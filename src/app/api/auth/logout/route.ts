import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, getTokenFromCookies } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";

export async function GET(request: NextRequest) {
  const token = await getTokenFromCookies();
  if (token) {
    await redis.del(keys.userByToken(token));
  }
  await clearAuthCookie();

  const url = new URL("/", request.url);
  return NextResponse.redirect(url);
}
