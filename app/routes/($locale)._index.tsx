import {
  type MetaArgs,
  type LoaderFunctionArgs,
  type LinksFunction,
} from 'react-router';
import {data, useLoaderData} from 'react-router';

import {seoPayload} from '~/lib/seo.server';
import {getStyxSeoMeta} from '~/lib/seo-meta';
import {CACHE_SHORT, routeHeaders} from '~/data/cache';
import {CHAIN_FAMILIES, styleToSlug} from '~/lib/chains';
import {
  HIDDEN_ARTICLE_HANDLES,
  PLACEHOLDER_ARTICLES,
} from '~/data/journal-articles';

import {
  GoldTicker,
  StyxNav,
  HeroGallery,
  HomePillars,
  HomeHands,
  HomeChains,
  HomePriceLedger,
  FerrymansCode,
  HomeLore,
  HomeJournal,
  Newsletter,
  StyxFooter,
} from '~/components/styx';
import {collectionCutoutUrl} from '~/components/styx/constants';
import type {ChainTile, PriceSample, JournalTeaser} from '~/components/styx';
import {HERO_IMAGE, HERO_WIDTHS} from '~/components/styx/HeroGallery';

/** This route renders its own GoldTicker + StyxNav + StyxFooter. */
export const handle = {ownChrome: true};

export const headers = routeHeaders;

// Preload the hero (LCP) image from the document head so the browser starts
// fetching it alongside the CSS instead of waiting for the <img> in the body.
export const links: LinksFunction = () => [
  {
    rel: 'preload',
    as: 'image',
    href: `${HERO_IMAGE}&width=1600`,
    imageSrcSet: HERO_WIDTHS.map((w) => `${HERO_IMAGE}&width=${w} ${w}w`).join(
      ', ',
    ),
    imageSizes: '100vw',
    // React Router types don't know fetchpriority yet; it passes through to the tag.
    ...({fetchpriority: 'high'} as any),
  },
];

export async function loader(args: LoaderFunctionArgs) {
  const {params, context} = args;
  const {language, country} = context.storefront.i18n;

  if (
    params.locale &&
    params.locale.toLowerCase() !== `${language}-${country}`.toLowerCase()
  ) {
    throw new Response(null, {status: 404});
  }

  const criticalData = await loadCriticalData(args);
  const deferredData = loadDeferredData(args);

  return data(
    {...deferredData, ...criticalData},
    {headers: {'Cache-Control': CACHE_SHORT}},
  );
}

