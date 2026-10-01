/**
 * Chain length size guide (approved spec 2026-10-01, Jaxxon pattern, neck-size
 * tabs per Apic).
 *
 * ONE base photo per neck size (generated once, Nano Banana Pro) and the
 * chain-length arcs are DRAWN on top as SVG, never regenerated, so every
 * length is shown on exactly the same neck. Each photo carries its own
 * calibration: where the base of the neck is, how wide it is, and the
 * pixels-per-inch derived from the neck circumference it represents.
 *
 * Drape model (front view): a chain of length L hugs the back half of the
 * neck base (≈ half its circumference) and the rest hangs as a U from the two
 * sides of the neck base. Each front leg ≈ 1.05 × the straight line from the
 * neck side to the lowest point, so
 *     drop d = sqrt( ((L − Cb/2) / 2.1)² − hb² )
 * with Cb the neck-base circumference (neck + 1") and hb the half neck-base
 * width in inches. A length that cannot close around the neck is shown snug.
 */
import {useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {FONT, STYX} from './constants';

export const GUIDE_LENGTHS = [16, 18, 20, 22, 24, 26] as const;

type NeckProfile = {
  inches: number;
  label: string;
  build: string;
  src: string;
  width: number; // image px
  height: number;
  notch: {x: number; y: number}; // collar front centre
  neckBaseY: number; // where the neck meets the shoulders
  halfBasePx: number; // half neck-base width, px
  neckWidthPx: number; // mid-neck width, px (sets the scale)
};

// Measured on the generated photos (1856×2304 originals, served at 1200 wide,
// so coordinates below are in the ORIGINAL pixel space = the SVG viewBox).
export const NECK_PROFILES: NeckProfile[] = [
  {
    inches: 14,
    label: '14" neck',
    build: 'Slim',
    src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-size-guide-neck-14.jpg?v=1790896451',
    width: 1856,
    height: 2304,
    notch: {x: 928, y: 538},
    neckBaseY: 538 - 155,
    halfBasePx: 235,
    neckWidthPx: 395,
  },
  {
    inches: 16,
    label: '16" neck',
    build: 'Average',
    src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-size-guide-neck-16.jpg?v=1790896453',
    width: 1856,
    height: 2304,
    notch: {x: 928, y: 496},
    neckBaseY: 496 - 150,
    halfBasePx: 250,
    neckWidthPx: 410,
  },
  {
    inches: 18,
    label: '18" neck',
    build: 'Broad',
    src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-size-guide-neck-18.jpg?v=1790896456',
    width: 1856,
    height: 2304,
    notch: {x: 928, y: 491},
    neckBaseY: 491 - 150,
    halfBasePx: 300,
    neckWidthPx: 500,
  },
];

const WHERE: Record<number, string> = {
  16: 'Sits at the base of the neck. A close, collar-line fit.',
  18: 'Rests on the collarbone. The classic everyday length.',
  20: 'Falls just below the collarbone, on the upper chest.',
  22: 'Reaches the top of the sternum. Room for a pendant.',
  24: 'Mid chest. Layers well over an 18" or 20".',
  26: 'Lower chest, over a shirt or hoodie.',
};

/** Pixels per inch for a profile: mid-neck width = circumference / π. */
export function pxPerInch(p: NeckProfile): number {
  return p.neckWidthPx / (p.inches / Math.PI);
}

/** Drop (inches) of a chain's lowest point below the neck base, null if it can't close. */
export function dropInches(p: NeckProfile, lengthIn: number): number | null {
  const ppi = pxPerInch(p);
  const hb = p.halfBasePx / ppi;
  const back = (p.inches + 1) / 2;
  const leg = (lengthIn - back) / 2.1;
  if (leg <= 0) return null;
  const d2 = leg * leg - hb * hb;
  return d2 <= 0 ? null : Math.sqrt(d2);
}

/** Where a length sits for a neck, as a short fit word. */
export function fitWord(
  p: NeckProfile,
  lengthIn: number,
): 'snug' | 'close' | 'good' | 'long' {
  const d = dropInches(p, lengthIn);
  if (d === null) return 'snug';
  if (d < 2.5) return 'close';
  if (d <= 7) return 'good';
  return 'long';
}

function arcPath(p: NeckProfile, lengthIn: number): string {
  const ppi = pxPerInch(p);
  const d = dropInches(p, lengthIn);
  const dropPx = d === null ? 0.35 * ppi : d * ppi;
  const x0 = p.notch.x - p.halfBasePx;
  const x1 = p.notch.x + p.halfBasePx;
  const y = p.neckBaseY;
  // Cubic with symmetric controls: the curve's lowest point is at 0.75 × control drop.
  const cy = y + dropPx / 0.75;
  const k = p.halfBasePx * 0.92;
  return `M ${x0} ${y} C ${p.notch.x - k} ${cy}, ${
    p.notch.x + k
  } ${cy}, ${x1} ${y}`;
}

function parseInches(v: string | null | undefined): number | null {
  const m = String(v ?? '').match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

export type SizeGuideProps = {
  open: boolean;
  onClose: () => void;
  /** Length option values offered by this product, e.g. ['16"', '18"']. */
  availableLengths?: string[];
  /** Currently selected Length option value. */
  selectedLength?: string | null;
  /** Chain thickness in mm, drawn to scale on the model. */
  thicknessMm?: number | null;
  /** Called with the Length option value when the shopper picks one. */
  onPickLength?: (lengthValue: string) => void;
  productTitle?: string;
};

export function SizeGuide({
  open,
  onClose,
  availableLengths = [],
  selectedLength = null,
  thicknessMm = null,
  onPickLength,
  productTitle,
}: SizeGuideProps) {
  const [neckIdx, setNeckIdx] = useState(1);
  const [length, setLength] = useState<number>(
    () => parseInches(selectedLength) ?? 20,
  );
  const closeRef = useRef<HTMLButtonElement>(null);

  // Follow the PDP's Length pills while open.
  useEffect(() => {
    const n = parseInches(selectedLength);
    if (n && (GUIDE_LENGTHS as readonly number[]).includes(n)) setLength(n);
  }, [selectedLength]);

  // Esc closes, body scroll locked, focus lands on the close button.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const profile = NECK_PROFILES[neckIdx];
  const ppi = pxPerInch(profile);
  const strokePx = Math.max(6, ((thicknessMm ?? 3) / 25.4) * ppi);
  const offered = useMemo(() => {
    const s = new Set<number>();
    for (const v of availableLengths) {
      const n = parseInches(v);
      if (n) s.add(n);
    }
    return s;
  }, [availableLengths]);
  const lengthValueFor = (n: number) =>
    availableLengths.find((v) => parseInches(v) === n) ?? `${n}"`;

  if (!open || typeof document === 'undefined') return null;

  const drop = dropInches(profile, length);

  return createPortal(
    <div
      className="styx-sizeguide"
      role="dialog"
      aria-modal="true"
      aria-labelledby="styx-sizeguide-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="styx-sizeguide-panel">
        <button
          ref={closeRef}
          type="button"
          className="styx-sizeguide-close"
          aria-label="Close size guide"
          onClick={onClose}
        >
          ✕
        </button>

        {/* ── Model + arcs ── */}
        <div className="styx-sizeguide-figure">
          <img
            src={profile.src}
            alt={`${profile.build} build, ${profile.label}`}
            width={profile.width}
            height={profile.height}
            decoding="async"
          />
          <svg
            viewBox={`0 0 ${profile.width} ${profile.height}`}
            aria-hidden="true"
            className="styx-sizeguide-arcs"
          >
            {GUIDE_LENGTHS.map((L) => {
              const active = L === length;
              return (
                <g key={L} className={active ? 'is-active' : undefined}>
                  <path
                    d={arcPath(profile, L)}
                    fill="none"
                    stroke={active ? STYX.gold : 'rgba(255,255,255,0.75)'}
                    strokeWidth={active ? strokePx : 3}
                    strokeDasharray={active ? undefined : '10 14'}
                    strokeLinecap="round"
                    style={{
                      filter: active
                        ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))'
                        : undefined,
                      transition: 'd 0.35s ease, stroke 0.2s',
                    }}
                  />
                  {!active && (
                    <text
                      x={profile.notch.x + profile.halfBasePx + 28}
                      y={
                        profile.neckBaseY +
                        (dropInches(profile, L) ?? 0.35) * ppi -
                        10
                      }
                      fontSize={34}
                      fontFamily="JetBrains Mono, monospace"
                      fill="rgba(255,255,255,0.9)"
                      style={{
                        paintOrder: 'stroke',
                        stroke: 'rgba(0,0,0,0.35)',
                        strokeWidth: 4,
                      }}
                    >
                      {L}"
                    </text>
                  )}
                </g>
              );
            })}
            {/* Active label, bigger, by the lowest point */}
            <text
              x={profile.notch.x}
              y={profile.neckBaseY + (drop ?? 0.35) * ppi + 70}
              textAnchor="middle"
              fontSize={48}
              fontFamily="Cormorant Garamond, Georgia, serif"
              fontWeight={500}
              fill="#fff"
              style={{
                paintOrder: 'stroke',
                stroke: 'rgba(0,0,0,0.45)',
                strokeWidth: 6,
              }}
            >
              {length}"
            </text>
          </svg>
        </div>

        {/* ── Controls ── */}
        <div className="styx-sizeguide-side">
          <div className="styx-eyebrow" style={{marginBottom: 6}}>
            Size guide
          </div>
          <h2 id="styx-sizeguide-title" className="styx-sizeguide-title">
            Which length sits where
          </h2>
          {productTitle && (
            <p className="styx-sizeguide-product">{productTitle}</p>
          )}

          <div className="styx-sizeguide-label">Your neck</div>
          <div className="styx-seg styx-sizeguide-necks" role="tablist">
            {NECK_PROFILES.map((p, i) => (
              <button
                key={p.inches}
                type="button"
                role="tab"
                aria-selected={i === neckIdx}
                className={i === neckIdx ? 'is-active' : undefined}
                onClick={() => setNeckIdx(i)}
              >
                <span>{p.label}</span>
                <small>{p.build}</small>
              </button>
            ))}
          </div>
          <p className="styx-sizeguide-hint">
            Measure around the base of your neck with a tape or a string. Most
            men are 15–17".
          </p>

          <div className="styx-sizeguide-label">Chain length</div>
          <div className="styx-sizeguide-lengths" role="tablist">
            {GUIDE_LENGTHS.map((L) => {
              const fit = fitWord(profile, L);
              const here = offered.size === 0 || offered.has(L);
              return (
                <button
                  key={L}
                  type="button"
                  role="tab"
                  aria-selected={L === length}
                  className={[
                    'styx-chip',
                    L === length ? 'is-active' : '',
                    here ? '' : 'is-unavailable',
                  ]
                    .join(' ')
                    .trim()}
                  aria-pressed={L === length}
                  onClick={() => setLength(L)}
                  title={here ? undefined : 'Not offered for this chain'}
                >
                  {L}"
                  <small className={`fit-${fit}`}>
                    {fit === 'snug'
                      ? 'snug'
                      : fit === 'close'
                      ? 'close'
                      : fit === 'long'
                      ? 'long'
                      : 'fits'}
                  </small>
                </button>
              );
            })}
          </div>

          <p className="styx-sizeguide-where">
            <strong>{length}"</strong> on a {profile.label.toLowerCase()}:{' '}
            {drop === null
              ? 'closes right at the neck, choker-tight. Go up a size.'
              : `${WHERE[length]} Lowest point about ${drop.toFixed(
                  1,
                )}" below the base of the neck.`}
          </p>

          {onPickLength && offered.has(length) && (
            <button
              type="button"
              className="styx-sizeguide-cta"
              onClick={() => {
                onPickLength(lengthValueFor(length));
                onClose();
              }}
            >
              Select {length}"
            </button>
          )}

          <table className="styx-sizeguide-table">
            <caption>Recommended lengths by neck size</caption>
            <thead>
              <tr>
                <th>Neck</th>
                <th>Collar line</th>
                <th>Collarbone</th>
                <th>Chest</th>
              </tr>
            </thead>
            <tbody>
              {NECK_PROFILES.map((p) => {
                const by = (want: 'close' | 'good') =>
                  GUIDE_LENGTHS.filter((L) => fitWord(p, L) === want);
                const close = by('close');
                const good = by('good');
                return (
                  <tr
                    key={p.inches}
                    className={p === profile ? 'is-active' : undefined}
                  >
                    <th scope="row">{p.inches}"</th>
                    <td>{close.length ? `${close[0]}"` : '—'}</td>
                    <td>{good.length ? `${good[0]}"` : '—'}</td>
                    <td>
                      {good.length > 1
                        ? `${good[1]}"–${good[good.length - 1]}"`
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="styx-sizeguide-hint">
            Thickness is drawn to scale for this chain
            {thicknessMm ? ` (${thicknessMm}mm)` : ''}. For the real thing at
            true size, use the ruler button on the product photo.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
