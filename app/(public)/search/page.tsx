import type { Metadata } from "next";
import { searchPosts } from "@/src/lib/posts";
import { SITE_NAME } from "@/src/lib/site";
import PostCard from "@/src/components/site/PostCard";

// Query-param search is request-specific → dynamic.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: `Search articles on ${SITE_NAME}.`,
  robots: { index: false }, // don't index search result pages
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchPosts(query) : [];

  return (
    <div className="site-container py-10">
      <h1 className="text-3xl font-bold tracking-tight">Search</h1>

      <form method="get" className="mt-6 flex max-w-xl gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search articles…"
          aria-label="Search query"
          className="field flex-1"
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {query && (
        <p className="mt-6 text-sm text-muted-foreground">
          {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">
          No articles matched “{query}”.
        </p>
      )}
    </div>
  );
}
