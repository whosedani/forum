import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { DEFAULT_FORUM_CONFIG } from "@/lib/constants";
import type { ForumConfig } from "@/lib/types";
import type { User } from "@/lib/types";

export const metadata: Metadata = {
  title: "Classic Forum",
  description: "A classic discussion board",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: User | null = null;
  let config: ForumConfig = DEFAULT_FORUM_CONFIG;

  try {
    user = await getCurrentUser();
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
          Powered by Classic Forum
        </footer>
      </body>
    </html>
  );
}
