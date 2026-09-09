import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, absoluteUrl, PARENT_COMPANY_NAME, PARENT_COMPANY_URL } from "@/src/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE_NAME} — the people, mission, and editorial approach behind our deep-dives into SEO, content strategy, and AI-assisted publishing.`,
  alternates: { canonical: absoluteUrl("/about") },
  openGraph: {
    title: `About — ${SITE_NAME}`,
    description: `About ${SITE_NAME} — the people, mission, and editorial approach behind our deep-dives into SEO, content strategy, and AI-assisted publishing.`,
    url: absoluteUrl("/about"),
    type: "website",
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `About — ${SITE_NAME}`,
    description: `About ${SITE_NAME} — the people, mission, and editorial approach behind our deep-dives into SEO, content strategy, and AI-assisted publishing.`,
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">About {SITE_NAME}</h1>
      <div className="article-content mt-6">
        <p>
          {SITE_NAME} publishes practical articles on SEO, search, and content
          strategy. Our goal is to help readers understand how modern search and
          discovery work, and how to create content that serves both people and
          search engines.
        </p>
        <p>
          {SITE_NAME} is built and operated by{" "}
          <a
            href={PARENT_COMPANY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            {PARENT_COMPANY_NAME}
          </a>
          .
        </p>
        <h2>How we work</h2>
        <p>
          Some of our articles are produced with AI assistance and reviewed by
          our editorial team before publication. Every published post passes an
          automated quality check and, where appropriate, human review.
        </p>
        <h2>Get in touch</h2>
        <p>
          Questions, corrections, or feedback? Visit our{" "}
          <Link href="/contact">contact page</Link>.
        </p>
      </div>
    </div>
  );
}
