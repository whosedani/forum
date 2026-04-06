import Link from "next/link";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { ONLINE_TTL_SECONDS } from "@/lib/constants";
import { getCurrentUser, touchOnline } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { Category, User, Thread } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ForumIndex() {
  let user: User | null = null;
  let categories: Category[] = [];
  let totalUsers = 0;
  let totalThreads = 0;
  let totalPosts = 0;
  let newestMember: { id: string; username: string } | null = null;
  let onlineUsers: { id: string; username: string }[] = [];
  let categoryThreads: Record<string, Thread[]> = {};

  try {
    user = await getCurrentUser();

    if (user) {
      await touchOnline(user.id);
    }

    // Fetch categories
    const categoryIds = await redis.zrange(keys.categoriesList(), 0, -1);

    if (categoryIds.length > 0) {
      const pipeline = redis.pipeline();
      for (const id of categoryIds) {
        pipeline.get(keys.category(id as string));
      }
      const results = await pipeline.exec();
      categories = results.filter(Boolean) as Category[];
    }

    // Stats
    totalUsers = (await redis.get<number>(keys.usersCounter())) ?? 0;
    totalThreads = (await redis.get<number>(keys.threadsCounter())) ?? 0;
    totalPosts = (await redis.get<number>(keys.postsCounter())) ?? 0;

    // Newest member
    const newestIds = await redis.zrange(keys.usersList(), -1, -1);
    if (newestIds.length > 0) {
      const u = await redis.get<User>(keys.user(newestIds[0] as string));
      if (u) newestMember = { id: u.id, username: u.username };
    }

    // Online users
    const cutoff = Date.now() - ONLINE_TTL_SECONDS * 1000;
    await redis.zremrangebyscore(keys.usersOnline(), 0, cutoff);
    const onlineIds = await redis.zrange(keys.usersOnline(), 0, -1);

    if (onlineIds.length > 0) {
      const pipeline = redis.pipeline();
      for (const id of onlineIds) {
        pipeline.get(keys.user(id as string));
      }
      const results = await pipeline.exec();
      onlineUsers = (results.filter(Boolean) as User[]).map((u) => ({
        id: u.id,
        username: u.username,
      }));
    }

    // Fetch threads for each category (last 10)
    for (const cat of categories) {
      const threadIds = await redis.zrange(keys.categoryThreads(cat.id), 0, 9, {
        rev: true,
      });
      if (threadIds.length > 0) {
        const pipeline = redis.pipeline();
        for (const id of threadIds) {
          pipeline.get(keys.thread(id as string));
        }
        const threads = (await pipeline.exec()).filter(Boolean) as Thread[];

        // Fetch view counts from separate keys
        const viewPipeline = redis.pipeline();
        for (const t of threads) {
          viewPipeline.get(keys.threadViews(t.id));
        }
        const viewResults = await viewPipeline.exec();
        threads.forEach((t, i) => {
          t.views_count = (viewResults[i] as number) || 0;
        });

        threads.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return (
            new Date(b.last_reply_at).getTime() -
            new Date(a.last_reply_at).getTime()
          );
        });
        categoryThreads[cat.id] = threads;
      } else {
        categoryThreads[cat.id] = [];
      }
    }
  } catch (error) {
    console.error("Forum index error:", error);
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "Forum Index" }]} />

      {/* Stats bar */}
      <div className="info-panel" style={{ marginTop: 0, marginBottom: 12 }}>
        <strong>Forum Statistics:</strong> Total Members:{" "}
        <strong>{totalUsers}</strong> | Total Threads:{" "}
        <strong>{totalThreads}</strong> | Total Posts:{" "}
        <strong>{totalPosts}</strong>
        {newestMember && (
          <>
            {" "}
            | Newest Member:{" "}
            <Link href={`/users/${newestMember.id}`}>
              <strong>{newestMember.username}</strong>
            </Link>
          </>
        )}
      </div>

      {/* Categories */}
      {categories.length === 0 ? (
        <div className="info-panel" style={{ textAlign: "center" }}>
          No categories yet.{" "}
          {user?.is_admin ? (
            <Link href="/admin">Create categories in the Admin Panel</Link>
          ) : (
            "Check back soon!"
          )}
        </div>
      ) : (
        categories.map((category) => {
          const threads = categoryThreads[category.id] || [];

          return (
            <div key={category.id} style={{ marginBottom: 12 }}>
              <div
                className="category-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Link
                  href={`/categories/${category.id}`}
                  style={{ color: "white", textDecoration: "none" }}
                >
                  {category.name}
                </Link>
                {user && (
                  <Link
                    href={`/categories/${category.id}/new`}
                    className="forum-btn"
                    style={{
                      fontSize: 10,
                      padding: "3px 10px",
                      borderColor: "rgba(255,255,255,0.3)",
                    }}
                  >
                    New Thread
                  </Link>
                )}
              </div>

              {category.description && (
                <div
                  style={{
                    background: "#E4D5CA",
                    padding: "4px 12px",
                    fontSize: 11,
                    color: "#555",
                    borderLeft: "1px solid #D9BFB7",
                    borderRight: "1px solid #D9BFB7",
                  }}
                >
                  {category.description}
                </div>
              )}

              <table className="forum-table">
                <thead>
                  <tr>
                    <th style={{ width: "4%" }}>&nbsp;</th>
                    <th style={{ width: "40%" }}>Thread</th>
                    <th style={{ width: "12%" }}>Author</th>
                    <th style={{ width: "8%", textAlign: "center" }}>Replies</th>
                    <th style={{ width: "8%", textAlign: "center" }}>Views</th>
                    <th style={{ width: "28%" }}>Last Post</th>
                  </tr>
                </thead>
                <tbody>
                  {threads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: "center",
                          color: "#888",
                          padding: 16,
                        }}
                      >
                        No threads yet. Be the first to start a discussion!
                      </td>
                    </tr>
                  ) : (
                    threads.map((thread) => {
                      const icon = thread.is_pinned
                        ? "📌"
                        : thread.is_locked
                        ? "🔒"
                        : thread.replies_count > 0
                        ? "💬"
                        : "📄";

                      const date = new Date(
                        thread.last_reply_at || thread.created_at
                      );
                      const dateStr = date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });

                      return (
                        <tr
                          key={thread.id}
                          className={thread.is_pinned ? "pinned" : ""}
                        >
                          <td style={{ textAlign: "center", fontSize: 16 }}>
                            {icon}
                          </td>
                          <td>
                            <Link
                              href={`/threads/${thread.id}`}
                              style={{ fontWeight: "bold", fontSize: 12 }}
                            >
                              {thread.title}
                            </Link>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#888",
                                marginTop: 2,
                              }}
                            >
                              by{" "}
                              <Link href={`/users/${thread.author_id}`}>
                                {thread.author_name}
                              </Link>
                              ,{" "}
                              {new Date(thread.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </div>
                          </td>
                          <td>
                            <Link
                              href={`/users/${thread.author_id}`}
                              style={{ fontSize: 11 }}
                            >
                              {thread.author_name}
                            </Link>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {thread.replies_count}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {thread.views_count || 0}
                          </td>
                          <td style={{ fontSize: 10, color: "#888" }}>
                            {dateStr}
                            <br />
                            by{" "}
                            <span style={{ color: "#800000" }}>
                              {thread.last_reply_by || thread.author_name}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          );
        })
      )}

      {/* Online Users */}
      <div className="info-panel">
        <strong>Users Online: {onlineUsers.length}</strong>
        {onlineUsers.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {onlineUsers.map((u, i) => (
              <span key={u.id}>
                {i > 0 && ", "}
                <span className="online-dot" />
                <Link href={`/users/${u.id}`}>{u.username}</Link>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
