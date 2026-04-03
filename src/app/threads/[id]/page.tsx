import Link from "next/link";
import { notFound } from "next/navigation";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { getCurrentUser, touchOnline } from "@/lib/auth";
import { POSTS_PER_PAGE } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";
import ReplyForm from "@/components/ReplyForm";
import ModActions from "@/components/ModActions";
import DeletePostButton from "@/components/DeletePostButton";
import type { Thread, Post, User, Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageStr } = await searchParams;
  const page = Number(pageStr || "1");

  const currentUser = await getCurrentUser();
  if (currentUser) await touchOnline(currentUser.id);

  const thread = await redis.get<Thread>(keys.thread(id));
  if (!thread) notFound();

  // Increment views
  await redis.incr(keys.threadViews(id));
  const views = (await redis.get<number>(keys.threadViews(id))) || 0;

  const category = await redis.get<Category>(keys.category(thread.category_id));

  // Fetch posts
  const total = await redis.zcard(keys.threadPosts(id));
  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const start = (page - 1) * POSTS_PER_PAGE;

  const postIds = await redis.zrange(
    keys.threadPosts(id),
    start,
    start + POSTS_PER_PAGE - 1
  );

  let posts: Post[] = [];
  const authors: Record<string, User> = {};

  if (postIds.length > 0) {
    const pipeline = redis.pipeline();
    for (const pid of postIds) {
      pipeline.get(keys.post(pid as string));
    }
    posts = (await pipeline.exec()).filter(Boolean) as Post[];

    const authorIds = [...new Set(posts.map((p) => p.author_id))];
    const authorPipeline = redis.pipeline();
    for (const aid of authorIds) {
      authorPipeline.get(keys.user(aid));
    }
    const authorResults = await authorPipeline.exec();
    authorResults.forEach((a) => {
      if (a) {
        const user = a as User;
        authors[user.id] = user;
      }
    });
  }

  // Calculate global post number offset
  const postOffset = start;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(category
            ? [{ label: category.name, href: `/categories/${category.id}` }]
            : []),
          { label: thread.title },
        ]}
      />

      {/* Thread title bar */}
      <div
        style={{
          background: "linear-gradient(to bottom, #3A5795, #2A4780)",
          color: "white",
          padding: "10px 12px",
          fontFamily: '"Trebuchet MS", Arial, sans-serif',
          fontSize: 16,
          fontWeight: "bold",
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {thread.is_pinned && <span>📌</span>}
        {thread.is_locked && <span>🔒</span>}
        <span>{thread.title}</span>
      </div>

      {/* Thread info bar */}
      <div
        style={{
          background: "#D6E0EF",
          padding: "4px 12px",
          fontSize: 10,
          color: "#555",
          borderLeft: "1px solid #B8C9E0",
          borderRight: "1px solid #B8C9E0",
        }}
      >
        Views: {views} | Replies: {thread.replies_count}
      </div>

      {/* Mod actions */}
      {currentUser?.is_admin && (
        <ModActions
          threadId={id}
          categoryId={thread.category_id}
          isPinned={thread.is_pinned}
          isLocked={thread.is_locked}
        />
      )}

      {/* Posts */}
      <div style={{ marginTop: 12 }}>
        {posts.map((post, i) => {
          const author = authors[post.author_id];
          const postNumber = postOffset + i + 1;
          const date = new Date(post.created_at);

          return (
            <div key={post.id} className="post-card">
              {/* User info sidebar */}
              <div className="post-userinfo">
                <div style={{ marginBottom: 8 }}>
                  <img
                    src={author?.avatar_url || "/static/default-avatar.svg"}
                    alt=""
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 4,
                      border: "1px solid #B8C9E0",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <Link
                    href={`/users/${post.author_id}`}
                    style={{
                      fontWeight: "bold",
                      fontSize: 12,
                      color: "#3A5795",
                    }}
                  >
                    {author?.username || "Unknown"}
                  </Link>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: author?.is_admin ? "#CC3333" : "#888",
                    fontWeight: author?.is_admin ? "bold" : "normal",
                    marginBottom: 6,
                  }}
                >
                  {author?.is_admin ? "Admin" : "Member"}
                </div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  Posts: {author?.post_count || 0}
                </div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  Joined:{" "}
                  {author?.join_date
                    ? new Date(author.join_date).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </div>
              </div>

              {/* Post content */}
              <div className="post-content">
                <div className="post-header">
                  <span>
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    {date.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {currentUser?.is_admin && (
                      <DeletePostButton postId={post.id} />
                    )}
                    <span style={{ color: "#888" }}>#{postNumber}</span>
                  </span>
                </div>
                <div className="post-body">{post.content}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            padding: "8px 0",
            fontSize: 11,
            display: "flex",
            gap: 4,
            alignItems: "center",
          }}
        >
          <span>Pages:</span>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <span key={p}>
              {p === page ? (
                <strong style={{ padding: "2px 6px" }}>{p}</strong>
              ) : (
                <Link
                  href={`/threads/${id}?page=${p}`}
                  style={{ padding: "2px 6px" }}
                >
                  {p}
                </Link>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Reply form */}
      {currentUser && !thread.is_locked ? (
        <ReplyForm threadId={id} />
      ) : thread.is_locked ? (
        <div
          className="info-panel"
          style={{ textAlign: "center", marginTop: 12 }}
        >
          🔒 This thread is locked. No new replies can be posted.
        </div>
      ) : (
        <div
          className="info-panel"
          style={{ textAlign: "center", marginTop: 12 }}
        >
          <a href="/login">Login</a> or <a href="/register">Register</a> to
          reply to this thread.
        </div>
      )}
    </div>
  );
}
