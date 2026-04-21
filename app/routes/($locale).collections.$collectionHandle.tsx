import {useEffect, useState, useMemo} from 'react';
import {
  json,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@remix-run/node';
import {useLoaderData, useNavigate, useSearchParams} from '@remix-run/react';
import {useInView} from 'react-intersection-observer';
import type {
  Filter,
  ProductCollectionSortKeys,
  ProductFilter,
} from '@shopify/hydrogen/storefront-api-types';
import {
  Pagination,
  flattenConnection,
  getPaginationVariables,
  Analytics,
  getSeoMeta,
} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';

import {Image} from '@shopify/hydrogen';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel, StyxProductCard, Obol} from '~/components/styx';
import {type SortParam} from '~/components/SortFilter';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';
import {FILTER_URL_PREFIX} from '~/components/SortFilter';
import {parseAsCurrency} from '~/lib/utils';

export const headers = routeHeaders;

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 24,
  });
  const {collectionHandle} = params;
  const locale = context.storefront.i18n;

  invariant(collectionHandle, 'Missing collectionHandle param');

  const searchParams = new URL(request.url).searchParams;

  const {sortKey, reverse} = getSortValuesFromParam(
    searchParams.get('sort') as SortParam,
  );
  const filters = [...searchParams.entries()].reduce(
    (filters, [key, value]) => {
      if (key.startsWith(FILTER_URL_PREFIX)) {
        const filterKey = key.substring(FILTER_URL_PREFIX.length);
        filters.push({
          [filterKey]: JSON.parse(value),
        });
      }
      return filters;
    },
    [] as ProductFilter[],
  );

  const {collection, collections} = await context.storefront.query(
    COLLECTION_QUERY,
    {
      variables: {
        ...paginationVariables,
        handle: collectionHandle,
        filters,
        sortKey,
        reverse,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    },
  );

  if (!collection) {
    throw new Response('collection', {status: 404});
  }

  const seo = seoPayload.collection({collection, url: request.url});

  const allFilterValues = collection.products.filters.flatMap(
    (filter) => filter.values,
  );

  const appliedFilters = filters
    .map((filter) => {
      const foundValue = allFilterValues.find((value) => {
        const valueInput = JSON.parse(value.input as string) as ProductFilter;
        // special case for price, the user can enter something freeform (still a number, though)
        // that may not make sense for the locale/currency.
        // Basically just check if the price filter is applied at all.
        if (valueInput.price && filter.price) {
          return true;
        }
        return (
          // This comparison should be okay as long as we're not manipulating the input we
          // get from the API before using it as a URL param.
          JSON.stringify(valueInput) === JSON.stringify(filter)
        );
      });
      if (!foundValue) {
        // eslint-disable-next-line no-console
        console.error('Could not find filter value for filter', filter);
        return null;
      }

      if (foundValue.id === 'filter.v.price') {
        // Special case for price, we want to show the min and max values as the label.
        const input = JSON.parse(foundValue.input as string) as ProductFilter;
        const min = parseAsCurrency(input.price?.min ?? 0, locale);
        const max = input.price?.max
          ? parseAsCurrency(input.price.max, locale)
          : '';
        const label = min && max ? `${min} - ${max}` : 'Price';

        return {
          filter,
          label,
        };
      }
      return {
        filter,
        label: foundValue.label,
      };
    })
    .filter((filter): filter is NonNullable<typeof filter> => filter !== null);

  return json({
    collection,
    appliedFilters,
    collections: flattenConnection(collections),
    seo,
  });
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

const SORT_OPTIONS: {label: string; value: SortParam | 'default'}[] = [
  {label: 'Featured', value: 'featured'},
  {label: 'Newest', value: 'newest'},
  {label: 'Best Selling', value: 'best-selling'},
  {label: 'Price: Low - High', value: 'price-low-high'},
  {label: 'Price: High - Low', value: 'price-high-low'},
];

/* ═══════════════════════════════════════════════════════════════
   Filter helpers — extract available filter values from products
   ═══════════════════════════════════════════════════════════════ */

const COLOR_HEX: Record<string, string> = {
  'Yellow Gold': '#C5A059',
  'Rose Gold': '#C08572',
  'White Gold': '#D4D2CC',
};

function extractFilters(cards: ReturnType<typeof explodeByColor>) {
  const colors = new Set<string>();
  const karats = new Set<string>();
  const thicknesses = new Set<string>();
  const constructions = new Set<string>();

  for (const {product, variantIndex} of cards) {
    const variant = product.variants?.nodes?.[variantIndex];
    if (!variant) continue;

    for (const opt of variant.selectedOptions ?? []) {
      if (opt.name === 'Color') colors.add(opt.value);
      if (opt.name === 'Karat') karats.add(opt.value);
    }

    // Extract thickness from product title (e.g. "Cuban Link Chain 3mm")
    const thicknessMatch = product.title?.match(/(\d+(?:\.\d+)?mm)/);
    if (thicknessMatch) thicknesses.add(thicknessMatch[1]);

    // Extract construction (hollow/solid) from title, tags, or product type
    const titleLower = (product.title || '').toLowerCase();
    const productType = (product.productType || '').toLowerCase();
    const tags = ((product.tags || []) as string[]).map((t: string) => t.toLowerCase());
    if (
      titleLower.includes('hollow') ||
      productType.includes('hollow') ||
      tags.includes('hollow')
    ) {
      constructions.add('Hollow');
    }
    if (
      titleLower.includes('solid') ||
      productType.includes('solid') ||
      tags.includes('solid')
    ) {
      constructions.add('Solid');
    }
    // If neither is explicitly set, default to Solid
    if (
      !titleLower.includes('hollow') &&
      !titleLower.includes('solid') &&
      !tags.includes('hollow') &&
      !tags.includes('solid') &&
      !productType.includes('hollow')
    ) {
      constructions.add('Solid');
    }
  }

  return {
    colors: [...colors].sort(),
    karats: [...karats].sort((a, b) => parseInt(a) - parseInt(b)),
    thicknesses: [...thicknesses].sort(
      (a, b) => parseFloat(a) - parseFloat(b),
    ),
    constructions: [...constructions].sort(),
  };
}

function applyFilters(
  cards: ReturnType<typeof explodeByColor>,
  filters: {color: string | null; karat: string | null; thickness: string | null; construction: string | null},
) {
  return cards.filter(({product, variantIndex}) => {
    const variant = product.variants?.nodes?.[variantIndex];
    if (!variant) return false;

    if (filters.color) {
      const colorOpt = variant.selectedOptions?.find(
        (o: any) => o.name === 'Color',
      );
      if (colorOpt?.value !== filters.color) return false;
    }

    if (filters.karat) {
      // Check if this product has any variant with the selected karat + same color
      const colorOpt = variant.selectedOptions?.find(
        (o: any) => o.name === 'Color',
      );
      const color = colorOpt?.value;
      const hasKarat = product.variants.nodes.some(
        (v: any) =>
          v.selectedOptions?.some(
            (o: any) => o.name === 'Karat' && o.value === filters.karat,
          ) &&
          (!color ||
            v.selectedOptions?.some(
              (o: any) => o.name === 'Color' && o.value === color,
            )),
      );
      if (!hasKarat) return false;
    }

    if (filters.thickness) {
      const thicknessMatch = product.title?.match(/(\d+(?:\.\d+)?mm)/);
      if (!thicknessMatch || thicknessMatch[1] !== filters.thickness)
        return false;
    }

    if (filters.construction) {
      const titleLower = (product.title || '').toLowerCase();
      const productType = (product.productType || '').toLowerCase();
      const tags = ((product.tags || []) as string[]).map((t: string) => t.toLowerCase());
      const target = filters.construction.toLowerCase();

      if (target === 'hollow') {
        const isHollow =
          titleLower.includes('hollow') ||
          productType.includes('hollow') ||
          tags.includes('hollow');
        if (!isHollow) return false;
      } else if (target === 'solid') {
        const isHollow =
          titleLower.includes('hollow') ||
          productType.includes('hollow') ||
          tags.includes('hollow');
        if (isHollow) return false;
      }
    }

    return true;
  });
}

/* ═══════════════════════════════════════════════════════════════
   Filter pill component
   ═══════════════════════════════════════════════════════════════ */

function FilterPill({
  label,
  active,
  onClick,
  swatch,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  swatch?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONT.cinzel,
        fontSize: 10,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        padding: swatch ? '5px 14px 5px 8px' : '6px 14px',
        borderRadius: 20,
        border: active ? `1px solid ${STYX.ink}` : `1px solid ${STYX.line}`,
        background: active ? STYX.ink : 'transparent',
        color: active ? STYX.bone : STYX.silt,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {swatch && (
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: swatch,
            boxShadow: active
              ? 'inset 0 0 0 1px rgba(239,234,224,0.3)'
              : 'inset 0 0 0 1px rgba(26,24,21,0.12)',
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Collection page
   ═══════════════════════════════════════════════════════════════ */

export default function Collection() {
  const {collection} = useLoaderData<typeof loader>();

  const {ref, inView} = useInView();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSort = searchParams.get('sort') || 'featured';

  // Client-side filters
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [filterKarat, setFilterKarat] = useState<string | null>(null);
  const [filterThickness, setFilterThickness] = useState<string | null>(null);
  const [filterConstruction, setFilterConstruction] = useState<string | null>(null);

  const allCards = useMemo(
    () => explodeByColor(collection.products.nodes),
    [collection.products.nodes],
  );

  const availableFilters = useMemo(() => extractFilters(allCards), [allCards]);

  const filteredCards = useMemo(
    () =>
      applyFilters(allCards, {
        color: filterColor,
        karat: filterKarat,
        thickness: filterThickness,
        construction: filterConstruction,
      }),
    [allCards, filterColor, filterKarat, filterThickness, filterConstruction],
  );

  const activeFilterCount =
    (filterColor ? 1 : 0) +
    (filterKarat ? 1 : 0) +
    (filterThickness ? 1 : 0) +
    (filterConstruction ? 1 : 0);

  // Collection metafields
  const c = collection as any;
  const storyHeading = c.story_heading?.value || null;
  const storyBody = c.story_body?.value || null;
  const eraLabel = c.era_label?.value || null;
  const chapterKicker = c.chapter_kicker?.value || null;

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      {/* Archive Hero */}
      <div
        style={{
          borderBottom: `1px solid ${STYX.line}`,
          background: STYX.bone,
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '64px 56px 48px',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            alignItems: 'end',
            gap: 48,
          }}
        >
          {/* Left */}
          <div>
            <StyxLabel>The Archive &middot; II</StyxLabel>
            <h1
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 80,
                fontWeight: 400,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                color: STYX.ink,
                lineHeight: 0.95,
                margin: 0,
              }}
            >
              {collection.title}
              <br />
              <span
                style={{
                  fontFamily: FONT.cormorant,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  textTransform: 'none',
                  letterSpacing: 0,
                  fontSize: '0.55em',
                  color: STYX.silt,
                }}
              >
                from the archive.
              </span>
            </h1>
          </div>

          {/* Right */}
          {collection.description && (
            <div
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                fontSize: 17,
                color: STYX.silt,
                lineHeight: 1.6,
                maxWidth: 420,
              }}
            >
              {collection.description}
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky Filter Toolbar ── */}
      <div
        style={{
          position: 'sticky',
          top: 64,
          zIndex: 5,
          background: STYX.paper,
          borderBottom: `1px solid ${STYX.line}`,
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '14px 56px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Row 1: Count + Sort */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <span
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: STYX.silt,
                }}
              >
                {filteredCards.length} Piece
                {filteredCards.length !== 1 ? 's' : ''}
              </span>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setFilterColor(null);
                    setFilterKarat(null);
                    setFilterThickness(null);
                    setFilterConstruction(null);
                  }}
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 10,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: STYX.gold,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                >
                  Clear {activeFilterCount} filter
                  {activeFilterCount > 1 ? 's' : ''}
                </button>
              )}
            </div>

            <select
              value={currentSort}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value === 'featured') {
                  params.delete('sort');
                } else {
                  params.set('sort', e.target.value);
                }
                setSearchParams(params, {preventScrollReset: true});
              }}
              style={{
                fontFamily: FONT.inter,
                fontSize: 12,
                fontWeight: 500,
                color: STYX.ink,
                background: 'transparent',
                border: `1px solid ${STYX.line}`,
                borderRadius: 4,
                padding: '6px 28px 6px 12px',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%231A1815'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Row 2: Filter pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            {/* Color filters */}
            {availableFilters.colors.length > 1 && (
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <span
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: STYX.silt2,
                    marginRight: 4,
                  }}
                >
                  Metal
                </span>
                {availableFilters.colors.map((color) => (
                  <FilterPill
                    key={color}
                    label={color.replace(' Gold', '')}
                    active={filterColor === color}
                    swatch={COLOR_HEX[color]}
                    onClick={() =>
                      setFilterColor(filterColor === color ? null : color)
                    }
                  />
                ))}
              </div>
            )}

            {/* Karat filters */}
            {availableFilters.karats.length > 1 && (
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <span
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: STYX.silt2,
                    marginRight: 4,
                  }}
                >
                  Karat
                </span>
                {availableFilters.karats.map((k) => (
                  <FilterPill
                    key={k}
                    label={k}
                    active={filterKarat === k}
                    onClick={() =>
                      setFilterKarat(filterKarat === k ? null : k)
                    }
                  />
                ))}
              </div>
            )}

            {/* Thickness filters */}
            {availableFilters.thicknesses.length > 1 && (
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <span
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: STYX.silt2,
                    marginRight: 4,
                  }}
                >
                  Width
                </span>
                {availableFilters.thicknesses.map((t) => (
                  <FilterPill
                    key={t}
                    label={t}
                    active={filterThickness === t}
                    onClick={() =>
                      setFilterThickness(
                        filterThickness === t ? null : t,
                      )
                    }
                  />
                ))}
              </div>
            )}

            {/* Construction filters (Hollow / Solid) */}
            {availableFilters.constructions.length > 1 && (
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <span
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: STYX.silt2,
                    marginRight: 4,
                  }}
                >
                  Build
                </span>
                {availableFilters.constructions.map((c) => (
                  <FilterPill
                    key={c}
                    label={c}
                    active={filterConstruction === c}
                    onClick={() =>
                      setFilterConstruction(
                        filterConstruction === c ? null : c,
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <Pagination connection={collection.products}>
        {({
          nodes,
          isLoading,
          PreviousLink,
          NextLink,
          nextPageUrl,
          hasNextPage,
          state,
        }) => (
          <div style={{maxWidth: 1440, margin: '0 auto', padding: '48px 56px 120px'}}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <PreviousLink
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: STYX.silt,
                  textDecoration: 'none',
                  padding: '10px 24px',
                  border: `1px solid ${STYX.line}`,
                  borderRadius: 4,
                }}
              >
                {isLoading ? 'Loading...' : 'Load previous'}
              </PreviousLink>
            </div>
            <ProductsLoadedOnScroll
              nodes={nodes}
              inView={inView}
              nextPageUrl={nextPageUrl}
              hasNextPage={hasNextPage}
              state={state}
              filterColor={filterColor}
              filterKarat={filterKarat}
              filterThickness={filterThickness}
              filterConstruction={filterConstruction}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 48,
              }}
            >
              <NextLink
                ref={ref}
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: STYX.silt,
                  textDecoration: 'none',
                  padding: '10px 24px',
                  border: `1px solid ${STYX.line}`,
                  borderRadius: 4,
                }}
              >
                {isLoading ? 'Loading...' : 'Load more products'}
              </NextLink>
            </div>
          </div>
        )}
      </Pagination>

      {/* ── Collection Story Section ── */}
      {(storyHeading || storyBody || collection.image) && (
        <section
          style={{
            background: STYX.taupe,
            padding: '120px 56px',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `
                radial-gradient(ellipse 60% 40% at 20% 20%, rgba(255,250,238,0.4), transparent 60%),
                radial-gradient(ellipse 50% 50% at 85% 80%, rgba(62,48,28,0.06), transparent 60%)`,
            }}
          />
          <div style={{maxWidth: 1080, margin: '0 auto', position: 'relative'}}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: collection.image ? '1fr 1.4fr' : '1fr',
                gap: 80,
                alignItems: 'start',
              }}
            >
              {/* Left: Image or decoration */}
              {collection.image && (
                <div>
                  <div style={{position: 'relative', aspectRatio: '4/5', overflow: 'hidden'}}>
                    <Image
                      data={collection.image}
                      aspectRatio="4/5"
                      sizes="(min-width: 1200px) 40vw, 80vw"
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                  </div>
                  <div style={{marginTop: 20, display: 'flex', alignItems: 'center', gap: 14}}>
                    <Obol size={44} color={STYX.ink} speed={6} />
                    {eraLabel && (
                      <span
                        style={{
                          fontFamily: FONT.cinzel,
                          fontSize: 11,
                          letterSpacing: '0.25em',
                          textTransform: 'uppercase',
                          color: STYX.graphite,
                        }}
                      >
                        {eraLabel}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Right: Story text */}
              <div>
                {chapterKicker && (
                  <div
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 11,
                      letterSpacing: '0.25em',
                      textTransform: 'uppercase',
                      color: STYX.graphite,
                      marginBottom: 18,
                    }}
                  >
                    {chapterKicker}
                  </div>
                )}
                <div
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 64,
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    lineHeight: 0.95,
                    color: STYX.ink,
                    textTransform: 'uppercase',
                  }}
                >
                  {storyHeading || `On the`}
                </div>
                <div
                  style={{
                    fontFamily: FONT.cormorant,
                    fontSize: 72,
                    fontStyle: 'italic',
                    fontWeight: 400,
                    lineHeight: 0.95,
                    color: STYX.ink,
                    marginTop: 8,
                  }}
                >
                  {collection.title}.
                </div>

                {storyBody && (
                  <div
                    style={{
                      fontFamily: FONT.cormorant,
                      fontSize: 19,
                      lineHeight: 1.75,
                      color: STYX.ink,
                      marginTop: 40,
                    }}
                  >
                    {storyBody}
                  </div>
                )}

                {!storyBody && collection.description && (
                  <div
                    style={{
                      fontFamily: FONT.cormorant,
                      fontSize: 19,
                      lineHeight: 1.75,
                      color: STYX.ink,
                      marginTop: 40,
                    }}
                  >
                    {collection.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />

      <StyxFooter />
    </div>
  );
}

/**
 * Explode products into per-color-variant cards.
 * If a product has Color options (Yellow Gold, Rose Gold, White Gold),
 * each color gets its own card so the customer sees every variation.
 * Products without a Color option render as a single card.
 */
function explodeByColor(products: any[]) {
  const cards: Array<{product: any; variantIndex: number; key: string}> = [];
  for (const product of products) {
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
      // No Color option or single color — one card
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

function ProductsLoadedOnScroll({
  nodes,
  inView,
  nextPageUrl,
  hasNextPage,
  state,
  filterColor,
  filterKarat,
  filterThickness,
  filterConstruction,
}: {
  nodes: any;
  inView: boolean;
  nextPageUrl: string;
  hasNextPage: boolean;
  state: any;
  filterColor: string | null;
  filterKarat: string | null;
  filterThickness: string | null;
  filterConstruction: string | null;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (inView && hasNextPage) {
      navigate(nextPageUrl, {
        replace: true,
        preventScrollReset: true,
        state,
      });
    }
  }, [inView, navigate, state, nextPageUrl, hasNextPage]);

  const allCards = explodeByColor(nodes);
  const cards = applyFilters(allCards, {
    color: filterColor,
    karat: filterKarat,
    thickness: filterThickness,
    construction: filterConstruction,
  });

  if (cards.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '80px 0',
        }}
      >
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 18,
            color: STYX.silt,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          No pieces match
        </div>
        <div
          style={{
            fontFamily: FONT.cormorant,
            fontSize: 16,
            fontStyle: 'italic',
            color: STYX.silt2,
          }}
        >
          Try adjusting your filters.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 48,
      }}
      data-test="product-grid"
    >
      {cards.map(({product, variantIndex, key}, i) => (
        <StyxProductCard
          key={key}
          product={product}
          variantIndex={variantIndex}
          index={i}
        />
      ))}
    </div>
  );
}

