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
import UpvoteButton from "@/components/UpvoteButton";
import type { Thread, Post, User, Category } from "@/lib/types";
import { getAvatarSrc } from "@/lib/avatar";
import PostBody from "@/components/PostBody";

type PostWithVotes = Post & { upvote_count: number; viewer_voted: boolean };

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

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

  // Fetch ALL posts (re-sort by upvotes globally, then paginate)
  const allPostIds = await redis.zrange(keys.threadPosts(id), 0, -1);
  const total = allPostIds.length;
  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));

  let posts: Post[] = [];
  let counts: number[] = [];
  let voted: boolean[] = [];
  const authors: Record<string, User> = {};

  if (allPostIds.length > 0) {
    const postPipeline = redis.pipeline();
    for (const pid of allPostIds) {
      postPipeline.get(keys.post(pid as string));
    }
    const postResults = await postPipeline.exec();
    posts = postResults.filter(Boolean) as Post[];

    const votePipeline = redis.pipeline();
    for (const p of posts) {
      votePipeline.scard(keys.postUpvotes(p.id));
    }
    if (currentUser) {
      for (const p of posts) {
        votePipeline.sismember(keys.postUpvotes(p.id), currentUser.id);
      }
    }
    const voteResults = await votePipeline.exec();
    counts = voteResults.slice(0, posts.length).map((v) => (v as number) || 0);
    voted = currentUser
      ? voteResults
          .slice(posts.length)
          .map((v) => Boolean(v as number))
      : posts.map(() => false);

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

  // Enrich, sort by upvotes desc (tiebreak by created_at asc), pin OP on page 1
  const enriched: PostWithVotes[] = posts.map((p, i) => ({
    ...p,
    upvote_count: counts[i] ?? 0,
    viewer_voted: voted[i] ?? false,
  }));

  enriched.sort((a, b) => {
    if (b.upvote_count !== a.upvote_count) return b.upvote_count - a.upvote_count;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  if (page === 1 && enriched.length > 1) {
    let opIdx = 0;
    for (let i = 1; i < enriched.length; i++) {
      if (
        new Date(enriched[i].created_at).getTime() <
        new Date(enriched[opIdx].created_at).getTime()
      ) {
        opIdx = i;
      }
    }
    if (opIdx > 0) {
      const [op] = enriched.splice(opIdx, 1);
      enriched.unshift(op);
    }
  }

  const start = (page - 1) * POSTS_PER_PAGE;
  const pagePosts = enriched.slice(start, start + POSTS_PER_PAGE);

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
          background: "linear-gradient(to bottom, #800000, #660000)",
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
          background: "#E4D5CA",
          padding: "4px 12px",
          fontSize: 10,
          color: "#555",
          borderLeft: "1px solid #D9BFB7",
          borderRight: "1px solid #D9BFB7",
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
        {pagePosts.map((post) => {
          const author = authors[post.author_id];
          const date = new Date(post.created_at);

          return (
            <div key={post.id} className="post-card">
              {/* User info sidebar */}
              <div className="post-userinfo">
                <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
                  <img
                    src={getAvatarSrc(author?.avatar_url)}
                    alt=""
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 4,
                      border: "1px solid #D9BFB7",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <Link
                    href={`/users/${post.author_id}`}
                    style={{
                      fontWeight: "bold",
                      fontSize: 12,
                      color: "#800000",
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
                    <UpvoteButton
                      postId={post.id}
                      initialCount={post.upvote_count}
                      initialVoted={post.viewer_voted}
                      canVote={!!currentUser}
                    />
                    {currentUser?.is_admin && (
                      <DeletePostButton postId={post.id} />
                    )}
                  </span>
                </div>
                <PostBody content={post.content} />
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
      {thread.is_locked ? (
        <div
          className="info-panel"
          style={{ textAlign: "center", marginTop: 12 }}
        >
          🔒 This thread is locked. No new replies can be posted.
        </div>
      ) : currentUser ? (
        <ReplyForm threadId={id} />
      ) : null}
    </div>
  );
}
