"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AvatarUpload({ currentUrl }: { currentUrl: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setError("Only PNG and JPG allowed");
      return;
    }

    // Resize on client
    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current!;
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext("2d")!;
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 150, 150);

      canvas.toBlob(
        async (blob) => {
          if (!blob) return;
          setUploading(true);
          setError("");
          try {
            const formData = new FormData();
            formData.append("avatar", blob, "avatar.jpg");
            const res = await fetch("/api/users/avatar", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error || "Upload failed");
              return;
            }
            router.refresh();
          } catch {
            setError("Upload failed");
          } finally {
            setUploading(false);
          }
        },
        "image/jpeg",
        0.8
      );
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <input
        type="file"
        accept=".png,.jpg,.jpeg"
        ref={fileRef}
        onChange={handleFile}
        style={{ display: "none" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} width={150} height={150} />
      <button
        type="button"
        className="forum-btn"
        style={{ fontSize: 10, padding: "3px 10px", marginTop: 6 }}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Change Avatar"}
      </button>
      {error && (
        <div style={{ color: "#CC3333", fontSize: 10, marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}
