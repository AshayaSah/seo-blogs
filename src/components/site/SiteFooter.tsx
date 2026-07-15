import Link from "next/link";
import { SITE_NAME } from "@/src/lib/site";
import type { Taxonomy } from "@/src/lib/posts";

export default function SiteFooter({
  categories,
}: {
  categories: Taxonomy[];
}) {
  return (
    <footer className="mt-16 border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="text-base font-bold">{SITE_NAME}</p>
          <p className="mt-2 max-w-xs text-sm text-zinc-500">
            AI-assisted articles on SEO, search, and content strategy.
          </p>
        </div>

        <nav aria-label="Explore">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Explore
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <li><Link href="/blog" className="hover:underline">Blog</Link></li>
            <li><Link href="/authors" className="hover:underline">Authors</Link></li>
            <li><Link href="/search" className="hover:underline">Search</Link></li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Company
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <li><Link href="/about" className="hover:underline">About</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
            <li><Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link></li>
          </ul>
        </nav>

        <nav aria-label="Categories">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Categories
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            {categories.length === 0 ? (
              <li className="text-zinc-400">—</li>
            ) : (
              categories.slice(0, 6).map((c) => (
                <li key={c.slug}>
                  <Link href={`/blog/category/${c.slug}`} className="hover:underline">
                    {c.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </nav>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-900">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-xs text-zinc-500">
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
