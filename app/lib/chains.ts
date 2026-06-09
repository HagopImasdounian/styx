/**
 * Shared chain-weave helpers — keep the family list in ONE place so the
 * print sheet, product page and compare page can't drift apart.
 */

/** Chain weave families that have a silhouette/outline tile in /images/silhouettes/tiles. */
export const CHAIN_FAMILIES = [
  'cuban', 'curb', 'box', 'rope', 'cable', 'figaro', 'wheat',
  'rolo', 'singapore', 'franco', 'herringbone', 'paperclip', 'snake',
] as const;

export type ChainFamily = (typeof CHAIN_FAMILIES)[number];

/** Map a chain style label (or the product title) → family slug; null if none match. */
export function styleToSlug(
  style: string | null | undefined,
  title = '',
): ChainFamily | null {
  const hay = (style || title || '').toLowerCase();
  return CHAIN_FAMILIES.find((f) => hay.includes(f)) ?? null;
}

/** Parse a width in millimetres from a thickness string, else the title (e.g. "5.4 mm"). */
export function parseMm(
  thickness: string | null | undefined,
  title = '',
): number | null {
  const src = thickness || title || '';
  const m =
    src.match(/(\d+(?:\.\d+)?)\s*mm/i) || src.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

/** Standard ID-1 card (credit card / driver's licence) dimensions in millimetres. */
export const CARD_LONG_MM = 85.6;
export const CARD_SHORT_MM = 53.98;
