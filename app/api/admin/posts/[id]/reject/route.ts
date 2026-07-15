import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { posts } from "@/src/db/schema";
import { COOKIE_NAME, verifySessionToken } from "@/src/lib/admin-auth";

/**
 * POST /api/admin/posts/[id]/reject
 *
 * Sends a post back to 'draft' (the schema enum has no 'archived' state) and
 * clears any publish timestamp. Never publishes.
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
    .returning({ id: posts.id, status: posts.status });

  if (!updated) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id: updated.id, status: updated.status });
}
