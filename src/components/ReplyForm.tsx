"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    e.target.value = "";

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setError("Only PNG and JPG images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      // Insert image tag at cursor position
      const tag = `[img]${data.url}[/img]`;
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent =
          content.substring(0, start) + tag + content.substring(end);
        setContent(newContent);
      } else {
        setContent((prev) => prev + (prev ? "\n" : "") + tag);
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

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
          ref={textareaRef}
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

        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <button type="submit" className="forum-btn" disabled={loading || uploading}>
            {loading ? "Posting..." : "Submit Reply"}
          </button>

          <input
            type="file"
            accept=".png,.jpg,.jpeg"
            ref={fileRef}
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="forum-btn"
            style={{ background: "#6B84B5", borderColor: "#5A7299", fontSize: 10, padding: "5px 12px" }}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Attach Image"}
          </button>
          <span style={{ fontSize: 10, color: "#888" }}>PNG, JPG up to 5MB</span>
        </div>
      </div>
    </form>
  );
}
