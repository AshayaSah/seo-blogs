import Link from "next/link";
import { slugify } from "@/src/lib/site";
import type { PostCard as PostCardData } from "@/src/lib/posts";
import CardImage from "@/src/components/site/CardImage";

function formatDate(d: Date | null): string | null {
  return d
    ? d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;
}

// Image card with the category badge + title + excerpt overlaid on the photo
// behind a dark gradient (see the reference blog cards). Posts without a
// featured image fall back to a branded gradient so the grid stays uniform.
export default function PostCard({ post }: { post: PostCardData }) {
  const img = post.featuredImage;
  const date = formatDate(post.publishedAt);

  return (
    <article className="post-card group">
      {/* Branded gradient base — always present, so posts with no image (or a
          broken image URL) still look intentional. */}
      <div className="post-card-fallback" aria-hidden />
      {img && (
        <CardImage
          image={img}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      )}
      <div className="post-card-scrim" aria-hidden />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
        {post.category && (
          <Link
            href={`/blog/category/${slugify(post.category)}`}
            className="badge badge-on-image relative z-10 w-fit"
          >
            {post.category}
          </Link>
        )}
        <h3 className="text-lg font-semibold leading-snug tracking-tight text-white">
          {/* Stretched link makes the whole card clickable. */}
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title ?? post.slug}
          </Link>
        </h3>
        {post.metaDescription && (
          <p className="line-clamp-2 text-sm text-white/85">
            {post.metaDescription}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-white/70">
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
