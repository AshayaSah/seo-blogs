import type { Metadata } from "next";

// Defense-in-depth: the admin area is never meant to be indexed. Auth guards
// access; this just keeps any leaked URL out of the search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
