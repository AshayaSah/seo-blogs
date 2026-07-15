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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Search</h1>

      <form method="get" className="mt-6 flex max-w-xl gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search articles…"
          aria-label="Search query"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Search
        </button>
      </form>

      {query && (
        <p className="mt-6 text-sm text-zinc-500">
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
        <p className="mt-10 text-center text-zinc-500">
          No articles matched “{query}”.
        </p>
      )}
    </div>
  );
}
