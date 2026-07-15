import Link from "next/link";
import { getPublishedPostsLite, getCategories } from "@/src/lib/posts";
import { SITE_NAME, SITE_DESCRIPTION } from "@/src/lib/site";
import PostCard from "@/src/components/site/PostCard";
import Newsletter from "@/src/components/site/Newsletter";

export const revalidate = 3600;

export default async function HomePage() {
  const [posts, categories] = await Promise.all([
    getPublishedPostsLite(),
    getCategories(),
  ]);

  const featured = posts[0];
  const latest = posts.slice(1, 7);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Hero */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {SITE_NAME}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          {SITE_DESCRIPTION}
        </p>
        {categories.length > 0 && (
          <nav
            aria-label="Categories"
            className="mt-6 flex flex-wrap justify-center gap-2"
          >
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/blog/category/${c.slug}`}
                className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {c.name}
              </Link>
            ))}
          </nav>
        )}
      </section>

      {posts.length === 0 ? (
        <p className="py-16 text-center text-zinc-500">No posts yet.</p>
      ) : (
        <>
          {/* Featured / most recent */}
          {featured && (
            <section aria-labelledby="featured" className="mb-14">
              <h2 id="featured" className="sr-only">
                Featured post
              </h2>
              <Link
                href={`/blog/${featured.slug}`}
                className="group grid gap-6 overflow-hidden rounded-2xl border border-zinc-200 md:grid-cols-2 dark:border-zinc-800"
              >
                {featured.featuredImage && (
                  <img
                    src={featured.featuredImage.url}
                    alt={featured.featuredImage.alt_text}
                    width={featured.featuredImage.width}
                    height={featured.featuredImage.height}
                    className="aspect-[16/9] w-full object-cover md:aspect-auto md:h-full"
                    style={{ height: "auto" }}
                  />
                )}
                <div className="flex flex-col justify-center p-6">
                  {featured.category && (
                    <span className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                      {featured.category}
                    </span>
                  )}
                  <h3 className="mt-2 text-2xl font-bold tracking-tight group-hover:underline">
                    {featured.title ?? featured.slug}
                  </h3>
                  {featured.metaDescription && (
                    <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                      {featured.metaDescription}
                    </p>
                  )}
                </div>
              </Link>
            </section>
          )}

          {/* Latest grid */}
          {latest.length > 0 && (
            <section aria-labelledby="latest" className="mb-14">
              <div className="mb-5 flex items-center justify-between">
                <h2 id="latest" className="text-xl font-semibold tracking-tight">
                  Latest posts
                </h2>
                <Link
                  href="/blog"
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  View all →
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {latest.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Newsletter />
    </div>
  );
}
