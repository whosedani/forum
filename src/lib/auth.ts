import { cookies } from "next/headers";
import { redis } from "./redis";
import { keys } from "./keys";
import { TOKEN_COOKIE, TOKEN_EXPIRY_DAYS } from "./constants";
import type { User } from "./types";

export function generateToken(): string {
  return crypto.randomUUID();
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
}

export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getTokenFromCookies();
  if (!token) return null;

  const userId = await redis.get<string>(keys.userByToken(token));
  if (!userId) return null;

  const user = await redis.get<User>(keys.user(userId));
  return user ?? null;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function touchOnline(userId: string) {
  await redis.zadd(keys.usersOnline(), {
    score: Date.now(),
    member: userId,
  });
}
