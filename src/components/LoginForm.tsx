"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="category-header">Login &mdash; Enter Your Username</div>

      <table className="forum-table">
        <tbody>
          <tr>
            <td style={{ width: "30%", fontWeight: "bold", fontSize: 11 }}>
              Username
            </td>
            <td>
              <input
                type="text"
                className="forum-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={{ maxWidth: 300 }}
              />
            </td>
          </tr>
        </tbody>
      </table>

      {error && (
        <div
          style={{
            margin: "8px 0",
            padding: "8px 12px",
            background: "#FFF0F0",
            border: "1px solid #CC3333",
            color: "#CC3333",
            fontSize: 11,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ padding: "12px 0" }}>
        <button type="submit" className="forum-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <span style={{ marginLeft: 12, fontSize: 11, color: "#888" }}>
          Don&apos;t have an account?{" "}
          <a href="/register">Register here</a>
        </span>
      </div>
    </form>
  );
}
