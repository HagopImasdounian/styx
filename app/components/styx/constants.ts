export const STYX = {
  bone: '#EFEAE0',
  paper: '#F5F2EA',
  parchment: '#E8E1D2',
  ink: '#1A1815',
  graphite: '#2D2A24',
  silt: '#4A443B',
  silt2: '#6B6459',
  gold: '#B8924A',
  goldDeep: '#8A6A32',
  goldLight: '#D4B478',
  taupe: '#6B4423',
  taupeDeep: '#4A2E18',
  taupeLight: '#8B5E3C',
  line: 'rgba(26,24,21,0.12)',
  lineSoft: 'rgba(26,24,21,0.06)',
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
  /** custom.cutout_image metafield — transparent chain PNG (mega menu, weave strip) */
  cutout?: {
    reference?: {
      image?: {url: string} | null;
    } | null;
  } | null;
};

/** Cutout PNG URL for a collection, if set in Shopify (custom.cutout_image).
 * Always request a resized variant — the originals are 100–300 KB PNGs, and
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
