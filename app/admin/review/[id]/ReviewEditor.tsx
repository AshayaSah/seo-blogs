"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: string;
  slug: string;
  initialTitle: string;
  initialMetaDescription: string;
  initialContentBody: string;
  status: string;
};

type Feedback = { kind: "ok" | "error"; text: string } | null;

export default function ReviewEditor({
  id,
  slug,
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
  const isPublished = status === "published";

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
        setFeedback({
          kind: "ok",
          text: isPublished
            ? "Edits saved — live page updated."
            : "Edits saved.",
        });
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
    if (action === "reject" && isPublished) {
      const confirmed = window.confirm(
        "Unpublish this post? It will come down from the live site immediately and move back to draft.",
      );
      if (!confirmed) return;
    }

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
              : isPublished
                ? "Unpublished — moved back to draft."
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

  const inputClass = "field";

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
            feedback.kind === "ok" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {feedback.text}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button
          onClick={saveEdits}
          disabled={busy !== null || !dirty}
          className="btn btn-outline"
        >
          {busy === "save" ? "Saving…" : "Save edits"}
        </button>

        {isPublished ? (
          <>
            <Link
              href={`/blog/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
            >
              View live ↗
            </Link>
            <button
              onClick={() => act("reject")}
              disabled={busy !== null}
              className="btn bg-red-600 text-white hover:bg-red-700"
            >
              {busy === "reject" ? "Unpublishing…" : "Unpublish"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => act("approve")}
              disabled={busy !== null}
              className="btn bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {busy === "approve" ? "Approving…" : "Approve & publish"}
            </button>

            <button
              onClick={() => act("reject")}
              disabled={busy !== null}
              className="btn bg-red-600 text-white hover:bg-red-700"
            >
              {busy === "reject" ? "Rejecting…" : "Reject"}
            </button>
          </>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          Current status: {status}
        </span>
      </div>
    </div>
  );
}
