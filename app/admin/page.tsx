import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/src/db";
import { posts } from "@/src/db/schema";
import { requireAdminPage } from "@/src/lib/admin-guard";
import type { QualityReport } from "@/src/lib/quality-gate";
import LogoutButton from "./LogoutButton";
import StatusBadge from "./StatusBadge";

// Always render fresh: the review queue must reflect the latest DB state.
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

export default async function AdminDashboardPage() {
  await requireAdminPage();

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      status: posts.status,
      primaryKeyword: posts.primaryKeyword,
      qualityReport: posts.qualityReport,
      sourceTrendReference: posts.sourceTrendReference,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(inArray(posts.status, ["flagged", "draft"]))
    .orderBy(desc(posts.createdAt));

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} post{rows.length === 1 ? "" : "s"} awaiting review
            (flagged or draft)
          </p>
        </div>
        <LogoutButton />
      </header>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nothing to review. 🎉
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Keyword</th>
                <th className="px-4 py-3 font-medium">Failed checks</th>
                <th className="px-4 py-3 font-medium">Trend</th>
                <th className="px-4 py-3 font-medium">KD</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const trend = row.sourceTrendReference as TrendRef;
                const failed = failedChecks(
                  row.qualityReport as QualityReport | null,
                );
                return (
                  <tr
                    key={row.id}
                    className="border-t border-border hover:bg-muted"
                  >
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
                    <td className="px-4 py-3">
                      {failed.length === 0 ? (
                        <span className="text-emerald-600">
                          all passed
                        </span>
                      ) : (
                        <span className="text-amber-700">
                          {failed.join(", ")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {trend?.trend_score ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {trend?.keyword_difficulty ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.createdAt.toLocaleString()}
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
