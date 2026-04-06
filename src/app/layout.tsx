import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { getCurrentUser, getTokenFromCookies, clearAuthCookie } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { DEFAULT_FORUM_CONFIG } from "@/lib/constants";
import { redirect } from "next/navigation";
import type { ForumConfig } from "@/lib/types";
import type { User } from "@/lib/types";

export const metadata: Metadata = {
  title: "Forum Dog",
  description: "Forum Dog - Discussion Board",
  icons: {
    icon: "/favicon.jpeg",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: User | null = null;
  let config: ForumConfig = { ...DEFAULT_FORUM_CONFIG, name: "Forum Dog" };

  try {
    const token = await getTokenFromCookies();
    if (token) {
      user = await getCurrentUser();
      if (!user) {
        // Token exists but user not found (deleted) — clear stale cookie
        await clearAuthCookie();
        redirect("/register");
      }
    }
  } catch {
    // ignore auth errors
  }

  try {
    const stored = await redis.get<ForumConfig>(keys.forumConfig());
    if (stored) config = stored;
  } catch {
    // ignore redis errors, use defaults
  }

  return (
    <html lang="en">
      <body>
        <Header user={user} config={config} />
        <main
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 8px",
          }}
        >
          {children}
        </main>
        <footer
          style={{
            maxWidth: 1100,
            margin: "16px auto 24px",
            padding: "0 8px",
            textAlign: "center",
            fontSize: "10px",
            color: "#888",
          }}
        >
          Powered by Forum Dog
        </footer>
      </body>
    </html>
  );
}
