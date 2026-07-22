import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// The Neon HTTP driver issues each query via `fetch()`. Inside an ISR route
// (e.g. the `revalidate = 3600` blog post page), Next.js auto-caches plain
// fetch() calls in its Data Cache — which would silently cache DB query
// results too, independent of page-level revalidation. `cache: "no-store"`
// would bypass that, but it also forces the route to render dynamically,
// which breaks `generateStaticParams`-based static generation at build time.
// Tagging every query instead keeps it cacheable (safe for static builds)
// while letting `revalidateTag("db")` (see publish-hooks.ts) explicitly bust
// stale query results whenever an admin mutation changes a post.
const sql = neon(process.env.DATABASE_URL, {
  fetchOptions: { next: { tags: ["db"] } },
});

export const db = drizzle({ client: sql, schema });

export { schema };
