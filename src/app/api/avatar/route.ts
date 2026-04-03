import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.redirect(new URL("/static/default-avatar.svg", request.url));
  }

  try {
    // Verify blob exists
    const blobInfo = await head(url);

    // Fetch the blob content using the token
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch blob");

    const body = res.body;
    return new NextResponse(body, {
      headers: {
        "Content-Type": blobInfo.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/static/default-avatar.svg", request.url));
  }
}
