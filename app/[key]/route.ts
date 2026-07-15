import { notFound } from "next/navigation";

/**
 * Serves the IndexNow key verification file at `/<key>.txt`.
 *
 * App Router doesn't allow partial dynamic segments (`[key].txt`), so this is a
 * single root dynamic segment that captures the whole `<key>.txt` filename and
 * only responds for the configured key — everything else 404s (falling through
 * to Next's normal not-found handling for unknown top-level paths).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const configured = process.env.INDEXNOW_KEY;
  const { key } = await params;

  if (!configured || key !== `${configured}.txt`) {
    notFound();
  }

  return new Response(configured, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
