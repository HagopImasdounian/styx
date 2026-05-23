import {useState} from 'react';
import {type LoaderFunctionArgs, type MetaArgs} from 'react-router';
import {data, useLoaderData} from 'react-router';
import {getSeoMeta} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';
import {routeHeaders} from '~/data/cache';
import {
  STYX,
  FONT,
  GoldTicker,
  StyxNav,
  StyxFooter,
  StyxLabel,
  ChainProductCard,
  Obol,
} from '~/components/styx';
import {
  getChainProductsByCategory,
  getBraceletProducts,
  CATEGORY_LABELS,
  type ChainCategory,
  type ChainProduct,
} from '~/lib/shiny.server';

export const headers = routeHeaders;

const VALID_CATEGORIES = ['cuban', 'box', 'curb', 'rope', 'bracelet'];

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {category} = params;
  invariant(category, 'Missing category param');

  if (!VALID_CATEGORIES.includes(category)) {
    throw new Response('Not found', {status: 404});
  }

  const [{collections}, products] = await Promise.all([
    context.storefront.query(NAV_COLLECTIONS_QUERY, {
      variables: {
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
    category === 'bracelet'
      ? getBraceletProducts()
      : getChainProductsByCategory(category as ChainCategory),
  ]);

  if (products.length === 0) {
    throw new Response('No products found', {status: 404});
  }

  const label =
    CATEGORY_LABELS[category as ChainCategory] || category;

  return data({
    collections: collections?.nodes || [],
    products,
    category,
    label,
    spotPerOz: products[0]?.spotPerOz || 0,
  });
}

export const meta = ({data}: MetaArgs<typeof loader>) => {
  if (!data) return [];
  const d = data as any;
  return getSeoMeta({
    title: `${d.label} — Live Gold Pricing | Styx Gold`,
    description: `Shop ${d.label} chains in 10K and 14K solid gold. ${d.products.length} pieces priced transparently from the live gold spot price.`,
  });
};

type SortKey = 'price-asc' | 'price-desc' | 'weight-asc' | 'weight-desc';
type FilterKey = 'all' | '10k' | '14k' | 'solid' | 'hollow';

const SORT_OPTIONS: {label: string; value: SortKey}[] = [
  {label: 'Price ↑', value: 'price-asc'},
  {label: 'Price ↓', value: 'price-desc'},
  {label: 'Weight ↑', value: 'weight-asc'},
  {label: 'Weight ↓', value: 'weight-desc'},
];

function sortProducts(products: ChainProduct[], sort: SortKey): ChainProduct[] {
  const sorted = [...products];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.priceRange.min - b.priceRange.min);
    case 'price-desc':
      return sorted.sort((a, b) => b.priceRange.max - a.priceRange.max);
    case 'weight-asc':
      return sorted.sort((a, b) => a.weight - b.weight);
    case 'weight-desc':
      return sorted.sort((a, b) => b.weight - a.weight);
    default:
      return sorted;
  }
}

function filterProducts(
  products: ChainProduct[],
  filter: FilterKey,
): ChainProduct[] {
  switch (filter) {
    case '10k':
      return products.filter((p) => p.karat === 10);
    case '14k':
      return products.filter((p) => p.karat === 14);
    case 'solid':
      return products.filter((p) => !p.isHollow);
    case 'hollow':
      return products.filter((p) => p.isHollow);
    default:
      return products;
  }
}

export default function ChainCategory() {
  const {collections, products, category, label, spotPerOz} =
    useLoaderData<typeof loader>();
  const [sort, setSort] = useState<SortKey>('price-asc');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = filterProducts(products as ChainProduct[], filter);
  const sorted = sortProducts(filtered, sort);

  // Available filters
  const has10k = products.some((p: any) => p.karat === 10);
  const has14k = products.some((p: any) => p.karat === 14);
  const hasSolid = products.some((p: any) => !p.isHollow);
  const hasHollow = products.some((p: any) => p.isHollow);

  const filters: {label: string; value: FilterKey}[] = [
    {label: 'All', value: 'all'},
    ...(has10k ? [{label: '10K', value: '10k' as FilterKey}] : []),
    ...(has14k ? [{label: '14K', value: '14k' as FilterKey}] : []),
    ...(hasSolid ? [{label: 'Solid', value: 'solid' as FilterKey}] : []),
    ...(hasHollow ? [{label: 'Hollow', value: 'hollow' as FilterKey}] : []),
  ];

  return (
    <div style={{background: STYX.paper}}>
      <GoldTicker />
      <StyxNav collections={collections} />

      {/* Hero */}
      <section
        className="styx-chain-cat-hero"
        style={{
          background: STYX.bone,
          padding: '96px 56px 64px',
          borderBottom: `1px solid ${STYX.line}`,
        }}
      >
        <StyxLabel>{category === 'bracelet' ? 'Bracelets' : 'Chains'}</StyxLabel>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 40,
            flexWrap: 'wrap',
          }}
        >
          <h1
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 56,
              fontWeight: 400,
              letterSpacing: '0.03em',
              lineHeight: 1,
              margin: '16px 0 0',
              color: STYX.ink,
              textTransform: 'uppercase',
            }}
          >
            {label}
          </h1>
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <span
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                fontSize: 16,
                color: STYX.silt,
              }}
            >
              {sorted.length} pieces
            </span>
            <Obol size={32} color={STYX.gold} speed={14} />
          </div>
        </div>
        {spotPerOz > 0 && (
          <div
            style={{
              marginTop: 24,
              fontFamily: FONT.mono,
              fontSize: 11,
              color: STYX.silt,
              letterSpacing: '0.04em',
            }}
          >
            Gold spot: ${(spotPerOz as number).toLocaleString()}/oz · Prices
            update in real-time
          </div>
        )}
      </section>

      {/* Filters + Sort Bar */}
      <section
        style={{
          padding: '20px 56px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${STYX.line}`,
          flexWrap: 'wrap',
          gap: 16,
        }}
        className="styx-chain-filters"
      >
        {/* Filter pills */}
        <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '8px 16px',
                border: `1px solid ${filter === f.value ? STYX.ink : STYX.line}`,
                background: filter === f.value ? STYX.ink : 'transparent',
                color: filter === f.value ? STYX.bone : STYX.silt,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{display: 'flex', gap: 8}}>
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSort(s.value)}
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                letterSpacing: '0.04em',
                padding: '8px 12px',
                border: 'none',
                background: sort === s.value ? STYX.ink : 'transparent',
                color: sort === s.value ? STYX.bone : STYX.silt,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section style={{padding: '48px 56px 80px'}} className="styx-chain-grid">
        {sorted.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 0',
              fontFamily: FONT.cormorant,
              fontSize: 20,
              color: STYX.silt,
              fontStyle: 'italic',
            }}
          >
            No chains match your filters.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 24,
            }}
            className="styx-chain-product-grid"
          >
            {sorted.map((product: any, i: number) => (
              <ChainProductCard
                key={product.id}
                product={product}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      <StyxFooter collections={collections} />
    </div>
  );
}

const NAV_COLLECTIONS_QUERY = `#graphql
  query ChainCatNavCollections($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 50, sortKey: TITLE) {
      nodes {
        id
        title
        handle
        products(first: 1) { nodes { id } }
      }
    }
  }
` as const;
