"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Feedback = { kind: "ok" | "error"; text: string } | null;

export default function SettingsForm({
  initialValue,
}: {
  initialValue: boolean;
}) {
  const router = useRouter();
  const [autoPublish, setAutoPublish] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function toggle() {
    const next = !autoPublish;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ auto_publish_enabled: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAutoPublish(next);
        setFeedback({
          kind: "ok",
          text: next
            ? "Auto-publish enabled — clean submissions will be published immediately."
            : "Auto-publish disabled — all submissions will be queued for review.",
        });
        router.refresh();
      } else {
        setFeedback({ kind: "error", text: data.error ?? "Save failed." });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="rounded-lg border border-border p-6">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={autoPublish}
            onChange={toggle}
            disabled={busy}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <div>
            <span className="font-medium">Auto-publish clean submissions</span>
            <p className="mt-1 text-sm text-muted-foreground">
              When checked, agent submissions that pass every quality-gate check
              are published immediately. When unchecked, all agent
              submissions — passing or not — are queued in the review queue for
              manual approval.
            </p>
          </div>
        </label>

        {feedback && (
          <p
            className={`mt-4 text-sm ${
              feedback.kind === "ok" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {feedback.text}
          </p>
        )}
      </div>
    </div>
  );
}
