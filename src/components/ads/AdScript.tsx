import { adsEnabled } from "@/src/lib/ads/config";
import { activeProvider } from "./registry";

/**
 * Mounts the active provider's loader script in the root layout — but only
 * when ads are enabled. Dormant by default (renders nothing).
 */
export default function AdScript() {
  if (!adsEnabled()) return null;
  const provider = activeProvider();
  if (!provider) return null;
  const { Loader } = provider;
  return <Loader />;
}
