import Link from "next/link";
import { SITE_NAME } from "@/src/lib/site";
import type { Taxonomy } from "@/src/lib/posts";

export default function SiteFooter({
  categories,
}: {
  categories: Taxonomy[];
}) {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="site-container grid gap-8 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="text-base font-bold">{SITE_NAME}</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            AI-assisted articles on SEO, search, and content strategy.
          </p>
        </div>

        <nav aria-label="Explore">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Explore
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
            <li><Link href="/authors" className="hover:text-foreground">Authors</Link></li>
            <li><Link href="/search" className="hover:text-foreground">Search</Link></li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Company
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link></li>
          </ul>
        </nav>

        <nav aria-label="Categories">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Categories
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            {categories.length === 0 ? (
              <li className="text-muted-foreground">—</li>
            ) : (
              categories.slice(0, 6).map((c) => (
                <li key={c.slug}>
                  <Link href={`/blog/category/${c.slug}`} className="hover:text-foreground">
                    {c.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="site-container py-6 text-center text-xs text-muted-foreground">
          <p>
            Some articles on {SITE_NAME} are produced with AI assistance and
            reviewed by our editorial team before publication.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
