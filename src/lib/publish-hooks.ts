import { after } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createSign } from "node:crypto";
import { SITE_URL, absoluteUrl, slugify } from "./site";

/**
 * Post-publish automation. Call `onPublish(post)` whenever a post transitions
 * into the 'published' state (ingestion auto-publish OR admin approve).
 *
 * It runs two kinds of work:
 *   - Cache revalidation (synchronous, in-request) so the new/updated content
 *     is served immediately.
 *   - External search-engine notifications (IndexNow + Google Indexing API),
 *     deferred with `after()` so they never delay the HTTP response and never
 *     fail the publish — each is isolated and only logs on error.
 */

export type PublishablePost = {
  slug: string;
  tags?: string[] | null;
  category?: string | null;
};

export function onPublish(post: PublishablePost): void {
  revalidateForPost(post);

  after(async () => {
    const url = absoluteUrl(`/blog/${post.slug}`);
    const results = await Promise.allSettled([
      pingIndexNow(url),
      submitToGoogleIndexing(url),
    ]);
    for (const r of results) {
      if (r.status === "rejected") {
        console.error("[onPublish] notification failed:", r.reason);
      }
    }
  });
}

// ---------------------------------------------------------------------------
// 1) Revalidation
// ---------------------------------------------------------------------------

export function revalidateForPost(post: PublishablePost): void {
  const paths = new Set<string>([
    `/blog/${post.slug}`, // the post itself
    "/blog", // blog index (when it exists)
    "/", // home
  ]);
  if (post.category) paths.add(`/blog/category/${slugify(post.category)}`);
  for (const tag of post.tags ?? []) paths.add(`/blog/tag/${slugify(tag)}`);

  for (const path of paths) revalidatePath(path);
  // The sitemap and llms.txt both enumerate published posts — refresh them too.
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");

  // Every DB query is tagged "db" (see src/db/index.ts) so this busts the
  // Data Cache for the actual query results too — without it, revalidatePath
  // would force a fresh render of the right page but that render could still
  // read a stale cached DB response. `{ expire: 0 }` (rather than the default
  // "max" stale-while-revalidate profile) is what Next recommends for a
  // Route Handler that needs the change visible on the very next request.
  revalidateTag("db", { expire: 0 });
}

// ---------------------------------------------------------------------------
// 2a) IndexNow (Bing, Yandex, Seznam, …)
// ---------------------------------------------------------------------------

async function pingIndexNow(url: string): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    console.warn("[onPublish] INDEXNOW_KEY not set; skipping IndexNow");
    return;
  }

  const host = new URL(SITE_URL).host;
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${SITE_URL}/${key}.txt`,
      urlList: [url],
    }),
  });

  // IndexNow returns 200/202 on success; log anything else.
  if (!res.ok) {
    console.warn(`[onPublish] IndexNow responded ${res.status}`);
  }
}

// ---------------------------------------------------------------------------
// 2b) Google Search Console Indexing API
// ---------------------------------------------------------------------------

type ServiceAccount = { client_email: string; private_key: string };

async function submitToGoogleIndexing(url: string): Promise<void> {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.warn(
      "[onPublish] GSC_SERVICE_ACCOUNT_JSON not set; skipping Google Indexing",
    );
    return;
  }

  let sa: ServiceAccount;
  try {
    sa = JSON.parse(raw);
  } catch {
    console.error("[onPublish] GSC_SERVICE_ACCOUNT_JSON is not valid JSON");
    return;
  }

  const token = await getGoogleAccessToken(sa);
  const res = await fetch(
    "https://indexing.googleapis.com/v3/urlNotifications:publish",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ url, type: "URL_UPDATED" }),
    },
  );

  if (!res.ok) {
    console.warn(
      `[onPublish] Google Indexing responded ${res.status}: ${await res
        .text()
        .catch(() => "")}`,
    );
  }
}

function base64url(input: Buffer | string): string {
  return (typeof input === "string" ? Buffer.from(input) : input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Mint a short-lived OAuth2 access token via a signed service-account JWT. */
async function getGoogleAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(claims),
  )}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  // Normalize any escaped newlines in the PEM (common when stored in env).
  const privateKey = sa.private_key.replace(/\\n/g, "\n");
  const jwt = `${signingInput}.${base64url(signer.sign(privateKey))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("No access_token in token response");
  return data.access_token;
}
