export const STYX = {
  bone: '#EBEBE8',
  paper: '#F4F4F2',
  parchment: '#E4E4E1',
  ink: '#1A1B1C',
  graphite: '#2B2C2D',
  silt: '#2B2C2D',
  silt2: '#3B3C3D',
  gold: '#A8925C',
  goldDeep: '#7D6A3F',
  goldLight: '#CDB77F',
  taupe: '#5C4F33',
  taupeDeep: '#3F3627',
  taupeLight: '#7D6A3F',
  line: 'rgba(26,27,28,0.12)',
  lineSoft: 'rgba(26,27,28,0.06)',
} as const;

export type CollectionNode = {
  id: string;
  title: string;
  handle: string;
  description?: string;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  /** custom.cutout_image metafield, transparent chain PNG (mega menu, weave strip) */
  cutout?: {
    reference?: {
      image?: {url: string} | null;
    } | null;
  } | null;
};

/** Cutout PNG URL for a collection, if set in Shopify (custom.cutout_image).
 * Always request a resized variant, the originals are 100–300 KB PNGs, and
 * Shopify's CDN serves a ~20 KB AVIF/WebP once a `width` param is present.
 * 400px covers the largest rendered size (mega-menu card ≈ 130–200 CSS px)
 * at 2–3× DPR. */
export function collectionCutoutUrl(
  c?: CollectionNode | null,
  width = 400,
): string | undefined {
  const url = c?.cutout?.reference?.image?.url;
  if (!url) return undefined;
  return `${url}${url.includes('?') ? '&' : '?'}width=${width}`;
}

export const FONT = {
  cinzel: "'Cinzel', serif",
  cormorant: "'Cormorant Garamond', serif",
  inter: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;
