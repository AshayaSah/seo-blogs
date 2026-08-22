import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { posts } from "@/src/db/schema";
import { requireAdminPage } from "@/src/lib/admin-guard";
import type { QualityReport } from "@/src/lib/quality-gate";
import AdminNav, { type AdminTab } from "../../AdminNav";
import StatusBadge from "../../StatusBadge";
import ReviewEditor from "./ReviewEditor";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;

  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) notFound();

  const report = post.qualityReport as QualityReport | null;
  const trend = post.sourceTrendReference as {
    trend_name?: string;
    trend_score?: number;
    keyword_difficulty?: number;
    detected_at?: string;
  } | null;

  const isPublished = post.status === "published";
  const backHref = isPublished ? "/admin?tab=published" : "/admin";
  const backLabel = isPublished ? "← Back to published posts" : "← Back to queue";
  const activeTab: AdminTab = isPublished ? "published" : "queue";

  const featuredImage = post.featuredImage as {
    url: string;
    alt_text: string;
    width: number;
    height: number;
    caption?: string;
    cloudinary_public_id?: string;
  } | null;

  const contentSections = (post.contentSections ?? []) as {
    id: string;
    title: string;
    content: string;
    image?: {
      url: string;
      alt_text: string;
      width: number;
      height: number;
      caption?: string;
      cloudinary_public_id?: string;
    };
  }[];

  const images = (post.images ?? []) as {
    url: string;
    alt_text: string;
    width: number;
    height: number;
    caption?: string;
    cloudinary_public_id?: string;
  }[];

  const externalLinks = (post.externalLinks ?? []) as {
    label: string;
    url: string;
    rel?: "nofollow" | "sponsored" | "ugc" | null;
    description?: string;
  }[];

  return (
    <div>
      <AdminNav active={activeTab} />

      <div className="mb-6 flex items-center justify-between">
        <Link href={backHref} className="text-sm text-primary hover:underline">
          {backLabel}
        </Link>
        <StatusBadge status={post.status} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Editor + main content */}
        <div>
          <ReviewEditor
            id={post.id}
            slug={post.slug}
            initialTitle={post.title ?? ""}
            initialMetaDescription={post.metaDescription ?? ""}
            initialContentBody={post.contentBody ?? ""}
            initialFeaturedImage={featuredImage}
            initialContentSections={contentSections}
            initialImages={images}
            initialExternalLinks={externalLinks}
            status={post.status}
          />
        </div>

        {/* Sidebar: metadata + quality report */}
        <aside className="flex flex-col gap-6">
          <section className="rounded-lg border border-border p-4 text-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Details
            </h2>
            <dl className="flex flex-col gap-2">
              <Detail label="Primary keyword" value={post.primaryKeyword} />
              <Detail label="Category" value={post.category} />
              <Detail label="Slug" value={post.slug} />
              <Detail
                label="Read time"
                value={
                  post.readTimeMinutes ? `${post.readTimeMinutes} min` : null
                }
              />
              <Detail label="Trend" value={trend?.trend_name} />
              <Detail
                label="Trend score"
                value={trend?.trend_score?.toString()}
              />
              <Detail
                label="Keyword difficulty"
                value={trend?.keyword_difficulty?.toString()}
              />
              <Detail label="Created" value={post.createdAt.toLocaleString()} />
              {post.publishedAt && (
                <Detail
                  label="Published"
                  value={post.publishedAt.toLocaleString()}
                />
              )}
            </dl>
          </section>

          <section className="rounded-lg border border-border p-4 text-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quality report
              {report && (
                <span
                  className={`ml-2 ${
                    report.passed ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {report.passed ? "passed" : "failed"}
                </span>
              )}
            </h2>
            {!report ? (
              <p className="text-muted-foreground">No report recorded.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {report.checks.map((c) => (
                  <li key={c.name} className="flex gap-2">
                    <span
                      className={c.passed ? "text-emerald-600" : "text-red-600"}
                    >
                      {c.passed ? "✓" : "✗"}
                    </span>
                    <span>
                      <span className="font-medium">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {c.detail}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value ?? "—"}</dd>
    </div>
  );
}
