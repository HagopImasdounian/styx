/**
 * Estimate a screen's true physical pixel density — CSS px per physical
 * millimetre — WITHOUT asking the shopper to do anything.
 *
 * The card-calibration overlay is exact but high-friction. For most visitors we
 * can get within a few percent automatically from the device's own metrics, so
 * "See It At Actual Size" can just work on load; the card stays as an optional
 * way to validate / fine-tune (e.g. on desktop, where physical size is genuinely
 * unknowable from the browser).
 *
 * The maths
 * ─────────
 *   pxPerMm = PPI / (devicePixelRatio × 25.4)
 *
 * because  physical mm = physicalPixels / PPI × 25.4   and
 *          CSS px      = physicalPixels / devicePixelRatio.
 *
 * So the whole job is inferring the device's real PPI:
 *   • Android — Chrome derives devicePixelRatio from a 160-dpi baseline, so one
 *     CSS px ≈ 1/160 inch on essentially every Android. pxPerMm ≈ 6.30, flat.
 *   • iPhone  — a small, fixed catalogue. Nearly all Face-ID models are ~459 PPI
 *     at DPR 3; classic 4.7"/XR are 326 at DPR 2. A tiny table nails it.
 *   • iPad    — ~264 PPI (DPR 2); a couple of minis at 326.
 *   • Mac Retina / desktop — progressively less certain; the monitor's real DPI
 *     can't be read, so we return a best-guess at low confidence and lean on the
 *     card. (Plain DPR-1 desktops fall back to the CSS-spec 96 dpi.)
 */

const MM_PER_IN = 25.4;
const ppmm = (ppi: number, dpr: number) => ppi / (dpr * MM_PER_IN);

export type ScaleConfidence = 'high' | 'medium' | 'low';

export type ScaleEstimate = {
  pxPerMm: number;
  dpr: number;
  confidence: ScaleConfidence;
  /** Short, human label of how we got it — handy for debugging / copy. */
  basis: string;
};

/**
 * iPhone PPI keyed by `${shortCssEdge}x${dpr}` (short edge = the smaller of the
 * two logical screen dimensions, so it's orientation-independent). Covers the
 * outliers that differ from the DPR heuristic; everything else falls through to
 * the heuristic below, which is correct for the bulk of the line-up.
 */
const IPHONE_PPI: Record<string, number> = {
  // Classic 4.7" Touch-ID (6/7/8/SE2/SE3) and 5/5S/SE1 — 326 @ DPR2.
  '320x2': 326,
  '375x2': 326,
  // XR / 11 — 6.1" LCD, 326 @ DPR2.
  '414x2': 326,
  // mini (12 mini / 13 mini) — unusually dense, 476 @ DPR3.
  '360x3': 476,
  // Plus LCD (6+/7+/8+) — downsampled, ~401 @ DPR3.
  '414x3': 401,
};

function isProbablyIPad(): boolean {
  const ua = navigator.userAgent || '';
  if (/iPad/.test(ua)) return true;
  // iPadOS 13+ reports as a Mac but exposes touch points.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

/**
 * Best-effort physical CSS-px-per-mm for the current device, or null on the
 * server. Always returns *something* on a real browser; `confidence` says how
 * much to trust it.
 */
export function estimatePxPerMm(): ScaleEstimate | null {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return null;
  }

  const dpr = window.devicePixelRatio || 1;
  const ua = navigator.userAgent || '';
  const w = window.screen?.width ?? 0;
  const h = window.screen?.height ?? 0;
  const shortEdge = Math.min(w, h);

  const isIPhone = /iPhone|iPod/.test(ua);
  const isIPad = isProbablyIPad();
  const isAndroid = /Android/.test(ua);
  const isTouch = navigator.maxTouchPoints > 0;

  // ── iPhone: table first, then a DPR heuristic that fits the rest. ──
  if (isIPhone) {
    const keyed = IPHONE_PPI[`${shortEdge}x${Math.round(dpr)}`];
    if (keyed) {
      return {pxPerMm: ppmm(keyed, dpr), dpr, confidence: 'high', basis: 'iphone-model'};
    }
    // Modern Face-ID iPhones cluster tightly at ~459 PPI @ DPR3; older 2× LCDs
    // at 326. Either way the heuristic lands within ~1% of the true model.
    const ppi = dpr >= 2.5 ? 459 : 326;
    return {pxPerMm: ppmm(ppi, dpr), dpr, confidence: 'high', basis: 'iphone-dpr'};
  }

  // ── iPad: 264 PPI for the mainstream sizes, 326 for the (DPR2) minis. ──
  if (isIPad) {
    // iPad mini renders a narrower CSS width (744–768) than full-size iPads
    // (810–1024); use that to pick the denser panel.
    const ppi = shortEdge && shortEdge < 800 ? 326 : 264;
    return {pxPerMm: ppmm(ppi, dpr), dpr, confidence: 'medium', basis: 'ipad'};
  }

  // ── Android: CSS px is pinned to a 160-dpi baseline → ~6.30 px/mm flat. ──
  if (isAndroid) {
    return {pxPerMm: 160 / MM_PER_IN, dpr, confidence: 'medium', basis: 'android-160dpi'};
  }

  // ── Other touch devices (Windows tablets, etc.): treat like Android's
  //    density-independent baseline; it's the best general guess. ──
  if (isTouch && dpr > 1.25) {
    return {pxPerMm: 160 / MM_PER_IN, dpr, confidence: 'low', basis: 'touch-160dpi'};
  }

  // ── Retina Mac laptops: ~218–254 PPI at DPR2 → ~4.5–5.0 px/mm. We can't tell
  //    the exact model, so split the difference; low confidence, card refines. ──
  if (/Macintosh/.test(ua) && dpr >= 2) {
    return {pxPerMm: ppmm(232, dpr), dpr, confidence: 'low', basis: 'mac-retina'};
  }

  // ── Plain desktop: the monitor's real DPI is unknowable. Fall back to the
  //    CSS-spec 96 dpi (1 CSS px = 1/96 in). Often wrong — the card overlay is
  //    the honest fix here, which is why confidence is low. ──
  return {pxPerMm: 96 / MM_PER_IN, dpr, confidence: 'low', basis: 'css-default-96dpi'};
}
