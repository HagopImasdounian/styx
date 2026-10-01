import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {type MetaArgs, type LoaderFunctionArgs} from 'react-router';
import {data, useLoaderData, useNavigate, useSearchParams} from 'react-router';
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
} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';

import {Image} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import {
  STYX,
  FONT,
  GoldTicker,
  StyxNav,
  StyxFooter,
  StyxProductCard,
  Obol,
} from '~/components/styx';
import {trackCollectionView} from '~/components/GTMDataLayer';
import {
  COLOR_HEX,
  METAL_COLLECTION_COLOR,
  activeFacetChips,
  applyFacets,
  countActive,
  emptySelection,
  explodeByColor,
  facetOptions,
  groupCardsByThickness,
  parseFacetSelection,
  toggleFacetValue,
  writeFacetSelection,
  type FacetKey,
  type FacetSelection,
} from '~/components/styx/listingFilters';
import {
  FilterSortButton,
  GridDensityScript,
  GridDensityToggle,
  ListingBottomBar,
  gridDensityClass,
  useGridDensity,
} from '~/components/styx/ListingControls';
import {ListingFilterDrawer} from '~/components/styx/ListingFilterDrawer';

/* ─── Chain type intros + journal links ─── */
const CHAIN_INTROS: Record<
  string,
  {intro: string; journal: string; journalTitle: string}
