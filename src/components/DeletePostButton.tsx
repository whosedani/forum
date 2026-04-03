"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      style={{
        background: "none",
        border: "none",
        color: "#CC3333",
        cursor: "pointer",
        fontSize: 12,
        padding: "0 4px",
      }}
      title="Delete post"
    >
      {loading ? "..." : "🗑"}
    </button>
  );
}
