import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { ONLINE_TTL_SECONDS, DEFAULT_FORUM_CONFIG } from "@/lib/constants";
import type { Category, ForumConfig, User } from "@/lib/types";

export async function GET() {
  try {
    const config =
      (await redis.get<ForumConfig>(keys.forumConfig())) ?? DEFAULT_FORUM_CONFIG;

    // Fetch categories
    const categoryIds = await redis.zrange(keys.categoriesList(), 0, -1);
    let categories: Category[] = [];

    if (categoryIds.length > 0) {
      const pipeline = redis.pipeline();
      for (const id of categoryIds) {
        pipeline.get(keys.category(id as string));
      }
      const results = await pipeline.exec();
      categories = results.filter(Boolean) as Category[];
    }

    // Stats
    const [totalUsers, totalThreads, totalPosts] = await Promise.all([
      redis.get<number>(keys.usersCounter()) ?? 0,
      redis.get<number>(keys.threadsCounter()) ?? 0,
      redis.get<number>(keys.postsCounter()) ?? 0,
    ]);

    // Newest member
    const newestIds = await redis.zrange(keys.usersList(), -1, -1);
    let newestMember = null;
    if (newestIds.length > 0) {
      newestMember = await redis.get<User>(keys.user(newestIds[0] as string));
    }

    // Online users
    const cutoff = Date.now() - ONLINE_TTL_SECONDS * 1000;
    await redis.zremrangebyscore(keys.usersOnline(), 0, cutoff);
    const onlineIds = await redis.zrange(keys.usersOnline(), 0, -1);
    let onlineUsers: { id: string; username: string }[] = [];

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

    return NextResponse.json({
      config,
      categories,
      stats: {
        totalUsers,
        totalThreads,
        totalPosts,
        newestMember: newestMember
          ? { id: newestMember.id, username: newestMember.username }
          : null,
      },
      onlineUsers,
    });
  } catch (error) {
    console.error("Forum data error:", error);
    return NextResponse.json({ error: "Failed to load forum data" }, { status: 500 });
  }
}
