/** Site-wide constants used for canonical URLs, metadata, and JSON-LD. */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "Saastra Labs";

export const SITE_DESCRIPTION =
  "AI-assisted articles on SEO, search, and content strategy.";

// Used by the site-wide Organization schema and as a publisher reference.
export const ORGANIZATION = {
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/next.svg`,
};

/** Turn arbitrary text (e.g. a category name) into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const absoluteUrl = (path: string): string =>
  path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
