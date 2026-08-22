"use client";

import { useRef, useState } from "react";

export type ImageFieldData = {
  url: string;
  alt_text: string;
  width: number;
  height: number;
  caption?: string;
  cloudinary_public_id?: string;
};

type Props = {
  value: ImageFieldData;
  onChange: (data: ImageFieldData) => void;
  label?: string;
};

const inputClass = "field";

export default function ImageField({ value, onChange, label }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed.");
      }

      const data = await res.json();
      onChange({
        ...value,
        url: data.url,
        width: data.width,
        height: data.height,
        cloudinary_public_id: data.cloudinary_public_id,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      )}

      {/* Thumbnail preview */}
      {value.url && (
        <img
          src={value.url}
          alt={value.alt_text || "Image preview"}
          width={value.width || 400}
          height={value.height || 300}
          className="mb-1 max-h-40 w-auto rounded border border-border object-contain"
        />
      )}

      {/* Upload button */}
      <div className="flex items-center gap-3">
        <label className="btn btn-outline cursor-pointer text-xs">
          {uploading ? "Uploading…" : "Upload image"}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        {value.url && (
          <button
            type="button"
            onClick={() =>
              onChange({ ...value, url: "", width: 0, height: 0, cloudinary_public_id: undefined })
            }
            className="text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        )}
      </div>
      {uploadError && (
        <p className="text-xs text-red-600">{uploadError}</p>
      )}

      {/* Manual URL field (fallback or override) */}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">URL</span>
        <input
          value={value.url}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
          className={inputClass}
          placeholder="https://…"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Alt text</span>
          <input
            value={value.alt_text}
            onChange={(e) => onChange({ ...value, alt_text: e.target.value })}
            className={inputClass}
            placeholder="Descriptive alt text"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Caption</span>
          <input
            value={value.caption ?? ""}
            onChange={(e) => onChange({ ...value, caption: e.target.value || undefined })}
            className={inputClass}
            placeholder="Optional caption"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Width (px)</span>
          <input
            type="number"
            value={value.width || ""}
            onChange={(e) => onChange({ ...value, width: Number(e.target.value) || 0 })}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Height (px)</span>
          <input
            type="number"
            value={value.height || ""}
            onChange={(e) => onChange({ ...value, height: Number(e.target.value) || 0 })}
            className={inputClass}
          />
        </label>
      </div>
    </div>
  );
}
