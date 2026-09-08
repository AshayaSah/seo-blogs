import type { Metadata } from "next";
import { SITE_NAME, absoluteUrl } from "@/src/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact the ${SITE_NAME} editorial team — questions, corrections, collaborations, or press inquiries are welcome.`,
  alternates: { canonical: absoluteUrl("/contact") },
  openGraph: {
    title: `Contact — ${SITE_NAME}`,
    description: `Contact the ${SITE_NAME} editorial team — questions, corrections, collaborations, or press inquiries are welcome.`,
    url: absoluteUrl("/contact"),
    type: "website",
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Contact — ${SITE_NAME}`,
    description: `Contact the ${SITE_NAME} editorial team — questions, corrections, collaborations, or press inquiries are welcome.`,
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
      <div className="article-content mt-6">
        <p>
          We’d love to hear from you. For questions, corrections, or partnership
          enquiries, email us at{" "}
          <a href="mailto:hello@example.com">hello@example.com</a>.
        </p>
        <p>
          {/* Placeholder — replace with a real address / form / ESP endpoint. */}
          We aim to respond within a few business days.
        </p>
      </div>
    </div>
  );
}
