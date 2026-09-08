import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getPublishedSlugs,
  getPublishedPostBySlug,
  getRelatedPosts,
  type FaqItem,
  type FeaturedImage,
  type Og,
} from "@/src/lib/posts";
import {
  renderArticleHtml,
  renderInlineMarkdown,
  stripMarkdown,
  limitText,
} from "@/src/lib/markdown";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/src/lib/jsonld";
import { SITE_NAME, absoluteUrl, slugify } from "@/src/lib/site";
import { sectionizeForAds, sectionizeForAdsFromSections } from "@/src/lib/ads/placement";
import JsonLd from "@/src/components/JsonLd";
import AdSlot from "@/src/components/ads/AdSlot";
import TableOfContents from "@/src/components/TableOfContents";

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
  // The canonical is always the local post URL. Ingestion may store an original
  // source URL in post.canonicalUrl, but the published post on this origin is
  // the authoritative copy, so we never self-canonicalize elsewhere.
  const canonical = absoluteUrl(`/blog/${post.slug}`);
  const title = og.title ?? (post.title ? stripMarkdown(post.title) : SITE_NAME);
  const description = limitText(og.description ?? post.metaDescription);

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
      locale: "en_US",
      publishedTime: post.publishedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function buildRel(rel?: string | null): string {
  const parts = ["noopener", "noreferrer"];
  if (rel === "nofollow" || rel === "sponsored" || rel === "ugc") parts.push(rel);
  return parts.join(" ");
}

type ContentSectionImage = {
  url: string;
  alt_text: string;
  width: number;
  height: number;
  caption?: string;
};

type ContentSection = {
  id: string;
  title: string;
  content: string;
  image?: ContentSectionImage;
};

type ExternalLink = {
  label: string;
  url: string;
  rel?: "nofollow" | "sponsored" | "ugc" | null;
  description?: string;
};

type GalleryImage = {
  url: string;
  alt_text: string;
  width: number;
  height: number;
  caption?: string;
};

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
  const contentSections = (post.contentSections ?? []) as ContentSection[];
  const externalLinks = (post.externalLinks ?? []) as ExternalLink[];
  const galleryImages = (post.images ?? []) as GalleryImage[];

  const contentHtml = post.contentBody
    ? renderArticleHtml(post.contentBody, post.contentFormat === "html" ? "html" : "markdown")
    : "";

  const hasModularContent = contentSections.length > 0;

  const publishedISO = post.publishedAt?.toISOString();
  const publishedLabel = post.publishedAt?.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const updatedAt = post.updatedAt;
  const updatedISO = updatedAt?.toISOString();
  const updatedLabel = updatedAt?.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  // Show "Updated" only when the change lands on a different calendar day, so
  // a same-day save doesn't render a redundant duplicate of the date.
  const showUpdated =
    !!updatedAt &&
    !!post.publishedAt &&
    updatedAt.getTime() !== post.publishedAt.getTime() &&
    updatedAt.toDateString() !== post.publishedAt.toDateString();

  return (
    <div className="site-container px-6 py-12">
      {/* Structured data */}
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd data={breadcrumbJsonLd(post)} />
      {faq.length > 0 && <JsonLd data={faqJsonLd(faq)} />}

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-sm text-muted-foreground"
      >
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
                  href={`/blog/category/${slugify(post.category)}`}
                  className="hover:text-foreground"
                >
                  {post.category}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>›</li>
          <li className="text-foreground" aria-current="page">
            {post.title ? stripMarkdown(post.title) : "Article"}
          </li>
        </ol>
      </nav>

      <article>
        <header className="mb-8">
          <h1
            className="text-4xl font-bold leading-tight tracking-tight"
            dangerouslySetInnerHTML={
              post.title ? { __html: renderInlineMarkdown(post.title) } : undefined
            }
          />

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
            {showUpdated && updatedISO && updatedLabel && (
              <>
                <span aria-hidden>·</span>
                <time dateTime={updatedISO}>
                  <span className="font-medium text-foreground">Updated</span>{" "}
                  {updatedLabel}
                </time>
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

        {/* Featured image: next/image reserves the aspect-ratio box using the
            stored width/height + sizes, so there's no layout shift (CLS-safe).
            priority preloads the LCP image for faster Largest Contentful Paint. */}
        {image && (
          <Image
            src={image.url}
            alt={image.alt_text}
            width={image.width}
            height={image.height}
            sizes="100vw"
            priority
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

        {hasModularContent ? (
          <>
            {/* Modular path: table of contents */}
            <TableOfContents sections={contentSections} />

            {/* Modular path: content sections with interleaved ad slots */}
            {(() => {
              const adAfter = sectionizeForAdsFromSections(contentSections);
              return contentSections.map((section, i) => (
                <Fragment key={section.id}>
                  <section id={section.id} className="scroll-mt-24">
                    <h2
                      className="mb-4 text-2xl font-bold leading-tight"
                      dangerouslySetInnerHTML={{
                        __html: renderInlineMarkdown(section.title),
                      }}
                    />
                    <div
                      className="article-content"
                      dangerouslySetInnerHTML={{
                        __html: renderArticleHtml(
                          section.content,
                          post.contentFormat === "html" ? "html" : "markdown",
                        ),
                      }}
                    />
                    {section.image && section.image.url && (
                      <Image
                        src={section.image.url}
                        alt={section.image.alt_text}
                        width={section.image.width}
                        height={section.image.height}
                        sizes="100vw"
                        loading="lazy"
                        style={{ width: "100%", height: "auto" }}
                        className="mt-6 rounded-xl border border-border"
                      />
                    )}
                  </section>
                  {adAfter.has(i) && <AdSlot slot={adAfter.get(i)!} />}
                </Fragment>
              ));
            })()}
          </>
        ) : (
          /* Legacy path: render contentBody exactly as before */
          (() => {
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
          })()
        )}

        {/* Post-level image gallery */}
        {galleryImages.length > 0 && (
          <section aria-labelledby="gallery" className="mt-10">
            <h2
              id="gallery"
              className="mb-4 text-2xl font-semibold"
            >
              Gallery
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {galleryImages.map((img, i) => (
                <figure key={i}>
                  <Image
                    src={img.url}
                    alt={img.alt_text}
                    width={img.width}
                    height={img.height}
                    sizes="(min-width: 640px) 50vw, 100vw"
                    loading="lazy"
                    style={{ width: "100%", height: "auto" }}
                    className="rounded-lg border border-border"
                  />
                  {img.caption && (
                    <figcaption className="mt-2 text-sm text-muted-foreground">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

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
                  <p className="mt-1 text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* External links — "Further reading" */}
        {externalLinks.length > 0 && (
          <section aria-labelledby="further-reading" className="mt-12">
            <h2 id="further-reading" className="mb-4 text-2xl font-semibold">
              Further reading
            </h2>
            <ul className="flex flex-col gap-3">
              {externalLinks.map((link, i) => (
                <li key={i} className="rounded-lg border border-border p-4">
                  <a
                    href={link.url}
                    target="_blank"
                    rel={buildRel(link.rel)}
                    className="font-medium text-primary hover:underline"
                  >
                    <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(link.label) }} />
                  </a>
                  {link.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
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
                  <span className="font-medium text-primary">{r.title}</span>
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
    </div>
  );
}
