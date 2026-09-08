import type { Metadata } from "next";
import { SITE_NAME, absoluteUrl } from "@/src/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `The ${SITE_NAME} privacy policy — what data we collect, how we use it, and the choices you have about your information.`,
  alternates: { canonical: absoluteUrl("/privacy-policy") },
  openGraph: {
    title: `Privacy Policy — ${SITE_NAME}`,
    description: `The ${SITE_NAME} privacy policy — what data we collect, how we use it, and the choices you have about your information.`,
    url: absoluteUrl("/privacy-policy"),
    type: "website",
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Privacy Policy — ${SITE_NAME}`,
    description: `The ${SITE_NAME} privacy policy — what data we collect, how we use it, and the choices you have about your information.`,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().getFullYear()}
      </p>

      <div className="article-content mt-6">
        <p>
          This Privacy Policy explains how {SITE_NAME} (“we”, “us”) collects,
          uses, and protects information when you visit this website. This is a
          template and should be reviewed by a qualified professional before
          launch.
        </p>

        <h2>Information we collect</h2>
        <p>
          We may collect standard log data (such as IP address, browser type,
          and pages visited) and analytics data to understand how the site is
          used.
        </p>

        <h2>Cookies and advertising</h2>
        <p>
          We may use cookies and similar technologies. If advertising is
          enabled, third-party vendors — including Google — may use cookies to
          serve ads based on your prior visits to this and other websites.
          Google’s use of advertising cookies enables it and its partners to
          serve ads based on your visit here and/or other sites on the internet.
          You can opt out of personalised advertising by visiting{" "}
          <a href="https://www.google.com/settings/ads" rel="noopener noreferrer" target="_blank">
            Google Ads Settings
          </a>
          .
        </p>

        <h2>Your choices (EEA/UK)</h2>
        <p>
          Visitors in the EEA and UK will be asked for consent before
          personalised advertising cookies are set, via a Google-certified
          consent management platform.
        </p>

        <h2>Third-party services</h2>
        <p>
          We may use third-party services (analytics, advertising, hosting)
          that process data according to their own privacy policies.
        </p>

        <h2>Contact</h2>
        <p>
          For privacy questions, email{" "}
          <a href="mailto:privacy@example.com">privacy@example.com</a>.
        </p>
      </div>
    </div>
  );
}
