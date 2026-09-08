import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_DESCRIPTION } from "@/src/lib/site";

// Default shared social image for the whole app, inherited by every public
// route below the root (homepage, /blog, tag/category/author/about/contact).
// Blog posts override it with their own generated per-post image. Kept at the
// app root so it cascades to all child segments.
export const alt = SITE_NAME;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #312e81 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            padding: "0 80px",
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#c7d2fe",
            marginTop: 28,
            textAlign: "center",
            padding: "0 120px",
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    { ...size }
  );
}