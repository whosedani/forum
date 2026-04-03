"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ModActions({
  threadId,
  categoryId,
  isPinned,
  isLocked,
}: {
  threadId: string;
  categoryId: string;
  isPinned: boolean;
  isLocked: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  const togglePin = async () => {
    setLoading("pin");
    await fetch(`/api/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_pinned: !isPinned }),
    });
    setLoading("");
    router.refresh();
  };

  const toggleLock = async () => {
    setLoading("lock");
    await fetch(`/api/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_locked: !isLocked }),
    });
    setLoading("");
    router.refresh();
  };

  const deleteThread = async () => {
    if (!confirm("Delete this thread and all its posts? This cannot be undone.")) return;
    setLoading("delete");
    await fetch(`/api/threads/${threadId}`, { method: "DELETE" });
    router.push(`/categories/${categoryId}`);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        padding: "6px 12px",
        background: "#FFF8DC",
        border: "1px solid #B8C9E0",
        borderTop: "none",
        fontSize: 11,
      }}
    >
      <span style={{ color: "#888", marginRight: 4 }}>Mod:</span>
      <button
        className="forum-btn"
        style={{ fontSize: 10, padding: "2px 8px" }}
        onClick={togglePin}
        disabled={!!loading}
      >
        {loading === "pin" ? "..." : isPinned ? "📌 Unpin" : "📌 Pin"}
      </button>
      <button
        className="forum-btn"
        style={{ fontSize: 10, padding: "2px 8px" }}
        onClick={toggleLock}
        disabled={!!loading}
      >
        {loading === "lock" ? "..." : isLocked ? "🔓 Unlock" : "🔒 Lock"}
      </button>
      <button
        className="forum-btn forum-btn-red"
        style={{ fontSize: 10, padding: "2px 8px" }}
        onClick={deleteThread}
        disabled={!!loading}
      >
        {loading === "delete" ? "..." : "🗑 Delete"}
      </button>
    </div>
  );
}
