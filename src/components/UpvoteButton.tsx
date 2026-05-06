"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function UpvoteButton({
  postId,
  initialCount,
  initialVoted,
  canVote,
}: {
  postId: string;
  initialCount: number;
  initialVoted: boolean;
  canVote: boolean;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(initialVoted);
  const [pending, start] = useTransition();

  if (!canVote) {
    return (
      <span style={{ fontSize: 11, color: "#888" }}>▲ {count}</span>
    );
  }

  const click = () => {
    const wasVoted = voted;
    setVoted(!wasVoted);
    setCount((c) => c + (wasVoted ? -1 : 1));
    start(async () => {
      try {
        const r = await fetch(`/api/posts/${postId}/vote`, { method: "POST" });
        if (r.ok) {
          const { voted: v, count: c } = await r.json();
          setVoted(v);
          setCount(c);
          router.refresh();
        } else {
          setVoted(wasVoted);
          setCount((c) => c + (wasVoted ? 1 : -1));
        }
      } catch {
        setVoted(wasVoted);
        setCount((c) => c + (wasVoted ? 1 : -1));
      }
    });
  };

  return (
    <button
      onClick={click}
      disabled={pending}
      style={{
        background: voted ? "#F5E6E0" : "none",
        border: "1px solid #D9BFB7",
        color: voted ? "#800000" : "#666",
        fontWeight: voted ? "bold" : "normal",
        cursor: "pointer",
        fontSize: 11,
        padding: "1px 6px",
        borderRadius: 2,
      }}
      title={voted ? "Remove upvote" : "Upvote"}
    >
      ▲ {count}
    </button>
  );
}
