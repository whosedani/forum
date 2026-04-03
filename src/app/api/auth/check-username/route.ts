import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();

  if (!username || username.length < 2) {
    return NextResponse.json({ available: false });
  }

  const existing = await redis.get(keys.userByUsername(username));
  return NextResponse.json({ available: !existing });
}
