"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Reply content is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/threads/${threadId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to post reply");
        return;
      }

      setContent("");
      router.refresh();
    } catch {
      setError("Failed to post reply. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
      <div className="category-header">Post Reply</div>

      <div
        style={{
          border: "1px solid #B8C9E0",
          borderTop: "none",
          padding: 12,
          background: "white",
        }}
      >
        <textarea
          className="forum-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your reply here..."
          style={{ minHeight: 120 }}
        />

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

        <div style={{ marginTop: 8 }}>
          <button type="submit" className="forum-btn" disabled={loading}>
            {loading ? "Posting..." : "Submit Reply"}
          </button>
        </div>
      </div>
    </form>
  );
}
