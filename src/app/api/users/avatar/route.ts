import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { put } from "@vercel/blob";
import { MAX_AVATAR_SIZE } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      return NextResponse.json({ error: "Only PNG and JPG allowed" }, { status: 400 });
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json({ error: "Avatar must be under 2MB" }, { status: 400 });
    }

    const blob = await put(`avatars/${Date.now()}-${file.name}`, file, {
      access: "private",
      addRandomSuffix: true,
    });

    user.avatar_url = blob.url;
    await redis.set(keys.user(user.id), JSON.stringify(user));

    return NextResponse.json({ avatar_url: blob.url });
  } catch (error) {
    console.error("Avatar update error:", error);
    return NextResponse.json({ error: "Failed to update avatar" }, { status: 500 });
  }
}
