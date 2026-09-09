/** Site-wide constants used for canonical URLs, metadata, and JSON-LD. */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "Knowra";

export const SITE_DESCRIPTION =
  "Knowra — AI-powered SEO & content strategy insights, powered by Saastra Labs.";

// Parent company constants
export const PARENT_COMPANY_NAME = "Saastra Labs";
export const PARENT_COMPANY_URL = "https://saastralabs.com/";

// Used by the site-wide Organization schema and as a publisher reference.
export const ORGANIZATION = {
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo_knowra.png`,
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
  path.startsWith("http")
    ? path
    : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
