import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { posts } from "@/src/db/schema";
import { COOKIE_NAME, verifySessionToken } from "@/src/lib/admin-auth";
import { revalidateForPost } from "@/src/lib/publish-hooks";

/**
 * POST /api/admin/posts/[id]/reject
 *
 * Sends a post back to 'draft' (the schema enum has no 'archived' state) and
 * clears any publish timestamp. Never publishes. Also doubles as "unpublish"
 * for an already-live post — the admin UI reuses this endpoint and just
 * changes the label. Either way, revalidate its public paths: without this,
 * a post unpublished here would keep serving its stale, statically-cached
 * page for up to an hour (see `revalidate = 3600` on the blog post route).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifySessionToken(request.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [updated] = await db
    .update(posts)
    .set({ status: "draft", publishedAt: null })
    .where(eq(posts.id, id))
    .returning({
      id: posts.id,
      status: posts.status,
      slug: posts.slug,
      tags: posts.tags,
      category: posts.category,
    });

  if (!updated) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  revalidateForPost({
    slug: updated.slug,
    tags: updated.tags,
    category: updated.category,
  });

  return NextResponse.json({ ok: true, id: updated.id, status: updated.status });
}
