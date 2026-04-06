import Link from "next/link";
import { notFound } from "next/navigation";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { getCurrentUser, touchOnline } from "@/lib/auth";
import { THREADS_PER_PAGE } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { Category, Thread } from "@/lib/types";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageStr } = await searchParams;
  const page = Number(pageStr || "1");

  const user = await getCurrentUser();
  if (user) await touchOnline(user.id);

  const category = await redis.get<Category>(keys.category(id));
  if (!category) notFound();

  // Fetch ALL threads to separate pinned from regular
  const allThreadIds = await redis.zrange(keys.categoryThreads(id), 0, -1, { rev: true });
  let allThreads: Thread[] = [];
  if (allThreadIds.length > 0) {
    const pipeline = redis.pipeline();
    for (const tid of allThreadIds) {
      pipeline.get(keys.thread(tid as string));
    }
    allThreads = (await pipeline.exec()).filter(Boolean) as Thread[];
  }

  const pinnedThreads = allThreads
    .filter((t) => t.is_pinned)
    .sort((a, b) => new Date(b.last_reply_at).getTime() - new Date(a.last_reply_at).getTime());
  const regularThreads = allThreads
    .filter((t) => !t.is_pinned)
    .sort((a, b) => new Date(b.last_reply_at).getTime() - new Date(a.last_reply_at).getTime());

  // Paginate only regular threads
  const totalRegular = regularThreads.length;
  const totalPages = Math.max(1, Math.ceil(totalRegular / THREADS_PER_PAGE));
  const start = (page - 1) * THREADS_PER_PAGE;
  const pageRegularThreads = regularThreads.slice(start, start + THREADS_PER_PAGE);

  // Combine: pinned always first, then paginated regular
  const threads = [...pinnedThreads, ...pageRegularThreads];

  // Get view counts
  const viewPipeline = redis.pipeline();
  for (const t of threads) {
    viewPipeline.get(keys.threadViews(t.id));
  }
  const viewResults = await viewPipeline.exec();

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: category.name },
        ]}
      />

      <div
        className="category-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <span>{category.name}</span>
        {user && (
          <Link
            href={`/categories/${id}/new`}
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
                style={{ textAlign: "center", color: "#888", padding: 16 }}
              >
                No threads yet. Be the first to start a discussion!
              </td>
            </tr>
          ) : (
            threads.map((thread, i) => {
              const views = (viewResults[i] as number) || 0;
              const icon = thread.is_pinned
                ? "📌"
                : thread.is_locked
                ? "🔒"
                : thread.replies_count > 0
                ? "💬"
                : "📄";

              const date = new Date(thread.last_reply_at || thread.created_at);
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
                      style={{ fontSize: 10, color: "#888", marginTop: 2 }}
                    >
                      by{" "}
                      <Link href={`/users/${thread.author_id}`}>
                        {thread.author_name}
                      </Link>
                      ,{" "}
                      {new Date(thread.created_at).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
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
                  <td style={{ textAlign: "center" }}>{views}</td>
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
                  href={`/categories/${id}?page=${p}`}
                  style={{ padding: "2px 6px" }}
                >
                  {p}
                </Link>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
