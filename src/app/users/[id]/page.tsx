import Link from "next/link";
import { notFound } from "next/navigation";
import { redis } from "@/lib/redis";
import { keys } from "@/lib/keys";
import { ONLINE_TTL_SECONDS } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { User } from "@/lib/types";
import { getAvatarSrc } from "@/lib/avatar";

export const dynamic = "force-dynamic";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await redis.get<User>(keys.user(id));
  if (!user) notFound();

  // Check if online
  const cutoff = Date.now() - ONLINE_TTL_SECONDS * 1000;
  const onlineScore = await redis.zscore(keys.usersOnline(), id);
  const isOnline = onlineScore !== null && Number(onlineScore) > cutoff;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: `Profile: ${user.username}` },
        ]}
      />

      <div
        style={{
          marginTop: 8,
          border: "1px solid #B8C9E0",
          background: "white",
        }}
      >
        <div className="category-header">User Profile</div>

        <div
          style={{
            padding: 20,
            display: "flex",
            gap: 24,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <img
              src={getAvatarSrc(user.avatar_url)}
              alt={user.username}
              style={{
                width: 150,
                height: 150,
                borderRadius: 4,
                border: "1px solid #B8C9E0",
                objectFit: "cover",
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <h2
              style={{
                fontFamily: '"Trebuchet MS", Arial, sans-serif',
                fontSize: 20,
                fontWeight: "bold",
                color: "#333",
                margin: "0 0 12px 0",
              }}
            >
              {user.username}
              {user.is_admin && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#CC3333",
                    fontWeight: "bold",
                    marginLeft: 8,
                    fontFamily: "Verdana, sans-serif",
                  }}
                >
                  [Admin]
                </span>
              )}
            </h2>

            <table
              style={{
                fontSize: 12,
                borderCollapse: "collapse",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "4px 16px 4px 0",
                      color: "#888",
                      fontWeight: "bold",
                      fontSize: 11,
                    }}
                  >
                    Joined:
                  </td>
                  <td style={{ padding: "4px 0" }}>
                    {new Date(user.join_date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "4px 16px 4px 0",
                      color: "#888",
                      fontWeight: "bold",
                      fontSize: 11,
                    }}
                  >
                    Total Posts:
                  </td>
                  <td style={{ padding: "4px 0" }}>{user.post_count}</td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "4px 16px 4px 0",
                      color: "#888",
                      fontWeight: "bold",
                      fontSize: 11,
                    }}
                  >
                    Status:
                  </td>
                  <td style={{ padding: "4px 0" }}>
                    {isOnline ? (
                      <span style={{ color: "#4CAF50" }}>
                        <span className="online-dot" /> Online
                      </span>
                    ) : (
                      <span style={{ color: "#888" }}>Offline</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8, textAlign: "center", fontSize: 11 }}>
        <Link href="/">&laquo; Back to Forum Index</Link>
      </div>
    </div>
  );
}
