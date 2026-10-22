import {
  CacheNone,
  CacheShort,
  generateCacheControlHeader,
} from '@shopify/hydrogen';

export function routeHeaders({loaderHeaders}: {loaderHeaders: Headers}) {
  // Keep the same cache-control headers when loading the page directly
  // versus when transititioning to the page from other areas in the app
  return {
    'Cache-Control': loaderHeaders.get('Cache-Control'),
  };
}

// Hydrogen's CacheShort() is max-age=1 + swr=9, a 10-second edge window that
// buys almost nothing. Pages here can tolerate a minute of staleness (prices
// derive from a gold spot that's itself cached 5 minutes) with a long
// stale-while-revalidate so the edge keeps serving instantly while it refreshes.
export const CACHE_SHORT = generateCacheControlHeader(
  CacheShort({maxAge: 60, staleWhileRevalidate: 3600}),
);
// Copy pages (About, Shipping, Terms, Buyback…). CacheLong() let browsers keep
// a page for an hour and serve it stale for a day, so copy edits looked
// undeployed (Patil, 2026-10-21). Five minutes is plenty for static copy.
export const CACHE_LONG = generateCacheControlHeader(
  CacheShort({maxAge: 300, staleWhileRevalidate: 3600}),
);
export const CACHE_NONE = generateCacheControlHeader(CacheNone());
