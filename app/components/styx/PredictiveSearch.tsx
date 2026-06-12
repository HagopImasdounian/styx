import {useEffect, useMemo, useRef, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router';

import {STYX, FONT} from './constants';
import type {
  PredictiveSearchCollection,
  PredictiveSearchProduct,
  PredictiveSearchResult,
} from '~/routes/api.predictive-search';

/* ═══════════════════════════════════════════════════════════════
   Predictive search — shared hook + desktop overlay + mobile input

   Suggestions come from /api/predictive-search (Storefront API
   predictiveSearch). Submitting goes to /search?q= where the search
   page itself pushes the GTM `search` event — nothing is tracked
   per keystroke here.
   ═══════════════════════════════════════════════════════════════ */

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 280;

const EMPTY_RESULTS: PredictiveSearchResult = {products: [], collections: []};

function usePredictiveSearch(query: string) {
  const [results, setResults] = useState<PredictiveSearchResult>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/predictive-search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : EMPTY_RESULTS))
        .then((json) => {
          const next = json as Partial<PredictiveSearchResult>;
          setResults({
            products: next.products ?? [],
            collections: next.collections ?? [],
          });
          setLoading(false);
        })
        .catch((err: unknown) => {
          if ((err as Error)?.name !== 'AbortError') {
            setResults(EMPTY_RESULTS);
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return {results, loading};
}

function useLocalePrefix() {
  const params = useParams();
  return params.locale ? `/${params.locale}` : '';
}

function formatPrice(amount: string, currencyCode: string) {
  const value = parseFloat(amount);
  if (Number.isNaN(value)) return '';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value.toFixed(0)}`;
  }
}

/** Uppercase, tracked placeholder — ::placeholder isn't reachable inline. */
function PlaceholderStyle() {
  // dangerouslySetInnerHTML (static, no user input) — text children of
  // <style> get HTML-escaped by React (' → &#x27;), which breaks the CSS
  // in SSR output and causes a hydration text mismatch.
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      .styx-predictive-input::placeholder {
        font-family: ${FONT.cinzel};
        font-size: 11px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: ${STYX.silt2};
        opacity: 1;
      }
    `,
      }}
    />
  );
}

/* ── Shared result rows ────────────────────────────────────────── */

function SectionLabel({children}: {children: React.ReactNode}) {
  return (
    <div
      aria-hidden
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color: STYX.gold,
        padding: '14px 0 6px',
      }}
    >
      {children}
    </div>
  );
}

function ProductRow({
  product,
  active,
  id,
  onClick,
  onPointerEnter,
}: {
  product: PredictiveSearchProduct;
  active?: boolean;
  id?: string;
  onClick: () => void;
  onPointerEnter?: () => void;
}) {
  const prefix = useLocalePrefix();
  return (
    <Link
      to={`${prefix}/products/${product.handle}`}
      prefetch="intent"
      role="option"
      aria-selected={active ? true : undefined}
      id={id}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '9px 8px',
        margin: '0 -8px',
        textDecoration: 'none',
        background: active ? 'rgba(184,146,74,0.12)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {product.featuredImage ? (
        <img
          src={product.featuredImage.url}
          alt={product.featuredImage.altText ?? product.title}
          width={40}
          height={40}
          loading="lazy"
          style={{
            width: 40,
            height: 40,
            objectFit: 'cover',
            flexShrink: 0,
            background: STYX.parchment,
          }}
        />
      ) : (
        <span
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            background: STYX.parchment,
            border: `1px solid ${STYX.lineSoft}`,
          }}
        />
      )}
      <span
        style={{
          flex: 1,
          fontFamily: FONT.cormorant,
          fontSize: 17,
          color: STYX.ink,
          lineHeight: 1.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {product.title}
      </span>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          color: STYX.silt,
          letterSpacing: '0.05em',
          flexShrink: 0,
        }}
      >
        {formatPrice(
          product.priceRange.minVariantPrice.amount,
          product.priceRange.minVariantPrice.currencyCode,
        )}
      </span>
    </Link>
  );
}

