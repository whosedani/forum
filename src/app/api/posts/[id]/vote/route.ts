import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { getCurrentUser, touchOnline } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exists = await redis.exists(keys.post(id));
  if (!exists) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const key = keys.postUpvotes(id);
  const had = await redis.sismember(key, user.id);

  const pipeline = redis.pipeline();
  if (had) {
    pipeline.srem(key, user.id);
  } else {
    pipeline.sadd(key, user.id);
  }
  pipeline.scard(key);
  const results = await pipeline.exec();
  const count = results[1] as number;

  await touchOnline(user.id);

  return NextResponse.json({ voted: !had, count });
}
