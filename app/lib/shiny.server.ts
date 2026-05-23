/**
 * Fetches chain products from ShinyJewellers WPGraphQL API.
 * Normalizes data, separates bracelets, estimates per-length weights,
 * and calculates pricing from gold spot price.
 */
import {getGoldSpotPrice} from './gold.server';
import {KARAT_PURITY} from './gold';

const API_URL = 'https://shinyjewellers.com/api';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Product types: chains (necklaces) and bracelets are separate
export const CHAIN_CATEGORIES = [
  'cuban',
  'box',
  'curb',
  'rope',
  'bracelet',
] as const;
export type ChainCategory = (typeof CHAIN_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ChainCategory, string> = {
  cuban: 'Cuban Link',
  box: 'Box Chain',
  curb: 'Curb Chain',
  rope: 'Rope Chain',
  bracelet: 'Bracelet',
};

// Bracelet lengths — any variant with these lengths gets separated
const BRACELET_LENGTHS = new Set(['7', '7.5', '8.5']);

function isBraceletLength(length: string): boolean {
  // Match "7", "7.5", "8.5" or variants like "7-inch", "8-5-inch", "7.5 INCH"
  const cleaned = length
    .replace(/["-]/g, ' ')
    .replace(/inch/i, '')
    .trim()
    .replace(/\s+/g, '.');
  return BRACELET_LENGTHS.has(cleaned);
}

function isBraceletSku(sku: string): boolean {
  return /\bBR\b/i.test(sku);
}

export type ChainVariant = {
  id: string;
  name: string;
  sku: string;
  length: string; // e.g. "20" or "8.5" (inches, no suffix)
  weight: number; // grams
  price: number; // calculated USD
  wirePrice: number; // 3% discount
  color: string; // "yellow", "white", "rose", or ""
};

export type ChainProduct = {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  sku: string;
  karat: number; // 10 or 14
  thickness: string; // e.g. "5.3mm"
  category: ChainCategory;
  chainStyle: string; // e.g. "cuban", "concave-curb", "beveled-curb", "marine", "box", "rope"
  isHollow: boolean;
  weight: number; // base weight in grams (from API)
  image: string;
  galleryImages: string[];
  variants: ChainVariant[];
  priceRange: {min: number; max: number};
  wirePriceRange: {min: number; max: number};
  goldPricePerGram: number;
  spotPerOz: number;
};

// Markup config
const MARKUP = 1.55; // 55% markup over material cost

let cache: {products: ChainProduct[]; timestamp: number} | null = null;

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function parseKarat(name: string): number {
  if (/14\s*k/i.test(name) || /14\s*karat/i.test(name)) return 14;
  return 10;
}

function parseThicknessFromName(name: string): string {
  // Extract "5.3mm", "0.85mm", etc from product name
  const m = name.match(/(\d+\.?\d*)\s*mm/i);
  return m ? `${m[1]}mm` : '';
}

function parseThickness(name: string, attrs: any[]): string {
  // Try attributes first, but name is often more accurate
  const fromName = parseThicknessFromName(name);
  if (fromName) return fromName;

  const thicknessAttr = attrs.find(
    (a: any) =>
      a.name === 'Thickness' ||
      a.name === 'pa_thickness' ||
      a.name === 'Width',
  );
  if (thicknessAttr?.options?.[0]) return thicknessAttr.options[0];
  return '';
}

function parseIsHollow(name: string): boolean {
  return /hollow/i.test(name);
}

/** Classify the sub-style for curb variants (concave, beveled, marine, etc.) */
function parseChainStyle(name: string, category: string): string {
  const lower = name.toLowerCase();
  if (/concave\s*curb/i.test(lower)) return 'concave-curb';
  if (/beveled?\s*curb/i.test(lower)) return 'beveled-curb';
  if (/marine/i.test(lower)) return 'marine';
  if (/cuban/i.test(lower)) return 'cuban';
  if (/rope/i.test(lower)) return 'rope';
  if (/box/i.test(lower)) return 'box';
  return category; // fallback to category slug
}

function parseSourceCategory(cats: any[]): string | null {
  const validCats = ['cuban', 'box', 'curb', 'rope'];
  for (const c of cats) {
    if (validCats.includes(c.slug)) return c.slug;
  }
  return null;
}

/** Normalize length string to a clean number like "20", "22", "8.5" */
function normalizeLength(raw: string): string {
  return raw
    .replace(/-/g, '.')
    .replace(/inch/gi, '')
    .replace(/"/g, '')
    .replace(/\+\s*\d+/g, '') // remove "+2" adjustable suffixes
    .replace(/with.*$/i, '') // remove "with loop at 18 for adjustability"
    .trim();
}

function parseLengthFromVariant(attrs: any[]): string {
  const lengthAttr = attrs.find((a: any) => a.name === 'pa_length');
  if (lengthAttr?.value) return normalizeLength(lengthAttr.value);
  return '';
}

function parseColorFromVariant(attrs: any[]): string {
  const colorAttr = attrs.find(
    (a: any) => a.name === 'pa_colour-choices' || a.name === 'pa_color',
  );
  if (!colorAttr?.value) return '';
  const val = colorAttr.value.toLowerCase().replace(/-/g, ' ');
  if (val.includes('white')) return 'white';
  if (val.includes('rose')) return 'rose';
  if (val.includes('yellow')) return 'yellow';
  return val;
}

/** Build a normalized SKU: "{baseSKU} - {length}" */
function buildVariantSku(
  baseSku: string,
  length: string,
  color: string,
): string {
  // Some products already have a color-specific base SKU embedded in the variant
  // We just need to ensure the length suffix is consistent
  const cleanBase = baseSku
    .replace(/\s*[-/]\s*\d+["']?\s*$/, '') // strip existing length suffix
    .replace(/\s*[-/]\s*BR\s*$/i, '') // strip bracelet suffix
    .replace(/\s+BR\s*$/i, '') // strip "BR" without separator
    .trim();
  if (!length) return cleanBase;

  const isBracelet = isBraceletLength(length);
  return isBracelet ? `${cleanBase} - BR` : `${cleanBase} - ${length}"`;
}

// ---------------------------------------------------------------------------
// Weight estimation
// ---------------------------------------------------------------------------

/**
 * Estimate weight for a specific length given a base weight and its reference length.
 * Weight scales roughly linearly with length for the same chain style.
 */
function estimateWeight(
  baseWeight: number,
  baseLength: number,
  targetLength: number,
): number {
  if (baseLength <= 0 || baseWeight <= 0) return baseWeight;
  return +(baseWeight * (targetLength / baseLength)).toFixed(2);
}

/**
 * Guess the "reference length" that the base weight corresponds to.
 * For most ShinyJewellers products, it's the first/shortest necklace length.
 */
function guessReferenceLength(lengths: number[]): number {
  const necklaceLengths = lengths.filter((l) => l >= 14);
  if (necklaceLengths.length === 0) return lengths[0] || 20;
  return Math.min(...necklaceLengths);
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

function calculatePrice(
  weightGrams: number,
  karat: number,
  spotPerOz: number,
): number {
  const purity = KARAT_PURITY[karat] ?? 0.417;
  const goldPerGram = (spotPerOz / 31.1035) * purity;
  const materialCost = goldPerGram * weightGrams;
  return Math.round(materialCost * MARKUP);
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const PRODUCTS_QUERY = `
  query ChainProducts($after: String) {
    products(first: 50, after: $after, where: {categoryIn: ["cuban", "box", "curb", "rope"]}) {
      nodes {
        ... on SimpleProduct {
          id databaseId name slug sku
          shortDescription(format: RAW)
          image { sourceUrl }
          galleryImages { nodes { sourceUrl } }
          productCategories { nodes { name slug } }
          attributes { nodes { name options } }
          weight
        }
        ... on VariableProduct {
          id databaseId name slug sku
          shortDescription(format: RAW)
          image { sourceUrl }
          galleryImages { nodes { sourceUrl } }
          productCategories { nodes { name slug } }
          attributes { nodes { name options } }
          weight
          variations(first: 50) {
            nodes {
              id databaseId name sku weight
              attributes { nodes { name value } }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

async function fetchAllProducts(): Promise<any[]> {
  const allNodes: any[] = [];
  let after: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        query: PRODUCTS_QUERY,
        variables: {after},
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`ShinyJewellers API error: ${res.status}`);

    const json: any = await res.json();
    const products = json?.data?.products;
    if (!products) break;

    allNodes.push(...products.nodes);
    hasNext = products.pageInfo.hasNextPage;
    after = products.pageInfo.endCursor;
  }

  return allNodes;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalizeProducts(
  rawProducts: any[],
  spotPerOz: number,
): ChainProduct[] {
  const necklaces: ChainProduct[] = [];
  const bracelets: ChainProduct[] = [];

  for (const raw of rawProducts) {
    const cats = (raw.productCategories?.nodes || []) as any[];
    const sourceCategory = parseSourceCategory(cats);
    if (!sourceCategory) continue;

    const karat = parseKarat(raw.name);
    const attrs = (raw.attributes?.nodes || []) as any[];
    const thickness = parseThickness(raw.name, attrs);
    const isHollow = parseIsHollow(raw.name);
    const chainStyle = parseChainStyle(raw.name, sourceCategory);
    const baseWeight = parseFloat(raw.weight) || 0;
    const purity = KARAT_PURITY[karat] ?? 0.417;
    const goldPerGram = (spotPerOz / 31.1035) * purity;

    // Collect all variants from the API
    const rawVariations = (raw.variations?.nodes || []) as any[];

    // Parse all variant data first to separate necklaces vs bracelets
    type ParsedVariant = {
      id: string;
      name: string;
      rawSku: string;
      length: string;
      lengthNum: number;
      weight: number;
      color: string;
      isBracelet: boolean;
    };

    const parsed: ParsedVariant[] = [];

    if (rawVariations.length > 0) {
      for (const v of rawVariations) {
        const vAttrs = (v.attributes?.nodes || []) as any[];
        const length = parseLengthFromVariant(vAttrs);
        const color = parseColorFromVariant(vAttrs);
        const w = parseFloat(v.weight) || baseWeight;
        const lengthNum = parseFloat(length) || 0;
        const sku = v.sku || '';
        const bracelet = isBraceletLength(length) || isBraceletSku(sku);

        if (w <= 0 && baseWeight <= 0) continue;

        parsed.push({
          id: v.id,
          name: v.name || raw.name,
          rawSku: sku,
          length,
          lengthNum,
          weight: w > 0 ? w : baseWeight,
          color,
          isBracelet: bracelet,
        });
      }
    } else if (baseWeight > 0) {
      // Simple product — single variant
      const sku = raw.sku || '';
      // Check if the whole product is a bracelet
      const bracelet =
        isBraceletSku(sku) || /bracelet/i.test(raw.name || '');
      const lengthAttr = attrs.find(
        (a: any) => a.name === 'pa_length' || a.name === 'Length',
      );
      let length = '';
      if (lengthAttr?.options?.[0]) {
        length = normalizeLength(lengthAttr.options[0]);
      }

      parsed.push({
        id: raw.id,
        name: raw.name,
        rawSku: sku,
        length,
        lengthNum: parseFloat(length) || 0,
        weight: baseWeight,
        color: '',
        isBracelet: bracelet,
      });
    }

    if (parsed.length === 0) continue;

    // Split into necklace and bracelet groups
    const necklaceVariants = parsed.filter((p) => !p.isBracelet);
    const braceletVariants = parsed.filter((p) => p.isBracelet);

    // Estimate per-length weights for necklaces
    const necklaceLengths = necklaceVariants
      .map((v) => v.lengthNum)
      .filter((l) => l > 0);
    const refLength =
      necklaceLengths.length > 0 ? guessReferenceLength(necklaceLengths) : 0;

    // Check if the API actually has different weights per variant
    const uniqueWeights = new Set(necklaceVariants.map((v) => v.weight));
    const hasPerVariantWeights = uniqueWeights.size > 1;

    const buildProduct = (
      variants: ParsedVariant[],
      category: ChainCategory,
    ): ChainProduct | null => {
      if (variants.length === 0) return null;

      const builtVariants: ChainVariant[] = [];

      for (const v of variants) {
        let weight = v.weight;

        // Estimate weight by length if all variants share the same weight
        if (
          !hasPerVariantWeights &&
          refLength > 0 &&
          v.lengthNum > 0 &&
          v.lengthNum !== refLength
        ) {
          weight = estimateWeight(baseWeight, refLength, v.lengthNum);
        }

        const sku = buildVariantSku(
          v.rawSku || raw.sku || '',
          v.length,
          v.color,
        );
        const price = calculatePrice(weight, karat, spotPerOz);

        builtVariants.push({
          id: v.id,
          name: v.name,
          sku,
          length: v.length,
          weight,
          price,
          wirePrice: Math.round(price * 0.97),
          color: v.color,
        });
      }

      if (builtVariants.length === 0) return null;

      const prices = builtVariants.map((v) => v.price);
      const wirePrices = builtVariants.map((v) => v.wirePrice);

      return {
        id: raw.id,
        databaseId: raw.databaseId,
        name: raw.name,
        slug: raw.slug,
        sku: raw.sku || '',
        karat,
        thickness,
        category,
        chainStyle,
        isHollow,
        weight: baseWeight,
        image: raw.image?.sourceUrl || '',
        galleryImages: (raw.galleryImages?.nodes || []).map(
          (img: any) => img.sourceUrl,
        ),
        variants: builtVariants,
        priceRange: {min: Math.min(...prices), max: Math.max(...prices)},
        wirePriceRange: {
          min: Math.min(...wirePrices),
          max: Math.max(...wirePrices),
        },
        goldPricePerGram: +goldPerGram.toFixed(2),
        spotPerOz: +spotPerOz.toFixed(2),
      };
    }

    // Build necklace product
    const necklace = buildProduct(necklaceVariants, sourceCategory as ChainCategory);
    if (necklace) necklaces.push(necklace);

    // Build bracelet product (separate)
    const bracelet = buildProduct(braceletVariants, 'bracelet');
    if (bracelet) {
      // Override the name to make it clear it's a bracelet
      bracelet.name = bracelet.name.replace(/chain/gi, '').trim() + ' Bracelet';
      bracelets.push(bracelet);
    }
  }

  const allProducts = [...necklaces, ...bracelets];

  // Sort: solid before hollow, then by price ascending within category
  allProducts.sort((a, b) => {
    // Group by category first
    const catOrder = CHAIN_CATEGORIES.indexOf(a.category) - CHAIN_CATEGORIES.indexOf(b.category);
    if (catOrder !== 0) return catOrder;
    // Solid before hollow
    if (a.isHollow !== b.isHollow) return a.isHollow ? 1 : -1;
    // Price ascending
    return a.priceRange.min - b.priceRange.min;
  });

  return allProducts;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getChainProducts(): Promise<ChainProduct[]> {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.products;
  }

  try {
    const [rawProducts, spotPerOz] = await Promise.all([
      fetchAllProducts(),
      getGoldSpotPrice(),
    ]);

    const spot = spotPerOz ?? 3300;
    const products = normalizeProducts(rawProducts, spot);

    cache = {products, timestamp: Date.now()};
    return products;
  } catch (err) {
    console.error('Failed to fetch chain products:', err);
    if (cache) return cache.products;
    return [];
  }
}

export async function getChainProductBySlug(
  slug: string,
): Promise<ChainProduct | null> {
  const products = await getChainProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getChainProductsByCategory(
  category: ChainCategory,
): Promise<ChainProduct[]> {
  const products = await getChainProducts();
  return products.filter((p) => p.category === category);
}

/** Get only necklace categories (no bracelets) */
export async function getNecklaceProducts(): Promise<ChainProduct[]> {
  const products = await getChainProducts();
  return products.filter((p) => p.category !== 'bracelet');
}

/** Get only bracelet products */
export async function getBraceletProducts(): Promise<ChainProduct[]> {
  const products = await getChainProducts();
  return products.filter((p) => p.category === 'bracelet');
}

export function getCategories(): {
  slug: ChainCategory;
  label: string;
}[] {
  return CHAIN_CATEGORIES.map((slug) => ({
    slug,
    label: CATEGORY_LABELS[slug],
  }));
}

export function getNecklaceCategories(): {
  slug: ChainCategory;
  label: string;
}[] {
  return CHAIN_CATEGORIES.filter((s) => s !== 'bracelet').map((slug) => ({
    slug,
    label: CATEGORY_LABELS[slug],
  }));
}
