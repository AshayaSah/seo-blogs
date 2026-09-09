import Link from "next/link";
import LogoutButton from "./LogoutButton";

export type AdminTab = "queue" | "published" | "all" | "settings";

const TABS: { key: AdminTab; label: string; href: string }[] = [
  { key: "queue", label: "Review queue", href: "/admin" },
  { key: "published", label: "Published", href: "/admin?tab=published" },
  { key: "all", label: "All posts", href: "/admin?tab=all" },
  { key: "settings", label: "Settings", href: "/admin/settings" },
];

export default function AdminNav({
  active,
  counts,
}: {
  active?: AdminTab;
  counts?: Partial<Record<AdminTab, number>>;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
      <div className="flex flex-wrap items-center gap-6">
        <Link href="/admin" className="text-sm font-bold tracking-tight">
          Knowra Admin
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={active === tab.key ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              {counts && <span className="ml-1.5 opacity-70">({counts[tab.key]})</span>}
            </Link>
          ))}
        </nav>
      </div>
      <LogoutButton />
    </div>
  );
}
