import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { posts } from "@/src/db/schema";
import { requireAdminPage } from "@/src/lib/admin-guard";
import type { QualityReport } from "@/src/lib/quality-gate";
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin"
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Back to queue
        </Link>
        <StatusBadge status={post.status} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Editor + main content */}
        <div>
          <ReviewEditor
            id={post.id}
            initialTitle={post.title ?? ""}
            initialMetaDescription={post.metaDescription ?? ""}
            initialContentBody={post.contentBody ?? ""}
            status={post.status}
          />
        </div>

        {/* Sidebar: metadata + quality report */}
        <aside className="flex flex-col gap-6">
          <section className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
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
            </dl>
          </section>

          <section className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Quality report
              {report && (
                <span
                  className={`ml-2 ${
                    report.passed
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {report.passed ? "passed" : "failed"}
                </span>
              )}
            </h2>
            {!report ? (
              <p className="text-zinc-500">No report recorded.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {report.checks.map((c) => (
                  <li key={c.name} className="flex gap-2">
                    <span
                      className={
                        c.passed
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {c.passed ? "✓" : "✗"}
                    </span>
                    <span>
                      <span className="font-medium">{c.name}</span>
                      <span className="block text-xs text-zinc-500">
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
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium">{value ?? "—"}</dd>
    </div>
  );
}
