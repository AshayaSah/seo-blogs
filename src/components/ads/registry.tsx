import type { ComponentType } from "react";
import { AD_PROVIDER } from "@/src/lib/ads/config";
import { AdSenseLoader, AdSenseUnit } from "./adsense";

/**
 * Provider registry — the swap point. Each provider supplies a `Loader`
 * (script for the layout) and a `Unit` (the per-slot markup). To add
 * Mediavine/Raptive, implement their components and register them here; the
 * rest of the app keeps using <AdSlot> unchanged.
 */
export interface AdProviderComponents {
  Loader: ComponentType;
  Unit: ComponentType<{ slot: string; reloadKey: string }>;
}

const PROVIDERS: Partial<Record<string, AdProviderComponents>> = {
  adsense: { Loader: AdSenseLoader, Unit: AdSenseUnit },
  // mediavine: { Loader: MediavineLoader, Unit: MediavineUnit },
  // raptive:   { Loader: RaptiveLoader,   Unit: RaptiveUnit },
};

export function activeProvider(): AdProviderComponents | null {
  return PROVIDERS[AD_PROVIDER] ?? null;
}
