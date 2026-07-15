import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { posts } from "@/src/db/schema";
import { COOKIE_NAME, verifySessionToken } from "@/src/lib/admin-auth";
import { onPublish } from "@/src/lib/publish-hooks";

/**
 * POST /api/admin/posts/[id]/approve
 *
 * The ONLY path by which a post (flagged or draft) becomes 'published'.
 * Nothing else in the system promotes to published — the ingest gate can only
 * publish clean, non-draft posts on the way in; a post that was ever flagged
 * reaches 'published' exclusively through this human action.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Defense in depth: re-verify the session inside the mutating handler.
  if (!verifySessionToken(request.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [updated] = await db
    .update(posts)
    .set({ status: "published", publishedAt: new Date() })
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

  // Post-publish automation: revalidate + notify search engines.
  onPublish({
    slug: updated.slug,
    tags: updated.tags,
    category: updated.category,
  });

  return NextResponse.json({ ok: true, id: updated.id, status: updated.status });
}
