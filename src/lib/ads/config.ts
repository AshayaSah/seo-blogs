/**
 * Ad system configuration and the provider seam.
 *
 * The whole system is DORMANT by default: with no configured provider client
 * id, `adsEnabled()` is false and nothing renders / no script loads / ads.txt
 * is empty. Switching networks (AdSense → Mediavine/Raptive) is a config swap:
 * set NEXT_PUBLIC_AD_PROVIDER and add the provider's components to the registry
 * (src/components/ads/registry.tsx) — no page/template changes required.
 */

export type AdProviderId = "adsense" | "mediavine" | "raptive";

export const AD_PROVIDER: AdProviderId =
  (process.env.NEXT_PUBLIC_AD_PROVIDER as AdProviderId) || "adsense";

// AdSense client id, e.g. "ca-pub-1234567890123456". Empty => dormant.
export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() || "";

/** True only when the active provider is fully configured. */
export function adsEnabled(): boolean {
  switch (AD_PROVIDER) {
    case "adsense":
      return ADSENSE_CLIENT_ID.length > 0;
    // Other networks aren't wired yet — stay dormant until they are.
    case "mediavine":
    case "raptive":
    default:
      return false;
  }
}

// CLS-safe reserved heights (px). Defaults sized for a responsive in-article
// unit; individual slots can override per placement.
export const DEFAULT_MIN_HEIGHT_MOBILE = 280;
export const DEFAULT_MIN_HEIGHT_DESKTOP = 280;

export interface AdSlotProps {
  /** Network ad-unit id (AdSense data-ad-slot). */
  slot: string;
  className?: string;
  minHeightMobile?: number;
  minHeightDesktop?: number;
}

/**
 * The single authorized-seller line for /ads.txt, or null when dormant.
 * (f08c47fec0942fa0 is Google's ads.txt certification authority id.)
 */
export function adsTxtLine(): string | null {
  if (AD_PROVIDER === "adsense" && ADSENSE_CLIENT_ID) {
    const publisherId = ADSENSE_CLIENT_ID.replace(/^ca-/, "");
    return `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`;
  }
  // Mediavine/Raptive manage ads.txt differently (redirect/managed) — add here.
  return null;
}
