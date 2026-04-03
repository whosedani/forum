"use client";

import { useState, useRef } from "react";
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
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Upload failed"); return; }

      const tag = `[img]${data.url}[/img]`;
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        setContent(content.substring(0, start) + tag + content.substring(end));
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

    if (!title.trim()) { setError("Title is required"); return; }
    if (!content.trim()) { setError("Content is required"); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create thread"); return; }
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
                ref={textareaRef}
                className="forum-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post here..."
                style={{ minHeight: 200 }}
              />
              <div style={{ marginTop: 6 }}>
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
                  style={{ background: "#6B84B5", borderColor: "#5A7299", fontSize: 10, padding: "4px 12px" }}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Attach Image"}
                </button>
                <span style={{ marginLeft: 8, fontSize: 10, color: "#888" }}>PNG, JPG up to 5MB</span>
              </div>
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
        <button type="submit" className="forum-btn" disabled={loading || uploading}>
          {loading ? "Creating..." : "Create Thread"}
        </button>
      </div>
    </form>
  );
}
