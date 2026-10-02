import {useSyncExternalStore} from 'react';
import {useNonce} from '@shopify/hydrogen';

/* ═══════════════════════════════════════════════════════════════
   Grid density (listing pages)

   'compact' = today's layout (3-up desktop / 2-up phone).
   'large'   = 2-up desktop / 1-up phone, applied via the classes
               `styx-grid-2up styx-grid-1up` on the grid element (CSS at the
               end of app.css). Persisted in localStorage under
               `styx:grid-density`.

   No flash on reload: <GridDensityScript> (rendered right after the grid)
   adds the classes before hydration; the React store then agrees with the
   DOM on its first client render (useSyncExternalStore re-renders
   synchronously when the client snapshot differs from the server one).
   ═══════════════════════════════════════════════════════════════ */

export const GRID_DENSITY_KEY = 'styx:grid-density';
export type GridDensity = 'compact' | 'large';
export const GRID_DENSITY_CLASSES = 'styx-grid-2up styx-grid-1up';

let cached: GridDensity | null = null;
const listeners = new Set<() => void>();

function readStored(): GridDensity {
  try {
    return window.localStorage.getItem(GRID_DENSITY_KEY) === 'large'
      ? 'large'
      : 'compact';
  } catch {
    return 'compact';
  }
}

function getSnapshot(): GridDensity {
  if (cached === null) cached = readStored();
  return cached;
}
function getServerSnapshot(): GridDensity {
  return 'compact';
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setGridDensity(next: GridDensity) {
  cached = next;
  try {
    window.localStorage.setItem(GRID_DENSITY_KEY, next);
  } catch {
    /* private mode etc. */
  }
  listeners.forEach((cb) => cb());
}

export function useGridDensity(): [GridDensity, (d: GridDensity) => void] {
  const density = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return [density, setGridDensity];
}

export function gridDensityClass(density: GridDensity): string {
  return density === 'large' ? GRID_DENSITY_CLASSES : '';
}

/**
 * Inline bootstrap: applies the stored density to every product grid BEFORE
 * React hydrates so a "large" preference never flashes the compact layout.
 * Render it after the grid in DOM order. Grids carry
 * `suppressHydrationWarning` so the pre-applied class is not reported.
 */
const BOOT = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  GRID_DENSITY_KEY,
)})==='large'){var g=document.querySelectorAll('[data-test="product-grid"]');for(var i=0;i<g.length;i++){g[i].classList.add('styx-grid-2up','styx-grid-1up')}}}catch(e){}})();`;

export function GridDensityScript() {
  const nonce = useNonce();
  return (
    <script
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{__html: BOOT}}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   Toolbar controls
   ═══════════════════════════════════════════════════════════════ */

function SquaresIcon({count}: {count: 4 | 2}) {
  // 4 squares = compact grid, 2 squares = large grid
  return count === 4 ? (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" fill="currentColor" />
      <rect x="9" y="1" width="6" height="6" fill="currentColor" />
      <rect x="1" y="9" width="6" height="6" fill="currentColor" />
      <rect x="9" y="9" width="6" height="6" fill="currentColor" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1" y="1" width="14" height="6" fill="currentColor" />
      <rect x="1" y="9" width="14" height="6" fill="currentColor" />
    </svg>
  );
}

export function GridDensityToggle({
  density,
  onChange,
  className,
}: {
  density: GridDensity;
  onChange: (d: GridDensity) => void;
  className?: string;
}) {
  const btn = (value: GridDensity, label: string, icon: 4 | 2) => {
    const pressed = density === value;
    return (
      <button
        type="button"
        aria-pressed={pressed}
        aria-label={label}
        title={label}
        onClick={() => onChange(value)}
        className="styx-seg-btn styx-seg-icon"
      >
        <SquaresIcon count={icon} />
      </button>
    );
  };
  return (
    <div
      role="group"
      aria-label="Grid density"
      className={`styx-seg ${className ?? ''}`.trim()}
    >
      {btn('compact', 'Smaller product images', 4)}
      {btn('large', 'Larger product images', 2)}
    </div>
  );
}

function SlidersIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <line x1="1" y1="3.5" x2="13" y2="3.5" />
      <line x1="1" y1="10.5" x2="13" y2="10.5" />
      <circle cx="5" cy="3.5" r="1.8" fill="var(--styx-slider-knob, #f4f4f2)" />
      <circle cx="9.5" cy="10.5" r="1.8" fill="var(--styx-slider-knob, #f4f4f2)" />
    </svg>
  );
}

export function FilterSortButton({
  activeCount,
  open,
  onClick,
  className,
  fill,
}: {
  activeCount: number;
  open: boolean;
  onClick: () => void;
  className?: string;
  /** Solid ink button (phone bottom bar) instead of outlined. */
  fill?: boolean;
}) {
  const label =
    activeCount > 0
      ? `Filter and sort, ${activeCount} filter${
          activeCount === 1 ? '' : 's'
        } active`
      : 'Filter and sort';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={label}
      className={`styx-ctl${fill ? ' styx-ctl-fill' : ''} ${className ?? ''}`.trim()}
      data-active={activeCount > 0 ? 'true' : undefined}
    >
      <span className="styx-ctl-icon">
        <SlidersIcon />
      </span>
      Filter &amp; sort
      {activeCount > 0 && <span aria-hidden="true">({activeCount})</span>}
    </button>
  );
}

/**
 * Phone-only floating bottom bar (CSS hides it above 768px). Rendered by the
 * listing routes only, so it never overlaps the PDP.
 */
export function ListingBottomBar({
  activeCount,
  onOpenFilters,
  density,
  onDensity,
  hidden,
}: {
  activeCount: number;
  onOpenFilters: () => void;
  density: GridDensity;
  onDensity: (d: GridDensity) => void;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <div className="styx-listing-bottombar" role="toolbar" aria-label="Listing tools">
      <FilterSortButton
        activeCount={activeCount}
        open={false}
        onClick={onOpenFilters}
        className="styx-listing-bottombar-filter"
        fill
      />
      <GridDensityToggle density={density} onChange={onDensity} />
    </div>
  );
}
