"use client";

import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import {
  adsEnabled,
  DEFAULT_MIN_HEIGHT_MOBILE,
  DEFAULT_MIN_HEIGHT_DESKTOP,
  type AdSlotProps,
} from "@/src/lib/ads/config";
import { activeProvider } from "./registry";

/**
 * Public ad interface. Usage: `<AdSlot slot="in-article-1" />`.
 *
 * - Dormant: renders nothing when no provider is configured.
 * - CLS-safe: reserves a fixed min-height per breakpoint via the `.ad-slot`
 *   CSS (see globals.css) so layout doesn't shift when the ad fills in.
 * - Provider-agnostic: delegates the actual markup to the active provider's
 *   Unit, keyed to the pathname so units reload on client navigation.
 */
export default function AdSlot({
  slot,
  className,
  minHeightMobile = DEFAULT_MIN_HEIGHT_MOBILE,
  minHeightDesktop = DEFAULT_MIN_HEIGHT_DESKTOP,
}: AdSlotProps) {
  const pathname = usePathname();

  if (!adsEnabled()) return null;
  const provider = activeProvider();
  if (!provider) return null;

  const { Unit } = provider;
  const style = {
    "--ad-mh-mobile": `${minHeightMobile}px`,
    "--ad-mh-desktop": `${minHeightDesktop}px`,
  } as CSSProperties;

  return (
    <div
      className={`ad-slot${className ? ` ${className}` : ""}`}
      style={style}
      role="complementary"
      aria-label="Advertisement"
    >
      <Unit slot={slot} reloadKey={pathname} />
    </div>
  );
}
