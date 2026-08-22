import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/src/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE_NAME}.`,
  alternates: { canonical: "/about" },
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
