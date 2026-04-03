import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { getCurrentUser } from "@/lib/auth";
import { POSTS_PER_PAGE } from "@/lib/constants";
import type { Thread, Post, User, Category } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const page = Number(request.nextUrl.searchParams.get("page") || "1");

  const thread = await redis.get<Thread>(keys.thread(id));
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // Increment view count
  await redis.incr(keys.threadViews(id));

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

    // Fetch unique authors
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

  // Get category for breadcrumbs
  const category = await redis.get<Category>(keys.category(thread.category_id));

  // Get actual view count
  const views = (await redis.get<number>(keys.threadViews(id))) || 0;

  return NextResponse.json({
    thread: { ...thread, views_count: views },
    posts,
    authors,
    category,
    page,
    totalPages,
    totalPosts: total,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thread = await redis.get<Thread>(keys.thread(id));
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  try {
    const updates = await request.json();

    if (updates.is_pinned !== undefined) thread.is_pinned = updates.is_pinned;
    if (updates.is_locked !== undefined) thread.is_locked = updates.is_locked;

    await redis.set(keys.thread(id), JSON.stringify(thread));

    return NextResponse.json({ thread });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thread = await redis.get<Thread>(keys.thread(id));
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // Get all post IDs
  const postIds = await redis.zrange(keys.threadPosts(id), 0, -1);

  const pipeline = redis.pipeline();
  for (const pid of postIds) {
    pipeline.del(keys.post(pid as string));
  }
  pipeline.del(keys.threadPosts(id));
  pipeline.del(keys.thread(id));
  pipeline.del(keys.threadViews(id));
  pipeline.zrem(keys.categoryThreads(thread.category_id), id);
  await pipeline.exec();

  // Update category stats
  const category = await redis.get<Category>(keys.category(thread.category_id));
  if (category) {
    category.thread_count = Math.max(0, category.thread_count - 1);
    category.post_count = Math.max(0, category.post_count - (postIds.length));
    await redis.set(keys.category(thread.category_id), JSON.stringify(category));
  }

  // Decrement global counters
  await redis.decrby(keys.postsCounter(), postIds.length);
  await redis.decr(keys.threadsCounter());

  return NextResponse.json({ success: true, category_id: thread.category_id });
}
