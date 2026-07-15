import type { Metadata } from "next";
import { SITE_NAME } from "@/src/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${SITE_NAME}.`,
  alternates: { canonical: "/contact" },
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
