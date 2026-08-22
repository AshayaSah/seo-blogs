"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ImageField, { type ImageFieldData } from "./ImageField";
import { VALIDATION_LIMITS } from "@/src/lib/validation";

type ContentSection = {
  id: string;
  title: string;
  content: string;
  image?: ImageFieldData;
};

type ExternalLink = {
  label: string;
  url: string;
  rel?: "nofollow" | "sponsored" | "ugc" | null;
  description?: string;
};

type Props = {
  id: string;
  slug: string;
  initialTitle: string;
  initialMetaDescription: string;
  initialContentBody: string;
  initialFeaturedImage: ImageFieldData | null;
  initialContentSections: ContentSection[];
  initialImages: ImageFieldData[];
  initialExternalLinks: ExternalLink[];
  status: string;
};

type Feedback = { kind: "ok" | "error"; text: string } | null;

function makeEmptyImage(): ImageFieldData {
  return { url: "", alt_text: "", width: 0, height: 0 };
}

function makeEmptySection(): ContentSection {
  return { id: "", title: "", content: "", image: undefined };
}

function makeEmptyExternalLink(): ExternalLink {
  return { label: "", url: "", rel: null, description: "" };
}

const inputClass = "field";

export default function ReviewEditor({
  id,
  slug,
  initialTitle,
  initialMetaDescription,
  initialContentBody,
  initialFeaturedImage,
  initialContentSections,
  initialImages,
  initialExternalLinks,
  status,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [metaDescription, setMetaDescription] = useState(initialMetaDescription);
  const [contentBody, setContentBody] = useState(initialContentBody);
  const [featuredImage, setFeaturedImage] = useState<ImageFieldData | null>(initialFeaturedImage);
  const [contentSections, setContentSections] = useState<ContentSection[]>(initialContentSections);
  const [images, setImages] = useState<ImageFieldData[]>(initialImages);
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>(initialExternalLinks);

  const [busy, setBusy] = useState<null | "save" | "approve" | "reject">(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const isPublished = status === "published";
  const hasSections = initialContentSections.length > 0;

  // --- Section helpers ---
  function updateSection(index: number, patch: Partial<ContentSection>) {
    setContentSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }
  function removeSection(index: number) {
    setContentSections((prev) => prev.filter((_, i) => i !== index));
  }
  function moveSection(index: number, dir: -1 | 1) {
    setContentSections((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  // --- Gallery helpers ---
  function updateImage(index: number, data: ImageFieldData) {
    setImages((prev) => prev.map((img, i) => (i === index ? data : img)));
  }
  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  // --- External link helpers ---
  function updateExternalLink(index: number, patch: Partial<ExternalLink>) {
    setExternalLinks((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  function removeExternalLink(index: number) {
    setExternalLinks((prev) => prev.filter((_, i) => i !== index));
  }

  // --- Dirty check ---
  const dirty =
    title !== initialTitle ||
    metaDescription !== initialMetaDescription ||
    contentBody !== initialContentBody ||
    JSON.stringify(featuredImage) !== JSON.stringify(initialFeaturedImage) ||
    JSON.stringify(contentSections) !== JSON.stringify(initialContentSections) ||
    JSON.stringify(images) !== JSON.stringify(initialImages) ||
    JSON.stringify(externalLinks) !== JSON.stringify(initialExternalLinks);

  // --- Save ---
  async function saveEdits() {
    setBusy("save");
    setFeedback(null);
    try {
      const payload: Record<string, unknown> = {
        title,
        meta_description: metaDescription,
        content_body: contentBody || null,
        featured_image: featuredImage,
        images: images.length > 0 ? images : null,
        external_links: externalLinks.length > 0 ? externalLinks : null,
      };
      if (hasSections) {
        payload.content_sections = contentSections.length > 0 ? contentSections : null;
      }

      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
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

  // --- Approve / Reject ---
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
      const res = await fetch(`/api/admin/posts/${id}/${action}`, { method: "POST" });
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

  const galleryLimit = VALIDATION_LIMITS.maxGalleryImages;
  const extLinkLimit = VALIDATION_LIMITS.maxExternalLinks;

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Title ---- */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Title{" "}
          <span className="font-normal normal-case">({title.length} chars)</span>
        </span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </label>

      {/* ---- Meta description ---- */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Meta description{" "}
          <span className="font-normal normal-case">({metaDescription.length} chars)</span>
        </span>
        <textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          rows={3}
          className={inputClass}
        />
      </label>

      {/* ---- Featured image ---- */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Featured image
        </span>
        <ImageField
          value={featuredImage ?? makeEmptyImage()}
          onChange={(data) => setFeaturedImage(data.url ? data : null)}
        />
      </div>

      {/* ---- Content body (legacy) or Sections (modular) ---- */}
      {hasSections ? (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Content sections
          </span>
          {contentSections.map((section, idx) => (
            <div key={section.id || idx} className="flex flex-col gap-2 rounded-lg border border-border p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                <div className="ml-auto flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveSection(idx, -1)}
                    disabled={idx === 0}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 1)}
                    disabled={idx === contentSections.length - 1}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(idx)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Section title</span>
                <input
                  value={section.title}
                  onChange={(e) => updateSection(idx, { title: e.target.value })}
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Content (markdown)</span>
                <textarea
                  value={section.content}
                  onChange={(e) => updateSection(idx, { content: e.target.value })}
                  rows={10}
                  spellCheck={false}
                  className={`${inputClass} font-mono leading-relaxed`}
                />
              </label>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Section image (optional)</span>
                <ImageField
                  value={section.image ?? makeEmptyImage()}
                  onChange={(data) =>
                    updateSection(idx, { image: data.url ? data : undefined })
                  }
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setContentSections((prev) => [...prev, makeEmptySection()])}
            className="btn btn-outline self-start text-xs"
          >
            + Add section
          </button>
        </div>
      ) : (
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
      )}

      {/* ---- Gallery images ---- */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Gallery images ({images.length}/{galleryLimit})
          </span>
          {images.length < galleryLimit && (
            <button
              type="button"
              onClick={() => setImages((prev) => [...prev, makeEmptyImage()])}
              className="text-xs text-primary hover:underline"
            >
              + Add image
            </button>
          )}
        </div>
        {images.map((img, idx) => (
          <div key={idx} className="relative">
            <ImageField
              value={img}
              onChange={(data) => updateImage(idx, data)}
              label={`Image ${idx + 1}`}
            />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute right-2 top-2 text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* ---- External links ---- */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            External links ({externalLinks.length}/{extLinkLimit})
          </span>
          {externalLinks.length < extLinkLimit && (
            <button
              type="button"
              onClick={() => setExternalLinks((prev) => [...prev, makeEmptyExternalLink()])}
              className="text-xs text-primary hover:underline"
            >
              + Add link
            </button>
          )}
        </div>
        {externalLinks.map((link, idx) => (
          <div key={idx} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Link {idx + 1}</span>
              <button
                type="button"
                onClick={() => removeExternalLink(idx)}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Label</span>
                <input
                  value={link.label}
                  onChange={(e) => updateExternalLink(idx, { label: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Google Study"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">URL</span>
                <input
                  value={link.url}
                  onChange={(e) => updateExternalLink(idx, { url: e.target.value })}
                  className={inputClass}
                  placeholder="https://…"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Rel</span>
                <select
                  value={link.rel ?? ""}
                  onChange={(e) =>
                    updateExternalLink(idx, {
                      rel: (e.target.value || null) as "nofollow" | "sponsored" | "ugc" | null,
                    })
                  }
                  className={inputClass}
                >
                  <option value="">None</option>
                  <option value="nofollow">nofollow</option>
                  <option value="sponsored">sponsored</option>
                  <option value="ugc">ugc</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Description</span>
                <input
                  value={link.description ?? ""}
                  onChange={(e) => updateExternalLink(idx, { description: e.target.value })}
                  className={inputClass}
                  placeholder="Optional"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* ---- Feedback ---- */}
      {feedback && (
        <p className={`text-sm ${feedback.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}>
          {feedback.text}
        </p>
      )}

      {/* ---- Actions ---- */}
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
