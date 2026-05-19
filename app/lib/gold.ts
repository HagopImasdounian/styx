/**
 * Gold price calculations — shared between server and client.
 * No server-only imports here.
 */

/** Karat purity lookup — exact fraction of pure gold (karat/24). */
export const KARAT_PURITY: Record<number, number> = {
  10: 10 / 24, // 0.41666...
  14: 14 / 24, // 0.58333...
  18: 18 / 24, // 0.75
  22: 22 / 24, // 0.91666...
  24: 1.0,
};

/** Troy oz to grams conversion. */
const TROY_OZ_GRAMS = 31.1035;

export type GoldPriceBreakdown = {
  spotPerOz: number;
  purity: number;
  karat: number;
  goldPerGram: number;
  weight: number;
  materialCost: number;
  laborCost: number;
  margin: number;
  retailPrice: number;
  markupMultiple: number;
  perGramByKarat: Record<number, number>;
};

/**
 * Compute a full transparent price breakdown for a piece.
 */
export function computeGoldPrice({
  spotPerOz,
  weight,
  karat = 18,
  laborCost = 280,
  margin = 0.55,
}: {
  spotPerOz: number;
  weight: number;
  karat?: number;
  laborCost?: number;
  margin?: number;
}): GoldPriceBreakdown {
  const purity = KARAT_PURITY[karat] ?? 0.75;
  const goldPerGram = (spotPerOz / TROY_OZ_GRAMS) * purity;
  const materialCost = goldPerGram * weight;
  const subtotal = materialCost + laborCost;
  const retailPrice = Math.round(subtotal * (1 + margin));
  const markupMultiple = materialCost > 0 ? retailPrice / materialCost : 0;

  const perGramByKarat: Record<number, number> = {};
  for (const [k, p] of Object.entries(KARAT_PURITY)) {
    perGramByKarat[Number(k)] = +((spotPerOz / TROY_OZ_GRAMS) * p).toFixed(2);
  }

  return {
    spotPerOz,
    purity,
    karat,
    goldPerGram: +goldPerGram.toFixed(2),
    weight,
    materialCost: +materialCost.toFixed(2),
    laborCost,
    margin,
    retailPrice,
    markupMultiple: +markupMultiple.toFixed(1),
    perGramByKarat,
  };
}
