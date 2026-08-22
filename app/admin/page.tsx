import Link from "next/link";
import { and, count, desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "@/src/db";
import { posts } from "@/src/db/schema";
import { requireAdminPage } from "@/src/lib/admin-guard";
import type { QualityReport } from "@/src/lib/quality-gate";
import AdminNav, { type AdminTab } from "./AdminNav";
import StatusBadge from "./StatusBadge";

// Always render fresh: the dashboard must reflect the latest DB state.
export const dynamic = "force-dynamic";

type TrendRef = {
  trend_name?: string;
  trend_score?: number;
  keyword_difficulty?: number;
} | null;

function failedChecks(report: QualityReport | null): string[] {
  if (!report?.checks) return [];
  return report.checks.filter((c) => !c.passed).map((c) => c.name);
}

function parseTab(value: string | undefined): AdminTab {
  if (value === "published" || value === "all" || value === "settings") return value;
  return "queue";
}

const HEADING: Record<AdminTab, string> = {
  queue: "Review queue",
  published: "Published posts",
  all: "All posts",
  settings: "Settings",
};

const SUBTITLE: Record<AdminTab, string> = {
  queue: "Flagged or draft posts awaiting a human decision.",
  published: "Live on the site. Edit content or unpublish.",
  all: "Every post, regardless of status.",
  settings: "Control how incoming agent submissions are handled.",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  await requireAdminPage();
  const { tab: tabParam, q: qParam } = await searchParams;
  const tab = parseTab(tabParam);
  const q = qParam?.trim() ?? "";

  const [{ n: queueCount }] = await db
    .select({ n: count() })
    .from(posts)
    .where(inArray(posts.status, ["flagged", "draft"]));
  const [{ n: publishedCount }] = await db
    .select({ n: count() })
    .from(posts)
    .where(eq(posts.status, "published"));
  const [{ n: allCount }] = await db.select({ n: count() }).from(posts);

  const statusFilter =
    tab === "queue"
      ? inArray(posts.status, ["flagged", "draft"])
      : tab === "published"
        ? eq(posts.status, "published")
        : undefined;
  const filters = [statusFilter, q ? ilike(posts.title, `%${q}%`) : undefined].filter(
    (f) => f !== undefined,
  );

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      status: posts.status,
      primaryKeyword: posts.primaryKeyword,
      category: posts.category,
      qualityReport: posts.qualityReport,
      sourceTrendReference: posts.sourceTrendReference,
      createdAt: posts.createdAt,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(tab === "published" ? posts.publishedAt : posts.createdAt));

  const clearHref = tab === "queue" ? "/admin" : `/admin?tab=${tab}`;

  return (
    <div>
      <AdminNav
        active={tab}
        counts={{ queue: queueCount, published: publishedCount, all: allCount }}
      />

      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{HEADING[tab]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{SUBTITLE[tab]}</p>
      </header>

      <form action="/admin" method="GET" className="mb-4 flex gap-2">
        <input type="hidden" name="tab" value={tab} />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by title…"
          className="field max-w-xs"
        />
        <button type="submit" className="btn btn-outline">
          Search
        </button>
        {q && (
          <Link href={clearHref} className="btn btn-outline">
            Clear
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {q
            ? `No posts match "${q}".`
            : tab === "queue"
              ? "Nothing to review. 🎉"
              : "No posts yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Keyword</th>
                <th className="px-4 py-3 font-medium">Category</th>
                {tab === "queue" && (
                  <>
                    <th className="px-4 py-3 font-medium">Failed checks</th>
                    <th className="px-4 py-3 font-medium">Trend</th>
                    <th className="px-4 py-3 font-medium">KD</th>
                  </>
                )}
                <th className="px-4 py-3 font-medium">
                  {tab === "published" ? "Published" : "Created"}
                </th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const trend = row.sourceTrendReference as TrendRef;
                const failed = failedChecks(row.qualityReport as QualityReport | null);
                const dateShown = tab === "published" ? row.publishedAt : row.createdAt;
                return (
                  <tr key={row.id} className="border-t border-border hover:bg-muted">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/review/${row.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {row.title ?? "(untitled)"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.primaryKeyword ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.category ?? "—"}
                    </td>
                    {tab === "queue" && (
                      <>
                        <td className="px-4 py-3">
                          {failed.length === 0 ? (
                            <span className="text-emerald-600">all passed</span>
                          ) : (
                            <span className="text-amber-700">{failed.join(", ")}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {trend?.trend_score ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {trend?.keyword_difficulty ?? "—"}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-muted-foreground">
                      {dateShown?.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.status === "published" && (
                        <Link
                          href={`/blog/${row.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          View live ↗
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