async function loadCriticalData({context, request}: LoaderFunctionArgs) {
  const [{shop}, {products}, {collections}] = await Promise.all([
    context.storefront.query(HOMEPAGE_SEO_QUERY),
    context.storefront.query(STYX_ALL_PRODUCTS_QUERY, {
      variables: {
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
    context.storefront.query(STYX_COLLECTIONS_QUERY, {
      variables: {
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
  ]);

  const rawCollections: any[] = (collections?.nodes || []).filter(
    (c: any) => c.products?.nodes?.length > 0,
  );
  const productNodes: any[] = products?.nodes || [];

  return {
    shop,
    // Nav + footer only need the collection shell. The per-collection price
    // sample fetched below is folded into chainTiles and dropped here so the
    // client payload stays small.
    collections: rawCollections.map((c) => ({
      ...c,
      products: {nodes: [{id: c.products.nodes[0].id}]},
    })),
    chainTiles: buildChainTiles(rawCollections, productNodes),
    priceSamples: pickPriceSamples(productNodes),
    journalTeasers: buildJournalTeasers(),
    seo: seoPayload.home({url: request.url}),
  };
}

function loadDeferredData({context}: LoaderFunctionArgs) {
  const {cart, customerAccount} = context;
  return {
    isLoggedIn: customerAccount?.isLoggedIn() ?? Promise.resolve(false),
    cart: cart.get(),
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getStyxSeoMeta(...matches.map((match) => (match.data as any).seo));
};

/* ─── Loader helpers (server only) ─── */

/** Lowest positive price among in-stock variants; null when nothing is priced. */
function minVariantPrice(
  productList: any[],
): {amount: number; currencyCode: string} | null {
  let best: {amount: number; currencyCode: string} | null = null;
  for (const p of productList) {
    for (const v of p?.variants?.nodes || []) {
      const amount = parseFloat(v?.price?.amount || '0');
      if (!(amount > 0) || v?.availableForSale === false) continue;
      if (!best || amount < best.amount) {
        best = {amount, currencyCode: v.price.currencyCode || 'USD'};
      }
    }
  }
  return best;
}

/**
 * Category tiles for "The chains". Driven by the live collections list:
 * any collection whose handle or title names a chain family becomes a tile,
 * in CHAIN_FAMILIES order, with the collection's own lowest in-stock price.
 * Falls back to the all-products scan when the collection carries no price.
 */
function buildChainTiles(
  collectionList: any[],
  productList: any[],
): ChainTile[] {
  const byFamily = new Map<string, ChainTile>();

  for (const c of collectionList) {
    const family = styleToSlug(c.handle, c.title);
    if (!family || byFamily.has(family)) continue;

    let from = minVariantPrice(c.products?.nodes || []);
    if (!from) {
      from = minVariantPrice(
        productList.filter((p) => styleToSlug(p.title) === family),
      );
    }

    byFamily.set(family, {
      handle: c.handle,
      title: c.title,
      image: c.image ? {url: c.image.url, altText: c.image.altText} : null,
      cutoutUrl: collectionCutoutUrl(c, 800) ?? null,
      fromPrice: from?.amount ?? null,
      currencyCode: from?.currencyCode ?? null,
    });
  }

  return CHAIN_FAMILIES.map((f) => byFamily.get(f))
    .filter((t): t is ChainTile => Boolean(t))
    .slice(0, 9);
}

function weightInGrams(v: any): number | null {
  const w = typeof v?.weight === 'number' ? v.weight : parseFloat(v?.weight);
  if (!(w > 0)) return null;
  switch (v?.weightUnit) {
    case 'KILOGRAMS':
      return w * 1000;
    case 'OUNCES':
      return w * 28.3495;
    case 'POUNDS':
      return w * 453.592;
    default:
      return w;
  }
}

/** Karat: chain.karat metafield, else the title ("10K 3mm Rope Chain"), else 10. */
function parseKarat(
  metaValue: string | null | undefined,
  title: string,
): number {
  const fromMeta = metaValue ? parseInt(metaValue, 10) : NaN;
  if (!Number.isNaN(fromMeta) && fromMeta > 0) return fromMeta;
  const m = title.match(/(\d{2})\s*k/i);
  return m ? parseInt(m[1], 10) : 10;
}

/**
 * One real chain for the receipt in "The price, in full": the cheapest
 * in-stock solid chain (not a bracelet) that has a real weight and price.
 * Cheapest keeps the gold share honest without picking a statement piece.
 */
function pickPriceSamples(productList: any[]): PriceSample[] {
  const candidates: PriceSample[] = [];

  for (const p of productList) {
    const title: string = p?.title || '';
    const hay = `${title} ${(p?.tags || []).join(' ')} ${
      p?.chain_construction?.value || ''
    }`.toLowerCase();
    if (hay.includes('bracelet') || hay.includes('hollow')) continue;

    const family = styleToSlug(p?.chain_style?.value, title);
    if (!family) continue;

    // One variant per product: its cheapest in-stock, weighed length.
    let best: PriceSample | null = null;
    for (const v of p?.variants?.nodes || []) {
      const price = parseFloat(v?.price?.amount || '0');
      const grams = weightInGrams(v);
      if (!(price > 0) || !grams || v?.availableForSale === false) continue;
      if (best && price >= best.price) continue;
      const length =
        v?.selectedOptions?.find(
          (o: any) => o?.name?.toLowerCase() === 'length',
        )?.value ?? null;
      const thickness =
        p?.chain_thickness?.value ||
        (title.match(/(\d+(?:\.\d+)?)\s*mm/i)?.[0] ?? null);
      best = {
        handle: p.handle,
        title,
        karat: parseKarat(p?.karat?.value, title),
        style: family.charAt(0).toUpperCase() + family.slice(1),
        thickness,
        length,
        weightGrams: Math.round(grams * 100) / 100,
        price,
        currencyCode: v.price.currencyCode || 'USD',
      };
    }
    if (best) candidates.push(best);
  }

  if (candidates.length === 0) return [];
  candidates.sort((a, b) => a.weightGrams - b.weightGrams);
  const picks = [
    candidates[0],
    candidates[Math.floor(candidates.length / 2)],
    candidates[candidates.length - 1],
  ];
  // Distinct products and distinct weave families where the catalog allows.
  const out: PriceSample[] = [];
  for (const c of picks) {
    if (!out.some((o) => o.handle === c.handle)) out.push(c);
  }
  return out;
}

/** Three real journal entries. Handles must exist in the articles data and not be hidden. */
const JOURNAL_TEASER_PICKS: Omit<JournalTeaser, 'image'>[] = [
  {
    handle: 'understanding-gold-karats',
    kicker: 'Know your gold',
    title: 'Understanding gold karats',
    blurb:
      '10K, 14K, 18K: what the stamp means, and what each one is worth by the gram.',
  },
  {
    handle: 'history-of-gold-chains',
    kicker: 'The Almanac',
    title: 'A brief history of gold chains',
    blurb:
      'From the tombs of Ur to Miami: how a 4,500-year-old craft became the most durable symbol of wealth.',
  },
  {
    handle: 'history-of-the-cuban-link',
    kicker: 'Vol I',
    title: 'On the Cuban Link',
    blurb:
      'Miami, late 1970s. The chain that built a culture, and why it lies flat against the chest.',
  },
];

function buildJournalTeasers(): JournalTeaser[] {
  return JOURNAL_TEASER_PICKS.filter(
    (t) =>
      PLACEHOLDER_ARTICLES[t.handle] && !HIDDEN_ARTICLE_HANDLES.has(t.handle),
  ).map((t) => {
    const img = PLACEHOLDER_ARTICLES[t.handle].image;
    return {...t, image: img ? {url: img.url, altText: img.altText} : null};
  });
}

/* ─── Page ─── */

export default function Homepage() {
  const {collections, chainTiles, priceSamples, journalTeasers} =
    useLoaderData<typeof loader>();

  return (
    <div className="styx-home-modern">
      <GoldTicker />
      <StyxNav collections={collections} />
      <HeroGallery />
      <HomePillars />
      <HomeChains tiles={chainTiles} />
      <HomeHands />
      <HomePriceLedger samples={priceSamples} />
      <FerrymansCode />
      <HomeLore />
      <HomeJournal teasers={journalTeasers} />
      <Newsletter />
      <StyxFooter collections={collections} />
      <div
        style={{
          textAlign: 'center',
          padding: '16px 0',
          background: '#111',
          borderTop: '1px solid rgba(239,234,224,0.06)',
        }}
      >
        <a
          href="https://itshco.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            letterSpacing: '0.1em',
            color: 'rgba(239,234,224,0.35)',
            textDecoration: 'none',
          }}
        >
          Designed &amp; built by H&amp;Co
        </a>
      </div>
    </div>
  );
}

/* ─── Queries ─── */

const HOMEPAGE_SEO_QUERY = `#graphql
  query styxHomepageSeo {
    shop {
      name
      description
    }
  }
` as const;

// Server-side only: feeds the price receipt (weight, karat, price per
// variant) and the from-price fallback for the chain tiles. Nothing from
// this list reaches the client except the single picked sample.
const STYX_ALL_PRODUCTS_QUERY = `#graphql
  query styxHomeProducts($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 100) {
      nodes {
        id
        title
        handle
        tags
        karat: metafield(namespace: "chain", key: "karat") { value }
        chain_style: metafield(namespace: "chain", key: "chain_style") { value }
        chain_thickness: metafield(namespace: "chain", key: "thickness") { value }
        chain_construction: metafield(namespace: "chain", key: "construction") { value }
        variants(first: 10) {
          nodes {
            id
            availableForSale
            price {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
            weight
            weightUnit
          }
        }
      }
    }
  }
` as const;

// products(sortKey: PRICE) puts the cheapest products first, so a handful of
// nodes is enough to find each collection's honest "from" price.
const STYX_COLLECTIONS_QUERY = `#graphql
  query styxHomeCollections($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 50, sortKey: TITLE) {
      nodes {
        id
        title
        handle
        description
        image {
          url
          altText
          width
          height
        }
        cutout: metafield(namespace: "custom", key: "cutout_image") {
          reference {
            ... on MediaImage {
              image {
                url
              }
            }
          }
        }
        products(first: 6, sortKey: PRICE) {
          nodes {
            id
            variants(first: 10) {
              nodes {
                availableForSale
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
` as const;
