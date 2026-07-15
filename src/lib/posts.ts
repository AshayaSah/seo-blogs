import { cache } from "react";
import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/src/db";
import { posts, authors } from "@/src/db/schema";
import type { SelectPost, SelectAuthor } from "@/src/db/schema";
import { slugify } from "@/src/lib/site";

export type FeaturedImage = {
  url: string;
  alt_text: string;
  width: number;
  height: number;
};

export type FaqItem = { question: string; answer: string };

export type Og = { title?: string; description?: string; type?: string };

export type PostWithAuthor = SelectPost & { author: SelectAuthor | null };

/**
 * The canonical "publicly visible" predicate: published AND not soft-deleted.
 * Every public query composes this so deleted/unpublished posts never leak.
 */
const publicPost = () =>
  and(eq(posts.status, "published"), isNull(posts.deletedAt));

// ---------------------------------------------------------------------------
// Single post + author
// ---------------------------------------------------------------------------

/** All publicly visible slugs — used by generateStaticParams. */
export async function getPublishedSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: posts.slug }).from(posts).where(publicPost());
  return rows.map((r) => r.slug);
}

/**
 * A single publicly visible post joined with its author. Wrapped in React
 * `cache` so generateMetadata and the page share one query.
 */
export const getPublishedPostBySlug = cache(
  async (slug: string): Promise<PostWithAuthor | null> => {
    const [row] = await db
      .select()
      .from(posts)
      .leftJoin(authors, eq(posts.authorId, authors.id))
      .where(and(eq(posts.slug, slug), publicPost()))
      .limit(1);

    if (!row) return null;
    return { ...row.posts, author: row.authors ?? null };
  },
);

// ---------------------------------------------------------------------------
// Lightweight card projection (drives grids, lists, filters, search)
// ---------------------------------------------------------------------------

export type PostCard = {
  id: string;
  slug: string;
  title: string | null;
  metaDescription: string | null;
  category: string | null;
  tags: string[] | null;
  primaryKeyword: string | null;
  secondaryKeywords: string[] | null;
  authorId: string | null;
  featuredImage: FeaturedImage | null;
  readTimeMinutes: number | null;
  publishedAt: Date | null;
};

/**
 * All publicly visible posts, newest first, as lightweight cards. Cached per
 * render so the many list/filter pages that build from it share one query.
 */
export const getPublishedPostsLite = cache(async (): Promise<PostCard[]> => {
  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      metaDescription: posts.metaDescription,
      category: posts.category,
      tags: posts.tags,
      primaryKeyword: posts.primaryKeyword,
      secondaryKeywords: posts.secondaryKeywords,
      authorId: posts.authorId,
      featuredImage: posts.featuredImage,
      readTimeMinutes: posts.readTimeMinutes,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(publicPost())
    .orderBy(desc(posts.publishedAt));

  return rows.map((r) => ({
    ...r,
    featuredImage: (r.featuredImage as FeaturedImage | null) ?? null,
  }));
});

// ---------------------------------------------------------------------------
// Categories & tags (derived from the lite projection)
// ---------------------------------------------------------------------------

export type Taxonomy = { name: string; slug: string; count: number };

export async function getCategories(): Promise<Taxonomy[]> {
  const all = await getPublishedPostsLite();
  const map = new Map<string, Taxonomy>();
  for (const p of all) {
    if (!p.category) continue;
    const slug = slugify(p.category);
    const entry = map.get(slug) ?? { name: p.category, slug, count: 0 };
    entry.count += 1;
    map.set(slug, entry);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export async function getTags(): Promise<Taxonomy[]> {
  const all = await getPublishedPostsLite();
  const map = new Map<string, Taxonomy>();
  for (const p of all) {
    for (const tag of p.tags ?? []) {
      const slug = slugify(tag);
      if (!slug) continue;
      const entry = map.get(slug) ?? { name: tag, slug, count: 0 };
      entry.count += 1;
      map.set(slug, entry);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export async function getPostsByCategory(
  categorySlug: string,
): Promise<PostCard[]> {
  const all = await getPublishedPostsLite();
  return all.filter((p) => p.category && slugify(p.category) === categorySlug);
}

export async function getPostsByTag(tagSlug: string): Promise<PostCard[]> {
  const all = await getPublishedPostsLite();
  return all.filter((p) => (p.tags ?? []).some((t) => slugify(t) === tagSlug));
}

// ---------------------------------------------------------------------------
// Search (query-param, over titles + keywords)
// ---------------------------------------------------------------------------

export async function searchPosts(query: string): Promise<PostCard[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = await getPublishedPostsLite();
  return all.filter((p) => {
    const haystack = [
      p.title,
      p.primaryKeyword,
      p.metaDescription,
      ...(p.secondaryKeywords ?? []),
      ...(p.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

// ---------------------------------------------------------------------------
// Authors
// ---------------------------------------------------------------------------

export const getAuthorBySlug = cache(
  async (slug: string): Promise<SelectAuthor | null> => {
    const [row] = await db
      .select()
      .from(authors)
      .where(eq(authors.slug, slug))
      .limit(1);
    return row ?? null;
  },
);

export async function getAuthorSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: authors.slug }).from(authors);
  return rows.flatMap((r) => (r.slug ? [r.slug] : []));
}

export async function getPublishedPostsByAuthor(
  authorId: string,
): Promise<SelectPost[]> {
  return db
    .select()
    .from(posts)
    .where(and(eq(posts.authorId, authorId), publicPost()))
    .orderBy(desc(posts.publishedAt));
}

export type AuthorWithCount = SelectAuthor & { postCount: number };

/** All authors that have at least one publicly visible post. */
export async function getAuthorsWithCounts(): Promise<AuthorWithCount[]> {
  const [authorRows, lite] = await Promise.all([
    db.select().from(authors),
    getPublishedPostsLite(),
  ]);
  const counts = new Map<string, number>();
  for (const p of lite) {
    if (p.authorId) counts.set(p.authorId, (counts.get(p.authorId) ?? 0) + 1);
  }
  return authorRows
    .map((a) => ({ ...a, postCount: counts.get(a.id) ?? 0 }))
    .filter((a) => a.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount);
}

// ---------------------------------------------------------------------------
// Related posts (shared tags)
// ---------------------------------------------------------------------------

export type RelatedPost = {
  slug: string;
  title: string | null;
  metaDescription: string | null;
  publishedAt: Date | null;
};

export async function getRelatedPosts(
  currentId: string,
  tags: string[],
  limit = 3,
): Promise<RelatedPost[]> {
  if (tags.length === 0) return [];
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));

  const candidates = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      metaDescription: posts.metaDescription,
      publishedAt: posts.publishedAt,
      tags: posts.tags,
    })
    .from(posts)
    .where(and(publicPost(), ne(posts.id, currentId)))
    .orderBy(desc(posts.publishedAt))
    .limit(50);

  return candidates
    .map((c) => ({
      ...c,
      overlap: (c.tags ?? []).filter((t) => tagSet.has(t.toLowerCase())).length,
    }))
    .filter((c) => c.overlap > 0)
    .sort(
      (a, b) =>
        b.overlap - a.overlap ||
        (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
    )
    .slice(0, limit)
    .map(({ slug, title, metaDescription, publishedAt }) => ({
      slug,
      title,
      metaDescription,
      publishedAt,
    }));
}
