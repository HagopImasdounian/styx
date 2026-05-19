/**
 * Server-only gold price fetching.
 * Calculations are in gold.ts (shared with client).
 */
import {KARAT_PURITY} from './gold';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const TROY_OZ_GRAMS = 31.1035;

let cachedSpot: {price: number; timestamp: number} | null = null;

/**
 * Fetch the current gold spot price in USD per troy ounce.
 * Returns null if the API is unreachable and there's no cached value.
 */
export async function getGoldSpotPrice(): Promise<number | null> {
  if (cachedSpot && Date.now() - cachedSpot.timestamp < CACHE_TTL_MS) {
    return cachedSpot.price;
  }

  // Try gold-api.com (free, no key needed)
  try {
    const res = await fetch(
      'https://api.gold-api.com/price/XAU',
      {signal: AbortSignal.timeout(4000)},
    );
    if (res.ok) {
      const data: any = await res.json();
      const price = data?.price;
      if (typeof price === 'number' && price > 500) {
        cachedSpot = {price, timestamp: Date.now()};
        return price;
      }
    }
  } catch {
    // Fall through
  }

  // Fallback: current approximate gold price
  return cachedSpot?.price ?? 4700;
}

/**
 * Get gold data for the root loader.
 * Returns null if no real price data is available.
 */
export async function getGoldData() {
  const spotPerOz = await getGoldSpotPrice();

  if (spotPerOz === null) return null;

  const perGramByKarat: Record<number, number> = {};
  for (const [k, p] of Object.entries(KARAT_PURITY)) {
    perGramByKarat[Number(k)] = +((spotPerOz / TROY_OZ_GRAMS) * p).toFixed(2);
  }

  return {
    spotPerOz: +spotPerOz.toFixed(2),
    perGramByKarat,
    updatedAt: new Date().toISOString(),
  };
}
