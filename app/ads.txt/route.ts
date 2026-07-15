import { adsTxtLine } from "@/src/lib/ads/config";

// Built from NEXT_PUBLIC_ADSENSE_CLIENT_ID at build time.
export const dynamic = "force-static";

export function GET() {
  const line = adsTxtLine();
  const body = line ? `${line}\n` : "# No ad provider configured\n";
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
