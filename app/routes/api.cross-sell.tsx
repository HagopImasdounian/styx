import {data, type LoaderFunctionArgs} from 'react-router';
import type {Storefront} from '@shopify/hydrogen';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';

import {CACHE_SHORT, routeHeaders} from '~/data/cache';

export const headers = routeHeaders;

/**
 * GET /api/cross-sell?handle=<product-handle>
 *
 * Returns the strict counterpart piece for a product — same weave, same
 * width, same karat, opposite product type (chain <-> bracelet) — or null.
 *
 * The matching logic mirrors getCrossSellProducts in
 * ($locale).products.$productHandle.tsx (the PDP's "Pairs Well With"
 * module). The strictness is deliberate brand policy: a 3mm rope chain
 * pairs with the 3mm rope bracelet, or with nothing at all. `null` is a
 * correct and common answer.
 */

export type CrossSellCounterpart = {
  handle: string;
  title: string;
  image: {url: string; altText: string | null} | null;
  price: {amount: string; currencyCode: CurrencyCode};
  available: boolean;
};

export type CrossSellResponse = {product: CrossSellCounterpart | null};

const HANDLE_RE = /^[a-z0-9-]+$/;

export async function loader({
  request,
  context: {storefront},
}: LoaderFunctionArgs) {
  const handle = new URL(request.url).searchParams.get('handle') ?? '';

  if (!HANDLE_RE.test(handle)) {
    return data(
      {error: 'Invalid handle'},
      {status: 400, headers: {'Cache-Control': 'no-store'}},
    );
  }

  try {
    const counterpart = await findCounterpart(storefront, handle);
    return data<CrossSellResponse>(
      {product: counterpart},
      {headers: {'Cache-Control': CACHE_SHORT}},
    );
  } catch {
    // The upsell is an enhancement — never surface a Storefront hiccup.
    return data<CrossSellResponse>(
      {product: null},
      {headers: {'Cache-Control': 'no-store'}},
    );
  }
}

async function findCounterpart(
  storefront: Storefront,
  handle: string,
): Promise<CrossSellCounterpart | null> {
  const i18n = {
    country: storefront.i18n.country,
    language: storefront.i18n.language,
  };

  const {product} = (await storefront.query(SOURCE_PRODUCT_QUERY, {
    variables: {handle, ...i18n},
    cache: storefront.CacheShort(),
  })) as {product: any};

  if (!product?.id) return null;

  const styleTitle = (product.title as string) || '';
  const myTags = (product.tags ?? []) as string[];
  const style = parseStyle(product.chain_style?.value, myTags, styleTitle);
  const construction = parseConstruction(
    product.chain_construction?.value,
    myTags,
    styleTitle,
  );
  const myType = normalize(product.productType); // "chain" | "bracelet"
  const myMm = parseMm(product.chain_thickness?.value) ?? parseMm(styleTitle);
  const myKarat = parseKarat(product.karat?.value, styleTitle);

  // Without a known style, width, and karat we can't guarantee a true
  // counterpart — suggest nothing rather than something unrelated.
  if (!style || myMm == null || myKarat == null) return null;
  if (myType !== 'chain' && myType !== 'bracelet') return null;

  const pairType = myType === 'chain' ? 'Bracelet' : 'Chain';
  // The weave is stored as a product tag (e.g. "Cuban Link").
  const query = `tag:'${style}' AND product_type:${pairType}`;

  const result = (await storefront.query(COUNTERPART_QUERY, {
    variables: {query, count: 30, ...i18n},
    cache: storefront.CacheShort(),
  })) as any;

  const myStyle = normalize(style);

  const matches = (result?.products?.nodes ?? [])
    .filter((c: any) => {
      if (!c?.id || c.id === product.id) return false;
      if (normalize(c.productType) !== normalize(pairType)) return false;
      const cStyle = normalize(parseStyle(c.chain_style?.value, c.tags, c.title));
      if (cStyle !== myStyle) return false;
      const cMm = parseMm(c.chain_thickness?.value) ?? parseMm(c.title);
      // Titles round to the nearest 0.5mm — absorb that, but never let a
      // genuinely different width (0.5mm+ apart) through.
      if (cMm == null || Math.abs(cMm - myMm) > 0.25) return false;
      const cKarat = parseKarat(c.chain_karat?.value, c.title);
      if (cKarat == null || cKarat !== myKarat) return false;
      return true;
    })
    // Prefer same construction (hollow/solid) and in-stock counterparts.
    .sort((a: any, b: any) => {
      const conScore = (c: any) =>
        construction &&
        parseConstruction(c.chain_construction?.value, c.tags, c.title) ===
          construction
          ? 1
          : 0;
      const stockScore = (c: any) =>
        (c.variants?.nodes ?? []).some((v: any) => v.availableForSale) ? 1 : 0;
      return conScore(b) - conScore(a) || stockScore(b) - stockScore(a);
    });

  const top = matches[0];
  if (!top) return null;

  return {
    handle: top.handle,
    title: top.title,
    image: top.featuredImage
      ? {url: top.featuredImage.url, altText: top.featuredImage.altText ?? null}
      : null,
    price: {
      amount: top.priceRange?.minVariantPrice?.amount ?? '0',
      currencyCode: (top.priceRange?.minVariantPrice?.currencyCode ??
        'USD') as CurrencyCode,
    },
    available: (top.variants?.nodes ?? []).some(
      (v: any) => v.availableForSale,
    ),
  };
}

