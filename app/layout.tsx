import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import JsonLd from "@/src/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/src/lib/jsonld";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, absoluteUrl } from "@/src/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    types: {
      "application/rss+xml": absoluteUrl("/feed.xml"),
    },
  },
  // Social-sharing defaults inherited by every route. The og:image is the
  // generated default at /opengraph-image (app/opengraph-image.tsx); child
  // pages override openGraph.images explicitly when they have a better one
  // (e.g. blog posts).
  openGraph: {
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    url: SITE_URL,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

// Root layout stays minimal: html/body + site-wide structured data. Public
// chrome (header/footer/ads/consent) lives in the (public) route group so it
// doesn't wrap the /admin section.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title={SITE_NAME}
          href={absoluteUrl("/feed.xml")}
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        {children}
      </body>
    </html>
  );
}
