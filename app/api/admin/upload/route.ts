import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/src/lib/admin-auth";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function POST(request: NextRequest) {
  if (!verifySessionToken(request.cookies.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.CLOUDINARY_URL) {
    return NextResponse.json(
      {
        error:
          "Cloudinary is not configured. Set CLOUDINARY_URL in .env.local (format: cloudinary://<api_key>:<api_secret>@<cloud_name>).",
      },
      { status: 501 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Request body must be multipart/form-data." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "A single 'file' field is required." },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: `Unsupported file type '${file.type}'. Accepted: JPEG, PNG, WebP, GIF, AVIF.`,
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `File is ${Math.round(file.size / 1024 / 1024)} MB. Maximum allowed is 8 MB.` },
      { status: 400 },
    );
  }

  // Dynamic import to avoid loading the Cloudinary SDK at module-level
  // when CLOUDINARY_URL is unset.
  const { cloudinary } = await import("@/src/lib/cloudinary");

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "seo-blogs",
      unique_filename: true,
    });

    return NextResponse.json({
      url: result.secure_url,
      width: result.width,
      height: result.height,
      cloudinary_public_id: result.public_id,
    });
  } catch (err) {
    console.error("[upload] Cloudinary upload failed:", err);
    return NextResponse.json(
      { error: "Upload to Cloudinary failed. Check server logs for details." },
      { status: 502 },
    );
  }
}