> = {
  cuban: {
    intro:
      'The Cuban Link is the undisputed heavyweight of gold chains. Born in Miami in the 1970s, its flat-filed interlocking links create a mirror-smooth surface that catches light from every angle. Solid, dense, and engineered to lay flat against the chest, this is the chain that built a culture.',
    journal: 'history-of-the-cuban-link',
    journalTitle: 'Read: the history of the Cuban link',
  },
  curb: {
    intro:
      'The Curb Chain is the oldest and most universal chain design in existence, dating back to 2600 BC in ancient Sumer. Its flat, twisted links were inspired by horse curb bits, the same geometry that controls a stallion now adorns the neck. From Victorian pocket watches to modern streetwear, the curb has never gone out of style.',
    journal: 'history-of-the-curb-chain',
    journalTitle: 'Read: the history of the Curb chain',
  },
  box: {
    intro:
      "The Box Chain originated in 6th-century Venice, where goldsmiths discovered that square links interlocked at 90-degree angles create a chain with perfect geometric precision. Clean, architectural, and virtually kink-proof, the box chain is the engineer's choice.",
    journal: 'history-of-the-box-chain',
    journalTitle: 'Read: the history of the Box chain',
  },
  rope: {
    intro:
      'The Rope Chain traces its origins to ancient Egypt, circa 2500 BCE, where artisans twisted gold wire into helical spirals that mimicked the hemp ropes of Nile river boats. Its signature twist catches light in a continuous sparkle that no flat chain can replicate. From pharaohs to hip-hop, the rope endures.',
    journal: 'history-of-the-rope-chain',
    journalTitle: 'Read: the history of the Rope chain',
  },
  cable: {
    intro:
      'The Cable Chain is the DNA of all chain designs, simple interlocking oval links, unchanged since the Royal Tombs of Ur. Its strength lies in its simplicity: lightweight, versatile, and nearly indestructible. The cable chain is the foundation upon which every other weave was built.',
    journal: 'history-of-the-cable-chain',
    journalTitle: 'Read: the history of the Cable chain',
  },
  figaro: {
    intro:
      'The Figaro Chain was born in the goldsmithing workshops of Vicenza, Italy, around 1885. Its distinctive pattern, three small links followed by one elongated link, creates a visual rhythm unlike any other chain. Named after the clever barber of Seville, the Figaro is Italian craftsmanship at its most playful.',
    journal: 'history-of-the-figaro-chain',
    journalTitle: 'Read: the history of the Figaro chain',
  },
  wheat: {
    intro:
      'The Wheat Chain, known in Italy as the Spiga, mimics the overlapping husks of a wheat ear, four strands of oval links woven into a tight, flexible tube. Born during the Renaissance in Vicenza, it is one of the strongest chain weaves per gram. Substantial enough to carry a heavy pendant, elegant enough to wear alone.',
    journal: 'history-of-the-wheat-chain',
    journalTitle: 'Read: the history of the Wheat chain',
  },
  rolo: {
    intro:
      'The Rolo Chain emerged in Victorian London around 1850, perfectly round, symmetrical links that interlock in a clean, modern pattern. Heavier and more substantial than a cable chain, the rolo carries a satisfying weight that you feel against your chest. Minimal, bold, timeless.',
    journal: 'history-of-the-rolo-chain',
    journalTitle: 'Read: the history of the Rolo chain',
  },
  singapore: {
    intro:
      'The Singapore Chain was developed by Italian chain-makers in the 1970s and named for its popularity in Southeast Asian gold markets. Its twisted, braided links create a diamond-cut surface that shimmers with every movement, a chain that sparkles like no other, even in the thinnest widths.',
    journal: 'history-of-the-singapore-chain',
    journalTitle: 'Read: the history of the Singapore chain',
  },
  franco: {
    intro:
      'The Franco Chain was born in the goldsmithing workshops of Northern Italy in the late 1970s, a flat-sided square weave so dense it reads as a solid bar of gold. It is the chain you choose when you need mass that can carry serious pendant weight and still lie flat against the chest.',
    journal: 'history-of-the-franco-chain',
    journalTitle: 'Read: the history of the Franco chain',
  },
  herringbone: {
    intro:
      'The Herringbone traces back to ancient Egypt around 3000 BCE, flat, slanted links laid in a tight fishbone pattern that turns the entire chain into a mirror-smooth ribbon of liquid gold. Sleek, flexible, and unmistakable under light, it lies perfectly flat against the skin.',
    journal: 'history-of-the-herringbone-chain',
    journalTitle: 'Read: the history of the Herringbone',
  },
  snake: {
    intro:
      "The Snake Chain emerged in Victorian London around 1840, tightly fitted links that form a smooth, round, flexible tube with the faint banding of a serpent's skin. Completely seamless to the touch, it catches the light in one continuous, unbroken line.",
    journal: 'history-of-the-snake-chain',
    journalTitle: 'Read: the history of the Snake chain',
  },
  paperclip: {
    intro:
      'The Paperclip Chain is the modern minimalist, elongated, uniform oval links inspired by the humble office clip, first popularized in Oslo around 1940. Clean, architectural, and effortlessly contemporary, it wears as well on its own as it does carrying a charm.',
    journal: 'history-of-the-paperclip-chain',
    journalTitle: 'Read: the history of the Paperclip',
  },
  '10k-gold': {
    intro:
      '10K gold is 41.7% pure gold alloyed with copper, silver, and zinc, making it the most durable karat we carry. Its hardness means thinner chains hold up to daily wear without stretching or deforming. The color is a refined, pale champagne-gold. For everyday chains, 10K is the workhorse: real gold, built to last, priced honestly.',
    journal: 'understanding-gold-karats',
    journalTitle: 'Read: understanding gold karats, 10K to 24K',
  },
  '14k-gold': {
    intro:
      '14K gold is 58.3% pure gold, the American standard for fine jewelry. Richer and warmer in color than 10K, with enough alloy to remain durable for daily wear. This is the sweet spot: unmistakably gold, strong enough for any chain style, and the most popular karat in the United States for good reason.',
    journal: 'understanding-gold-karats',
    journalTitle: 'Read: understanding gold karats, 10K to 24K',
  },
};
import {FILTER_URL_PREFIX, type SortParam} from '~/components/SortFilter';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {CACHE_SHORT, routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';
import {getStyxSeoMeta} from '~/lib/seo-meta';
import {parseAsCurrency, validateLocale} from '~/lib/utils';

/** This route renders its own GoldTicker + StyxNav + StyxFooter. */
export const handle = {ownChrome: true};

export const headers = routeHeaders;

export async function loader({params, request, context}: LoaderFunctionArgs) {
  validateLocale(params);
  const {collectionHandle} = params;
  const locale = context.storefront.i18n;

  invariant(collectionHandle, 'Missing collectionHandle param');

  const searchParams = new URL(request.url).searchParams;

  const sortParam = searchParams.get('sort') || DEFAULT_SORT;
  const {sortKey, reverse} = getSortValuesFromParam(sortParam as SortParam);

  // Server-side filters (`filter.*` params → Storefront API ProductFilter).
  // On this store only `price` and `available` have Search & Discovery filter
  // definitions, so only those actually narrow the query, the mobile menu's
  // price buckets use `filter.price`.
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

  // Client-side facets (type/color/karat/width/length/price/construction)
  // have NO working Storefront API filter on this store (productType/tag/
  // variantOption/productMetafield filters are silently ignored without S&D
  // definitions). When any is active we bypass pagination and fetch the FULL
  // collection (≤ ~115 products) so client filtering and counts are complete.
  const selection = parseFacetSelection(
    searchParams,
    METAL_COLLECTION_COLOR[collectionHandle] ?? null,
  );
  // The default "Thickness" order is computed client-side (Shopify cannot
  // sort by metafield), so it needs the full set too.
  const fullSet = countActive(selection) > 0 || sortParam === THICKNESS_SORT;

  const paginationVariables = fullSet
    ? {first: FULL_SET_PAGE_SIZE}
    : getPaginationVariables(request, {pageBy: 24});

  const {collection, allIndex, collections} = await context.storefront.query(
    COLLECTION_QUERY,
    {
      variables: {
        ...paginationVariables,
        handle: collectionHandle,
        filters,
        sortKey,
        reverse,
        // In paginated mode, also fetch a lightweight index of the whole
        // collection so the result count + available pills cover every
        // product, not just loaded pages. In full-set mode the main
        // products query already holds the complete set.
        fetchIndex: !fullSet,
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
    (filter: Filter) => filter.values,
  );

  const appliedFilters = filters
    .map((filter) => {
      const foundValue = allFilterValues.find(
        (value: Filter['values'][number]) => {
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
        },
      );
      if (!foundValue) {
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

  return data(
    {
      collection,
      // Lightweight full-collection index (null in full-set mode, where
      // collection.products already contains every product).
      allProductIndex: fullSet ? null : allIndex?.products?.nodes ?? null,
      fullSet,
      appliedFilters,
      collections: flattenConnection(collections),
      seo,
    },
    {headers: {'Cache-Control': CACHE_SHORT}},
  );
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getStyxSeoMeta(...matches.map((match) => (match.data as any).seo));
};

// Client-side sort: thin → thick by chain.thickness, grouped per mm. Shopify
// has no metafield sort key, so the loader fetches the full set for it.
const THICKNESS_SORT = 'thickness';

const SORT_OPTIONS: {
  label: string;
  value: SortParam | 'default' | 'thickness';
}[] = [
  {label: 'Thickness', value: THICKNESS_SORT},
  {label: 'Price ↑', value: 'price-low-high'},
  {label: 'Price ↓', value: 'price-high-low'},
  {label: 'Newest', value: 'newest'},
  {label: 'Popular', value: 'best-selling'},
];

// Plain-word sort labels for the drawer (arrows are fine in a segmented
// control, less so in a radio list).
const DRAWER_SORT_OPTIONS = [
  {label: 'Thickness, thin to thick', value: THICKNESS_SORT},
  {label: 'Price, low to high', value: 'price-low-high'},
  {label: 'Price, high to low', value: 'price-high-low'},
  {label: 'Newest', value: 'newest'},
  {label: 'Popular', value: 'best-selling'},
];

const DEFAULT_SORT = THICKNESS_SORT;

/* ═══════════════════════════════════════════════════════════════
   Filter state lives in the URL (shareable / bookmarkable / back-safe)

   Two kinds of filters:
   • SERVER filters, `filter.*` params parsed by the loader into Storefront
     API ProductFilters. Only `price` (and `available`) have Search &
     Discovery definitions on this store, so only those work server-side
     (the mega menu's price links use `filter.price`).
   • CLIENT facets, `type`, `color`, `karat`, `width`, `style`, `length`,
     `price`, `construction` params (comma-separated multi-values). The API silently
     ignores productType/tag/variantOption/productMetafield filters here, so
     these are applied client-side over the FULL collection set (loader
     fetches first: 250 when any is active). Model + URL codec live in
     ~/components/styx/listingFilters.ts.
   ═══════════════════════════════════════════════════════════════ */

// Collections max out around ~115 products, so one 250-product page always
// covers the complete set when client-side facet filtering is active.
const FULL_SET_PAGE_SIZE = 250;

// Facets that get inline quick-filter pills on desktop (the drawer has all).
const QUICK_FACETS: FacetKey[] = [
  'type',
  'color',
  'karat',
  'width',
  'style',
  'construction',
];

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
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="styx-chip"
    >
      {swatch && (
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: swatch,
            boxShadow: 'inset 0 0 0 1px rgba(26,24,21,0.12)',
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Weave directory, all 14 chain families, shown on the Chains archive
   ═══════════════════════════════════════════════════════════════ */

const WEAVES: Array<{handle: string; label: string}> = [
  {handle: 'cuban', label: 'Cuban Link'},
  {handle: 'curb', label: 'Curb'},
  {handle: 'rope', label: 'Rope'},
  {handle: 'box', label: 'Box'},
  {handle: 'figaro', label: 'Figaro'},
  {handle: 'cable', label: 'Cable'},
  {handle: 'wheat', label: 'Wheat'},
  {handle: 'rolo', label: 'Rolo'},
  {handle: 'singapore', label: 'Singapore'},
  {handle: 'franco', label: 'Franco'},
  {handle: 'herringbone', label: 'Herringbone'},
  {handle: 'paperclip', label: 'Paperclip'},
  {handle: 'snake', label: 'Snake'},
  {handle: 'marine', label: 'Marine'},
];

export default function Collection() {
  const {
    collection,
    collections: allCollections,
    allProductIndex,
    fullSet,
    appliedFilters,
  } = useLoaderData<typeof loader>();
  // weave handle → cutout PNG url (custom.cutout_image metafield)
  const weaveCutout = (handle: string): string | undefined =>
    (allCollections as any[])?.find((c) => c.handle === handle)?.cutout
      ?.reference?.image?.url;

  const {ref, inView} = useInView();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSort = searchParams.get('sort') || DEFAULT_SORT;
  const collectionHandle = (collection as any).handle as string;
  const presetColor = METAL_COLLECTION_COLOR[collectionHandle] ?? null;

  // All filter state is derived from the URL, shareable, bookmarkable,
  // back-button safe. Pills and the drawer write it via setSearchParams.
  const selection = useMemo(
    () => parseFacetSelection(searchParams, presetColor),
    [searchParams, presetColor],
  );

  // Drawer + grid density UI state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const [density, setDensity] = useGridDensity();

  // Complete collection set (post server filters): in full-set mode the main
  // products query holds everything; otherwise use the lightweight index.
  // Drives the result count, facet options and counts, never just loaded pages.
  const fullSetCards = useMemo(() => {
    const nodes =
      fullSet || !allProductIndex ? collection.products.nodes : allProductIndex;
    return explodeByColor(nodes as any[]);
  }, [fullSet, allProductIndex, collection.products.nodes]);

  const availableFilters = useMemo(
    () => facetOptions(fullSetCards),
    [fullSetCards],
  );

  // Exact count over the COMPLETE filtered set (not loaded pages)
  const filteredCount = useMemo(
    () => applyFacets(fullSetCards, selection).length,
    [fullSetCards, selection],
  );

  const activeFilterCount = countActive(selection) + appliedFilters.length;

  const commitParams = (params: URLSearchParams) => {
    setSearchParams(params, {preventScrollReset: true});
  };

  // Replace the whole facet selection (drawer apply, chip removal, pills)
  const applySelection = (next: FacetSelection, sort?: string) => {
    const params = writeFacetSelection(
      new URLSearchParams(searchParams),
      next,
      presetColor,
    );
    if (sort !== undefined) {
      if (sort === DEFAULT_SORT) params.delete('sort');
      else params.set('sort', sort);
    }
    commitParams(params);
  };

  // Toggle one facet value (quick pills + active chips)
  const toggleFacet = (key: FacetKey, value: string) =>
    applySelection(toggleFacetValue(selection, key, value));

  // Remove a server-side `filter.*` param (e.g. the mobile menu's price bucket)
  const removeServerFilter = (filter: ProductFilter) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(filter).forEach(([key, value]) => {
      params.delete(FILTER_URL_PREFIX + key, JSON.stringify(value));
    });
    params.delete('cursor');
    params.delete('direction');
    commitParams(params);
  };

  const clearAllFilters = () => {
    const params = writeFacetSelection(
      new URLSearchParams(searchParams),
      emptySelection(),
      presetColor,
    );
    for (const key of [...params.keys()]) {
      if (key.startsWith(FILTER_URL_PREFIX)) params.delete(key);
    }
    commitParams(params);
  };

  const setSort = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === DEFAULT_SORT) params.delete('sort');
    else params.set('sort', value);
    // sort changes restart pagination
    params.delete('cursor');
    params.delete('direction');
    commitParams(params);
  };

  const activeChips = activeFacetChips(selection);

  // Chain close-up cutout (transparent PNG) for the hero, from the
  // collection's custom.cutout_image metafield, set in Shopify admin
  const heroChainImage =
    (collection as any).cutout?.reference?.image?.url ?? null;

  // Track collection view in data layer
  useEffect(() => {
    const products = collection.products?.nodes ?? [];
    trackCollectionView({
      id: collection.id,
      title: collection.title,
      products: products.slice(0, 20).map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.variants?.nodes?.[0]?.price?.amount || '0',
      })),
    });
  }, [collection.id]);

  // Collection metafields
  const c = collection as any;
  const storyHeading = c.story_heading?.value || null;
  const storyBody = c.story_body?.value || null;
  const eraLabel = c.era_label?.value || null;
  const chapterKicker = c.chapter_kicker?.value || null;

  return (
    <div
      className="styx-listing-page styx-catalog"
      style={{background: 'var(--styx-surface)', minHeight: '100vh'}}
    >
      <GoldTicker />
      <StyxNav />

      {/* Archive Hero */}
      <div
        style={{
          borderBottom: '1px solid var(--styx-border)',
        }}
      >
        <div
          className="styx-collection-hero"
          style={{
            maxWidth: 1800,
            margin: '0 auto',
            padding: '40px var(--styx-page-gutter) 32px',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            alignItems: 'end',
            gap: 48,
          }}
        >
          {/* Left */}
          <div>
            {heroChainImage && (
              <img
                src={heroChainImage}
                alt={`${collection.title} close-up`}
                style={{
                  height: 64,
                  width: 'auto',
                  display: 'block',
                  marginBottom: 16,
                }}
              />
            )}
            <h1
              data-reveal=""
              className="styx-catalog-title"
              style={{margin: 0}}
            >
              {collection.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Shop by Weave, every chain family, on the all-chains archive ── */}
      {(collection as any).handle === 'chains' && (
        <div
          style={{
            borderBottom: '1px solid var(--styx-border)',
          }}
        >
          <div
            className="styx-weave-strip"
            style={{
              maxWidth: 1800,
              margin: '0 auto',
              padding: '28px var(--styx-page-gutter) 32px',
            }}
          >
            <div className="styx-catalog-label" style={{marginBottom: 16}}>
              Shop by weave
            </div>
            <div
              className="styx-weave-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 12,
              }}
            >
              {WEAVES.map((w) => (
                <Link
                  key={w.handle}
                  to={`/collections/${w.handle}`}
                  prefetch="intent"
                  className="styx-weave-tile"
                  aria-current={
                    w.handle === collectionHandle ? 'page' : undefined
                  }
                >
                  {weaveCutout(w.handle) ? (
                    <img
                      src={weaveCutout(w.handle)}
                      alt={`${w.label} chain close-up`}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{height: 36}} />
                  )}
                  <span>{w.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Chain Intro + Journal Link ── */}
      {(() => {
        const handle = (collection as any).handle;
        const info = CHAIN_INTROS[handle];
        if (!info) return null;
        return (
          <div
            className="styx-collection-intro"
            style={{
              maxWidth: 1800,
              margin: '0 auto',
              padding: '28px var(--styx-page-gutter)',
              display: 'flex',
              gap: 48,
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--styx-border)',
            }}
          >
            <p className="styx-catalog-intro-text">{info.intro}</p>
            <Link
              to={`/journal/${info.journal}`}
              className="styx-text-link"
              style={{whiteSpace: 'nowrap', flexShrink: 0}}
            >
              {info.journalTitle} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        );
      })()}

      {/* ── Sticky Filter Toolbar, pins exactly below the (auto-hiding) header ── */}
      <div
        style={{
          position: 'sticky',
          top: 'var(--styx-header-offset, 64px)',
          zIndex: 5,
          background: 'var(--styx-surface)',
          borderBottom: '1px solid var(--styx-border)',
          transition: 'top 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          className="styx-collection-toolbar"
          style={{
            maxWidth: 1800,
            margin: '0 auto',
            padding: '14px var(--styx-page-gutter)',
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
              <span className="styx-catalog-count">
                {filteredCount} piece
                {filteredCount !== 1 ? 's' : ''}
              </span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="styx-catalog-clear"
                >
                  Clear {activeFilterCount} filter
                  {activeFilterCount > 1 ? 's' : ''}
                </button>
              )}
            </div>

            <div
              className="styx-collection-tools"
              style={{display: 'flex', alignItems: 'center', gap: 12}}
            >
              <div
                className="styx-collection-sort styx-seg"
                role="group"
                aria-label="Sort"
              >
                {SORT_OPTIONS.map((opt) => {
                  const isActive = currentSort === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSort(opt.value)}
                      aria-pressed={isActive}
                      className="styx-seg-btn"
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <FilterSortButton
                activeCount={activeFilterCount}
                open={drawerOpen}
                onClick={() => setDrawerOpen(true)}
                className="styx-collection-filter-btn"
              />
              <GridDensityToggle
                density={density}
                onChange={setDensity}
                className="styx-collection-density"
              />
            </div>
          </div>

          {/* Row 2 (desktop): quick-filter pills for the common facets, plus
              removable chips for anything else that is active (length, price,
              server-side filter.price). Hidden on phones by CSS. */}
          <div
            className="styx-collection-filters"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            {QUICK_FACETS.map((key) => {
              const opts = availableFilters[key];
              if (opts.length < 2) return null;
              return (
                <div
                  key={key}
                  style={{display: 'flex', alignItems: 'center', gap: 6}}
                >
                  <FacetHeading>{FACET_TITLE_SHORT[key]}</FacetHeading>
                  {opts.map((o) => (
                    <FilterPill
                      key={o.value}
                      label={
                        key === 'color' ? o.value.replace(' Gold', '') : o.label
                      }
                      active={selection[key].includes(o.value)}
                      swatch={key === 'color' ? COLOR_HEX[o.value] : undefined}
                      onClick={() => toggleFacet(key, o.value)}
                    />
                  ))}
                </div>
              );
            })}

            {/* Active length / price facets (no quick pills), click to remove */}
            {(['length', 'price'] as FacetKey[]).map((key) =>
              selection[key].length > 0 ? (
                <div
                  key={key}
                  style={{display: 'flex', alignItems: 'center', gap: 8}}
                >
                  <FacetHeading>{FACET_TITLE_SHORT[key]}</FacetHeading>
                  {activeChips
                    .filter((c) => c.key === key)
                    .map((c) => (
                      <FilterPill
                        key={c.value}
                        label={`${c.label} ✕`}
                        active
                        onClick={() => toggleFacet(c.key, c.value)}
                      />
                    ))}
                </div>
              ) : null,
            )}

            {/* Active server-side filters (e.g. price bucket from the
                mobile menu), click to remove */}
            {appliedFilters.length > 0 && (
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <FacetHeading>Price</FacetHeading>
                {appliedFilters.map(({label, filter}) => (
                  <FilterPill
                    key={`${label}-${JSON.stringify(filter)}`}
                    label={`${label} ✕`}
                    active
                    onClick={() => removeServerFilter(filter)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Row 3 (phones): active filters as removable chips. Hidden on
              desktop by CSS, where the pill row already shows state. */}
          {(activeChips.length > 0 || appliedFilters.length > 0) && (
            <div
              className="styx-collection-active-chips"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'nowrap',
              }}
              aria-label="Active filters"
            >
              {activeChips.map((c) => (
                <FilterPill
                  key={`${c.key}:${c.value}`}
                  label={`${c.label} ✕`}
                  active
                  onClick={() => toggleFacet(c.key, c.value)}
                />
              ))}
              {appliedFilters.map(({label, filter}) => (
                <FilterPill
                  key={`srv-${label}-${JSON.stringify(filter)}`}
                  label={`${label} ✕`}
                  active
                  onClick={() => removeServerFilter(filter)}
                />
              ))}
            </div>
          )}
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
          <div
            className="styx-collection-products"
            style={{
              maxWidth: 1800,
              margin: '0 auto',
              padding: '36px var(--styx-page-gutter) 120px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <PreviousLink className="styx-ctl styx-catalog-more">
                {isLoading ? 'Loading...' : 'Load previous'}
              </PreviousLink>
            </div>
            <ProductsLoadedOnScroll
              nodes={nodes}
              inView={inView}
              nextPageUrl={nextPageUrl}
              hasNextPage={hasNextPage}
              state={state}
              selection={selection}
              gridClass={gridDensityClass(density)}
              groupByThickness={currentSort === THICKNESS_SORT}
            />
            {/* Applies the stored grid density before hydration (no flash).
                Must come after the grid in DOM order. */}
            <GridDensityScript />
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 48,
              }}
            >
              <NextLink ref={ref} className="styx-ctl styx-catalog-more">
                {isLoading ? 'Loading...' : 'Load more products'}
              </NextLink>
            </div>
          </div>
        )}
      </Pagination>

      {/* ── Collection Story Section ── */}
      {(storyHeading || storyBody || collection.image) && (
        <section
          className="styx-collection-story"
          style={{
            background: '#ede9df',
            borderTop: '1px solid var(--styx-border)',
            padding: '96px var(--styx-page-gutter)',
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
              data-grid=""
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
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '4/5',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      data={collection.image}
                      alt={collection.image.altText ?? collection.title}
                      aspectRatio="4/5"
                      sizes="(min-width: 1200px) 40vw, 80vw"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: 20,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <Obol size={44} color={STYX.ink} speed={6} />
                    {eraLabel && (
                      <span className="styx-eyebrow" style={{margin: 0}}>
                        {eraLabel}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Right: Story text */}
              <div>
                {chapterKicker && (
                  <div className="styx-eyebrow" style={{marginBottom: 18}}>
                    {chapterKicker}
                  </div>
                )}
                <div
                  style={{
                    fontFamily: FONT.cormorant,
                    fontSize: 'clamp(40px, 4vw, 62px)',
                    fontWeight: 400,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    color: '#1a1815',
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

      {/* Phone-only floating toolbar (hidden while the drawer is open) */}
      <ListingBottomBar
        activeCount={activeFilterCount}
        onOpenFilters={() => setDrawerOpen(true)}
        density={density}
        onDensity={setDensity}
        hidden={drawerOpen}
      />

      <ListingFilterDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        cards={fullSetCards}
        selection={selection}
        sort={currentSort}
        sortOptions={DRAWER_SORT_OPTIONS}
        onApply={(next, sort) => {
          applySelection(next, sort);
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}

// Short facet headings for the inline pill row
const FACET_TITLE_SHORT: Record<FacetKey, string> = {
  type: 'Type',
  color: 'Metal',
  karat: 'Karat',
  width: 'Width',
  style: 'Style',
  length: 'Length',
  price: 'Price',
  construction: 'Build',
};

function FacetHeading({children}: {children: ReactNode}) {
  return (
    <span
      style={{
        fontFamily: FONT.inter,
        fontSize: 11,
        letterSpacing: '0.01em',
        color: 'var(--styx-muted)',
        marginRight: 4,
      }}
    >
      {children}
    </span>
  );
}

function ProductsLoadedOnScroll({
  nodes,
  inView,
  nextPageUrl,
  hasNextPage,
  state,
  selection,
  gridClass,
  groupByThickness,
}: {
  nodes: any;
  inView: boolean;
  nextPageUrl: string;
  hasNextPage: boolean;
  state: any;
  selection: FacetSelection;
  gridClass: string;
  groupByThickness: boolean;
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

  const cards = applyFacets(explodeByColor(nodes), selection);
  // Thickness order: thin → thick, one header per mm, every colour of that
  // thickness side by side. Headers span the grid so density classes still
  // apply to the cards.
  const groups = groupByThickness ? groupCardsByThickness(cards) : null;

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
            fontFamily: FONT.cormorant,
            fontSize: 32,
            fontWeight: 500,
            color: '#1a1815',
            letterSpacing: '-0.02em',
            marginBottom: 10,
          }}
        >
          No pieces match
        </div>
        <div
          style={{
            fontFamily: FONT.inter,
            fontSize: 13,
            color: 'var(--styx-muted)',
          }}
        >
          Try adjusting your filters.
        </div>
      </div>
    );
  }

  return (
    <div
      className={`styx-collection-product-grid ${gridClass}`.trim()}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '40px 32px',
      }}
      data-test="product-grid"
      // GridDensityScript may add the density classes before hydration
      suppressHydrationWarning
    >
      {groups
        ? groups.map((g, gi) => (
            <Fragment key={g.label}>
              <div
                className="styx-thickness-head"
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 14,
                  paddingTop: gi === 0 ? 0 : 24,
                  paddingBottom: 4,
                  borderBottom: '1px solid var(--styx-border)',
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.cormorant,
                    fontSize: 28,
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    color: STYX.ink,
                    fontVariantNumeric: 'lining-nums',
                  }}
                >
                  {g.label}
                </span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    letterSpacing: '0.04em',
                    color: 'var(--styx-muted)',
                  }}
                >
                  {g.cards.length} {g.cards.length === 1 ? 'piece' : 'pieces'}
                </span>
              </div>
              {g.cards.map(({product, variantIndex, key}, i) => (
                <StyxProductCard
                  key={key}
                  product={product}
                  variantIndex={variantIndex}
                  index={i}
                />
              ))}
            </Fragment>
          ))
        : cards.map(({product, variantIndex, key}, i) => (
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
    $fetchIndex: Boolean!
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
      cutout: metafield(namespace: "custom", key: "cutout_image") {
        reference {
          ... on MediaImage {
            image {
              url
            }
          }
        }
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
    # Lightweight index of the ENTIRE collection (post server filters)
    # powers the exact result count + available filter pills while the main
    # products query stays paginated. Skipped in full-set mode.
    allIndex: collection(handle: $handle) @include(if: $fetchIndex) {
      id
      products(first: 250, filters: $filters) {
        nodes {
          id
          title
          chain_construction: metafield(namespace: "chain", key: "construction") {
            value
          }
          chain_thickness: metafield(namespace: "chain", key: "thickness") {
            value
          }
          spec_style: metafield(namespace: "custom", key: "spec_style") {
            value
          }
          variants(first: 30) {
            nodes {
              price {
                amount
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
    collections(first: 100) {
      edges {
        node {
          title
          handle
          cutout: metafield(namespace: "custom", key: "cutout_image") {
            reference {
              ... on MediaImage {
                image {
                  url
                }
              }
            }
          }
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
  switch (sortParam as string) {
    // Thickness is ordered client-side; price asc is the tiebreaker within a mm
    case THICKNESS_SORT:
      return {sortKey: 'PRICE', reverse: false};
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
