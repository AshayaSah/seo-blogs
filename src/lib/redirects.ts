import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { redirects, type SelectRedirect } from "@/src/db/schema";

/**
 * Create (or update) a slug redirect. `from_slug` is unique, so re-creating a
 * redirect for the same source updates its target/status rather than failing.
 */
export async function createRedirect(
  fromSlug: string,
  toSlug: string,
  statusCode = 301,
): Promise<SelectRedirect> {
  const [row] = await db
    .insert(redirects)
    .values({ fromSlug, toSlug, statusCode })
    .onConflictDoUpdate({
      target: redirects.fromSlug,
      set: { toSlug, statusCode },
    })
    .returning();
  return row;
}

/**
 * Resolve a redirect for `slug`. Returns the destination slug and status code,
 * or null when no redirect exists. Follows chains (a→b→c) to the final target,
 * with a guard against cycles and runaway chains.
 */
export async function resolveRedirect(
  slug: string,
): Promise<{ toSlug: string; statusCode: number } | null> {
  const seen = new Set<string>([slug]);
  let current = slug;
  let statusCode = 301;
  let resolved: string | null = null;

  for (let hops = 0; hops < 10; hops++) {
    const [row] = await db
      .select()
      .from(redirects)
      .where(eq(redirects.fromSlug, current))
      .limit(1);

    if (!row) break;

    statusCode = row.statusCode ?? 301;
    resolved = row.toSlug;

    // Stop if the chain loops or the target has no further redirect.
    if (seen.has(row.toSlug)) break;
    seen.add(row.toSlug);
    current = row.toSlug;
  }

  return resolved ? { toSlug: resolved, statusCode } : null;
}
