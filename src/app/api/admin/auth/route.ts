import { NextRequest, NextResponse } from "next/server";
import { hashPassword, getCurrentUser } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const hash = await hashPassword(password);
    const adminHash = process.env.ADMIN_HASH;

    if (!adminHash || hash !== adminHash) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // If the current user is logged in, make them admin
    const user = await getCurrentUser();
    if (user && !user.is_admin) {
      user.is_admin = true;
      await redis.set(keys.user(user.id), JSON.stringify(user));
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
