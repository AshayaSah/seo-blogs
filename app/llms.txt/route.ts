import { getPublishedPostsLite } from "@/src/lib/posts";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/src/lib/site";

// Refresh hourly so newly published posts appear for AI crawlers.
export const revalidate = 3600;

/**
 * /llms.txt — a plain-text map of the site for AI crawlers (the emerging
 * llmstxt.org convention). Describes structure and lists published articles
 * (published AND not soft-deleted).
 */
export async function GET() {
  const published = (await getPublishedPostsLite()).slice(0, 200);

  const articleLines = published
    .map((p) => `- [${p.title ?? p.slug}](${SITE_URL}/blog/${p.slug})`)
    .join("\n");

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

Some articles are produced with AI assistance and reviewed by our editorial
team before publication.

## Site structure

- Blog posts: ${SITE_URL}/blog/{slug}
- Author pages: ${SITE_URL}/author/{slug}
- Sitemap: ${SITE_URL}/sitemap.xml

## Published articles

${articleLines || "- (none yet)"}
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
