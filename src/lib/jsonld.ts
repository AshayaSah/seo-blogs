import { ORGANIZATION, SITE_NAME, SITE_URL, absoluteUrl, slugify } from "./site";
import { stripMarkdown, limitText } from "./markdown";
import type { FaqItem, FeaturedImage, PostWithAuthor } from "./posts";
import type { SelectAuthor } from "@/src/db/schema";

type Json = Record<string, unknown>;

export function organizationJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANIZATION.name,
    url: ORGANIZATION.url,
    logo: ORGANIZATION.logo,
  };
}

export function websiteJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function personJsonLd(author: SelectAuthor): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name ?? undefined,
    url: author.slug ? absoluteUrl(`/author/${author.slug}`) : undefined,
    jobTitle: author.jobTitle ?? undefined,
    description: author.bio ?? undefined,
    image: author.avatarUrl ?? undefined,
    // sameAs powers the "known profiles" links that search engines cross-ref.
    sameAs: author.sameAs && author.sameAs.length > 0 ? author.sameAs : undefined,
  };
}

export function articleJsonLd(post: PostWithAuthor): Json {
  // Canonical must match the page's <link rel="canonical"> (the local URL), so
  // mainEntityOfPage points at the same URL even when ingestion stored a source
  // canonicalUrl.
  const url = absoluteUrl(`/blog/${post.slug}`);
  const image = post.featuredImage as FeaturedImage | null;
  const author = post.author;

  const allImages = [
    ...(image ? [image.url] : []),
    ...((post.images as { url: string }[] | null) ?? []).map((i) => i.url),
    ...((post.contentSections as { image?: { url: string } | null }[] | null) ?? [])
      .flatMap((s) => (s.image ? [s.image.url] : [])),
  ];

  return {
    "@context": "https://schema.org",
    "@type": post.structuredDataType ?? "Article",
    headline: post.title ? stripMarkdown(post.title) : undefined,
    description: limitText(post.metaDescription),
    image: allImages.length > 0 ? allImages : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: (post.updatedAt ?? post.publishedAt)?.toISOString(),
    inLanguage: post.language ?? "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: author
      ? {
          "@type": "Person",
          name: author.name ?? undefined,
          url: author.slug
            ? absoluteUrl(`/author/${author.slug}`)
            : undefined,
          sameAs:
            author.sameAs && author.sameAs.length > 0
              ? author.sameAs
              : undefined,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: ORGANIZATION.name,
      logo: { "@type": "ImageObject", url: ORGANIZATION.logo },
    },
  };
}

export function breadcrumbJsonLd(post: PostWithAuthor): Json {
  const items: Json[] = [
    { name: SITE_NAME, url: SITE_URL },
  ];
  if (post.category) {
    items.push({
      name: post.category,
      url: absoluteUrl(`/blog/category/${slugify(post.category)}`),
    });
  }
  items.push({
    name: post.title ? stripMarkdown(post.title) : "Article",
    url: absoluteUrl(`/blog/${post.slug}`),
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Generic BreadcrumbList from an ordered list of crumbs. */
export function breadcrumbTrailJsonLd(
  items: { name: string; url: string }[],
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function faqJsonLd(faq: FaqItem[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
