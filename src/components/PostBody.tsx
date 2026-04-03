import React from "react";

export default function PostBody({ content }: { content: string }) {
  // Split content by [img]...[/img] tags
  const parts = content.split(/\[img\](.*?)\[\/img\]/g);

  return (
    <div className="post-body">
      {parts.map((part, i) => {
        // Odd indices are image URLs (captured groups)
        if (i % 2 === 1) {
          return (
            <div key={i} style={{ margin: "8px 0" }}>
              <img
                src={part}
                alt="Posted image"
                style={{
                  maxWidth: "100%",
                  maxHeight: 600,
                  border: "1px solid #B8C9E0",
                  borderRadius: 4,
                }}
              />
            </div>
          );
        }
        // Even indices are text
        if (!part) return null;
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
