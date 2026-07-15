"use client";

import Link from "next/link";
import { useState } from "react";
import { SITE_NAME } from "@/src/lib/site";
import type { Taxonomy } from "@/src/lib/posts";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/authors", label: "Authors" },
  { href: "/about", label: "About" },
];

export default function SiteHeader({
  categories,
}: {
  categories: Taxonomy[];
}) {
  const [open, setOpen] = useState(false);
  const topCategories = categories.slice(0, 6);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {SITE_NAME}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/search"
            aria-label="Search"
            className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
          >
            Search
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="inline-flex items-center rounded-md border border-zinc-300 px-3 py-1.5 text-sm md:hidden dark:border-zinc-700"
        >
          Menu
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-zinc-200 md:hidden dark:border-zinc-800">
          <nav className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3">
            {NAV.concat({ href: "/search", label: "Search" }).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {item.label}
              </Link>
            ))}
            {topCategories.length > 0 && (
              <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Categories
                </p>
                {topCategories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/blog/category/${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Category strip (desktop) */}
      {topCategories.length > 0 && (
        <div className="hidden border-t border-zinc-100 md:block dark:border-zinc-900">
          <nav className="mx-auto flex max-w-5xl flex-wrap gap-4 px-6 py-2 text-xs">
            {topCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/blog/category/${c.slug}`}
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
