/**
 * Server-only gold price fetching.
 * Calculations are in gold.ts (shared with client).
 */
import {KARAT_PURITY} from './gold';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
// Keep this tight: getGoldData() runs in the root loader's critical path, so
// the worst-case TTFB tax on every page is bounded by this timeout.
const FETCH_TIMEOUT_MS = 1200;
const TROY_OZ_GRAMS = 31.1035;
const HARDCODED_FALLBACK = 4700;

// Module-level last-good-price cache. Within the TTL it's fresh; after the TTL
// it's still kept around as a stale fallback when the API is unreachable.
let cachedSpot: {price: number; timestamp: number} | null = null;

/**
 * Fetch the current gold spot price in USD per troy ounce.
 * `isFallback` is true when the value is the hardcoded fallback or a stale
 * cached price returned after a failed fetch.
 */
async function fetchSpotPrice(): Promise<{price: number; isFallback: boolean}> {
  if (cachedSpot && Date.now() - cachedSpot.timestamp < CACHE_TTL_MS) {
    return {price: cachedSpot.price, isFallback: false};
  }

  // Try gold-api.com (free, no key needed)
  try {
    const res = await fetch(
      'https://api.gold-api.com/price/XAU',
      {signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)},
    );
    if (res.ok) {
      const data: any = await res.json();
      const price = data?.price;
      if (typeof price === 'number' && price > 500) {
        cachedSpot = {price, timestamp: Date.now()};
        return {price, isFallback: false};
      }
    }
  } catch {
    // Fall through
  }

  // Stale last-good price if we ever had one, else hardcoded approximation
  return {price: cachedSpot?.price ?? HARDCODED_FALLBACK, isFallback: true};
}

/**
 * Fetch the current gold spot price in USD per troy ounce.
 * Returns null if the API is unreachable and there's no cached value.
 */
export async function getGoldSpotPrice(): Promise<number | null> {
  const {price} = await fetchSpotPrice();
  return price;
}

/**
 * Get gold data for the root loader.
 * Never throws; falls back to the last good (or hardcoded) price.
 */
export async function getGoldData() {
  const {price: spotPerOz, isFallback} = await fetchSpotPrice();

  const perGramByKarat: Record<number, number> = {};
  for (const [k, p] of Object.entries(KARAT_PURITY)) {
    perGramByKarat[Number(k)] = +((spotPerOz / TROY_OZ_GRAMS) * p).toFixed(2);
  }

  return {
    spotPerOz: +spotPerOz.toFixed(2),
    perGramByKarat,
    isFallback,
    updatedAt: new Date().toISOString(),
  };
}
