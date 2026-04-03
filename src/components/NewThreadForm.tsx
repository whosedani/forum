"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewThreadForm({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create thread");
        return;
      }

      router.push(`/threads/${data.thread.id}`);
    } catch {
      setError("Failed to create thread. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="category-header">
        Post New Thread in &quot;{categoryName}&quot;
      </div>

      <table className="forum-table">
        <tbody>
          <tr>
            <td style={{ width: "15%", fontWeight: "bold", fontSize: 11 }}>
              Title
            </td>
            <td>
              <input
                type="text"
                className="forum-input"
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Thread title (max 120 characters)"
              />
            </td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold", fontSize: 11, verticalAlign: "top" }}>
              Content
            </td>
            <td>
              <textarea
                className="forum-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post here..."
                style={{ minHeight: 200 }}
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
          {loading ? "Creating..." : "Create Thread"}
        </button>
      </div>
    </form>
  );
}
