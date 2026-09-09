import { ImageResponse } from "next/og";
import { getPublishedPostBySlug, type FeaturedImage } from "@/src/lib/posts";
import { SITE_NAME } from "@/src/lib/site";

// Dynamic 1200x630 social image per blog post: title (large), author + site
// (small), and the post's featured image on the right when one exists.
export const alt = "Blog post";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Runs on the Node runtime (default in Next 16) so DB + Buffer are available.
export const runtime = "nodejs";

async function toDataUri(image?: FeaturedImage | null): Promise<string | null> {
  if (!image?.url) return null;
  try {
    const res = await fetch(image.url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type") ?? "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    // Degrade gracefully to a text-only layout if the image can't be fetched.
    return null;
  }
}

async function getLogoDataUri(): Promise<string | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/logo_knowra.png`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function stripMarkdown(input: string): string {
  return input.replace(/[#*_`>`[\]()!]/g, "").trim();
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            color: "#ffffff",
            fontSize: 48,
          }}
        >
          {SITE_NAME}
        </div>
      ),
      { ...size }
    );
  }

  const title = stripMarkdown(post.title ?? post.slug);
  const author = post.author?.name?.trim() ?? "";
  const img = await toDataUri(post.featuredImage as FeaturedImage | null);
  const logo = await getLogoDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #312e81 100%)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {logo && (
              <img
                src={logo}
                width={70}
                height={56}
                style={{ objectFit: "contain" }}
              />
            )}
            <div style={{ display: "flex", fontSize: 28, color: "#c7d2fe" }}>
              {SITE_NAME}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 50,
              fontWeight: 800,
              lineHeight: 1.15,
              marginTop: 24,
            }}
          >
            {title}
          </div>
          {author && (
            <div
              style={{
                display: "flex",
                fontSize: 26,
                color: "#c7d2fe",
                marginTop: 32,
              }}
            >
              By {author}
            </div>
          )}
        </div>
        {img && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 48px 0 0",
            }}
          >
            <img
              src={img}
              style={{
                width: 400,
                height: 400,
                objectFit: "cover",
                borderRadius: 24,
                border: "2px solid rgba(255, 255, 255, 0.25)",
              }}
            />
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}