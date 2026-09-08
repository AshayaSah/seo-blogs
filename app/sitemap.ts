import type { MetadataRoute } from "next";
import {
  getPublishedPostsLite,
  getCategories,
  getTags,
  getAuthorsWithCounts,
} from "@/src/lib/posts";
import { SITE_URL, slugify } from "@/src/lib/site";

// Regenerate hourly; onPublish also revalidates "/sitemap.xml" on publish.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags, authors] = await Promise.all([
    getPublishedPostsLite(), // published AND not soft-deleted
    getCategories(),
    getTags(),
    getAuthorsWithCounts(),
  ]);

  // A post's "content last changed" feeds lastmod everywhere it's listed.
  const postLastModified = (p: (typeof posts)[number]): Date | undefined =>
    p.updatedAt ?? p.publishedAt ?? undefined;

  const latestPostDate = posts.reduce<Date | undefined>(
    (latest, p) => {
      const d = postLastModified(p);
      return d && (!latest || d.getTime() > latest.getTime()) ? d : latest;
    },
    undefined,
  );

  // Latest post change per category tag / author slug, for those index pages.
  const categoryLatest = new Map<string, Date>();
  for (const p of posts) {
    if (!p.category) continue;
    const slug = slugify(p.category);
    const d = postLastModified(p);
    if (d && (!categoryLatest.has(slug) || d > categoryLatest.get(slug)!)) {
      categoryLatest.set(slug, d);
    }
  }

  const tagLatest = new Map<string, Date>();
  for (const p of posts) {
    for (const tag of p.tags ?? []) {
      const slug = slugify(tag);
      if (!slug) continue;
      const d = postLastModified(p);
      if (d && (!tagLatest.has(slug) || d > tagLatest.get(slug)!)) {
        tagLatest.set(slug, d);
      }
    }
  }

  const authorIdToSlug = new Map<string, string>();
  for (const a of authors) {
    if (a.slug) authorIdToSlug.set(a.id, a.slug);
  }
  const authorLatest = new Map<string, Date>();
  for (const p of posts) {
    if (!p.authorId) continue;
    const slug = authorIdToSlug.get(p.authorId);
    if (!slug) continue;
    const d = postLastModified(p);
    if (d && (!authorLatest.has(slug) || d > authorLatest.get(slug)!)) {
      authorLatest.set(slug, d);
    }
  }

  const sitemapEntry = (
    url: string,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number,
    lastModified?: Date,
  ): MetadataRoute.Sitemap[number] => ({
    url,
    changeFrequency,
    priority,
    ...(lastModified ? { lastModified: lastModified.toISOString() } : {}),
  });

  const staticPages: MetadataRoute.Sitemap = [
    // Homepage and /blog reflect the newest published/edited post, not "now".
    sitemapEntry(SITE_URL, "daily", 1, latestPostDate),
    sitemapEntry(`${SITE_URL}/blog`, "daily", 0.9, latestPostDate),
    // Evergreen static pages: no meaningful last-changed date, so omit lastmod
    // rather than churning it on every regeneration.
    sitemapEntry(`${SITE_URL}/authors`, "monthly", 0.4),
    sitemapEntry(`${SITE_URL}/about`, "yearly", 0.3),
    sitemapEntry(`${SITE_URL}/contact`, "yearly", 0.3),
    sitemapEntry(`${SITE_URL}/privacy-policy`, "yearly", 0.2),
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((p) =>
    sitemapEntry(
      `${SITE_URL}/blog/${p.slug}`,
      "weekly",
      0.8,
      postLastModified(p),
    ),
  );

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) =>
    sitemapEntry(
      `${SITE_URL}/blog/category/${c.slug}`,
      "weekly",
      0.5,
      categoryLatest.get(c.slug),
    ),
  );

  const tagPages: MetadataRoute.Sitemap = tags.map((t) =>
    sitemapEntry(
      `${SITE_URL}/blog/tag/${t.slug}`,
      "weekly",
      0.4,
      tagLatest.get(t.slug),
    ),
  );

  const authorPages: MetadataRoute.Sitemap = authors.map((a) =>
    sitemapEntry(
      `${SITE_URL}/author/${a.slug}`,
      "monthly",
      0.4,
      a.slug ? authorLatest.get(a.slug) : undefined,
    ),
  );

  return [
    ...staticPages,
    ...postPages,
    ...categoryPages,
    ...tagPages,
    ...authorPages,
  ];
}