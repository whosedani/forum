import Link from "next/link";
import type { User } from "@/lib/types";
import type { ForumConfig } from "@/lib/types";
import { getAvatarSrc } from "@/lib/avatar";

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
          background: "linear-gradient(to bottom, #800000, #660000)",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          borderBottom: "1px solid #550000",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: '"Trebuchet MS", Arial, sans-serif',
            fontSize: "22px",
            fontWeight: "bold",
            color: "#F0E0D6",
            textDecoration: "none",
          }}
        >
          {config.name}
        </Link>

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
                color: "#F0E0D6",
              }}
            >
              <img
                src={getAvatarSrc(user.avatar_url)}
                alt=""
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid #D9BFB7",
                }}
              />
              <Link
                href={`/users/${user.id}`}
                style={{ color: "#F0E0D6", fontWeight: "bold", textDecoration: "none" }}
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
