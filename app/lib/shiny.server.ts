/**
 * Fetches chain products from ShinyJewellers WPGraphQL API.
 * Normalizes data and calculates pricing from gold spot price.
 */
import {getGoldSpotPrice} from './gold.server';
import {KARAT_PURITY} from './gold';

const API_URL = 'https://shinyjewellers.com/api';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// The 4 chain categories we care about
export const CHAIN_CATEGORIES = ['cuban', 'box', 'curb', 'rope'] as const;
export type ChainCategory = (typeof CHAIN_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ChainCategory, string> = {
  cuban: 'Cuban Link',
  box: 'Box Chain',
  curb: 'Curb Chain',
  rope: 'Rope Chain',
};

export type ChainVariant = {
  id: string;
  name: string;
  sku: string;
  length: string;
  weight: number; // grams
  price: number; // calculated USD
  wirePrice: number; // 3% discount
};

export type ChainProduct = {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  sku: string;
  karat: number; // 10 or 14
  thickness: string;
  category: ChainCategory;
  isHollow: boolean;
  weight: number; // base weight in grams
  image: string;
  galleryImages: string[];
  variants: ChainVariant[];
  // Pricing (calculated)
  priceRange: {min: number; max: number};
  wirePriceRange: {min: number; max: number};
  goldPricePerGram: number;
  spotPerOz: number;
};

// Markup config
const MARKUP = 1.55; // 55% markup over material cost

let cache: {products: ChainProduct[]; timestamp: number} | null = null;

function parseKarat(name: string): number {
  if (/14\s*k/i.test(name) || /14\s*karat/i.test(name)) return 14;
  return 10; // default to 10K
}

function parseThickness(attrs: any[]): string {
  const thicknessAttr = attrs.find(
    (a: any) => a.name === 'Thickness' || a.name === 'pa_thickness',
  );
  if (thicknessAttr?.options?.[0]) return thicknessAttr.options[0];

  // Try to extract from name
  return '';
}

function parseIsHollow(name: string): boolean {
  return /hollow/i.test(name);
}

function parseCategory(cats: any[]): ChainCategory | null {
  for (const c of cats) {
    if (CHAIN_CATEGORIES.includes(c.slug as ChainCategory)) {
      return c.slug as ChainCategory;
    }
  }
  return null;
}

function parseLengthFromVariant(attrs: any[]): string {
  const lengthAttr = attrs.find((a: any) => a.name === 'pa_length');
  if (lengthAttr?.value) {
    return lengthAttr.value.replace(/-/g, ' ').replace('inch', '"').trim();
  }
  return '';
}

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

function normalizeProducts(
  rawProducts: any[],
  spotPerOz: number,
): ChainProduct[] {
  const products: ChainProduct[] = [];

  for (const raw of rawProducts) {
    const cats = raw.productCategories?.nodes || [];
    const category = parseCategory(cats);
    if (!category) continue;

    const karat = parseKarat(raw.name);
    const attrs = raw.attributes?.nodes || [];
    const thickness = parseThickness(attrs);
    const isHollow = parseIsHollow(raw.name);
    const baseWeight = parseFloat(raw.weight) || 0;
    const purity = KARAT_PURITY[karat] ?? 0.417;
    const goldPerGram = (spotPerOz / 31.1035) * purity;

    // Build variants from variations
    const rawVariations = raw.variations?.nodes || [];
    const variants: ChainVariant[] = [];

    if (rawVariations.length > 0) {
      for (const v of rawVariations) {
        const w = parseFloat(v.weight) || baseWeight;
        if (w <= 0) continue;
        const length = parseLengthFromVariant(v.attributes?.nodes || []);
        const price = calculatePrice(w, karat, spotPerOz);
        variants.push({
          id: v.id,
          name: v.name,
          sku: v.sku || '',
          length,
          weight: w,
          price,
          wirePrice: Math.round(price * 0.97),
        });
      }
    }

    // If no variants, create one from the base product
    if (variants.length === 0 && baseWeight > 0) {
      const price = calculatePrice(baseWeight, karat, spotPerOz);
      variants.push({
        id: raw.id,
        name: raw.name,
        sku: raw.sku || '',
        length: '',
        weight: baseWeight,
        price,
        wirePrice: Math.round(price * 0.97),
      });
    }

    if (variants.length === 0) continue;

    const prices = variants.map((v) => v.price);
    const wirePrices = variants.map((v) => v.wirePrice);

    products.push({
      id: raw.id,
      databaseId: raw.databaseId,
      name: raw.name,
      slug: raw.slug,
      sku: raw.sku || '',
      karat,
      thickness,
      category,
      isHollow,
      weight: baseWeight,
      image: raw.image?.sourceUrl || '',
      galleryImages: (raw.galleryImages?.nodes || []).map(
        (img: any) => img.sourceUrl,
      ),
      variants,
      priceRange: {min: Math.min(...prices), max: Math.max(...prices)},
      wirePriceRange: {
        min: Math.min(...wirePrices),
        max: Math.max(...wirePrices),
      },
      goldPricePerGram: +goldPerGram.toFixed(2),
      spotPerOz: +spotPerOz.toFixed(2),
    });
  }

  // Sort: solid before hollow, then by price ascending
  products.sort((a, b) => {
    if (a.category !== b.category) return 0;
    if (a.isHollow !== b.isHollow) return a.isHollow ? 1 : -1;
    return a.priceRange.min - b.priceRange.min;
  });

  return products;
}

export async function getChainProducts(): Promise<ChainProduct[]> {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.products;
  }

  try {
    const [rawProducts, spotPerOz] = await Promise.all([
      fetchAllProducts(),
      getGoldSpotPrice(),
    ]);

    // Fallback spot price if API fails
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

export function getCategories(): {
  slug: ChainCategory;
  label: string;
}[] {
  return CHAIN_CATEGORIES.map((slug) => ({
    slug,
    label: CATEGORY_LABELS[slug],
  }));
}
