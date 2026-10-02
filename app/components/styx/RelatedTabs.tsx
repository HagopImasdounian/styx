import {useId, useRef, useState} from 'react';

import {FONT} from './constants';
import {StyxProductCard} from './StyxProductCard';
import {useRecentlyViewedProducts} from './RecentlyViewed';

/**
 * One tabbed module at the bottom of the PDP: "You may also like" (default)
 * and "Recently viewed". The second tab only appears once the visitor has
 * looked at at least one other product (history is localStorage-backed and
 * client-only, so the server renders the recommendations tab alone).
 *
 * Both panels stay mounted and stacked in the same grid cell, so the module
 * is as tall as its tallest panel and switching tabs never shifts the page.
 */

type TabKey = 'recommended' | 'recent';

type Tab = {
  key: TabKey;
  label: string;
  eyebrow: string;
  items: any[];
};

export function RelatedTabs({
  recommended,
  excludeHandle,
  maxItems = 4,
}: {
  /** Resolved "You may also like" product nodes (ProductCard fragment). */
  recommended: any[];
  /** Current product handle, excluded from Recently viewed. */
  excludeHandle: string;
  maxItems?: number;
}) {
  const baseId = useId();
  const [active, setActive] = useState<TabKey>('recommended');
  const tabRefs = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>(
    {},
  );

  const recentProducts = useRecentlyViewedProducts(excludeHandle, 1);

  const recommendedItems = (recommended ?? []).filter(Boolean).slice(0, maxItems);
  const recentItems = (recentProducts ?? []).filter(Boolean).slice(0, maxItems);

  const tabs: Tab[] = [];
  if (recommendedItems.length > 0) {
    tabs.push({
      key: 'recommended',
      label: 'You may also like',
      eyebrow: 'Continue the crossing',
      items: recommendedItems,
    });
  }
  if (recentItems.length > 0) {
    tabs.push({
      key: 'recent',
      label: 'Recently viewed',
      eyebrow: 'Retrace your steps',
      items: recentItems,
    });
  }

  if (tabs.length === 0) return null;

  // If the active tab has nothing to show (e.g. history cleared), fall back.
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  const tabId = (key: TabKey) => `${baseId}-tab-${key}`;
  const panelId = (key: TabKey) => `${baseId}-panel-${key}`;

  const focusTab = (index: number) => {
    const next = tabs[(index + tabs.length) % tabs.length];
    if (!next) return;
    setActive(next.key);
    tabRefs.current[next.key]?.focus();
  };

  const onTabListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.key === current.key);
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        focusTab(i + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        focusTab(i - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusTab(0);
        break;
      case 'End':
        e.preventDefault();
        focusTab(tabs.length - 1);
        break;
      default:
    }
  };

  return (
    <section
      className="styx-product-related"
      style={{
        maxWidth: 1800,
        margin: '0 auto',
        padding: '80px var(--styx-page-gutter)',
      }}
    >
      <p className="styx-eyebrow" style={{marginBottom: 12}}>
        {current.eyebrow}
      </p>
      <h2
        data-reveal=""
        style={{
          fontFamily: FONT.cormorant,
          fontSize: 'clamp(36px, 3.6vw, 54px)',
          fontWeight: 400,
          lineHeight: 1,
          color: '#1a1b1c',
          margin: tabs.length > 1 ? '0 0 24px' : '0 0 40px',
          letterSpacing: '-0.03em',
        }}
      >
        {current.label}
      </h2>

      {tabs.length > 1 && (
        <div
          role="tablist"
          aria-label="Related products"
          className="styx-related-tablist"
          onKeyDown={onTabListKeyDown}
          style={{
            display: 'flex',
            gap: 28,
            borderBottom: '1px solid var(--styx-border)',
            marginBottom: 32,
          }}
        >
          {tabs.map((tab) => {
            const selected = tab.key === current.key;
            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabRefs.current[tab.key] = el;
                }}
                type="button"
                role="tab"
                id={tabId(tab.key)}
                aria-selected={selected}
                aria-controls={panelId(tab.key)}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(tab.key)}
                className="styx-related-tab"
                style={{
                  appearance: 'none',
                  background: 'transparent',
                  border: 'none',
                  padding: '0 0 12px',
                  marginBottom: -1,
                  cursor: 'pointer',
                  minHeight: 44,
                  fontFamily: FONT.inter,
                  fontSize: 13,
                  fontWeight: selected ? 500 : 400,
                  letterSpacing: '0.005em',
                  color: selected ? '#1a1b1c' : 'var(--styx-muted)',
                  borderBottom: `1px solid ${
                    selected ? '#1a1b1c' : 'transparent'
                  }`,
                  transition: 'color 0.2s ease, border-color 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Panels stacked in one grid cell: height = tallest panel, no shift. */}
      <div style={{display: 'grid', minHeight: 200}}>
        {tabs.map((tab) => {
          const selected = tab.key === current.key;
          return (
            <div
              key={tab.key}
              role="tabpanel"
              id={panelId(tab.key)}
              aria-labelledby={tabId(tab.key)}
              aria-hidden={selected ? undefined : true}
              className="styx-product-related-grid"
              style={{
                gridArea: '1 / 1',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 24,
                visibility: selected ? 'visible' : 'hidden',
                opacity: selected ? 1 : 0,
                pointerEvents: selected ? 'auto' : 'none',
                transition: 'opacity 0.25s ease',
              }}
            >
              {tab.items.map((product, i) => (
                <StyxProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  belowFold
                />
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
