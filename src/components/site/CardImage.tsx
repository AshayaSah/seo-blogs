"use client";

import { useState } from "react";
import Image from "next/image";
import type { FeaturedImage } from "@/src/lib/posts";

// Renders a card's featured image, but removes itself if the URL fails to load
// so the branded fallback gradient behind it shows through (instead of a broken
// image glyph). Keeps the grid looking clean even with bad/placeholder URLs.
export default function CardImage({
  image,
  className,
}: {
  image: FeaturedImage;
  className?: string;
}) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;

  return (
    <Image
      fill
      src={image.url}
      alt={image.alt_text}
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      onError={() => setOk(false)}
      className={className}
    />
  );
}