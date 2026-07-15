import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { posts } from "@/src/db/schema";
import { COOKIE_NAME, verifySessionToken } from "@/src/lib/admin-auth";

/**
 * PATCH /api/admin/posts/[id]
 *
 * Saves reviewer edits to title / meta_description / content_body only.
 * Hard rule: this handler NEVER touches `status`, so editing can't publish a
 * post — publishing happens exclusively via the approve action.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifySessionToken(request.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: {
    title?: unknown;
    meta_description?: unknown;
    content_body?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Whitelist editable fields; anything else (notably `status`) is ignored.
  const updates: {
    title?: string;
    metaDescription?: string;
    contentBody?: string;
  } = {};
  if (typeof body.title === "string") updates.title = body.title;
  if (typeof body.meta_description === "string")
    updates.metaDescription = body.meta_description;
  if (typeof body.content_body === "string")
    updates.contentBody = body.content_body;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No editable fields provided" },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(posts)
    .set(updates) // updatedAt is bumped by the schema's $onUpdate
    .where(eq(posts.id, id))
    .returning({
      id: posts.id,
      status: posts.status,
      title: posts.title,
      metaDescription: posts.metaDescription,
    });

  if (!updated) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, post: updated });
}
