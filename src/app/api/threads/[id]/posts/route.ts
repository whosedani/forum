import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { getCurrentUser, touchOnline } from "@/lib/auth";
import type { Thread, Post, Category } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thread = await redis.get<Thread>(keys.thread(id));
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  if (thread.is_locked) {
    return NextResponse.json(
      { error: "Thread is locked" },
      { status: 403 }
    );
  }

  try {
    const { content } = await request.json();

    if (!content?.trim() || content.length > 10000) {
      return NextResponse.json(
        { error: "Content must be 1-10000 characters" },
        { status: 400 }
      );
    }

    const postId = String(await redis.incr(keys.postsCounter()));
    const now = new Date().toISOString();

    const post: Post = {
      id: postId,
      thread_id: id,
      author_id: user.id,
      content: content.trim(),
      created_at: now,
      edited_at: null,
    };

    // Update thread
    thread.replies_count += 1;
    thread.last_reply_at = now;
    thread.last_reply_by = user.username;

    // Update user post count
    const userData = { ...user, post_count: user.post_count + 1 };

    // Update category
    const category = await redis.get<Category>(keys.category(thread.category_id));

    const pipeline = redis.pipeline();
    pipeline.set(keys.post(postId), JSON.stringify(post));
    pipeline.zadd(keys.threadPosts(id), {
      score: new Date(now).getTime(),
      member: postId,
    });
    pipeline.set(keys.thread(id), JSON.stringify(thread));
    pipeline.set(keys.user(user.id), JSON.stringify(userData));

    // Update category sorted set score (bump thread to top)
    pipeline.zadd(keys.categoryThreads(thread.category_id), {
      score: new Date(now).getTime(),
      member: id,
    });

    if (category) {
      category.post_count += 1;
      category.last_post = {
        thread_id: id,
        thread_title: thread.title,
        author_id: user.id,
        author_name: user.username,
        date: now,
      };
      pipeline.set(keys.category(thread.category_id), JSON.stringify(category));
    }

    await pipeline.exec();
    await touchOnline(user.id);

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