const COLLECTION_QUERY = `#graphql
  query CollectionDetails(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys!
    $reverse: Boolean
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo {
        description
        title
      }
      image {
        id
        url
        width
        height
        altText
      }
      story_heading: metafield(namespace: "custom", key: "story_heading") {
        value
      }
      story_body: metafield(namespace: "custom", key: "story_body") {
        value
      }
      era_label: metafield(namespace: "custom", key: "era_label") {
        value
      }
      chapter_kicker: metafield(namespace: "custom", key: "chapter_kicker") {
        value
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        filters: $filters,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
        filters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
        nodes {
          ...ProductCard
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
    collections(first: 100) {
      edges {
        node {
          title
          handle
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

function getSortValuesFromParam(sortParam: SortParam | null): {
  sortKey: ProductCollectionSortKeys;
  reverse: boolean;
} {
  switch (sortParam) {
    case 'price-high-low':
      return {
        sortKey: 'PRICE',
        reverse: true,
      };
    case 'price-low-high':
      return {
        sortKey: 'PRICE',
        reverse: false,
      };
    case 'best-selling':
      return {
        sortKey: 'BEST_SELLING',
        reverse: false,
      };
    case 'newest':
      return {
        sortKey: 'CREATED',
        reverse: true,
      };
    case 'featured':
      return {
        sortKey: 'MANUAL',
        reverse: false,
      };
    default:
      return {
        sortKey: 'RELEVANCE',
        reverse: false,
      };
  }
}
