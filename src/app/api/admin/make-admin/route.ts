import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import type { User } from "@/lib/types";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.is_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const userId = await redis.get<string>(keys.userByUsername(username));
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = await redis.get<User>(keys.user(userId));
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.is_admin = true;
    await redis.set(keys.user(userId), JSON.stringify(user));

    return NextResponse.json({ success: true, username: user.username });
  } catch {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
