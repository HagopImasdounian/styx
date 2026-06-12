import {useEffect, useState} from 'react';

import {Link} from '~/components/Link';

import {STYX, FONT} from './constants';
import {StyxLabel} from './StyxLabel';
import {PlaceholderImage} from './PlaceholderImage';

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

function formatPrice(entry: RecentlyViewedEntry): string | null {
  const amount = entry.price ? parseFloat(entry.price) : NaN;
  if (!Number.isFinite(amount)) return null;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: entry.currencyCode || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function RecentlyViewed({
  excludeHandle,
}: {
  /** Current product handle — excluded from its own strip. */
  excludeHandle?: string;
}) {
  const [entries, setEntries] = useState<RecentlyViewedEntry[]>([]);

  // Hydrate from localStorage after mount; re-read when the product changes
  // (client-side navigation between PDPs re-runs this effect).
  useEffect(() => {
    setEntries(readEntries());
  }, [excludeHandle]);

  const items = entries.filter((e) => e.handle !== excludeHandle);

  // Hide entirely until there's enough history to be useful.
  if (items.length < 2) return null;

  return (
    <section
      className="styx-recently-viewed"
      style={{
        borderTop: `1px solid ${STYX.line}`,
        background: STYX.bone,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .styx-recently-viewed-row { scrollbar-width: none; }
            .styx-recently-viewed-row::-webkit-scrollbar { display: none; }
            @media (max-width: 48em) {
              .styx-recently-viewed-inner { padding: 56px 20px !important; }
              .styx-recently-viewed h2 { font-size: 26px !important; margin-bottom: 28px !important; }
              .styx-recently-viewed-card { flex: 0 0 44vw !important; max-width: 200px; }
            }
          `,
        }}
      />
      <div
        className="styx-recently-viewed-inner"
        style={{maxWidth: 1440, margin: '0 auto', padding: '72px 56px'}}
      >
        <StyxLabel>Retrace Your Steps</StyxLabel>
        <h2
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 32,
            fontWeight: 400,
            color: STYX.ink,
            margin: '8px 0 36px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Recently Viewed
        </h2>

        <div
          className="styx-recently-viewed-row"
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
            paddingBottom: 8,
          }}
        >
          {items.map((entry) => {
            const price = formatPrice(entry);
            return (
              <Link
                key={entry.handle}
                to={`/products/${entry.handle}`}
                prefetch="intent"
                className="styx-recently-viewed-card"
                style={{
                  flex: '0 0 190px',
                  scrollSnapAlign: 'start',
                  textDecoration: 'none',
                  border: `1px solid ${STYX.line}`,
                  background: STYX.paper,
                  transition: 'border-color 0.2s ease',
                }}
              >
                <div
                  style={{
                    aspectRatio: '1 / 1',
                    overflow: 'hidden',
                    background: '#FFFFFF',
                  }}
                >
                  {entry.image ? (
                    <img
                      src={entry.image}
                      alt={entry.title}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <PlaceholderImage aspect="1/1" label={entry.title} />
                  )}
                </div>
                <div style={{padding: '12px 12px 14px'}}>
                  <div
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 11,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      lineHeight: 1.4,
                      color: STYX.ink,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.title}
                  </div>
                  {(price || entry.karat) && (
                    <div
                      style={{
                        fontFamily: FONT.mono,
                        fontSize: 11,
                        color: STYX.silt,
                        marginTop: 4,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {entry.karat ? `${entry.karat}K` : null}
                      {entry.karat && price ? ' · ' : null}
                      {price}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
