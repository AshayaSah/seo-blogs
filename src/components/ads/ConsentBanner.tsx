/**
 * ConsentBanner — PLACEHOLDER.
 *
 * ⚠️ BEFORE ENABLING ADS IN PRODUCTION FOR EEA / UK VISITORS:
 * Google requires a Google-certified Consent Management Platform (CMP). The
 * turnkey option is **Google Funding Choices / Privacy & messaging** in the
 * AdSense console (it implements IAB TCF v2.2 and Google Consent Mode v2).
 *
 * Wiring checklist (do NOT ship ads to EEA/UK without this):
 *   1. In AdSense → Privacy & messaging, create a GDPR message; Google serves
 *      the CMP automatically alongside the adsbygoogle.js loader — usually no
 *      component needed here, just enable it on the account + domain.
 *   2. If self-managing instead, load the Funding Choices script and gate ad
 *      requests on Consent Mode v2 signals (ad_storage / ad_user_data /
 *      ad_personalization) — set defaults to 'denied' for EEA/UK until consent.
 *   3. Also surface a US state-privacy (CCPA/CPRA) notice where applicable.
 *   4. Replace this placeholder with the real banner/logic and remove the
 *      early return below.
 *
 * Kept as a dedicated component so consent is a first-class seam in the layout,
 * not an afterthought bolted on later.
 */
export default function ConsentBanner() {
  // Dormant placeholder — renders nothing until a certified CMP is wired.
  return null;
}
