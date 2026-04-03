import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { ONLINE_TTL_SECONDS } from "@/lib/constants";
import type { User } from "@/lib/types";

export async function GET() {
  const cutoff = Date.now() - ONLINE_TTL_SECONDS * 1000;
  await redis.zremrangebyscore(keys.usersOnline(), 0, cutoff);
  const onlineIds = await redis.zrange(keys.usersOnline(), 0, -1);

  if (!onlineIds.length) {
    return NextResponse.json({ users: [] });
  }

  const pipeline = redis.pipeline();
  for (const id of onlineIds) {
    pipeline.get(keys.user(id as string));
  }
  const results = await pipeline.exec();
  const users = (results.filter(Boolean) as User[]).map((u) => ({
    id: u.id,
    username: u.username,
  }));

  return NextResponse.json({ users });
}
