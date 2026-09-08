import { getPublishedPostsLite } from "@/src/lib/posts";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, absoluteUrl } from "@/src/lib/site";

// Regenerate hourly, matching /sitemap.xml. onPublish also revalidates
// "/feed.xml" so new posts appear promptly.
export const revalidate = 3600;

const FEED_LIMIT = 20;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = (await getPublishedPostsLite()).slice(0, FEED_LIMIT);

  const feedUrl = absoluteUrl("/feed.xml");
  const latest = posts
    .map((p) => p.updatedAt ?? p.publishedAt)
    .filter((d): d is Date => d !== null)
    .reduce<Date | null>((latestDate, d) =>
      latestDate === null || d > latestDate ? d : latestDate,
      null,
    );

  const items = posts
    .map((p) => {
      const link = absoluteUrl(`/blog/${p.slug}`);
      const published = p.updatedAt ?? p.publishedAt;
      const description = escapeXml(p.metaDescription ?? p.title ?? p.slug);
      return `    <item>
      <title>${escapeXml(p.title ?? p.slug)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      ${published ? `<pubDate>${published.toUTCString()}</pubDate>` : ""}
      <description>${description}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    ${latest ? `<lastBuildDate>${latest.toUTCString()}</lastBuildDate>` : ""}
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}