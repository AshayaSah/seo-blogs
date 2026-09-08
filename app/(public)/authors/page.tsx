import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAuthorsWithCounts } from "@/src/lib/posts";
import { SITE_NAME, absoluteUrl } from "@/src/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Authors",
  description: `Meet the writers and editors on ${SITE_NAME} — the voices covering SEO, content strategy, and technology.`,
  alternates: { canonical: absoluteUrl("/authors") },
  openGraph: {
    title: `Authors — ${SITE_NAME}`,
    description: `Meet the writers and editors on ${SITE_NAME} — the voices covering SEO, content strategy, and technology.`,
    url: absoluteUrl("/authors"),
    type: "website",
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Authors — ${SITE_NAME}`,
    description: `Meet the writers and editors on ${SITE_NAME} — the voices covering SEO, content strategy, and technology.`,
  },
};

export default async function AuthorsPage() {
  const authors = await getAuthorsWithCounts();

  return (
    <div className="site-container py-10">
      <h1 className="text-3xl font-bold tracking-tight">Authors</h1>
      <p className="mt-2 text-muted-foreground">The people behind our articles.</p>

      {authors.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No authors yet.</p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {authors.map((a) => (
            <li key={a.id}>
              <Link
                href={`/author/${a.slug}`}
                className="flex items-center gap-4 rounded-xl border border-border p-5 transition-colors hover:bg-muted"
              >
                {a.avatarUrl && (
                  <Image
                    src={a.avatarUrl}
                    alt={a.name ?? "Author"}
                    width={56}
                    height={56}
                    sizes="56px"
                    className="h-14 w-14 rounded-full border border-border object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold">{a.name}</p>
                  {a.jobTitle && (
                    <p className="text-sm text-muted-foreground">{a.jobTitle}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.postCount} post{a.postCount === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
