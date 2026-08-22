import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { posts } from "@/src/db/schema";
import { COOKIE_NAME, verifySessionToken } from "@/src/lib/admin-auth";
import { revalidateForPost } from "@/src/lib/publish-hooks";
import {
  imageSchema,
  imagesSchema,
  externalLinksSchema,
  contentSectionsSchema,
} from "@/src/lib/validation";
import { slugify } from "@/src/lib/site";

/**
 * PATCH /api/admin/posts/[id]
 *
 * Saves reviewer edits to title / meta_description / content_body /
 * featured_image / images / external_links / content_sections.
 *
 * Hard rule: this handler NEVER touches `status`, so editing can't publish a
 * post — publishing happens exclusively via the approve action.
 *
 * If the post being edited is already `published`, its cached public pages
 * are revalidated so the edit is visible immediately instead of waiting for
 * the hourly ISR window (see `revalidate = 3600` on the blog post route).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifySessionToken(request.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Whitelist editable fields; anything else (notably `status`) is ignored.
  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string") updates.title = body.title;
  if (typeof body.meta_description === "string")
    updates.metaDescription = body.meta_description;
  if (typeof body.content_body === "string" || body.content_body === null)
    updates.contentBody = body.content_body;

  // --- Featured image ---
  if (body.featured_image !== undefined) {
    if (body.featured_image === null) {
      updates.featuredImage = null;
    } else {
      const parsed = imageSchema.safeParse(body.featured_image);
      if (!parsed.success) {
        return NextResponse.json(
          { error: `Invalid featured_image: ${parsed.error.issues.map((i) => i.message).join(", ")}` },
          { status: 400 },
        );
      }
      updates.featuredImage = parsed.data;
    }
  }

  // --- Gallery images ---
  if (body.images !== undefined) {
    if (body.images === null || (Array.isArray(body.images) && body.images.length === 0)) {
      updates.images = null;
    } else {
      const parsed = imagesSchema.safeParse(body.images);
      if (!parsed.success) {
        return NextResponse.json(
          { error: `Invalid images: ${parsed.error.issues.map((i) => i.message).join(", ")}` },
          { status: 400 },
        );
      }
      updates.images = parsed.data;
    }
  }

  // --- External links ---
  if (body.external_links !== undefined) {
    if (body.external_links === null || (Array.isArray(body.external_links) && body.external_links.length === 0)) {
      updates.externalLinks = null;
    } else {
      const parsed = externalLinksSchema.safeParse(body.external_links);
      if (!parsed.success) {
        return NextResponse.json(
          { error: `Invalid external_links: ${parsed.error.issues.map((i) => i.message).join(", ")}` },
          { status: 400 },
        );
      }
      updates.externalLinks = parsed.data;
    }
  }

  // --- Content sections ---
  if (body.content_sections !== undefined) {
    if (body.content_sections === null || (Array.isArray(body.content_sections) && body.content_sections.length === 0)) {
      updates.contentSections = null;
    } else {
      const parsed = contentSectionsSchema.safeParse(body.content_sections);
      if (!parsed.success) {
        return NextResponse.json(
          { error: `Invalid content_sections: ${parsed.error.issues.map((i) => i.message).join(", ")}` },
          { status: 400 },
        );
      }
      // Regenerate section IDs from titles (slugify + dedupe).
      // Tradeoff: editing a section's title changes its anchor URL.
      const sectionSeen = new Map<string, number>();
      const sections = parsed.data!.map((s) => {
        let sectionId = slugify(s.title);
        const count = sectionSeen.get(sectionId) ?? 0;
        sectionSeen.set(sectionId, count + 1);
        if (count > 0) sectionId = `${sectionId}-${count + 1}`;
        return { ...s, id: sectionId };
      });
      updates.contentSections = sections;
    }
  }

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
      slug: posts.slug,
      tags: posts.tags,
      category: posts.category,
    });

  if (!updated) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (updated.status === "published") {
    revalidateForPost({
      slug: updated.slug,
      tags: updated.tags,
      category: updated.category,
    });
  }

  return NextResponse.json({ ok: true, post: updated });
}
