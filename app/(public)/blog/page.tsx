import type { Metadata } from "next";
import Link from "next/link";
import {
  getPublishedPostsLite,
  getCategories,
  getTags,
} from "@/src/lib/posts";
import { SITE_NAME } from "@/src/lib/site";
import PostCard from "@/src/components/site/PostCard";

export const revalidate = 3600;

const PAGE_SIZE = 9;

export const metadata: Metadata = {
  title: "Blog",
  description: `All articles on ${SITE_NAME}.`,
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const [posts, categories, tags] = await Promise.all([
    getPublishedPostsLite(),
    getCategories(),
    getTags(),
  ]);

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const page = Math.min(
    Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1),
    totalPages,
  );
  const pageItems = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="site-container py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
        <p className="mt-2 text-muted-foreground">
          {posts.length} article{posts.length === 1 ? "" : "s"}, newest first.
        </p>
      </header>

      {/* Filters */}
      {(categories.length > 0 || tags.length > 0) && (
        <div className="mb-8 flex flex-col gap-3 border-y border-border py-4">
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categories
              </span>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/blog/category/${c.slug}`}
                  className="badge hover:bg-border"
                >
                  {c.name} ({c.count})
                </Link>
              ))}
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tags
              </span>
              {tags.slice(0, 20).map((t) => (
                <Link
                  key={t.slug}
                  href={`/blog/tag/${t.slug}`}
                  className="text-sm text-primary hover:underline"
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {pageItems.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No posts yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-10 flex items-center justify-between text-sm"
        >
          {page > 1 ? (
            <Link
              href={page - 1 === 1 ? "/blog" : `/blog?page=${page - 1}`}
              className="btn btn-outline"
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`/blog?page=${page + 1}`} className="btn btn-outline">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
