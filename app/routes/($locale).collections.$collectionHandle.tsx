import {useEffect, useMemo} from 'react';
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

/* ─── Chain type intros + journal links ─── */
const CHAIN_INTROS: Record<
  string,
  {intro: string; journal: string; journalTitle: string}
> = {
  cuban: {
    intro:
      'The Cuban Link is the undisputed heavyweight of gold chains. Born in Miami in the 1970s, its flat-filed interlocking links create a mirror-smooth surface that catches light from every angle. Solid, dense, and engineered to lay flat against the chest — this is the chain that built a culture.',
    journal: 'history-of-the-cuban-link',
    journalTitle: 'Read: The History of the Cuban Link →',
  },
  curb: {
    intro:
      'The Curb Chain is the oldest and most universal chain design in existence, dating back to 2600 BC in ancient Sumer. Its flat, twisted links were inspired by horse curb bits — the same geometry that controls a stallion now adorns the neck. From Victorian pocket watches to modern streetwear, the curb has never gone out of style.',
    journal: 'history-of-the-curb-chain',
    journalTitle: 'Read: The History of the Curb Chain →',
  },
  box: {
    intro:
      "The Box Chain originated in 6th-century Venice, where goldsmiths discovered that square links interlocked at 90-degree angles create a chain with perfect geometric precision. Clean, architectural, and virtually kink-proof — the box chain is the engineer's choice.",
    journal: 'history-of-the-box-chain',
    journalTitle: 'Read: The History of the Box Chain →',
  },
  rope: {
    intro:
      'The Rope Chain traces its origins to ancient Egypt, circa 2500 BCE, where artisans twisted gold wire into helical spirals that mimicked the hemp ropes of Nile river boats. Its signature twist catches light in a continuous sparkle that no flat chain can replicate. From pharaohs to hip-hop, the rope endures.',
    journal: 'history-of-the-rope-chain',
    journalTitle: 'Read: The History of the Rope Chain →',
  },
  cable: {
    intro:
      'The Cable Chain is the DNA of all chain designs — simple interlocking oval links, unchanged since the Royal Tombs of Ur. Its strength lies in its simplicity: lightweight, versatile, and nearly indestructible. The cable chain is the foundation upon which every other weave was built.',
    journal: 'history-of-the-cable-chain',
    journalTitle: 'Read: The History of the Cable Chain →',
  },
  figaro: {
    intro:
      'The Figaro Chain was born in the goldsmithing workshops of Vicenza, Italy, around 1885. Its distinctive pattern — three small links followed by one elongated link — creates a visual rhythm unlike any other chain. Named after the clever barber of Seville, the Figaro is Italian craftsmanship at its most playful.',
    journal: 'history-of-the-figaro-chain',
    journalTitle: 'Read: The History of the Figaro Chain →',
  },
  wheat: {
    intro:
      'The Wheat Chain, known in Italy as the Spiga, mimics the overlapping husks of a wheat ear — four strands of oval links woven into a tight, flexible tube. Born during the Renaissance in Vicenza, it is one of the strongest chain weaves per gram. Substantial enough to carry a heavy pendant, elegant enough to wear alone.',
    journal: 'history-of-the-wheat-chain',
    journalTitle: 'Read: The History of the Wheat Chain →',
  },
  rolo: {
    intro:
      'The Rolo Chain emerged in Victorian London around 1850 — perfectly round, symmetrical links that interlock in a clean, modern pattern. Heavier and more substantial than a cable chain, the rolo carries a satisfying weight that you feel against your chest. Minimal, bold, timeless.',
    journal: 'history-of-the-rolo-chain',
    journalTitle: 'Read: The History of the Rolo Chain →',
  },
  singapore: {
    intro:
      'The Singapore Chain was developed by Italian chain-makers in the 1970s and named for its popularity in Southeast Asian gold markets. Its twisted, braided links create a diamond-cut surface that shimmers with every movement — a chain that sparkles like no other, even in the thinnest widths.',
    journal: 'history-of-the-singapore-chain',
    journalTitle: 'Read: The History of the Singapore Chain →',
  },
  franco: {
    intro:
      'The Franco Chain was born in the goldsmithing workshops of Northern Italy in the late 1970s — a flat-sided square weave so dense it reads as a solid bar of gold. It is the chain you choose when you need mass that can carry serious pendant weight and still lie flat against the chest.',
    journal: 'history-of-the-franco-chain',
    journalTitle: 'Read: The History of the Franco Chain →',
  },
  herringbone: {
    intro:
      'The Herringbone traces back to ancient Egypt around 3000 BCE — flat, slanted links laid in a tight fishbone pattern that turns the entire chain into a mirror-smooth ribbon of liquid gold. Sleek, flexible, and unmistakable under light, it lies perfectly flat against the skin.',
    journal: 'history-of-the-herringbone-chain',
    journalTitle: 'Read: The History of the Herringbone →',
  },
  snake: {
    intro:
      "The Snake Chain emerged in Victorian London around 1840 — tightly fitted links that form a smooth, round, flexible tube with the faint banding of a serpent's skin. Completely seamless to the touch, it catches the light in one continuous, unbroken line.",
    journal: 'history-of-the-snake-chain',
    journalTitle: 'Read: The History of the Snake Chain →',
  },
  paperclip: {
    intro:
      'The Paperclip Chain is the modern minimalist — elongated, uniform oval links inspired by the humble office clip, first popularized in Oslo around 1940. Clean, architectural, and effortlessly contemporary, it wears as well on its own as it does carrying a charm.',
    journal: 'history-of-the-paperclip-chain',
    journalTitle: 'Read: The History of the Paperclip →',
  },
  '10k-gold': {
    intro:
      '10K gold is 41.7% pure gold alloyed with copper, silver, and zinc — making it the most durable karat we carry. Its hardness means thinner chains hold up to daily wear without stretching or deforming. The color is a refined, pale champagne-gold. For everyday chains, 10K is the workhorse: real gold, built to last, priced honestly.',
    journal: 'understanding-gold-karats',
    journalTitle: 'Read: Understanding Gold Karats — 10K to 24K →',
  },
  '14k-gold': {
    intro:
      '14K gold is 58.3% pure gold — the American standard for fine jewelry. Richer and warmer in color than 10K, with enough alloy to remain durable for daily wear. This is the sweet spot: unmistakably gold, strong enough for any chain style, and the most popular karat in the United States for good reason.',
    journal: 'understanding-gold-karats',
    journalTitle: 'Read: Understanding Gold Karats — 10K to 24K →',
  },
};
import {FILTER_URL_PREFIX, type SortParam} from '~/components/SortFilter';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {CACHE_SHORT, routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';
import {getStyxSeoMeta} from '~/lib/seo-meta';
import {parseAsCurrency, validateLocale} from '~/lib/utils';

export const headers = routeHeaders;

export async function loader({params, request, context}: LoaderFunctionArgs) {
  validateLocale(params);
  const {collectionHandle} = params;
  const locale = context.storefront.i18n;

  invariant(collectionHandle, 'Missing collectionHandle param');

  const searchParams = new URL(request.url).searchParams;

  const {sortKey, reverse} = getSortValuesFromParam(
    (searchParams.get('sort') as SortParam) || 'price-low-high',
  );

  // Server-side filters (`filter.*` params → Storefront API ProductFilter).
  // On this store only `price` and `available` have Search & Discovery filter
  // definitions, so only those actually narrow the query — the mobile menu's
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

  // Client-side pills (type/color/karat/width/construction) have NO working
  // Storefront API filter on this store (productType/tag/variantOption/
  // productMetafield filters are silently ignored without S&D definitions).
  // When any is active we bypass pagination and fetch the FULL collection
  // (≤ ~115 products) so client filtering and counts are complete.
  const clientFilters = resolveClientFilters(searchParams, collectionHandle);
  const fullSet = clientFilters.any;

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

const SORT_OPTIONS: {label: string; value: SortParam | 'default'}[] = [
  {label: 'Price ↑', value: 'price-low-high'},
  {label: 'Price ↓', value: 'price-high-low'},
  {label: 'Newest', value: 'newest'},
  {label: 'Popular', value: 'best-selling'},
];

/* ═══════════════════════════════════════════════════════════════
   Filter helpers — extract available filter values from products
   ═══════════════════════════════════════════════════════════════ */

const COLOR_HEX: Record<string, string> = {
  'Yellow Gold': '#C5A059',
  'Rose Gold': '#C08572',
  'White Gold': '#D4D2CC',
};

// Metal collections pre-select their color filter so e.g. /collections/white-gold
// opens showing only white-gold variants.
const METAL_COLLECTION_COLOR: Record<string, string> = {
  'yellow-gold': 'Yellow Gold',
  'white-gold': 'White Gold',
  'rose-gold': 'Rose Gold',
};

/* ═══════════════════════════════════════════════════════════════
   Filter state lives in the URL (shareable / bookmarkable / back-safe)

   Two kinds of filters:
   • SERVER filters — `filter.*` params parsed by the loader into Storefront
     API ProductFilters. Only `price` (and `available`) have Search &
     Discovery definitions on this store, so only those work server-side.
   • CLIENT pills — `type`, `color`, `karat`, `width`, `construction`
     params. The API silently ignores productType/tag/variantOption/
     productMetafield filters here, so these are applied client-side over
     the FULL collection set (loader fetches first: 250 when any is active).
   ═══════════════════════════════════════════════════════════════ */

// Collections max out around ~115 products, so one 250-product page always
// covers the complete set when client-side pill filtering is active.
const FULL_SET_PAGE_SIZE = 250;

const CLIENT_FILTER_KEYS = [
  'type',
  'color',
  'karat',
  'width',
  'construction',
] as const;

type ClientFilters = {
  type: string | null;
  color: string | null;
  karat: string | null;
  width: string | null;
  construction: string | null;
  any: boolean;
};

function resolveClientFilters(
  searchParams: URLSearchParams,
  collectionHandle: string,
): ClientFilters {
  const get = (key: string) => {
    const v = searchParams.get(key);
    return v && v !== 'all' ? v : null;
  };
  // Metal collections preset their color; `color=all` is the explicit
  // "preset toggled off" sentinel.
  const presetColor = METAL_COLLECTION_COLOR[collectionHandle] ?? null;
  const colorRaw = searchParams.get('color');
  const color = colorRaw === 'all' ? null : colorRaw || presetColor;

  const values = {
    type: get('type'),
    color,
    karat: get('karat'),
    width: get('width'),
    construction: get('construction'),
  };
  return {...values, any: Object.values(values).some(Boolean)};
}

// Thickness ranges for filter pills
const THICKNESS_RANGES = [
  {label: 'Under 1mm', min: 0, max: 1},
  {label: '1–2mm', min: 1, max: 2},
  {label: '2–3mm', min: 2, max: 3},
  {label: '3–5mm', min: 3, max: 5},
  {label: '5–8mm', min: 5, max: 8},
  {label: '8–10mm', min: 8, max: 10},
  {label: '10mm+', min: 10, max: 999},
];

function getThicknessMm(title: string): number | null {
  const m = title?.match(/(\d+(?:\.\d+)?)\s*mm/i);
  return m ? parseFloat(m[1]) : null;
}

// Karat lives in the product title (separate products per karat, not a variant
// option), so parse it from there — falling back to a Karat variant option if
// one ever exists.
function getKaratLabel(title: string): string | null {
  if (/18\s*k/i.test(title)) return '18K';
  if (/14\s*k/i.test(title)) return '14K';
  if (/10\s*k/i.test(title)) return '10K';
  return null;
}

function cardKarat(product: any, variant: any): string | null {
  const opt = variant?.selectedOptions?.find((o: any) => o.name === 'Karat');
  if (opt?.value) {
    const m = String(opt.value).match(/(\d+)/);
    return m ? `${m[1]}K` : opt.value;
  }
  return getKaratLabel(product?.title || '');
}

// Normalize construction to a single canonical value so casing/whitespace
// differences ("solid" vs "Solid") don't create a phantom extra filter pill.
function normalizeConstruction(product: any): string {
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
function cardType(product: any): 'Necklace' | 'Bracelet' {
  return /bracelet/i.test(product?.title || '') ? 'Bracelet' : 'Necklace';
}

function extractFilters(cards: ReturnType<typeof explodeByColor>) {
  const colors = new Set<string>();
  const karats = new Set<string>();
  const thicknessRangesPresent = new Set<string>();
  const constructions = new Set<string>();
  const types = new Set<string>();

  for (const {product, variantIndex} of cards) {
    const variant = product.variants?.nodes?.[variantIndex];
    if (!variant) continue;

    types.add(cardType(product));

    for (const opt of variant.selectedOptions ?? []) {
      if (opt.name === 'Color') colors.add(opt.value);
    }

    // Karat comes from the title (separate products per karat)
    const k = cardKarat(product, variant);
    if (k) karats.add(k);

    // Map thickness to range bucket
    const mm = getThicknessMm(product.title || '');
    if (mm !== null) {
      for (const range of THICKNESS_RANGES) {
        if (mm >= range.min && mm < range.max) {
          thicknessRangesPresent.add(range.label);
          break;
        }
      }
    }

    // Construction — normalized so we only ever surface distinct builds
    // (the Solid/Hollow filter then only shows when both are actually present)
    constructions.add(normalizeConstruction(product));
  }

  // Return thickness ranges in order, only those that have products
  const thicknesses = THICKNESS_RANGES.filter((r) =>
    thicknessRangesPresent.has(r.label),
  ).map((r) => r.label);

  return {
    colors: [...colors].sort(),
    karats: [...karats].sort((a, b) => parseInt(a) - parseInt(b)),
    thicknesses,
    constructions: [...constructions].sort(),
    // Necklace first, Bracelet second — only those actually present
    types: ['Necklace', 'Bracelet'].filter((t) => types.has(t)),
  };
}

function applyFilters(
  cards: ReturnType<typeof explodeByColor>,
  filters: {
    color: string | null;
    karat: string | null;
    thickness: string | null;
    construction: string | null;
    type?: string | null;
  },
) {
  return cards.filter(({product, variantIndex}) => {
    const variant = product.variants?.nodes?.[variantIndex];
    if (!variant) return false;

    if (filters.type) {
      if (cardType(product) !== filters.type) return false;
    }

    if (filters.color) {
      const colorOpt = variant.selectedOptions?.find(
        (o: any) => o.name === 'Color',
      );
      if (colorOpt?.value !== filters.color) return false;
    }

    if (filters.karat) {
      if (cardKarat(product, variant) !== filters.karat) return false;
    }

    if (filters.thickness) {
      const mm = getThicknessMm(product.title || '');
      if (mm === null) return false;
      const range = THICKNESS_RANGES.find((r) => r.label === filters.thickness);
      if (!range || mm < range.min || mm >= range.max) return false;
    }

    if (filters.construction) {
      if (normalizeConstruction(product) !== filters.construction) return false;
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
   Weave directory — all 13 chain families, shown on the Chains archive
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
  const currentSort = searchParams.get('sort') || 'price-low-high';
  const collectionHandle = (collection as any).handle as string;
  const presetColor = METAL_COLLECTION_COLOR[collectionHandle] ?? null;

  // All filter state is derived from the URL — shareable, bookmarkable,
  // back-button safe. Pills toggle their param via setSearchParams below.
  const clientFilters = resolveClientFilters(searchParams, collectionHandle);
  const {
    type: filterType,
    color: filterColor,
    karat: filterKarat,
    width: filterThickness,
    construction: filterConstruction,
  } = clientFilters;

  // Complete collection set (post server filters): in full-set mode the main
  // products query holds everything; otherwise use the lightweight index.
  // Drives the result count + which pills are shown — never just loaded pages.
  const fullSetCards = useMemo(() => {
    const nodes =
      fullSet || !allProductIndex ? collection.products.nodes : allProductIndex;
    return explodeByColor(nodes as any[]);
  }, [fullSet, allProductIndex, collection.products.nodes]);

  const availableFilters = useMemo(
    () => extractFilters(fullSetCards),
    [fullSetCards],
  );

  // Exact count over the COMPLETE filtered set (not loaded pages)
  const filteredCount = useMemo(
    () =>
      applyFilters(fullSetCards, {
        color: filterColor,
        karat: filterKarat,
        thickness: filterThickness,
        construction: filterConstruction,
        type: filterType,
      }).length,
    [
      fullSetCards,
      filterColor,
      filterKarat,
      filterThickness,
      filterConstruction,
      filterType,
    ],
  );

  const activeFilterCount =
    (filterColor ? 1 : 0) +
    (filterKarat ? 1 : 0) +
    (filterThickness ? 1 : 0) +
    (filterConstruction ? 1 : 0) +
    (filterType ? 1 : 0) +
    appliedFilters.length;

  // Toggle a client pill: write/remove its URL param (resets pagination)
  const setClientFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    params.delete('cursor');
    params.delete('direction');
    if (value === null) {
      // `color=all` keeps a metal collection's preset from re-applying
      if (key === 'color' && presetColor) params.set('color', 'all');
      else params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params, {preventScrollReset: true});
  };

  // Remove a server-side `filter.*` param (e.g. the mobile menu's price bucket)
  const removeServerFilter = (filter: ProductFilter) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(filter).forEach(([key, value]) => {
      params.delete(FILTER_URL_PREFIX + key, JSON.stringify(value));
    });
    params.delete('cursor');
    params.delete('direction');
    setSearchParams(params, {preventScrollReset: true});
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams);
    for (const key of CLIENT_FILTER_KEYS) params.delete(key);
    for (const key of [...params.keys()]) {
      if (key.startsWith(FILTER_URL_PREFIX)) params.delete(key);
    }
    params.delete('cursor');
    params.delete('direction');
    if (presetColor) params.set('color', 'all');
    setSearchParams(params, {preventScrollReset: true});
  };

  // Chain close-up cutout (transparent PNG) for the hero — from the
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
          className="styx-collection-hero"
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '28px 56px 28px',
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
              style={{
                fontFamily: FONT.cinzel,
                fontSize: (collection as any).handle === 'chains' ? 44 : 56,
                fontWeight: 400,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                color: STYX.ink,
                lineHeight: 0.95,
                margin: 0,
              }}
            >
              {collection.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Shop by Weave — every chain family, on the all-chains archive ── */}
      {(collection as any).handle === 'chains' && (
        <div
          style={{
            borderBottom: `1px solid ${STYX.line}`,
            background: STYX.paper,
          }}
        >
          <div
            className="styx-weave-strip"
            style={{
              maxWidth: 1440,
              margin: '0 auto',
              padding: '32px 56px 36px',
            }}
          >
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 10,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: STYX.silt,
                marginBottom: 18,
              }}
            >
              Shop by Weave
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
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: '16px 10px 14px',
                    background: STYX.bone,
                    border: `1px solid ${STYX.line}`,
                    textDecoration: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = STYX.gold;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = STYX.line;
                  }}
                >
                  {weaveCutout(w.handle) ? (
                    <img
                      src={weaveCutout(w.handle)}
                      alt={`${w.label} chain close-up`}
                      loading="lazy"
                      style={{
                        height: 30,
                        maxWidth: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <div style={{height: 30}} />
                  )}
                  <span
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: STYX.ink,
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {w.label}
                  </span>
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
              maxWidth: 1440,
              margin: '0 auto',
              padding: '28px 56px',
              display: 'flex',
              gap: 32,
              alignItems: 'baseline',
              borderBottom: `1px solid ${STYX.line}`,
            }}
          >
            <p
              style={{
                fontFamily: FONT.cormorant,
                fontSize: 18,
                lineHeight: 1.7,
                color: STYX.silt,
                margin: 0,
                flex: 1,
              }}
            >
              {info.intro}
            </p>
            <Link
              to={`/journal/${info.journal}`}
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 11,
                letterSpacing: '0.12em',
                color: STYX.gold,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                borderBottom: `1px solid ${STYX.gold}`,
                paddingBottom: 2,
              }}
            >
              {info.journalTitle}
            </Link>
          </div>
        );
      })()}

      {/* ── Sticky Filter Toolbar — pins exactly below the (auto-hiding) header ── */}
      <div
        style={{
          position: 'sticky',
          top: 'var(--styx-header-offset, 64px)',
          zIndex: 5,
          background: STYX.paper,
          borderBottom: `1px solid ${STYX.line}`,
          transition: 'top 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          className="styx-collection-toolbar"
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
                {filteredCount} Piece
                {filteredCount !== 1 ? 's' : ''}
              </span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
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

            <div
              className="styx-collection-sort"
              style={{display: 'flex', alignItems: 'center', gap: 0}}
            >
              {SORT_OPTIONS.map((opt, i) => {
                const isActive = currentSort === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      if (opt.value === 'price-low-high') {
                        params.delete('sort');
                      } else {
                        params.set('sort', opt.value);
                      }
                      // sort changes restart pagination
                      params.delete('cursor');
                      params.delete('direction');
                      setSearchParams(params, {preventScrollReset: true});
                    }}
                    style={{
                      fontFamily: FONT.inter,
                      fontSize: 10,
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: isActive ? STYX.bone : STYX.silt,
                      background: isActive ? STYX.ink : 'transparent',
                      border: `1px solid ${isActive ? STYX.ink : STYX.line}`,
                      borderRight:
                        i < SORT_OPTIONS.length - 1 ? 'none' : undefined,
                      padding: '7px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Filter pills */}
          <div
            className="styx-collection-filters"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            {/* Type filter (Necklaces / Bracelets) */}
            {availableFilters.types.length > 1 && (
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
                  Type
                </span>
                {availableFilters.types.map((t) => (
                  <FilterPill
                    key={t}
                    label={t === 'Necklace' ? 'Necklaces' : 'Bracelets'}
                    active={filterType === t}
                    onClick={() =>
                      setClientFilter('type', filterType === t ? null : t)
                    }
                  />
                ))}
              </div>
            )}

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
                      setClientFilter(
                        'color',
                        filterColor === color ? null : color,
                      )
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
                      setClientFilter('karat', filterKarat === k ? null : k)
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
                      setClientFilter('width', filterThickness === t ? null : t)
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
                      setClientFilter(
                        'construction',
                        filterConstruction === c ? null : c,
                      )
                    }
                  />
                ))}
              </div>
            )}

            {/* Active server-side filters (e.g. price bucket from the
                mobile menu) — click to remove */}
            {appliedFilters.length > 0 && (
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
                  Price
                </span>
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
              maxWidth: 1440,
              margin: '0 auto',
              padding: '32px 56px 120px',
            }}
          >
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
              filterType={filterType}
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
  filterType,
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
  filterType: string | null;
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
    type: filterType,
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
      className="styx-collection-product-grid"
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
    # Lightweight index of the ENTIRE collection (post server filters) —
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
          variants(first: 30) {
            nodes {
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
