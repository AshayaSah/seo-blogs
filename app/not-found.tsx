import Link from "next/link";
import { SITE_NAME } from "@/src/lib/site";

// Global 404. Rendered inside the root layout (no public chrome), so it is
// self-contained with its own links back into the site.
export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Back to {SITE_NAME}
        </Link>
        <Link href="/blog" className="btn btn-outline">
          Browse the blog
        </Link>
      </div>
    </div>
  );
}
