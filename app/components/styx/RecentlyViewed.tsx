import {useEffect, useState} from 'react';

import {ProductGridSection} from './ProductGridSection';

/**
 * Recently Viewed strip — localStorage-backed, no context needed.
 *
 * SSR-safe by the same pattern as WishlistContext: initial state is empty
 * (server renders nothing), entries hydrate in a useEffect after mount.
 * `recordRecentlyViewed` is a plain helper the PDP calls from a useEffect,
 * so it never runs on the server either.
 */

const STORAGE_KEY = 'styx:recently-viewed';
const MAX_ENTRIES = 8;

export type RecentlyViewedEntry = {
  handle: string;
  title: string;
  /** Product image URL (variant or first media image). */
  image?: string | null;
  /** Raw price amount, e.g. "1234.56" — formatted at render time. */
  price?: string | null;
  /** ISO currency code for the price, defaults to USD. */
  currencyCode?: string | null;
  karat?: number | null;
};

function isEntry(value: unknown): value is RecentlyViewedEntry {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as RecentlyViewedEntry).handle === 'string' &&
    typeof (value as RecentlyViewedEntry).title === 'string'
  );
}

function readEntries(): RecentlyViewedEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

/** Record a product view. Most-recent-first, de-duped by handle, max 8. */
export function recordRecentlyViewed(entry: RecentlyViewedEntry) {
  if (typeof window === 'undefined') return;
  if (!entry?.handle || !entry?.title) return;
  try {
    const rest = readEntries().filter((e) => e.handle !== entry.handle);
    const next = [entry, ...rest].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode, quota) — viewing history is optional.
  }
}

export function RecentlyViewed({
  excludeHandle,
}: {
  /** Current product handle — excluded from its own strip. */
  excludeHandle?: string;
}) {
  // Full ProductCard data, fetched for the stored handles so this strip renders
  // the exact same <StyxProductCard> as "You Might Also Like" (one shared block,
  // not a parallel mini-card). Empty on the server; hydrates after mount.
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const handles = readEntries()
      .map((e) => e.handle)
      .filter((h) => h !== excludeHandle)
      .slice(0, 8);

    // Need at least two pieces of history before the strip earns its space.
    if (handles.length < 2) {
      setProducts([]);
      return;
    }

    let cancelled = false;
    fetch(`/api/products-by-handle?handles=${handles.join(',')}`)
      .then((r) => (r.ok ? r.json() : {products: []}))
      .then((d: any) => {
        if (!cancelled) setProducts(d?.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [excludeHandle]);

  if (products.length < 2) return null;

  return (
    <ProductGridSection
      label="Retrace Your Steps"
      heading="Recently Viewed"
      products={products}
    />
  );
}
