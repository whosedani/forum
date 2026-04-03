import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { DEFAULT_FORUM_CONFIG } from "@/lib/constants";
import type { ForumConfig } from "@/lib/types";

export async function GET() {
  const config =
    (await redis.get<ForumConfig>(keys.forumConfig())) ?? DEFAULT_FORUM_CONFIG;
  return NextResponse.json(config);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updates = await request.json();
    const existing =
      (await redis.get<ForumConfig>(keys.forumConfig())) ?? DEFAULT_FORUM_CONFIG;

    const config: ForumConfig = {
      ...existing,
      ...updates,
    };

    await redis.set(keys.forumConfig(), JSON.stringify(config));
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
