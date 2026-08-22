import { cloudinary } from "./cloudinary";

/** The canonical image shape used across the schema (featuredImage, images[], contentSections[].image). */
export type ImageShape = {
  url: string;
  alt_text: string;
  width: number;
  height: number;
  caption?: string;
  cloudinary_public_id?: string;
};

/**
 * Upload a single image to Cloudinary by passing the remote URL directly.
 * Cloudinary fetches the resource server-side — no local download needed.
 *
 * On success the returned object has `url` replaced by `secure_url`,
 * `width`/`height` replaced by Cloudinary's *actual measured* dimensions
 * (don't trust the agent's claimed values once we can verify them), and
 * `cloudinary_public_id` populated.
 *
 * If CLOUDINARY_URL is unset or the upload fails the original image is
 * returned unchanged (fail-open — never block ingestion on Cloudinary).
 */
export async function rehostImage(image: ImageShape): Promise<ImageShape> {
  if (!process.env.CLOUDINARY_URL) return image;

  try {
    const result = await cloudinary.uploader.upload(image.url, {
      folder: "seo-blogs",
      // Let Cloudinary auto-detect format; preserve the original filename
      // fragment as a public_id prefix for easy manual lookup.
      unique_filename: true,
    });

    return {
      ...image,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      cloudinary_public_id: result.public_id,
    };
  } catch (err) {
    console.warn("[images] Cloudinary upload failed, keeping original:", err);
    return image;
  }
}

/**
 * Rehost an array of images in parallel. Each image is independent — a
 * failure on one does not affect the others.
 */
export async function rehostImages(images: ImageShape[]): Promise<ImageShape[]> {
  const results = await Promise.allSettled(images.map(rehostImage));
  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    console.warn("[images] rehostImage settled with rejection:", r.reason);
    return images[i];
  });
}
