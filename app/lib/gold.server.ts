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
// Rough last-resort spots per oz, only used before any fetch has ever succeeded.
const HARDCODED_FALLBACK: Record<string, number> = {USD: 4700, CAD: 6500};

// Module-level last-good-price cache, per currency. Within the TTL it's fresh;
// after the TTL it's still kept around as a stale fallback when the API is
// unreachable. `usdRate` (currency units per USD) lets a currency we have never
// fetched fall back to the cached USD spot.
const cachedSpot = new Map<string, {price: number; usdRate: number; timestamp: number}>();

/**
 * Fetch the current gold spot price per troy ounce in `currency`
 * (gold-api.com quotes XAU in any ISO currency). `isFallback` is true when the
 * value is a stale cached or hardcoded price returned after a failed fetch;
 * `currency` is the currency the returned price is actually in.
 */
async function fetchSpotPrice(
  currency: string,
): Promise<{price: number; currency: string; isFallback: boolean}> {
  const cached = cachedSpot.get(currency);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {price: cached.price, currency, isFallback: false};
  }

  try {
    const res = await fetch(
      `https://api.gold-api.com/price/XAU/${encodeURIComponent(currency)}`,
      {signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)},
    );
    if (res.ok) {
      const data: any = await res.json();
      const price = data?.price;
      const usdRate = data?.exchangeRate;
      if (
        data?.currency === currency &&
        typeof price === 'number' &&
        typeof usdRate === 'number' &&
        price / usdRate > 500
      ) {
        cachedSpot.set(currency, {price, usdRate, timestamp: Date.now()});
        return {price, currency, isFallback: false};
      }
    }
  } catch {
    // Fall through
  }

  if (cached) return {price: cached.price, currency, isFallback: true};
  if (HARDCODED_FALLBACK[currency]) {
    return {price: HARDCODED_FALLBACK[currency], currency, isFallback: true};
  }
  const usd = cachedSpot.get('USD');
  return {price: usd?.price ?? HARDCODED_FALLBACK.USD, currency: 'USD', isFallback: true};
}

/**
 * Fetch the current gold spot price per troy ounce (default CAD, the store
 * currency). Never throws; falls back to the last good or hardcoded price.
 */
export async function getGoldSpotPrice(currency = 'CAD'): Promise<number | null> {
  const {price} = await fetchSpotPrice(currency);
  return price;
}

/**
 * Get gold data for the root loader.
 * Never throws; falls back to the last good (or hardcoded) price.
 */
export async function getGoldData(currency = 'CAD') {
  const {price: spotPerOz, currency: spotCurrency, isFallback} =
    await fetchSpotPrice(currency);

  const perGramByKarat: Record<number, number> = {};
  for (const [k, p] of Object.entries(KARAT_PURITY)) {
    perGramByKarat[Number(k)] = +((spotPerOz / TROY_OZ_GRAMS) * p).toFixed(2);
  }

  return {
    spotPerOz: +spotPerOz.toFixed(2),
    /** Currency of spotPerOz / perGramByKarat (the shopper's, unless fallback). */
    currency: spotCurrency,
    perGramByKarat,
    isFallback,
    updatedAt: new Date().toISOString(),
  };
}
