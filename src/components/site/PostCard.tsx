import Link from "next/link";
import { slugify } from "@/src/lib/site";
import type { PostCard as PostCardData } from "@/src/lib/posts";

function formatDate(d: Date | null): string | null {
  return d
    ? d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;
}

export default function PostCard({ post }: { post: PostCardData }) {
  const img = post.featuredImage;
  const date = formatDate(post.publishedAt);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700">
      {img && (
        // Fixed intrinsic width/height + aspect box keeps this CLS-safe.
        <Link href={`/blog/${post.slug}`} className="block">
          <img
            src={img.url}
            alt={img.alt_text}
            width={img.width}
            height={img.height}
            className="aspect-[16/9] w-full object-cover"
            style={{ height: "auto" }}
          />
        </Link>
      )}
      <div className="flex flex-1 flex-col p-5">
        {post.category && (
          <Link
            href={`/blog/category/${slugify(post.category)}`}
            className="text-xs font-medium uppercase tracking-wide text-blue-600 hover:underline dark:text-blue-400"
          >
            {post.category}
          </Link>
        )}
        <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight">
          <Link href={`/blog/${post.slug}`} className="hover:underline">
            {post.title ?? post.slug}
          </Link>
        </h3>
        {post.metaDescription && (
          <p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
            {post.metaDescription}
          </p>
        )}
        <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
          {date && <time dateTime={post.publishedAt!.toISOString()}>{date}</time>}
          {post.readTimeMinutes ? (
            <>
              <span aria-hidden>·</span>
              <span>{post.readTimeMinutes} min read</span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
