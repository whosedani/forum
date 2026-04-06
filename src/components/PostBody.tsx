import React from "react";

export default function PostBody({ content }: { content: string }) {
  const parts = content.split(/\[img\]([\s\S]*?)\[\/img\]/g);

  return (
    <div className="post-body">
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          const src = part.trim();
          return (
            <div key={i} style={{ margin: "8px 0" }}>
              <a href={src} target="_blank" rel="noopener noreferrer">
                <img
                  src={src}
                  alt="Posted image"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 600,
                    border: "1px solid #D9BFB7",
                    borderRadius: 4,
                  }}
                />
              </a>
            </div>
          );
        }
        if (!part) return null;
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
