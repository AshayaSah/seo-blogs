"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: string;
  initialTitle: string;
  initialMetaDescription: string;
  initialContentBody: string;
  status: string;
};

type Feedback = { kind: "ok" | "error"; text: string } | null;

export default function ReviewEditor({
  id,
  initialTitle,
  initialMetaDescription,
  initialContentBody,
  status,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [metaDescription, setMetaDescription] = useState(
    initialMetaDescription,
  );
  const [contentBody, setContentBody] = useState(initialContentBody);
  const [busy, setBusy] = useState<null | "save" | "approve" | "reject">(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const dirty =
    title !== initialTitle ||
    metaDescription !== initialMetaDescription ||
    contentBody !== initialContentBody;

  async function saveEdits() {
    setBusy("save");
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          meta_description: metaDescription,
          content_body: contentBody,
        }),
      });
      if (res.ok) {
        setFeedback({ kind: "ok", text: "Edits saved." });
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setFeedback({ kind: "error", text: data.error ?? "Save failed." });
      }
    } finally {
      setBusy(null);
    }
  }

  async function act(action: "approve" | "reject") {
    setBusy(action);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/posts/${id}/${action}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setFeedback({
          kind: "ok",
          text:
            action === "approve"
              ? "Approved — now published."
              : "Rejected — moved back to draft.",
        });
        router.refresh();
      } else {
        setFeedback({ kind: "error", text: data.error ?? `${action} failed.` });
      }
    } finally {
      setBusy(null);
    }
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Title{" "}
          <span className="font-normal normal-case">({title.length} chars)</span>
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Meta description{" "}
          <span className="font-normal normal-case">
            ({metaDescription.length} chars)
          </span>
        </span>
        <textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          rows={3}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Content body (markdown)
        </span>
        <textarea
          value={contentBody}
          onChange={(e) => setContentBody(e.target.value)}
          rows={22}
          spellCheck={false}
          className={`${inputClass} font-mono leading-relaxed`}
        />
      </label>

      {feedback && (
        <p
          className={`text-sm ${
            feedback.kind === "ok"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {feedback.text}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button
          onClick={saveEdits}
          disabled={busy !== null || !dirty}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {busy === "save" ? "Saving…" : "Save edits"}
        </button>

        <button
          onClick={() => act("approve")}
          disabled={busy !== null}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy === "approve" ? "Approving…" : "Approve & publish"}
        </button>

        <button
          onClick={() => act("reject")}
          disabled={busy !== null}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy === "reject" ? "Rejecting…" : "Reject"}
        </button>

        <span className="ml-auto text-xs text-zinc-500">
          Current status: {status}
        </span>
      </div>
    </div>
  );
}
