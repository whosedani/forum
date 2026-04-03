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
  const [images, setImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setImages((prev) => [...prev, data.url]);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) { setError("Title is required"); return; }
    if (!content.trim() && images.length === 0) { setError("Content is required"); return; }

    const imageTags = images.map((url) => `[img]${url}[/img]`).join("\n");
    const fullContent = [content.trim(), imageTags].filter(Boolean).join("\n");

    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: fullContent }),
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
                className="forum-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post here..."
                style={{ minHeight: 200 }}
              />

              {images.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
                  {images.map((url, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        width: 80,
                        height: 80,
                        border: "1px solid #B8C9E0",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          width: 18,
                          height: 18,
                          background: "rgba(204,51,51,0.85)",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          fontSize: 11,
                          cursor: "pointer",
                          lineHeight: "18px",
                          textAlign: "center",
                          padding: 0,
                        }}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}

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
