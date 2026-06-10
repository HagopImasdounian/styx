import {STYX} from './constants';

/**
 * A single chain-weave tile repeated to fill its window at the chain's true
 * thickness. The thickness may be expressed in real `mm` (print, true on paper)
 * or CSS `px` (screen, true once calibrated). Falls back to a solid gold bar
 * when the weave has no tile.
 *
 * Orientation:
 *  - `vertical` (default): chain runs top→bottom, thickness = width, tiles
 *    down the window. Good for side-by-side width comparison (compare columns).
 *  - `horizontal`: chain runs left→right, thickness = height, tiles across the
 *    full width. Reads like laying the chain on a ruler and costs far less
 *    vertical space — used on the product page.
 *
 * On screen (px mode) we use a real photographic gold-chain tile so shoppers see
 * the actual metal at true size; print (mm mode) keeps the crisp black line-art
 * tile, which reproduces far better on paper than a photo. Tiles are seamless
 * one-period crops where the chain fills the tile across its thickness, so the
 * same `thickness` scaling holds for either orientation.
 */
export function ChainSilhouette({
  styleSlug,
  widthMm,
  pxPerMm,
  heightPx,
  heightCss,
  title,
  orientation = 'vertical',
}: {
  styleSlug: string | null;
  widthMm: number;
  /** If set, render in CSS px (= widthMm × pxPerMm) for true on-screen size. */
  pxPerMm?: number | null;
  /** Run length in px (vertical, screen mode). */
  heightPx?: number;
  /** Run length for print/mm mode (default 90mm). */
  heightCss?: string;
  title?: string;
  orientation?: 'vertical' | 'horizontal';
}) {
  const px = pxPerMm != null;
  const horizontal = orientation === 'horizontal';
  // The chain's TRUE dimension — its thickness.
  const thickness = px ? `${widthMm * pxPerMm!}px` : `${widthMm}mm`;
  // Run length (the non-true axis): fills the container in horizontal mode.
  const runLen = px ? `${heightPx ?? 220}px` : heightCss ?? '90mm';
  // Photographic tiles on screen, line-art tiles for print.
  const tileDir = px ? (horizontal ? 'tiles-photo-h' : 'tiles-photo') : 'tiles';

  const base: React.CSSProperties = {
    width: horizontal ? '100%' : thickness,
    height: horizontal ? thickness : runLen,
    flexShrink: 0,
    WebkitPrintColorAdjust: 'exact',
    printColorAdjust: 'exact',
  };

  if (!styleSlug) {
    return (
      <div
        role="img"
        aria-label={title ? `${title} shown at ${widthMm}mm width` : undefined}
        style={{
          ...base,
          background: horizontal
            ? 'linear-gradient(180deg, #b8924a, #d4b478 50%, #8a6a32)'
            : 'linear-gradient(90deg, #b8924a, #d4b478 50%, #8a6a32)',
          border: `0.2mm solid ${STYX.goldDeep}`,
        }}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={
        title
          ? `${title} link outline shown at actual ${widthMm}mm width`
          : undefined
      }
      style={{
        ...base,
        backgroundImage: `url(/images/silhouettes/${tileDir}/${styleSlug}.png)`,
        backgroundRepeat: horizontal ? 'repeat-x' : 'repeat-y',
        backgroundPosition: horizontal ? 'left center' : 'center bottom',
        backgroundSize: horizontal ? `auto ${thickness}` : `${thickness} auto`,
      }}
    />
  );
}
