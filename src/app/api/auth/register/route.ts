import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { generateToken, setAuthCookie } from "@/lib/auth";
import { DEFAULT_AVATAR, MAX_AVATAR_SIZE } from "@/lib/constants";
import { put } from "@vercel/blob";
import type { User } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const username = (formData.get("username") as string)?.trim();
    const avatarFile = formData.get("avatar") as File | null;

    if (!username || username.length < 2 || username.length > 20) {
      return NextResponse.json(
        { error: "Username must be 2-20 characters" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores" },
        { status: 400 }
      );
    }

    const existing = await redis.get(keys.userByUsername(username));
    if (existing) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    let avatar_url = DEFAULT_AVATAR;
    if (avatarFile && avatarFile.size > 0) {
      if (avatarFile.size > MAX_AVATAR_SIZE) {
        return NextResponse.json(
          { error: "Avatar must be under 2MB" },
          { status: 400 }
        );
      }
      try {
        const blob = await put(`avatars/${Date.now()}-${avatarFile.name}`, avatarFile, {
          access: "public",
          addRandomSuffix: true,
        });
        avatar_url = blob.url;
      } catch {
        // Blob storage not configured, use default avatar
      }
    }

    const id = String(await redis.incr(keys.usersCounter()));
    const token = generateToken();
    const now = new Date().toISOString();

    const user: User = {
      id,
      username,
      avatar_url,
      join_date: now,
      post_count: 0,
      is_admin: false,
    };

    const pipeline = redis.pipeline();
    pipeline.set(keys.user(id), JSON.stringify(user));
    pipeline.set(keys.userByUsername(username), id);
    pipeline.set(keys.userByToken(token), id);
    pipeline.zadd(keys.usersList(), { score: Date.now(), member: id });
    await pipeline.exec();

    await setAuthCookie(token);

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
