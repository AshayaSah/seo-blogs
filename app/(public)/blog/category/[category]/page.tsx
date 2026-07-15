import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getPostsByCategory } from "@/src/lib/posts";
import { SITE_NAME, absoluteUrl } from "@/src/lib/site";
import { breadcrumbTrailJsonLd } from "@/src/lib/jsonld";
import JsonLd from "@/src/components/JsonLd";
import PostCard from "@/src/components/site/PostCard";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ category: c.slug }));
}

async function resolveCategory(slug: string) {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = await resolveCategory(category);
  if (!cat) return { title: "Category not found" };
  return {
    title: `${cat.name} articles`,
    description: `Articles in the ${cat.name} category on ${SITE_NAME}.`,
    alternates: { canonical: `/blog/category/${cat.slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = await resolveCategory(category);
  if (!cat) notFound();

  const posts = await getPostsByCategory(cat.slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbTrailJsonLd([
          { name: SITE_NAME, url: absoluteUrl("/") },
          { name: "Blog", url: absoluteUrl("/blog") },
          { name: cat.name, url: absoluteUrl(`/blog/category/${cat.slug}`) },
        ])}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:underline">{SITE_NAME}</Link></li>
          <li aria-hidden>›</li>
          <li><Link href="/blog" className="hover:underline">Blog</Link></li>
          <li aria-hidden>›</li>
          <li className="text-zinc-700 dark:text-zinc-300" aria-current="page">
            {cat.name}
          </li>
        </ol>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight">{cat.name}</h1>
      <p className="mt-2 text-zinc-500">
        {posts.length} article{posts.length === 1 ? "" : "s"} in this category.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}
