"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SITE_NAME } from "@/src/lib/site";
import type { Taxonomy } from "@/src/lib/posts";
import Image from "next/image";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/authors", label: "Authors" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader({ categories }: { categories: Taxonomy[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const topCategories = categories.slice(0, 6);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="border-b border-border">
      <div className="site-container flex items-center justify-between gap-4 py-4">
        {/* Brand + nav, grouped left */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo_knowra.png"
              alt={`${SITE_NAME} logo`}
              width={50}
              height={40}
              className="object-contain"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 text-sm md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={
                  isActive(item.href)
                    ? "font-medium text-primary"
                    : "text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/search" className="btn btn-secondary">
            Search
          </Link>
          <Link href="/#newsletter" className="btn btn-primary">
            Subscribe
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="flex btn btn-outline md:hidden"
        >
          Menu
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border md:hidden">
          <nav className="site-container flex flex-col gap-1 py-3">
            {NAV.concat({ href: "/search", label: "Search" }).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            {topCategories.length > 0 && (
              <div className="mt-2 border-t border-border pt-2">
                <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Categories
                </p>
                {topCategories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/blog/category/${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
