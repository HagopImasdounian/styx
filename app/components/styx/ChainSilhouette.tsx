import {STYX} from './constants';

/**
 * A single chain-weave silhouette: one seamless link tile repeated vertically
 * to fill the window at a given width. Width may be expressed in real `mm`
 * (print, true on paper) or CSS `px` (screen, true once calibrated). Falls back
 * to a solid gold bar when the weave has no tile.
 */
export function ChainSilhouette({
  styleSlug,
  widthMm,
  pxPerMm,
  heightPx,
  heightCss,
  title,
}: {
  styleSlug: string | null;
  widthMm: number;
  /** If set, render width in CSS px (= widthMm × pxPerMm) for true on-screen size. */
  pxPerMm?: number | null;
  /** Window height in px (screen mode). */
  heightPx?: number;
  /** Window height for print/mm mode (default 90mm). */
  heightCss?: string;
  title?: string;
}) {
  const px = pxPerMm != null;
  const width = px ? `${widthMm * pxPerMm!}px` : `${widthMm}mm`;
  const height = px ? `${heightPx ?? 220}px` : heightCss ?? '90mm';

  const base: React.CSSProperties = {
    width,
    height,
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
          background: 'linear-gradient(90deg, #b8924a, #d4b478 50%, #8a6a32)',
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
        backgroundImage: `url(/images/silhouettes/tiles/${styleSlug}.png)`,
        backgroundRepeat: 'repeat-y',
        backgroundPosition: 'center bottom',
        backgroundSize: `${width} auto`,
      }}
    />
  );
}
