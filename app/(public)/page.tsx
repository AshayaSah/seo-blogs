import Link from "next/link";
import { getPublishedPostsLite, getCategories } from "@/src/lib/posts";
import { SITE_DESCRIPTION } from "@/src/lib/site";
import PostCard from "@/src/components/site/PostCard";
import Newsletter from "@/src/components/site/Newsletter";

export const revalidate = 3600;

function formatDate(d: Date | null): string | null {
  return d
    ? d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;
}

export default async function HomePage() {
  const [posts, categories] = await Promise.all([
    getPublishedPostsLite(),
    getCategories(),
  ]);

  const gridPosts = posts.slice(0, 6);
  const featured = posts.slice(0, 3);
  const latest = posts.slice(3, 7);

  return (
    <div className="site-container py-10">
      {/* Hero */}
      <section className="mx-auto mb-14 max-w-2xl text-center">
        <span className="badge">Blog</span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Discover our latest news
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          {SITE_DESCRIPTION}
        </p>

        <form
          method="get"
          action="/search"
          className="mx-auto mt-7 flex max-w-lg gap-2"
        >
          <input
            type="search"
            name="q"
            placeholder="Search articles…"
            aria-label="Search articles"
            className="field"
          />
          <button type="submit" className="btn btn-primary">
            Find Now
          </button>
        </form>

        {categories.length > 0 && (
          <nav
            aria-label="Categories"
            className="mt-6 flex flex-wrap justify-center gap-2"
          >
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/blog/category/${c.slug}`}
                className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {c.name}
              </Link>
            ))}
          </nav>
        )}
      </section>

      {posts.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No posts yet.</p>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Main column: latest articles grid */}
          <section aria-labelledby="latest-articles">
            <div className="mb-6 flex items-center gap-4">
              <h2
                id="latest-articles"
                className="whitespace-nowrap text-xl font-semibold tracking-tight"
              >
                Latest articles
              </h2>
              <span className="h-px flex-1 bg-border" />
              <Link
                href="/blog"
                className="whitespace-nowrap text-sm text-primary hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>

          {/* Sidebar: Featured + Latest */}
          <aside className="flex flex-col gap-10">
            {featured.length > 0 && (
              <section aria-labelledby="featured">
                <h2
                  id="featured"
                  className="mb-4 border-b border-border pb-2 text-lg font-semibold tracking-tight"
                >
                  Featured
                </h2>
                <ul className="flex flex-col gap-5">
                  {featured.map((p) => (
                    <li key={p.id} className="flex gap-3">
                      {p.featuredImage && (
                        <Link
                          href={`/blog/${p.slug}`}
                          className="shrink-0"
                          aria-hidden
                          tabIndex={-1}
                        >
                          <img
                            src={p.featuredImage.url}
                            alt=""
                            width={64}
                            height={64}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        </Link>
                      )}
                      <div>
                        {formatDate(p.publishedAt) && (
                          <time
                            dateTime={p.publishedAt!.toISOString()}
                            className="text-xs text-muted-foreground"
                          >
                            {formatDate(p.publishedAt)}
                          </time>
                        )}
                        <h3 className="mt-0.5 text-sm font-semibold leading-snug">
                          <Link
                            href={`/blog/${p.slug}`}
                            className="hover:text-primary"
                          >
                            {p.title ?? p.slug}
                          </Link>
                        </h3>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {latest.length > 0 && (
              <section aria-labelledby="sidebar-latest">
                <h2
                  id="sidebar-latest"
                  className="mb-4 border-b border-border pb-2 text-lg font-semibold tracking-tight"
                >
                  Latest
                </h2>
                <ul className="flex flex-col gap-4">
                  {latest.map((p) => (
                    <li key={p.id}>
                      {formatDate(p.publishedAt) && (
                        <time
                          dateTime={p.publishedAt!.toISOString()}
                          className="text-xs text-muted-foreground"
                        >
                          {formatDate(p.publishedAt)}
                        </time>
                      )}
                      <h3 className="mt-0.5 text-sm font-semibold leading-snug">
                        <Link
                          href={`/blog/${p.slug}`}
                          className="hover:text-primary"
                        >
                          {p.title ?? p.slug}
                        </Link>
                      </h3>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      )}

      <div className="mt-16">
        <Newsletter />
      </div>
    </div>
  );
}