function CollectionRow({
  collection,
  active,
  id,
  onClick,
  onPointerEnter,
}: {
  collection: PredictiveSearchCollection;
  active?: boolean;
  id?: string;
  onClick: () => void;
  onPointerEnter?: () => void;
}) {
  const prefix = useLocalePrefix();
  return (
    <Link
      to={`${prefix}/collections/${collection.handle}`}
      prefetch="intent"
      role="option"
      aria-selected={active ? true : undefined}
      id={id}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        padding: '8px 8px',
        margin: '0 -8px',
        textDecoration: 'none',
        background: active ? 'rgba(184,146,74,0.12)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      <span
        aria-hidden
        style={{
          fontFamily: FONT.cinzel,
          fontSize: 9,
          letterSpacing: '0.1em',
          color: STYX.gold,
        }}
      >
        →
      </span>
      <span
        style={{
          fontFamily: FONT.cinzel,
          fontSize: 12,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: STYX.ink,
        }}
      >
        {collection.title}
      </span>
    </Link>
  );
}

function ViewAllLink({
  query,
  onClick,
}: {
  query: string;
  onClick: () => void;
}) {
  const prefix = useLocalePrefix();
  return (
    <Link
      to={`${prefix}/search?q=${encodeURIComponent(query.trim())}`}
      onClick={onClick}
      style={{
        display: 'inline-block',
        marginTop: 16,
        fontFamily: FONT.cinzel,
        fontSize: 10,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color: STYX.gold,
        textDecoration: 'none',
      }}
    >
      View all results →
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Desktop overlay — bone dropdown under the header
   ═══════════════════════════════════════════════════════════════ */

export function PredictiveSearchPanel({onClose}: {onClose: () => void}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const {results, loading} = usePredictiveSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const prefix = useLocalePrefix();

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= MIN_QUERY_LENGTH;
  const {products, collections} = hasQuery ? results : EMPTY_RESULTS;

  // Flattened keyboard order: products, then collections.
  const items = useMemo(
    () => [
      ...products.map((p) => ({
        key: p.id,
        url: `${prefix}/products/${p.handle}`,
      })),
      ...collections.map((c) => ({
        key: c.id,
        url: `${prefix}/collections/${c.handle}`,
      })),
    ],
    [products, collections, prefix],
  );

  // Selection resets whenever the result set changes.
  useEffect(() => {
    setActiveIndex(-1);
  }, [items]);

  // Focus the input on open; restore focus where it was on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  // Escape closes even when focus has tabbed onto a result link.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submitToSearch = () => {
    // The /search page pushes the GTM `search` event itself.
    navigate(`${prefix}/search?q=${encodeURIComponent(trimmed)}`);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (items.length === 0) return;
      e.preventDefault();
      setActiveIndex((prev) => {
        // -1 = no selection (typing in the input); wraps through the list.
        const next = prev + (e.key === 'ArrowDown' ? 1 : -1);
        if (next < -1) return items.length - 1;
        if (next >= items.length) return -1;
        return next;
      });
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const selected = activeIndex >= 0 ? items[activeIndex] : null;
      if (selected) {
        navigate(selected.url);
        onClose();
      } else if (trimmed) {
        submitToSearch();
      }
    }
  };

  const activeId =
    activeIndex >= 0 && activeIndex < items.length
      ? `styx-ps-option-${activeIndex}`
      : undefined;

  const showResults = hasQuery && (products.length > 0 || collections.length > 0);
  const showEmpty = hasQuery && !loading && !showResults;

  return (
    <>
      <PlaceholderStyle />
      {/* Scrim under the header — click closes */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 'var(--styx-header-offset, 120px)',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(26,24,21,0.25)',
          zIndex: 0,
          animation: 'styx-scrim-in 0.28s ease both',
        }}
      />
      <div
        role="search"
        aria-label="Search chains"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: STYX.bone,
          borderBottom: `1px solid ${STYX.line}`,
          boxShadow: '0 24px 48px -24px rgba(26,24,21,0.2)',
          zIndex: 1,
          animation: 'styx-menu-in 0.28s cubic-bezier(.2,.8,.2,1) both',
        }}
      >
        {/* Decorative gold hairline */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 56,
            right: 56,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${STYX.gold} 30%, ${STYX.gold} 70%, transparent)`,
            opacity: 0.6,
          }}
        />
        <div style={{maxWidth: 760, margin: '0 auto', padding: '36px 56px 40px'}}>
          {/* Input row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              borderBottom: `1px solid ${STYX.line}`,
              paddingBottom: 12,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={STYX.gold}
              strokeWidth="1.4"
              aria-hidden
              style={{flexShrink: 0}}
            >
              <circle cx="10.5" cy="10.5" r="7" />
              <line x1="16" y1="16" x2="21" y2="21" />
            </svg>
            <input
              ref={inputRef}
              className="styx-predictive-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={'SEARCH CHAINS — TRY "6MM CUBAN"'}
              role="combobox"
              aria-expanded={showResults}
              aria-controls="styx-predictive-listbox"
              aria-activedescendant={activeId}
              aria-autocomplete="list"
              autoComplete="off"
              spellCheck={false}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: FONT.cormorant,
                fontSize: 22,
                color: STYX.ink,
                padding: 0,
              }}
            />
            {loading && (
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 9,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: STYX.silt2,
                  flexShrink: 0,
                }}
              >
                Searching…
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                margin: -6,
                color: STYX.silt,
                display: 'flex',
                flexShrink: 0,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          </div>

          {/* Results */}
          <div id="styx-predictive-listbox" role="listbox" aria-label="Search suggestions">
            {showResults && (
              <>
                {products.length > 0 && (
                  <>
                    <SectionLabel>Chains</SectionLabel>
                    {products.map((p, i) => (
                      <ProductRow
                        key={p.id}
                        product={p}
                        active={activeIndex === i}
                        id={`styx-ps-option-${i}`}
                        onClick={onClose}
                        onPointerEnter={() => setActiveIndex(i)}
                      />
                    ))}
                  </>
                )}
                {collections.length > 0 && (
                  <>
                    <SectionLabel>Collections</SectionLabel>
                    {collections.map((c, i) => {
                      const index = products.length + i;
                      return (
                        <CollectionRow
                          key={c.id}
                          collection={c}
                          active={activeIndex === index}
                          id={`styx-ps-option-${index}`}
                          onClick={onClose}
                          onPointerEnter={() => setActiveIndex(index)}
                        />
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>

          {showEmpty && (
            <div
              style={{
                fontFamily: FONT.cormorant,
                fontSize: 16,
                fontStyle: 'italic',
                color: STYX.silt2,
                padding: '18px 0 4px',
              }}
            >
              Nothing in the vault matches &ldquo;{trimmed}&rdquo; — try a weave,
              karat or width.
            </div>
          )}

          {hasQuery && <ViewAllLink query={query} onClick={onClose} />}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Mobile menu search — sits at the top of the root pane
   ═══════════════════════════════════════════════════════════════ */

export function MobileMenuSearch({onClose}: {onClose: () => void}) {
  const [query, setQuery] = useState('');
  const {results, loading} = usePredictiveSearch(query);
  const navigate = useNavigate();
  const prefix = useLocalePrefix();

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= MIN_QUERY_LENGTH;
  const {products, collections} = hasQuery ? results : EMPTY_RESULTS;
  const hasResults = products.length > 0 || collections.length > 0;

  return (
    <div style={{borderBottom: `1px solid ${STYX.line}`}}>
      <PlaceholderStyle />
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (!trimmed) return;
          // The /search page pushes the GTM `search` event itself.
          navigate(`${prefix}/search?q=${encodeURIComponent(trimmed)}`);
          onClose();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 24px',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={STYX.gold}
          strokeWidth="1.4"
          aria-hidden
          style={{flexShrink: 0}}
        >
          <circle cx="10.5" cy="10.5" r="7" />
          <line x1="16" y1="16" x2="21" y2="21" />
        </svg>
        <input
          className="styx-predictive-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={'SEARCH CHAINS — TRY "6MM CUBAN"'}
          aria-label="Search chains"
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: FONT.cormorant,
            // 16px+ so iOS doesn't zoom the viewport on focus.
            fontSize: 18,
            color: STYX.ink,
            padding: 0,
          }}
        />
        {loading && (
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: STYX.silt2,
              flexShrink: 0,
            }}
          >
            …
          </span>
        )}
      </form>

      {hasQuery && (hasResults || !loading) && (
        <div style={{padding: '0 24px 18px'}}>
          {products.length > 0 && (
            <>
              <SectionLabel>Chains</SectionLabel>
              {products.map((p) => (
                <ProductRow key={p.id} product={p} onClick={onClose} />
              ))}
            </>
          )}
          {collections.length > 0 && (
            <>
              <SectionLabel>Collections</SectionLabel>
              {collections.map((c) => (
                <CollectionRow key={c.id} collection={c} onClick={onClose} />
              ))}
            </>
          )}
          {!hasResults && !loading && (
            <div
              style={{
                fontFamily: FONT.cormorant,
                fontSize: 15,
                fontStyle: 'italic',
                color: STYX.silt2,
                paddingTop: 12,
              }}
            >
              No matches — try a weave, karat or width.
            </div>
          )}
          <ViewAllLink query={query} onClick={onClose} />
        </div>
      )}
    </div>
  );
}
