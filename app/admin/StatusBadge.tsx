const STYLES: Record<string, string> = {
  draft: "bg-muted text-foreground",
  flagged: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        STYLES[status] ?? STYLES.draft
      }`}
    >
      {status}
    </span>
  );
}
