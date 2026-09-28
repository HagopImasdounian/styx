/**
 * Listing-page facet model shared by the collection route, the quick-filter
 * pill row and the Filter & Sort drawer.
 *
 * All facets are applied CLIENT-SIDE over the complete collection set (the
 * Storefront API silently ignores productType / variantOption / metafield
 * filters on this store, only `filter.price` works server-side). Selection
 * state lives in the URL query string so it is shareable and survives reload:
 *
 *   ?type=Bracelet&color=Yellow%20Gold,White%20Gold&karat=14K
 *   &width=2–3mm&length=18,20&price=500-1500&construction=Solid
 *
 * Each key holds a comma-separated list (multi-select within a facet, AND
 * across facets). `color=all` is the sentinel that turns a metal collection's
 * preset color off.
 */

export type ListingCard = {product: any; variantIndex: number; key: string};

export const FACET_KEYS = [
  'type',
  'color',
  'karat',
  'width',
  'length',
  'price',
  'construction',
] as const;
export type FacetKey = (typeof FACET_KEYS)[number];
export type FacetSelection = Record<FacetKey, string[]>;

export const FACET_TITLES: Record<FacetKey, string> = {
  type: 'Type',
  color: 'Metal',
  karat: 'Karat',
  width: 'Width',
  length: 'Length',
  price: 'Price',
  construction: 'Build',
};

export const COLOR_HEX: Record<string, string> = {
  'Yellow Gold': '#C5A059',
  'Rose Gold': '#C08572',
  'White Gold': '#D4D2CC',
};

// Metal collections pre-select their color filter so e.g. /collections/white-gold
// opens showing only white-gold variants.
export const METAL_COLLECTION_COLOR: Record<string, string> = {
  'yellow-gold': 'Yellow Gold',
  'white-gold': 'White Gold',
  'rose-gold': 'Rose Gold',
};

// Thickness buckets. The label doubles as the URL value (legacy contract).
export const THICKNESS_RANGES = [
  {label: 'Under 1mm', min: 0, max: 1},
  {label: '1–2mm', min: 1, max: 2},
  {label: '2–3mm', min: 2, max: 3},
  {label: '3–5mm', min: 3, max: 5},
  {label: '5–8mm', min: 5, max: 8},
  {label: '8–10mm', min: 8, max: 10},
  {label: '10mm+', min: 10, max: 999},
];

// Price buckets over the card's "from" price (same figure the card shows).
export const PRICE_BUCKETS = [
  {value: 'under-500', label: 'Under $500', min: 0, max: 500},
  {value: '500-1500', label: '$500 to $1,500', min: 500, max: 1500},
  {value: '1500-5000', label: '$1,500 to $5,000', min: 1500, max: 5000},
  {value: '5000-plus', label: '$5,000+', min: 5000, max: Infinity},
];

export function emptySelection(): FacetSelection {
  return {
    type: [],
    color: [],
    karat: [],
    width: [],
    length: [],
    price: [],
    construction: [],
  };
}

/* ─── Per-card attribute readers ─── */

export function getThicknessMm(title: string): number | null {
  const m = title?.match(/(\d+(?:\.\d+)?)\s*mm/i);
  return m ? parseFloat(m[1]) : null;
}

export function thicknessLabel(mm: number | null): string | null {
  if (mm === null) return null;
  const r = THICKNESS_RANGES.find((r) => mm >= r.min && mm < r.max);
  return r ? r.label : null;
}

// Karat lives in the product title (separate products per karat, not a variant
// option), so parse it from there, falling back to a Karat variant option if
// one ever exists.
export function getKaratLabel(title: string): string | null {
  if (/18\s*k/i.test(title)) return '18K';
  if (/14\s*k/i.test(title)) return '14K';
  if (/10\s*k/i.test(title)) return '10K';
  return null;
}

export function cardKarat(product: any, variant: any): string | null {
  const opt = variant?.selectedOptions?.find((o: any) => o.name === 'Karat');
  if (opt?.value) {
    const m = String(opt.value).match(/(\d+)/);
    return m ? `${m[1]}K` : opt.value;
  }
  return getKaratLabel(product?.title || '');
}

// Normalize construction to a single canonical value so casing/whitespace
// differences ("solid" vs "Solid") don't create a phantom extra filter pill.
export function normalizeConstruction(product: any): string {
  const raw =
    product?.chain_construction?.value ||
    (/hollow/i.test(product?.title || '') ? 'Hollow' : 'Solid');
  const v = String(raw).trim().toLowerCase();
  if (v.includes('hollow')) return 'Hollow';
  if (v.includes('solid')) return 'Solid';
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Solid';
}

// A piece is a bracelet if its title says so (every bracelet in the catalog
// has "Bracelet" in the title; necklaces never do).
export function cardType(product: any): 'Necklace' | 'Bracelet' {
  return /bracelet/i.test(product?.title || '') ? 'Bracelet' : 'Necklace';
}

function cardVariant(card: ListingCard): any {
  return card.product?.variants?.nodes?.[card.variantIndex] ?? null;
}

