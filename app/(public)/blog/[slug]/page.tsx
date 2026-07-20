import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublishedSlugs,
  getPublishedPostBySlug,
  getRelatedPosts,
  type FaqItem,
  type FeaturedImage,
  type Og,
} from "@/src/lib/posts";
import { renderMarkdown } from "@/src/lib/markdown";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
} from "@/src/lib/jsonld";
import { SITE_NAME, absoluteUrl, slugify } from "@/src/lib/site";
import { sectionizeForAds } from "@/src/lib/ads/placement";
import JsonLd from "@/src/components/JsonLd";
import AdSlot from "@/src/components/ads/AdSlot";

// ISR: prebuild published posts, revalidate hourly, and render newly published
// slugs on demand (dynamicParams defaults to true).
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { title: "Not found" };

  const og = (post.og as Og | null) ?? {};
  const image = post.featuredImage as FeaturedImage | null;
  const canonical = post.canonicalUrl ?? absoluteUrl(`/blog/${post.slug}`);
  const title = og.title ?? post.title ?? SITE_NAME;
  const description = og.description ?? post.metaDescription ?? undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: (og.type as "article") ?? "article",
      siteName: SITE_NAME,
      publishedTime: post.publishedAt?.toISOString(),
      images: image
        ? [
            {
              url: image.url,
              width: image.width,
              height: image.height,
              alt: image.alt_text,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image.url] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const image = post.featuredImage as FeaturedImage | null;
  const faq = (post.faq as FaqItem[] | null) ?? [];
  const takeaways = (post.keyTakeaways ?? []) as string[];
  const author = post.author;
  const related = await getRelatedPosts(post.id, post.tags ?? []);
  const contentHtml = post.contentBody
    ? post.contentFormat === "html"
      ? post.contentBody
      : renderMarkdown(post.contentBody)
    : "";

  const publishedISO = post.publishedAt?.toISOString();
  const publishedLabel = post.publishedAt?.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* Structured data */}
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd data={breadcrumbJsonLd(post)} />
      {faq.length > 0 && <JsonLd data={faqJsonLd(faq)} />}

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-foreground">
              {SITE_NAME}
            </Link>
          </li>
          {post.category && (
            <>
              <li aria-hidden>›</li>
              <li>
                <Link
                  href={`/category/${slugify(post.category)}`}
                  className="hover:text-foreground"
                >
                  {post.category}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>›</li>
          <li className="text-foreground" aria-current="page">
            {post.title}
          </li>
        </ol>
      </nav>

      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            {post.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {author && (
              <span>
                By{" "}
                <Link
                  href={`/author/${author.slug}`}
                  rel="author"
                  className="font-medium text-foreground hover:text-primary"
                >
                  {author.name}
                </Link>
              </span>
            )}
            {publishedISO && (
              <>
                <span aria-hidden>·</span>
                <time dateTime={publishedISO}>{publishedLabel}</time>
              </>
            )}
            {post.readTimeMinutes && (
              <>
                <span aria-hidden>·</span>
                <span>{post.readTimeMinutes} min read</span>
              </>
            )}
          </div>
        </header>

        {/* Featured image: explicit width/height + height:auto keeps the
            aspect-ratio box reserved, avoiding layout shift (CLS-safe). */}
        {image && (
          <img
            src={image.url}
            alt={image.alt_text}
            width={image.width}
            height={image.height}
            style={{ width: "100%", height: "auto" }}
            className="mb-8 rounded-xl border border-border"
          />
        )}

        {/* Key takeaways — placed high, before the body */}
        {takeaways.length > 0 && (
          <section
            aria-labelledby="key-takeaways"
            className="mb-10 rounded-xl border border-border bg-muted p-6"
          >
            <h2
              id="key-takeaways"
              className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Key takeaways
            </h2>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-[0.95rem]">
              {takeaways.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Body — split at headings so in-article ad slots can be
            interleaved (after 1st heading, mid-article, after 3rd heading).
            Slots are dormant unless an ad provider is configured. */}
        {(() => {
          const { sections, adAfter } = sectionizeForAds(contentHtml);
          return sections.map((html, i) => (
            <Fragment key={i}>
              <div
                className="article-content"
                dangerouslySetInnerHTML={{ __html: html }}
              />
              {adAfter.has(i) && <AdSlot slot={adAfter.get(i)!} />}
            </Fragment>
          ));
        })()}

        {/* FAQ */}
        {faq.length > 0 && (
          <section aria-labelledby="faq" className="mt-12">
            <h2 id="faq" className="mb-4 text-2xl font-semibold">
              Frequently asked questions
            </h2>
            <div className="flex flex-col divide-y divide-border">
              {faq.map((item, i) => (
                <div key={i} className="py-4">
                  <h3 className="font-medium">{item.question}</h3>
                  <p className="mt-1 text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-16">
          <h2 id="related" className="mb-4 text-xl font-semibold">
            Related posts
          </h2>
          <ul className="flex flex-col gap-4">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/blog/${r.slug}`}
                  className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                >
                  <span className="font-medium text-primary">
                    {r.title}
                  </span>
                  {r.metaDescription && (
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {r.metaDescription}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
