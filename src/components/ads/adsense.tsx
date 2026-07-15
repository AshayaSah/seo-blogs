"use client";

import Script from "next/script";
import { useEffect } from "react";
import { ADSENSE_CLIENT_ID } from "@/src/lib/ads/config";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** AdSense loader script — mounted once in the root layout when configured. */
export function AdSenseLoader() {
  if (!ADSENSE_CLIENT_ID) return null;
  return (
    <Script
      id="adsbygoogle-loader"
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
    />
  );
}

/**
 * A single AdSense unit. Keyed by `reloadKey` (the pathname) so React remounts
 * a fresh <ins> on navigation — required because AdSense throws if you push to
 * an <ins> that already has an ad.
 */
export function AdSenseUnit({
  slot,
  reloadKey,
}: {
  slot: string;
  reloadKey: string;
}) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Filled-slot / not-yet-loaded races are safe to ignore.
    }
  }, [reloadKey]);

  return (
    <ins
      key={reloadKey}
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
