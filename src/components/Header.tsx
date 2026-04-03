import Link from "next/link";
import type { User } from "@/lib/types";
import type { ForumConfig } from "@/lib/types";

export default function Header({
  user,
  config,
}: {
  user: User | null;
  config: ForumConfig;
}) {
  return (
    <header>
      <div
        style={{
          background: "linear-gradient(to bottom, #3A5795, #2A4780)",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: '"Trebuchet MS", Arial, sans-serif',
            fontSize: "22px",
            fontWeight: "bold",
            color: "white",
            textDecoration: "none",
          }}
        >
          {config.name}
        </Link>

        {/* Right side: user info (admin link only) */}
        {user && (
          <div
            style={{
              position: "absolute",
              right: 20,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "11px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "white",
              }}
            >
              <img
                src={user.avatar_url || "/static/default-avatar.svg"}
                alt=""
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
              <Link
                href={`/users/${user.id}`}
                style={{ color: "white", fontWeight: "bold", textDecoration: "none" }}
              >
                {user.username}
              </Link>
            </div>
            {user.is_admin && (
              <Link
                href="/admin"
                style={{
                  color: "#FFD700",
                  fontWeight: "bold",
                  textDecoration: "none",
                }}
              >
                Admin Panel
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
