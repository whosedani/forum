import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { getCurrentUser } from "@/lib/auth";
import type { Post, Thread, Category } from "@/lib/types";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await redis.get<Post>(keys.post(id));
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const pipeline = redis.pipeline();
  pipeline.del(keys.post(id));
  pipeline.zrem(keys.threadPosts(post.thread_id), id);
  await pipeline.exec();

  // Update thread reply count
  const thread = await redis.get<Thread>(keys.thread(post.thread_id));
  if (thread) {
    thread.replies_count = Math.max(0, thread.replies_count - 1);
    await redis.set(keys.thread(post.thread_id), JSON.stringify(thread));

    // Update category post count
    const category = await redis.get<Category>(keys.category(thread.category_id));
    if (category) {
      category.post_count = Math.max(0, category.post_count - 1);
      await redis.set(keys.category(thread.category_id), JSON.stringify(category));
    }
  }

  // Decrement global post counter
  await redis.decr(keys.postsCounter());

  return NextResponse.json({ success: true, thread_id: post.thread_id });
}
