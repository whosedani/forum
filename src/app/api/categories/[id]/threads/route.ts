import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { getCurrentUser, touchOnline } from "@/lib/auth";
import { THREADS_PER_PAGE } from "@/lib/constants";
import type { Category, Thread, Post } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const page = Number(request.nextUrl.searchParams.get("page") || "1");

  const category = await redis.get<Category>(keys.category(id));
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const total = await redis.zcard(keys.categoryThreads(id));
  const totalPages = Math.max(1, Math.ceil(total / THREADS_PER_PAGE));
  const start = (page - 1) * THREADS_PER_PAGE;

  const threadIds = await redis.zrange(keys.categoryThreads(id), start, start + THREADS_PER_PAGE - 1, {
    rev: true,
  });

  let threads: Thread[] = [];
  if (threadIds.length > 0) {
    const pipeline = redis.pipeline();
    for (const tid of threadIds) {
      pipeline.get(keys.thread(tid as string));
    }
    threads = (await pipeline.exec()).filter(Boolean) as Thread[];
    threads.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.last_reply_at).getTime() - new Date(a.last_reply_at).getTime();
    });
  }

  return NextResponse.json({ category, threads, page, totalPages });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const category = await redis.get<Category>(keys.category(id));
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  try {
    const { title, content } = await request.json();

    if (!title?.trim() || title.length > 120) {
      return NextResponse.json(
        { error: "Title must be 1-120 characters" },
        { status: 400 }
      );
    }
    if (!content?.trim() || content.length > 10000) {
      return NextResponse.json(
        { error: "Content must be 1-10000 characters" },
        { status: 400 }
      );
    }

    const threadId = String(await redis.incr(keys.threadsCounter()));
    const postId = String(await redis.incr(keys.postsCounter()));
    const now = new Date().toISOString();

    const thread: Thread = {
      id: threadId,
      title: title.trim(),
      category_id: id,
      author_id: user.id,
      author_name: user.username,
      created_at: now,
      last_reply_at: now,
      last_reply_by: user.username,
      replies_count: 0,
      views_count: 0,
      is_pinned: false,
      is_locked: false,
    };

    const post: Post = {
      id: postId,
      thread_id: threadId,
      author_id: user.id,
      content: content.trim(),
      created_at: now,
      edited_at: null,
    };

    // Update category stats
    category.thread_count += 1;
    category.post_count += 1;
    category.last_post = {
      thread_id: threadId,
      thread_title: thread.title,
      author_id: user.id,
      author_name: user.username,
      date: now,
    };

    // Update user post count
    const userData = { ...user, post_count: user.post_count + 1 };

    const pipeline = redis.pipeline();
    pipeline.set(keys.thread(threadId), JSON.stringify(thread));
    pipeline.set(keys.post(postId), JSON.stringify(post));
    pipeline.zadd(keys.categoryThreads(id), {
      score: new Date(now).getTime(),
      member: threadId,
    });
    pipeline.zadd(keys.threadPosts(threadId), {
      score: new Date(now).getTime(),
      member: postId,
    });
    pipeline.set(keys.category(id), JSON.stringify(category));
    pipeline.set(keys.user(user.id), JSON.stringify(userData));
    await pipeline.exec();

    await touchOnline(user.id);

    return NextResponse.json({ thread, post });
  } catch (error) {
    console.error("Create thread error:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}