export function cardColor(card: ListingCard): string | null {
  const variant = cardVariant(card);
  const opt = variant?.selectedOptions?.find(
    (o: any) => o.name?.toLowerCase() === 'color',
  );
  return opt?.value ?? null;
}

// Variants that belong to this card (same color, or every variant when the
// product has no Color option), the same set the product card prices from.
function cardVariants(card: ListingCard): any[] {
  const nodes: any[] = card.product?.variants?.nodes ?? [];
  const color = cardColor(card);
  if (!color) return nodes;
  return nodes.filter((v) =>
    v?.selectedOptions?.some(
      (o: any) => o.name?.toLowerCase() === 'color' && o.value === color,
    ),
  );
}

/** Length option value (`18"`, `8.5"`, `18 in`) to inches, or null. */
export function parseInches(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const m = String(value).match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function lengthValue(inches: number): string {
  return Number.isInteger(inches) ? String(inches) : String(inches);
}

export function lengthLabel(value: string): string {
  return `${value}"`;
}

/** Distinct lengths (in inches, as URL values) offered by this card.
 *  $0 variants are catalog errors and are not offered. */
export function cardLengths(card: ListingCard): string[] {
  const out = new Set<string>();
  for (const v of cardVariants(card)) {
    if (!(parseFloat(v?.price?.amount) > 0)) continue;
    for (const o of v?.selectedOptions ?? []) {
      if (o.name?.toLowerCase() !== 'length') continue;
      const n = parseInches(o.value);
      if (n !== null) out.add(lengthValue(n));
    }
  }
  return [...out];
}

/** The card's "from" price: lowest positive variant price for its color. */
export function cardMinPrice(card: ListingCard): number | null {
  let min: number | null = null;
  for (const v of cardVariants(card)) {
    const p = parseFloat(v?.price?.amount);
    if (!(p > 0)) continue; // $0 variants are catalog errors
    if (min === null || p < min) min = p;
  }
  return min;
}

export function priceBucketValue(price: number | null): string | null {
  if (price === null) return null;
  const b = PRICE_BUCKETS.find((b) => price >= b.min && price < b.max);
  return b ? b.value : null;
}

/** Every value this card carries for a facet (one, or several for length). */
export function cardFacetValues(card: ListingCard, key: FacetKey): string[] {
  const {product} = card;
  switch (key) {
    case 'type':
      return [cardType(product)];
    case 'color': {
      const c = cardColor(card);
      return c ? [c] : [];
    }
    case 'karat': {
      const k = cardKarat(product, cardVariant(card));
      return k ? [k] : [];
    }
    case 'width': {
      const l = thicknessLabel(getThicknessMm(product?.title || ''));
      return l ? [l] : [];
    }
    case 'length':
      return cardLengths(card);
    case 'price': {
      const b = priceBucketValue(cardMinPrice(card));
      return b ? [b] : [];
    }
    case 'construction':
      return [normalizeConstruction(product)];
  }
}

/* ─── Cards ─── */

/**
 * Explode products into per-color-variant cards.
 * If a product has Color options (Yellow Gold, Rose Gold, White Gold),
 * each color gets its own card so the customer sees every variation.
 * Products without a Color option render as a single card.
 */
export function explodeByColor(products: any[]): ListingCard[] {
  const cards: ListingCard[] = [];
  for (const product of products ?? []) {
    const variants = product.variants?.nodes ?? [];
    // Find all unique Color values and their first variant index
    const seenColors = new Map<string, number>();
    for (let i = 0; i < variants.length; i++) {
      const colorOpt = variants[i].selectedOptions?.find(
        (o: any) => o.name.toLowerCase() === 'color',
      );
      const color = colorOpt?.value || '__default__';
      if (!seenColors.has(color)) {
        seenColors.set(color, i);
      }
    }
    if (seenColors.size <= 1) {
      // No Color option or single color, one card
      cards.push({product, variantIndex: 0, key: product.id});
    } else {
      // One card per color
      for (const [color, idx] of seenColors) {
        cards.push({
          product,
          variantIndex: idx,
          key: `${product.id}-${color}`,
        });
      }
    }
  }
  return cards;
}

/* ─── Matching ─── */

export function matchesFacet(
  card: ListingCard,
  key: FacetKey,
  values: string[],
): boolean {
  if (!values || values.length === 0) return true;
  const have = cardFacetValues(card, key);
  return have.some((v) => values.includes(v));
}

export function applyFacets(
  cards: ListingCard[],
  selection: FacetSelection,
): ListingCard[] {
  const active = FACET_KEYS.filter((k) => selection[k]?.length);
  if (active.length === 0) return cards;
  return cards.filter((card) =>
    active.every((k) => matchesFacet(card, k, selection[k])),
  );
}

export function countActive(selection: FacetSelection): number {
  return FACET_KEYS.reduce((n, k) => n + (selection[k]?.length ?? 0), 0);
}

/* ─── Available options (display order) ─── */

export type FacetOption = {value: string; label: string; swatch?: string};
export type FacetOptions = Record<FacetKey, FacetOption[]>;

export function facetLabel(key: FacetKey, value: string): string {
  switch (key) {
    case 'type':
      return value === 'Necklace' ? 'Necklaces' : 'Bracelets';
    case 'length':
      return lengthLabel(value);
    case 'price':
      return PRICE_BUCKETS.find((b) => b.value === value)?.label ?? value;
    default:
      return value;
  }
}

export function facetOptions(cards: ListingCard[]): FacetOptions {
  const present: Record<FacetKey, Set<string>> = {
    type: new Set(),
    color: new Set(),
    karat: new Set(),
    width: new Set(),
    length: new Set(),
    price: new Set(),
    construction: new Set(),
  };
  for (const card of cards) {
    if (!cardVariant(card)) continue;
    for (const key of FACET_KEYS) {
      for (const v of cardFacetValues(card, key)) present[key].add(v);
    }
  }

  const opt = (key: FacetKey, value: string): FacetOption => ({
    value,
    label: facetLabel(key, value),
    swatch: key === 'color' ? COLOR_HEX[value] : undefined,
  });

  return {
    // Necklace first, Bracelet second, only those actually present
    type: ['Necklace', 'Bracelet']
      .filter((t) => present.type.has(t))
      .map((v) => opt('type', v)),
    color: [...present.color].sort().map((v) => opt('color', v)),
    karat: [...present.karat]
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((v) => opt('karat', v)),
    width: THICKNESS_RANGES.filter((r) => present.width.has(r.label)).map(
      (r) => opt('width', r.label),
    ),
    length: [...present.length]
      .sort((a, b) => parseFloat(a) - parseFloat(b))
      .map((v) => opt('length', v)),
    price: PRICE_BUCKETS.filter((b) => present.price.has(b.value)).map((b) =>
      opt('price', b.value),
    ),
    construction: [...present.construction]
      .sort()
      .map((v) => opt('construction', v)),
  };
}

/* ─── Live counts ─── */

export type FacetCounts = Record<FacetKey, Record<string, number>>;

/**
 * For every facet value: how many cards would match if that value were the
 * facet's only selection, given the OTHER facets' current selections.
 * (Standard disjunctive facet counting.)
 */
export function facetCounts(
  cards: ListingCard[],
  options: FacetOptions,
  selection: FacetSelection,
): FacetCounts {
  const counts = {} as FacetCounts;
  for (const key of FACET_KEYS) {
    // Cards that pass every facet except this one
    const others = FACET_KEYS.filter((k) => k !== key && selection[k]?.length);
    const base = others.length
      ? cards.filter((card) =>
          others.every((k) => matchesFacet(card, k, selection[k])),
        )
      : cards;
    const perValue: Record<string, number> = {};
    for (const o of options[key]) perValue[o.value] = 0;
    for (const card of base) {
      for (const v of cardFacetValues(card, key)) {
        if (v in perValue) perValue[v] += 1;
      }
    }
    counts[key] = perValue;
  }
  return counts;
}

/* ─── URL (de)serialization ─── */

const SEP = ',';

function splitValues(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(SEP)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Read the facet selection from the query string. `presetColor` is a metal
 * collection's default color; `color=all` explicitly switches it off.
 */
export function parseFacetSelection(
  searchParams: URLSearchParams,
  presetColor: string | null = null,
): FacetSelection {
  const sel = emptySelection();
  for (const key of FACET_KEYS) {
    if (key === 'color') continue;
    sel[key] = splitValues(searchParams.get(key)).filter((v) => v !== 'all');
  }
  const colorRaw = searchParams.get('color');
  if (colorRaw === 'all') sel.color = [];
  else if (colorRaw) sel.color = splitValues(colorRaw);
  else sel.color = presetColor ? [presetColor] : [];
  return sel;
}

/**
 * Write the selection back onto `params` (mutates and returns it). Pagination
 * cursors are dropped because the result set changes.
 */
export function writeFacetSelection(
  params: URLSearchParams,
  selection: FacetSelection,
  presetColor: string | null = null,
): URLSearchParams {
  for (const key of FACET_KEYS) {
    const values = selection[key] ?? [];
    if (key === 'color' && presetColor) {
      if (values.length === 0) params.set('color', 'all');
      else if (values.length === 1 && values[0] === presetColor)
        params.delete('color');
      else params.set('color', values.join(SEP));
      continue;
    }
    if (values.length) params.set(key, values.join(SEP));
    else params.delete(key);
  }
  params.delete('cursor');
  params.delete('direction');
  return params;
}

export function toggleFacetValue(
  selection: FacetSelection,
  key: FacetKey,
  value: string,
): FacetSelection {
  const current = selection[key] ?? [];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
  return {...selection, [key]: next};
}

export function isSelected(
  selection: FacetSelection,
  key: FacetKey,
  value: string,
): boolean {
  return (selection[key] ?? []).includes(value);
}

/** Flat list of active (facet, value) pairs for chip rows. */
export function activeFacetChips(
  selection: FacetSelection,
): Array<{key: FacetKey; value: string; label: string}> {
  const out: Array<{key: FacetKey; value: string; label: string}> = [];
  for (const key of FACET_KEYS) {
    for (const value of selection[key] ?? []) {
      out.push({key, value, label: facetLabel(key, value)});
    }
  }
  return out;
}
