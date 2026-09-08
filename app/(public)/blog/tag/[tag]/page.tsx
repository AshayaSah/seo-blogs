import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTags, getPostsByTag } from "@/src/lib/posts";
import { SITE_NAME, absoluteUrl } from "@/src/lib/site";
import { breadcrumbTrailJsonLd } from "@/src/lib/jsonld";
import JsonLd from "@/src/components/JsonLd";
import PostCard from "@/src/components/site/PostCard";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const tags = await getTags();
  return tags.map((t) => ({ tag: t.slug }));
}

async function resolveTag(slug: string) {
  const tags = await getTags();
  return tags.find((t) => t.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const found = await resolveTag(tag);
  if (!found) return { title: "Tag not found" };
  const title = `#${found.name}`;
  const description = `Posts tagged “${found.name}” on ${SITE_NAME} — hand-selected deep-dives, guides, and research on the topic.`;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/blog/tag/${found.slug}`) },
    openGraph: {
      title: `${title} — ${SITE_NAME}`,
      description,
      url: absoluteUrl(`/blog/tag/${found.slug}`),
      type: "website",
      images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${SITE_NAME}`,
      description,
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const found = await resolveTag(tag);
  if (!found) notFound();

  const posts = await getPostsByTag(found.slug);

  return (
    <div className="site-container py-10">
      <JsonLd
        data={breadcrumbTrailJsonLd([
          { name: SITE_NAME, url: absoluteUrl("/") },
          { name: "Blog", url: absoluteUrl("/blog") },
          { name: `#${found.name}`, url: absoluteUrl(`/blog/tag/${found.slug}`) },
        ])}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-foreground">{SITE_NAME}</Link></li>
          <li aria-hidden>›</li>
          <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
          <li aria-hidden>›</li>
          <li className="text-foreground" aria-current="page">
            #{found.name}
          </li>
        </ol>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight">#{found.name}</h1>
      <p className="mt-2 text-muted-foreground">
        {posts.length} post{posts.length === 1 ? "" : "s"} tagged.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}
