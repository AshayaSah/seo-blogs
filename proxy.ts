import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { COOKIE_NAME, verifySessionToken } from "@/src/lib/admin-auth";
import { resolveRedirect } from "@/src/lib/redirects";
import { db } from "@/src/db";
import { posts } from "@/src/db/schema";

// Next 16: the `middleware` convention was renamed to `proxy` and now defaults
// to the Node.js runtime — so node:crypto (admin auth) and the DB client work.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Public blog: slug redirects (301/302) + soft-delete (410) ----------
  if (pathname.startsWith("/blog")) {
    const match = pathname.match(/^\/blog\/([^/]+)$/);
    if (match) {
      return handleBlogSlug(request, decodeURIComponent(match[1]));
    }
    // /blog, /blog/category/*, /blog/tag/* are ordinary public pages.
    return NextResponse.next();
  }

  // --- Admin gate ---------------------------------------------------------
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }
  if (verifySessionToken(request.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * For a single-segment /blog/[slug]:
 *   - live published post  -> pass through (happy path, one DB read)
 *   - soft-deleted post    -> 301 to a redirect target if one exists, else 410 Gone
 *   - unknown slug         -> 301 if it's a redirect from_slug, else pass through (page 404s)
 *
 * NOTE: this adds one indexed DB read per /blog/[slug] request. For high
 * traffic, cache the redirect/deleted maps (e.g. a short-TTL snapshot) to keep
 * the happy path DB-free.
 */
async function handleBlogSlug(request: NextRequest, slug: string) {
  try {
    const [post] = await db
      .select({ deletedAt: posts.deletedAt, status: posts.status })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    // Live, published, not deleted → let the (cached) page render.
    if (post && post.status === "published" && !post.deletedAt) {
      return NextResponse.next();
    }

    // Deleted or missing: a redirect (if configured) takes precedence.
    const redirect = await resolveRedirect(slug);
    if (redirect) {
      const url = request.nextUrl.clone();
      url.pathname = `/blog/${redirect.toSlug}`;
      url.search = "";
      // Honors the stored status_code (301 by default) as a real HTTP redirect.
      return NextResponse.redirect(url, redirect.statusCode);
    }

    // Soft-deleted with no redirect → 410 Gone (so crawlers deindex).
    if (post?.deletedAt) {
      return new NextResponse("410 Gone — this post has been removed.", {
        status: 410,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  } catch (err) {
    // Fail open: on any error, let the request proceed to the page.
    console.error("[proxy] /blog slug check failed:", err);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/blog",
    "/blog/:path*",
  ],
};
