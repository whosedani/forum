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
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "11px",
          }}
        >
          {user ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "white",
                }}
              >
                <img
                  src={user.avatar_url || "/static/default-avatar.png"}
                  alt=""
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <span>
                  Welcome,{" "}
                  <Link
                    href={`/users/${user.id}`}
                    style={{ color: "white", fontWeight: "bold" }}
                  >
                    {user.username}
                  </Link>
                </span>
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
              <Link
                href="/api/auth/logout"
                style={{ color: "#ccc", textDecoration: "none" }}
              >
                Log Out
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/register"
                style={{
                  color: "white",
                  fontWeight: "bold",
                  textDecoration: "none",
                }}
              >
                Register
              </Link>
              <Link
                href="/login"
                style={{ color: "#ccc", textDecoration: "none" }}
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
