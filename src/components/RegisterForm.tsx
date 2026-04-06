"use client";

import { useState, useRef } from "react";

export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizedBlobRef = useRef<Blob | null>(null);
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkUsername = (value: string) => {
    if (value.length < 2) {
      setUsernameStatus("idle");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    checkTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(value)}`
        );
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 400);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext("2d")!;

      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 150, 150);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resizedBlobRef.current = blob;
            setAvatarPreview(canvas.toDataURL("image/jpeg", 0.8));
          }
        },
        "image/jpeg",
        0.8
      );
    };
    img.src = URL.createObjectURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || username.length < 2 || username.length > 20) {
      setError("Username must be 2-20 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Only letters, numbers, and underscores allowed");
      return;
    }
    if (usernameStatus === "taken") {
      setError("Username is already taken");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", username);
      if (resizedBlobRef.current) {
        formData.append("avatar", resizedBlobRef.current, "avatar.jpg");
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="category-header">Registration &mdash; Create Your Account</div>

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
                maxLength={20}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  checkUsername(e.target.value);
                }}
                placeholder="2-20 characters, letters/numbers/underscores"
                style={{ maxWidth: 300 }}
              />
              {usernameStatus === "checking" && (
                <span style={{ marginLeft: 8, color: "#888", fontSize: 11 }}>
                  checking...
                </span>
              )}
              {usernameStatus === "available" && (
                <span style={{ marginLeft: 8, color: "#4CAF50", fontSize: 11 }}>
                  &#10003; Available
                </span>
              )}
              {usernameStatus === "taken" && (
                <span style={{ marginLeft: 8, color: "#CC3333", fontSize: 11 }}>
                  &#10007; Taken
                </span>
              )}
              {usernameStatus === "invalid" && (
                <span style={{ marginLeft: 8, color: "#CC3333", fontSize: 11 }}>
                  &#10007; Invalid characters
                </span>
              )}
            </td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold", fontSize: 11 }}>
              Avatar
              <br />
              <span style={{ fontWeight: "normal", color: "#888", fontSize: 10 }}>
                (optional, max 2MB)
              </span>
            </td>
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 100,
                    height: 100,
                    border: "1px solid #D9BFB7",
                    borderRadius: 4,
                    overflow: "hidden",
                    background: "#E4D5CA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      style={{
                        width: 100,
                        height: 100,
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <img
                      src="/static/default-avatar.svg"
                      alt="Default"
                      style={{ width: 60, height: 60, opacity: 0.5 }}
                    />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileRef}
                    onChange={handleAvatarChange}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    className="forum-btn"
                    style={{ fontSize: 10, padding: "4px 12px" }}
                    onClick={() => fileRef.current?.click()}
                  >
                    Choose File
                  </button>
                  <span style={{ marginLeft: 8, fontSize: 11, color: "#888" }}>
                    {avatarPreview ? "File selected" : "No file chosen"}
                  </span>
                </div>
              </div>
              <canvas
                ref={canvasRef}
                style={{ display: "none" }}
                width={150}
                height={150}
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
          {loading ? "Registering..." : "Complete Registration"}
        </button>
      </div>
    </form>
  );
}
