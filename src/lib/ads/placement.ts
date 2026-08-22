/**
 * Splits rendered article HTML at top-level headings so ad slots can be
 * interleaved: one after the 1st heading, one mid-article, one after the 3rd.
 *
 * Returns the HTML `sections` (each rendered as its own block) and a map from
 * section index -> ad slot id, indicating an ad should follow that section.
 */
export function sectionizeForAds(html: string): {
  sections: string[];
  adAfter: Map<number, string>;
} {
  // Lookahead keeps each <h2> at the start of its section; the first chunk is
  // any intro content before the first heading.
  const sections = html
    .split(/(?=<h2[\s>])/i)
    .filter((s) => s.trim().length > 0);

  const headingIdx: number[] = [];
  sections.forEach((s, i) => {
    if (/^\s*<h2[\s>]/i.test(s)) headingIdx.push(i);
  });

  const adAfter = new Map<number, string>();
  const chosen = new Set<number>();
  const place = (ordinal: number, slot: string) => {
    const sectionIdx = headingIdx[ordinal];
    if (sectionIdx === undefined || chosen.has(sectionIdx)) return;
    chosen.add(sectionIdx);
    adAfter.set(sectionIdx, slot);
  };

  // After the 1st heading (top of article).
  place(0, "in-article-1");
  // Mid-article: the middle heading (never the very first).
  place(Math.max(1, Math.floor(headingIdx.length / 2)), "in-article-2");
  // After the 3rd heading; if that collides with mid, fall to the next heading
  // so ≥3-heading articles still get three distinct slots.
  let thirdOrdinal = 2;
  while (
    thirdOrdinal < headingIdx.length &&
    chosen.has(headingIdx[thirdOrdinal])
  ) {
    thirdOrdinal++;
  }
  place(thirdOrdinal, "in-article-3");

  return { sections, adAfter };
}

/**
 * Ad placement for the modular content-sections path. Same ordinal logic as
 * sectionizeForAds (after 1st heading, mid-article, after 3rd) but keyed on
 * real section indices instead of regex-split HTML.
 */
export function sectionizeForAdsFromSections(
  sections: { id: string }[],
): Map<number, string> {
  const headingIdx = sections.map((_, i) => i);
  if (headingIdx.length === 0) return new Map();

  const adAfter = new Map<number, string>();
  const chosen = new Set<number>();
  const place = (ordinal: number, slot: string) => {
    const sectionIdx = headingIdx[ordinal];
    if (sectionIdx === undefined || chosen.has(sectionIdx)) return;
    chosen.add(sectionIdx);
    adAfter.set(sectionIdx, slot);
  };

  place(0, "in-article-1");
  place(Math.max(1, Math.floor(headingIdx.length / 2)), "in-article-2");

  let thirdOrdinal = 2;
  while (
    thirdOrdinal < headingIdx.length &&
    chosen.has(headingIdx[thirdOrdinal])
  ) {
    thirdOrdinal++;
  }
  place(thirdOrdinal, "in-article-3");

  return adAfter;
}
