import {useEffect, useId, useMemo, useRef, useState} from 'react';
import {STYX, FONT} from './constants';
import {
  FACET_KEYS,
  FACET_TITLES,
  applyFacets,
  countActive,
  emptySelection,
  facetCounts,
  facetOptions,
  isSelected,
  toggleFacetValue,
  type FacetKey,
  type FacetSelection,
  type ListingCard,
} from './listingFilters';

export type SortOption = {label: string; value: string};

/**
 * "Filter & Sort" dialog for listing pages. Right-side drawer on desktop,
 * bottom sheet on phones (see the "Filter & Sort drawer" CSS block at the
 * end of app.css).
 *
 * Selections are STAGED locally while the drawer is open; every facet value
 * shows a live count given the other staged facets, and the sticky footer
 * applies them ("View N results") or clears them. The route turns the applied
 * selection into URL params.
 *
 * Accessibility: role=dialog + aria-modal, focus moves in on open and back to
 * the opener on close, Tab is trapped inside, Esc closes, body scroll locked.
 */
export function ListingFilterDrawer({
  open,
  onClose,
  cards,
  selection,
  sort,
  sortOptions,
  onApply,
  title = 'Filter & Sort',
}: {
  open: boolean;
  onClose: () => void;
  /** Complete (unfiltered) card set the counts are computed over. */
  cards: ListingCard[];
  selection: FacetSelection;
  sort: string;
  sortOptions: SortOption[];
  onApply: (selection: FacetSelection, sort: string) => void;
  title?: string;
}) {
  const [staged, setStaged] = useState<FacetSelection>(selection);
  const [stagedSort, setStagedSort] = useState(sort);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<Element | null>(null);
  const titleId = useId();

  // Re-seed staged state from the URL each time the drawer opens.
  useEffect(() => {
    if (open) {
      setStaged(selection);
      setStagedSort(sort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Focus management + Esc + scroll lock.
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      (openerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  const options = useMemo(() => facetOptions(cards), [cards]);
  const counts = useMemo(
    () => facetCounts(cards, options, staged),
    [cards, options, staged],
  );
  const resultCount = useMemo(
    () => applyFacets(cards, staged).length,
    [cards, staged],
  );
  const stagedActive = countActive(staged);

  if (!open) return null;

  const sectionTitle = (text: string) => (
    <div
      style={{
        fontFamily: FONT.cinzel,
        fontSize: 9,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color: STYX.silt2,
        margin: '22px 0 6px',
      }}
    >
      {text}
    </div>
  );

  const facetSection = (key: FacetKey) => {
    const opts = options[key];
    if (opts.length < 2) return null;
    return (
      <div key={key} role="group" aria-label={FACET_TITLES[key]}>
        {sectionTitle(FACET_TITLES[key])}
        <div className={`styx-fsd-values styx-fsd-values-${key}`}>
          {opts.map((o) => {
            const selected = isSelected(staged, key, o.value);
            const n = counts[key][o.value] ?? 0;
            const disabled = !selected && n === 0;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={selected}
                aria-disabled={disabled || undefined}
                aria-label={`${o.label}, ${n} result${n === 1 ? '' : 's'}`}
                onClick={() => {
                  if (disabled) return;
                  setStaged((s) => toggleFacetValue(s, key, o.value));
                }}
                className="styx-fsd-value"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '11px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: `1px solid ${STYX.lineSoft}`,
                  cursor: disabled ? 'default' : 'pointer',
                  opacity: disabled ? 0.38 : 1,
                  textAlign: 'left',
                  color: STYX.ink,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 14,
                    height: 14,
                    flexShrink: 0,
                    border: `1px solid ${selected ? STYX.ink : STYX.silt2}`,
                    background: selected ? STYX.ink : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected && (
                    <svg width="9" height="7" viewBox="0 0 9 7" aria-hidden="true">
                      <path
                        d="M1 3.5 3.4 6 8 1"
                        fill="none"
                        stroke={STYX.bone}
                        strokeWidth="1.4"
                      />
                    </svg>
                  )}
                </span>
                {o.swatch && (
                  <span
                    aria-hidden="true"
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: o.swatch,
                      boxShadow: 'inset 0 0 0 1px rgba(26,24,21,0.12)',
                      flexShrink: 0,
                    }}
                  />
                )}
                <span
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    flex: 1,
                  }}
                >
                  {o.label}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: FONT.inter,
                    fontSize: 11,
                    color: STYX.silt2,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="styx-fsd-root"
      style={{position: 'fixed', inset: 0, zIndex: 10000}}
    >
      {/* Backdrop */}
      <div
        className="styx-fsd-backdrop"
        onClick={onClose}
        role="presentation"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(26,24,21,0.42)',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="styx-fsd-panel"
        style={{
          position: 'absolute',
          background: STYX.bone,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: `1px solid ${STYX.line}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: `1px solid ${STYX.line}`,
            flexShrink: 0,
          }}
        >
          <h2
            id={titleId}
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 13,
              fontWeight: 400,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: STYX.ink,
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            style={{
              width: 36,
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: `1px solid ${STYX.line}`,
              color: STYX.ink,
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div
          className="styx-fsd-body"
          style={{flex: 1, overflowY: 'auto', padding: '0 24px 24px'}}
        >
          {/* Sort */}
          <div role="radiogroup" aria-label="Sort by">
            {sectionTitle('Sort by')}
            {sortOptions.map((opt) => {
              const checked = stagedSort === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => setStagedSort(opt.value)}
                  className="styx-fsd-value"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '11px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: `1px solid ${STYX.lineSoft}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: STYX.ink,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: `1px solid ${checked ? STYX.ink : STYX.silt2}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {checked && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: STYX.ink,
                        }}
                      />
                    )}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 11,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {FACET_KEYS.map((key) => facetSection(key))}
        </div>

        {/* Sticky footer */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '14px 24px',
            paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
            borderTop: `1px solid ${STYX.line}`,
            background: STYX.paper,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setStaged(emptySelection());
            }}
            disabled={stagedActive === 0}
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: stagedActive === 0 ? STYX.silt2 : STYX.gold,
              background: 'none',
              border: 'none',
              cursor: stagedActive === 0 ? 'default' : 'pointer',
              padding: 0,
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              opacity: stagedActive === 0 ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => onApply(staged, stagedSort)}
            style={{
              flex: 1,
              fontFamily: FONT.cinzel,
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              padding: '14px 18px',
              background: STYX.ink,
              color: STYX.bone,
              border: `1px solid ${STYX.ink}`,
              cursor: 'pointer',
            }}
          >
            View {resultCount} result{resultCount === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  );
}
