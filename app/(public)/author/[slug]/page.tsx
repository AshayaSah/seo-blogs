import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAuthorBySlug,
  getAuthorSlugs,
  getPublishedPostsByAuthor,
} from "@/src/lib/posts";
import { personJsonLd } from "@/src/lib/jsonld";
import { SITE_NAME, absoluteUrl } from "@/src/lib/site";
import JsonLd from "@/src/components/JsonLd";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAuthorSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return { title: "Author not found" };

  const title = `${author.name} — ${SITE_NAME}`;
  const description =
    author.bio ?? `Articles by ${author.name} on ${SITE_NAME}.`;
  const canonical = absoluteUrl(`/author/${author.slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "profile",
      images: author.avatarUrl ? [author.avatarUrl] : undefined,
    },
    twitter: { card: "summary", title, description },
  };
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const posts = await getPublishedPostsByAuthor(author.id);
  const sameAs = author.sameAs ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <JsonLd data={personJsonLd(author)} />

      <header className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        {author.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.avatarUrl}
            alt={author.name ?? "Author avatar"}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full border border-border object-cover"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{author.name}</h1>
          {author.jobTitle && (
            <p className="mt-1 text-muted-foreground">{author.jobTitle}</p>
          )}
        </div>
      </header>

      {author.bio && (
        <p className="mt-6 leading-relaxed text-foreground">
          {author.bio}
        </p>
      )}

      {sameAs.length > 0 && (
        <nav aria-label="Author profiles" className="mt-4">
          <ul className="flex flex-wrap gap-3 text-sm">
            {sameAs.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  rel="me noopener noreferrer"
                  target="_blank"
                  className="rounded-full border border-border px-3 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {hostOf(url)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <section aria-labelledby="author-posts" className="mt-12">
        <h2 id="author-posts" className="mb-4 text-xl font-semibold">
          Posts by {author.name}
        </h2>
        {posts.length === 0 ? (
          <p className="text-muted-foreground">No published posts yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {posts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                >
                  <span className="font-medium text-primary">
                    {p.title}
                  </span>
                  {p.metaDescription && (
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {p.metaDescription}
                    </span>
                  )}
                  {p.publishedAt && (
                    <time
                      dateTime={p.publishedAt.toISOString()}
                      className="mt-2 block text-xs text-muted-foreground"
                    >
                      {p.publishedAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