/* ─────────── Matching helpers — kept in lockstep with the PDP ─────────── */

/** Parse first mm number out of a thickness string or title. */
function parseMm(value?: string | null): number | null {
  if (!value) return null;
  const m =
    value.match(/(\d+(?:\.\d+)?)\s*mm/i) ?? value.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

function normalize(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

/** Parse karat from a metafield value or product title (e.g. "10K 3mm Rope Chain" → 10). */
function parseKarat(value?: string | null, title?: string | null): number | null {
  const fromValue = value ? parseInt(value, 10) : NaN;
  if (!Number.isNaN(fromValue) && fromValue > 0) return fromValue;
  const m = (title ?? '').match(/(\d{2})\s*k/i);
  return m ? parseInt(m[1], 10) : null;
}

// Longer names first so "Cuban Link" wins before any shorter substring could.
const CHAIN_STYLE_NAMES = [
  'Cuban Link', 'Herringbone', 'Singapore', 'Paperclip', 'Figaro',
  'Franco', 'Wheat', 'Curb', 'Rope', 'Cable', 'Rolo', 'Snake', 'Box',
];

/**
 * Derive the weave/style. Most products have no chain.* metafields, so fall
 * back to tags (e.g. "Cuban Link") and then the title.
 */
function parseStyle(
  metaValue?: string | null,
  tags?: string[] | null,
  title?: string | null,
): string | null {
  if (metaValue) return metaValue;
  const tagHit = (tags ?? []).find((t) =>
    CHAIN_STYLE_NAMES.some((s) => normalize(t) === normalize(s)),
  );
  if (tagHit) return tagHit;
  const hay = normalize(title);
  return CHAIN_STYLE_NAMES.find((s) => hay.includes(normalize(s))) ?? null;
}

/** Derive hollow/solid from metafield, tags, or title. */
function parseConstruction(
  metaValue?: string | null,
  tags?: string[] | null,
  title?: string | null,
): string {
  const v = normalize(metaValue);
  if (v) return v;
  const hay = `${normalize(title)} ${(tags ?? []).map(normalize).join(' ')}`;
  if (hay.includes('hollow')) return 'hollow';
  if (hay.includes('solid')) return 'solid';
  return '';
}

/* ────────────────────────────── Queries ────────────────────────────── */

const SOURCE_PRODUCT_QUERY = `#graphql
  query crossSellSourceProduct(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      productType
      tags
      chain_style: metafield(namespace: "chain", key: "chain_style") {
        value
      }
      chain_thickness: metafield(namespace: "chain", key: "thickness") {
        value
      }
      chain_construction: metafield(namespace: "chain", key: "construction") {
        value
      }
      karat: metafield(namespace: "chain", key: "karat") {
        value
      }
    }
  }
` as const;

const COUNTERPART_QUERY = `#graphql
  query crossSellCounterparts(
    $query: String!
    $count: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: $count, query: $query) {
      nodes {
        id
        title
        handle
        productType
        tags
        featuredImage {
          url
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        chain_style: metafield(namespace: "chain", key: "chain_style") {
          value
        }
        chain_thickness: metafield(namespace: "chain", key: "thickness") {
          value
        }
        chain_construction: metafield(namespace: "chain", key: "construction") {
          value
        }
        chain_karat: metafield(namespace: "chain", key: "karat") {
          value
        }
        variants(first: 20) {
          nodes {
            availableForSale
          }
        }
      }
    }
  }
` as const;

// Resource route — intentionally no default export so GET requests return
// the loader's JSON directly instead of a rendered HTML document.
