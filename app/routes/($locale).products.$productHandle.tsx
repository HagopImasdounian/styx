import {useState, useRef, useCallback, useEffect, Suspense} from 'react';
import {Disclosure, Listbox} from '@headlessui/react';
import {
    type MetaArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import {data, useLoaderData, Await, useRouteLoaderData} from 'react-router';
import {
  getSeoMeta,
  Money,
  Image,
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
  getProductOptions,
  type MappedProductOptions,
} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';
import clsx from 'clsx';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';

import type {ProductFragment} from 'storefrontapi.generated';
import type {RootLoader} from '~/root';
import {Link} from '~/components/Link';
import {AddToCartButton} from '~/components/AddToCartButton';
import {IconCaret, IconCheck, IconClose} from '~/components/Icon';
import {getExcerpt, validateLocale} from '~/lib/utils';
import {seoPayload} from '~/lib/seo.server';
import {getStyxSeoMeta} from '~/lib/seo-meta';
import {computeGoldPrice, KARAT_PURITY} from '~/lib/gold';
import type {Storefront} from '~/lib/type';
import {trackProductView, trackVariantSelect} from '~/components/GTMDataLayer';
import {CACHE_SHORT, routeHeaders} from '~/data/cache';
import {MEDIA_FRAGMENT, PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {
  STYX,
  FONT,
  GoldTicker,
  StyxNav,
  StyxFooter,
  StyxLabel,
  CTAButton,
  StyxProductCard,
  RecommendedProducts,
  Obol,
  ActualSizeChainStrip,
  RecentlyViewed,
  recordRecentlyViewed,
} from '~/components/styx';
import type {CrossSellProduct} from '~/components/styx';
import {CompareButton} from '~/components/styx/CompareButton';
import {PrintListButton} from '~/components/styx/PrintListButton';
import {useWishlist} from '~/context/WishlistContext';

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  validateLocale(args.params);
  const {productHandle} = args.params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  // PDP prices float with the gold spot price — never cache longer than
  // CACHE_SHORT (max-age=1 with a short stale-while-revalidate window).
  return data(
    {...deferredData, ...criticalData},
    {headers: {'Cache-Control': CACHE_SHORT}},
  );
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({
  params,
  request,
  context,
}: LoaderFunctionArgs) {
  const {productHandle} = params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  const selectedOptions = getSelectedProductOptions(request);

  const [{shop, product}] = await Promise.all([
    context.storefront.query(PRODUCT_QUERY, {
      variables: {
        handle: productHandle,
        selectedOptions,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response('product', {status: 404});
  }

  // Find the chain-type collection for recommendations
  const excludeCollections = new Set(['chains', '10k-gold', '14k-gold', 'frontpage', 'automated-collection']);
  const chainCollection = product.collections?.nodes?.find(
    (c: any) => !excludeCollections.has(c.handle),
  );
  const recommended = getRecommendedProducts(context.storefront, product.id, chainCollection?.handle);

  // Cross-sell: nearest same-style/construction pieces + matching bracelet/necklace.
  // Deliberately NOT awaited — it's a below-fold module and must not block TTFB.
  // Streamed to the client and rendered via <Suspense>/<Await> like `recommended`.
  const crossSell = getCrossSellProducts(context.storefront, product);

  const selectedVariant = product.selectedOrFirstAvailableVariant ?? {};
  const variants = getAdjacentAndFirstAvailableVariants(product);

  const seo = seoPayload.product({
    product: {...product, variants},
    selectedVariant,
    url: request.url,
  });

  return {
    product,
    variants,
    shop,
    storeDomain: shop.primaryDomain.url,
    recommended,
    crossSell,
    seo,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData(args: LoaderFunctionArgs) {
  // Put any API calls that are not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getStyxSeoMeta(...matches.map((match) => (match.data as any).seo));
};

/* ─────────────────────────── Main Product Page ─────────────────────────── */

export default function Product() {
  const {product, shop, recommended, crossSell, variants} =
    useLoaderData<typeof loader>();
  const {media, title, vendor, descriptionHtml} = product;
  const {shippingPolicy, refundPolicy} = shop;
  const [offerOpen, setOfferOpen] = useState(false);
  // 'offer' = haggling on an in-stock piece; 'request' = backorder a sold-out size
  const [offerMode, setOfferMode] = useState<'offer' | 'request'>('offer');
  // Inline submission state for the offer/request form (no native alert()s)
  const [offerStatus, setOfferStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const wishlist = useWishlist();
  const wished = wishlist.has(product.handle);

  // Gold data from root loader
  const rootData = useRouteLoaderData<RootLoader>('root');
  const goldData = (rootData as any)?.goldData;
  const spotPerOz = goldData?.spotPerOz ?? 4700;

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    variants,
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Track product view in data layer
  useEffect(() => {
    trackProductView({
      id: product.id,
      title: product.title,
      vendor: product.vendor,
      price: selectedVariant?.price?.amount || '0',
      variantId: selectedVariant?.id,
      variantTitle: selectedVariant?.title,
    });
  }, [product.id, selectedVariant?.id]);

  // Track variant selection (skip initial load)
  const initialVariantRef = useRef(selectedVariant?.id);
  useEffect(() => {
    if (selectedVariant?.id && selectedVariant.id !== initialVariantRef.current) {
      trackVariantSelect({
        id: product.id,
        title: product.title,
        price: selectedVariant?.price?.amount || '0',
        variantTitle: selectedVariant?.title,
        optionName: selectedVariant?.selectedOptions?.[0]?.name,
        optionValue: selectedVariant?.selectedOptions?.[0]?.value,
      });
    }
  }, [selectedVariant?.id]);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const isOutOfStock = !selectedVariant?.availableForSale;
  const isOnSale =
    selectedVariant?.price?.amount &&
    selectedVariant?.compareAtPrice?.amount &&
    selectedVariant?.price?.amount < selectedVariant?.compareAtPrice?.amount;

  // Extract metafields
  const p = product as any;
  const weightGrams = p.weight_grams?.value ? parseFloat(p.weight_grams.value) : null;
  // Karat: metafield > title parsing > default 10K
  const metafieldKarat = p.karat?.value
    ? parseInt(p.karat.value, 10)
    : /18\s*k/i.test(title) ? 18
    : /14\s*k/i.test(title) ? 14
    : 10;
  const chainThickness = p.chain_thickness?.value
    || (title.match(/(\d+(?:\.\d+)?)\s*mm/i)?.[0] ?? null);
  const chainConstruction = p.chain_construction?.value || null;
  const chainStyle = p.chain_style?.value || null;
  const laborCost = p.labor_cost?.value ? parseFloat(p.labor_cost.value) : 280;
  const marginPercent = p.margin_percent?.value ? parseFloat(p.margin_percent.value) / 100 : 0.55;
  const chainOrigin = p.chain_origin?.value || null;
  const yearInvented = p.year_invented?.value || null;
  const romanNumeral = p.roman_numeral?.value || null;
  const chainBlurb = p.chain_blurb?.value || null;
  const storyHeading = p.story_heading?.value || null;
  const storyBody = p.story_body?.value || null;
  const pullQuote = p.pull_quote?.value || null;
  const pullQuoteAttr = p.pull_quote_attr?.value || null;
  // spec_weave / spec_profile intentionally not shown — redundant with Chain Style
  const specClasp = p.spec_clasp?.value || null;
  const specCast = p.spec_cast?.value || null;

  // Use variant weight if available (from Shopify variant grams), else metafield
  const variantWeight = (selectedVariant as any)?.weight
    ? parseFloat((selectedVariant as any).weight)
    : null;

  // Variant weight takes priority (changes with length), then metafield
  // No fake weights — only show transparency when we have real data
  const displayWeight = variantWeight || weightGrams || null;

  // Detect karat from selected variant options (e.g. "14k" → 14)
  const karatOption = selectedVariant?.selectedOptions?.find(
    (o: any) => o.name.toLowerCase() === 'karat',
  );
  const karat = karatOption
    ? parseInt(karatOption.value, 10) || metafieldKarat
    : metafieldKarat;

  // Detect color from selected variant
  const colorOption = selectedVariant?.selectedOptions?.find(
    (o: any) => o.name.toLowerCase() === 'color',
  );
  const selectedColor = colorOption?.value || null;

  // Detect length (the price-affecting option) for variant-aware comparison
  const lengthOption = selectedVariant?.selectedOptions?.find(
    (o: any) => o.name.toLowerCase() === 'length',
  );
  const selectedLength = lengthOption?.value || null;

  // Record this product for the Recently Viewed strip (client-only effect).
  // Keyed on handle so a variant change doesn't churn the list; the strip
  // below excludes the current product from its own display.
  useEffect(() => {
    const firstMedia = media?.nodes?.[0] as any;
    const img =
      (selectedVariant as any)?.image?.url ||
      firstMedia?.image?.url ||
      firstMedia?.previewImage?.url ||
      null;
    recordRecentlyViewed({
      handle: product.handle,
      title: product.title,
      image: img,
      price: selectedVariant?.price?.amount ?? null,
      currencyCode: selectedVariant?.price?.currencyCode ?? null,
      karat,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.handle]);

  // All variants known client-side (selected + adjacent + first-selectable per
  // option value, via getAdjacentAndFirstAvailableVariants). Enough to price
  // every Length pill against the currently-selected Color.
  const knownVariants: any[] = [
    selectedVariant,
    ...(((variants as any[]) ?? []) as any[]),
  ].filter(Boolean);
  const findVariantForLength = (lengthName: string) => {
    const hasLength = (v: any) =>
      v?.selectedOptions?.some(
        (o: any) =>
          o.name?.toLowerCase() === 'length' && o.value === lengthName,
      );
    const matchesColor = (v: any) =>
      !selectedColor ||
      v?.selectedOptions?.some(
        (o: any) =>
          o.name?.toLowerCase() === 'color' && o.value === selectedColor,
      );
    return (
      knownVariants.find((v) => hasLength(v) && matchesColor(v)) ??
      knownVariants.find(hasLength) ??
      null
    );
  };

  // Compute gold transparency breakdown (only when we have weight)
  const hasTransparency = weightGrams !== null && weightGrams > 0;
  const goldBreakdown = hasTransparency
    ? computeGoldPrice({spotPerOz, weight: weightGrams!, karat, laborCost, margin: marginPercent})
    : null;

  // Per-gram price for the selected karat
  const selectedPurity = KARAT_PURITY[karat] ?? 0.75;
  const perGramSelected = (spotPerOz / 31.1035) * selectedPurity;

  // Gallery — filter media to the selected color. An image is shown when its
  // alt text either names the selected color or names no color at all
  // (color-neutral lifestyle/detail shots stay visible for every variant).
  const mediaNodes = media?.nodes ?? [];
  const COLOR_NAMES = ['yellow gold', 'white gold', 'rose gold'];
  const mediaAlt = (m: any): string =>
    String(m?.alt || m?.image?.altText || '').toLowerCase();
  const colorFilteredMedia = selectedColor
    ? mediaNodes.filter((m: any) => {
        const alt = mediaAlt(m);
        const named = COLOR_NAMES.find((c) => alt.includes(c));
        return !named || named === selectedColor.toLowerCase();
      })
    : mediaNodes;

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      {/* ── Breadcrumb Bar ── */}
      {(() => {
        // Find the chain-type collection (exclude chains, 10k-gold, 14k-gold, frontpage)
        const exclude = new Set(['chains', '10k-gold', '14k-gold', 'frontpage', 'automated-collection']);
        const chainCollection = (product as any).collections?.nodes?.find(
          (c: any) => !exclude.has(c.handle),
        );
        return (
          <div style={{borderBottom: `1px solid ${STYX.line}`}}>
            <div className="styx-product-breadcrumb" style={{maxWidth: 1440, margin: '0 auto', padding: '20px 56px'}}>
              {/* Full trail — desktop / tablet */}
              <nav
                className="styx-breadcrumb-full"
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: STYX.silt,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Link to="/" style={{color: STYX.silt, textDecoration: 'none'}}>Home</Link>
                <span style={{opacity: 0.4}}>/</span>
                {chainCollection ? (
                  <>
                    <Link to={`/collections/${chainCollection.handle}`} style={{color: STYX.silt, textDecoration: 'none'}}>
                      {chainCollection.title}
                    </Link>
                    <span style={{opacity: 0.4}}>/</span>
                  </>
                ) : (
                  <>
                    <Link to="/collections" style={{color: STYX.silt, textDecoration: 'none'}}>Collections</Link>
                    <span style={{opacity: 0.4}}>/</span>
                  </>
                )}
                <span style={{color: STYX.ink}}>{title}</span>
              </nav>
              {/* Single back link — mobile (product name is in the H1 right below) */}
              <nav
                className="styx-breadcrumb-back"
                style={{
                  display: 'none',
                  fontFamily: FONT.cinzel,
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                <Link
                  to={chainCollection ? `/collections/${chainCollection.handle}` : '/collections'}
                  style={{
                    color: STYX.silt,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span aria-hidden>&larr;</span>
                  {chainCollection ? chainCollection.title : 'Collections'}
                </Link>
              </nav>
            </div>
          </div>
        );
      })()}

      {/* ── Main Two-Column Grid ──
          Three direct grid children so mobile can interleave with CSS `order`:
          lead image → buy box → remaining gallery (see app.css ≤48em overrides).
          Desktop placement is explicit: gallery rows 1–2 in col 1 (8px row gap
          reproduces the old flex-column gap), info spans both rows in col 2. */}
      <div
        className="styx-product-grid"
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          columnGap: 80,
          rowGap: 8,
          padding: '64px 56px 100px',
          alignItems: 'start',
        }}
      >
        {/* ── Gallery — Lead Image (first on mobile) ── */}
        <div className="styx-gallery-lead" style={{gridColumn: '1 / 2', gridRow: '1'}}>
          {/* Lead image — variant image if available, else first color-matched media */}
          {(() => {
            const variantImg = (selectedVariant as any)?.image;
            const firstMedia = colorFilteredMedia[0];
            const leadImage = variantImg || (firstMedia && 'image' in firstMedia ? firstMedia.image : firstMedia?.previewImage);
            return (
              <div
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#FFFFFF',
                  ...(leadImage?.width && leadImage?.height && leadImage.width / leadImage.height > 1.3
                    ? {aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center'}
                    : {}),
                }}
              >
                {leadImage ? (
                  <ZoomableImage
                    data={leadImage}
                    alt={title}
                    sizes="(min-width: 1200px) 55vw, 90vw"
                    loading="eager"
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: STYX.silt2,
                      fontFamily: FONT.cinzel,
                      fontSize: 14,
                    }}
                  >
                    No Image
                  </div>
                )}

                {/* Year / Origin Badge */}
                {(romanNumeral || yearInvented) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 24,
                      left: 24,
                      background: STYX.bone,
                      border: `1px solid ${STYX.line}`,
                      padding: '14px 18px',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONT.cinzel,
                        fontSize: 10,
                        letterSpacing: '0.3em',
                        color: STYX.silt,
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      Invented
                    </div>
                    <div
                      style={{
                        fontFamily: FONT.cinzel,
                        fontSize: 22,
                        letterSpacing: '0.12em',
                        color: STYX.ink,
                        fontWeight: 600,
                      }}
                    >
                      {romanNumeral || yearInvented}
                    </div>
                    {yearInvented && romanNumeral && (
                      <div style={{fontFamily: FONT.mono, fontSize: 10, color: STYX.silt, marginTop: 6}}>
                        = {yearInvented}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Gallery — Remaining Images (after buy box on mobile) ── */}
        <div
          className="styx-gallery-rest"
          style={{
            gridColumn: '1 / 2',
            gridRow: '2',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* Remaining media — large, stacked; skip whichever image leads */}
          {(() => {
            const variantImg = (selectedVariant as any)?.image;
            const leadUrl =
              variantImg?.url ||
              colorFilteredMedia[0]?.image?.url ||
              colorFilteredMedia[0]?.previewImage?.url;
            return colorFilteredMedia
              .filter((m: any) => (m.image?.url || m.previewImage?.url) !== leadUrl)
              .slice(0, 7);
          })().map((m: any, i: number) => {
            const img = m.image || m.previewImage;
            if (!img) return null;
            return (
              <div
                key={m.id || i}
                style={{
                  background: STYX.paper,
                }}
              >
                <ZoomableImage
                  data={img}
                  alt={title}
                  sizes="(min-width: 1200px) 55vw, 90vw"
                  loading="lazy"
                />
              </div>
            );
          })}

        </div>

        {/* ── Right Column — Product Info (sticky) ── */}
        <div
          className="styx-product-info"
          style={{
            gridColumn: '2 / 3',
            gridRow: '1 / 3',
            position: 'sticky',
            top: 88,
            paddingTop: 8,
          }}
        >
          {/* Origin Label (no collection name) */}
          {chainOrigin && (
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 11,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: STYX.silt,
                marginBottom: 16,
              }}
            >
              {chainOrigin}{romanNumeral ? ` · ${romanNumeral}` : ''}
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 48,
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              lineHeight: 1.05,
              color: STYX.ink,
              margin: 0,
            }}
          >
            The {title}
          </h1>
          {yearInvented && (
            <div
              style={{
                fontFamily: FONT.cormorant,
                fontSize: 22,
                fontStyle: 'italic',
                color: STYX.graphite,
                marginTop: 6,
              }}
            >
              Est. {yearInvented}
            </div>
          )}

          {/* ── PRICE BLOCK ── */}
          <div style={{marginTop: 32}}>
            {/* Credit Card + Wire Transfer side by side */}
            {selectedVariant?.price && (() => {
              const basePrice = parseFloat(selectedVariant.price.amount);
              const wirePrice = basePrice * 0.96;
              const currencyCode = selectedVariant.price.currencyCode;
              const fmt = (n: number) =>
                new Intl.NumberFormat('en-US', {style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2}).format(n);
              const pureGoldWeight = displayWeight ? +(displayWeight * selectedPurity).toFixed(1) : null;
              return (
                <>
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                    }}
                  >
                    {/* Credit Card — default / emphasized */}
                    <div
                      style={{
                        flex: 1,
                        border: `1px solid ${STYX.ink}`,
                        padding: '12px 14px',
                        background: STYX.ink,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: FONT.cinzel,
                          fontSize: 9,
                          letterSpacing: '0.25em',
                          textTransform: 'uppercase',
                          color: STYX.gold,
                          marginBottom: 4,
                        }}
                      >
                        Credit Card
                      </div>
                      <div
                        style={{
                          fontFamily: FONT.cinzel,
                          fontSize: 22,
                          fontWeight: 600,
                          color: STYX.bone,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {fmt(basePrice)}
                      </div>
                      <div
                        style={{
                          fontFamily: FONT.mono,
                          fontSize: 10,
                          color: 'rgba(239,234,224,0.55)',
                          marginTop: 3,
                        }}
                      >
                        default at checkout
                      </div>
                    </div>
                    {/* Wire Transfer */}
                    <div
                      style={{
                        flex: 1,
                        border: `1px solid ${STYX.line}`,
                        padding: '12px 14px',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: FONT.cinzel,
                          fontSize: 9,
                          letterSpacing: '0.25em',
                          textTransform: 'uppercase',
                          color: STYX.silt,
                          marginBottom: 4,
                        }}
                      >
                        Wire Transfer
                      </div>
                      <div
                        style={{
                          fontFamily: FONT.cinzel,
                          fontSize: 22,
                          fontWeight: 400,
                          color: STYX.graphite,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {fmt(wirePrice)}
                      </div>
                      <div
                        style={{
                          fontFamily: FONT.mono,
                          fontSize: 10,
                          color: STYX.silt,
                          marginTop: 3,
                        }}
                      >
                        4% discount
                      </div>
                    </div>
                  </div>

                  {/* Weight row: karat + total weight */}
                  {displayWeight && (
                  <div style={{marginTop: 14}}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 16,
                        fontFamily: FONT.mono,
                        fontSize: 12,
                        color: STYX.silt,
                      }}
                    >
                      <span>{karat}K &middot; {displayWeight}g total</span>
                    </div>
                    <div
                      style={{
                        fontFamily: FONT.cormorant,
                        fontStyle: 'italic',
                        fontSize: 13,
                        color: STYX.silt2,
                        marginTop: 4,
                      }}
                    >
                      Approximate &mdash; each piece is hand-finished, so weight may vary by a few percent.
                    </div>
                  </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* ── Variant Selectors ── */}
          <div style={{marginTop: 28, display: 'flex', flexDirection: 'column', gap: 28}}>
            {productOptions
            .filter((option) => {
              // Hide "Title" option with only "Default Title" value
              if (option.name.toLowerCase() === 'title') {
                return !(option.optionValues.length === 1 && option.optionValues[0].name === 'Default Title');
              }
              return true;
            })
            .map((option, optionIndex) => {
              const isKarat = option.name.toLowerCase() === 'karat';
              const isColor = option.name.toLowerCase() === 'color';

              // Gold color swatches
              const colorSwatches: Record<string, string> = {
                'Yellow Gold': '#D4A844',
                'Rose Gold': '#C9877A',
                'White Gold': '#D5D0C8',
              };

              return (
                <div key={option.name}>
                  <div
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 11,
                      letterSpacing: '0.25em',
                      textTransform: 'uppercase',
                      color: STYX.silt,
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{option.name}</span>
                    {isKarat && (
                      <span style={{fontFamily: FONT.mono, fontSize: 10, color: STYX.silt2, letterSpacing: '0.05em', textTransform: 'none'}}>
                        ${perGramSelected.toFixed(2)}/g
                      </span>
                    )}
                    {isColor && selectedColor && (
                      <span style={{fontFamily: FONT.cormorant, fontSize: 13, fontStyle: 'italic', color: STYX.silt2, letterSpacing: 0, textTransform: 'none'}}>
                        {selectedColor}
                      </span>
                    )}
                  </div>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: isColor ? 12 : 0}}>
                    {isKarat ? (
                      /* Karat: full-width segmented control with gold accent */
                      <div style={{display: 'flex', width: '100%', border: `1px solid ${STYX.line}`}}>
                        {option.optionValues.map(
                          ({isDifferentProduct, name, variantUriQuery, handle, selected, available}) => (
                            <Link
                              key={option.name + name}
                              {...(!isDifferentProduct ? {rel: 'nofollow'} : {})}
                              to={`/products/${handle}?${variantUriQuery}`}
                              preventScrollReset
                              prefetch="intent"
                              replace
                              style={{
                                flex: 1,
                                fontFamily: FONT.cinzel,
                                fontSize: 13,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                padding: '16px 0',
                                textAlign: 'center',
                                background: selected ? STYX.ink : 'transparent',
                                color: selected ? STYX.gold : available ? STYX.ink : STYX.silt2,
                                borderRight: `1px solid ${STYX.line}`,
                                cursor: 'pointer',
                                opacity: available ? 1 : 0.5,
                                textDecoration: available ? 'none' : 'line-through',
                                textDecorationThickness: available ? undefined : '1.5px',
                                transition: 'all 0.25s ease',
                                position: 'relative',
                              }}
                              title={available ? undefined : 'Sold out — select to request this size'}
                            >
                              {name}
                              {selected && (
                                <span style={{
                                  position: 'absolute', bottom: 0, left: '20%', right: '20%',
                                  height: 2, background: STYX.gold,
                                }} />
                              )}
                            </Link>
                          ),
                        )}
                      </div>
                    ) : isColor ? (
                      /* Color: outline pills with swatch dot, gold accent when selected */
                      <div className="styx-color-pills" style={{display: 'flex', width: '100%', border: `1px solid ${STYX.line}`}}>
                        {option.optionValues.map(
                          ({isDifferentProduct, name, variantUriQuery, handle, selected, available}) => (
                            <Link
                              key={option.name + name}
                              {...(!isDifferentProduct ? {rel: 'nofollow'} : {})}
                              to={`/products/${handle}?${variantUriQuery}`}
                              preventScrollReset
                              prefetch="intent"
                              replace
                              style={{
                                flex: 1,
                                fontFamily: FONT.cinzel,
                                fontSize: 12,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                padding: '14px 0',
                                textAlign: 'center',
                                background: selected ? STYX.paper : 'transparent',
                                color: selected ? STYX.ink : available ? STYX.silt : STYX.silt2,
                                borderRight: `1px solid ${STYX.line}`,
                                cursor: 'pointer',
                                opacity: available ? 1 : 0.5,
                                textDecoration: available ? 'none' : 'line-through',
                                textDecorationThickness: available ? undefined : '1.5px',
                                transition: 'all 0.25s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                position: 'relative',
                              }}
                              title={available ? undefined : 'Sold out — select to request this color'}
                            >
                              <span
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background: colorSwatches[name] || STYX.silt2,
                                  boxShadow: 'inset 0 0 0 1px rgba(26,24,21,0.12)',
                                  flexShrink: 0,
                                }}
                              />
                              {name}
                              {selected && (
                                <span style={{
                                  position: 'absolute', bottom: 0, left: '20%', right: '20%',
                                  height: 2, background: STYX.gold,
                                }} />
                              )}
                            </Link>
                          ),
                        )}
                      </div>
                    ) : (
                      /* Default: outline pill buttons, gold underline when selected.
                         Length pills also show that length's price (current color). */
                      option.optionValues.map(
                        ({isDifferentProduct, name, variantUriQuery, handle, selected, available, swatch, firstSelectableVariant}) => {
                          const isLength = option.name.toLowerCase() === 'length';
                          const pillVariant = isLength
                            ? findVariantForLength(name) ?? firstSelectableVariant ?? null
                            : null;
                          const pillPrice =
                            isLength && available && pillVariant?.price
                              ? pillVariant.price
                              : null;
                          return (
                          <Link
                            key={option.name + name}
                            {...(!isDifferentProduct ? {rel: 'nofollow'} : {})}
                            to={`/products/${handle}?${variantUriQuery}`}
                            preventScrollReset
                            prefetch="intent"
                            replace
                            style={{
                              fontFamily: FONT.cinzel,
                              fontSize: 12,
                              letterSpacing: '0.15em',
                              textTransform: 'uppercase',
                              padding: isLength ? '10px 14px' : '12px 24px',
                              background: selected ? STYX.paper : 'transparent',
                              color: selected ? STYX.ink : available ? STYX.silt : STYX.silt2,
                              border: `1px solid ${selected ? STYX.graphite : STYX.line}`,
                              borderBottom: selected ? `2px solid ${STYX.gold}` : `1px solid ${STYX.line}`,
                              cursor: 'pointer',
                              opacity: available ? 1 : 0.5,
                              textDecoration: available ? 'none' : 'line-through',
                              textDecorationThickness: available ? undefined : '1.5px',
                              transition: 'all 0.2s ease',
                              ...(isLength
                                ? {
                                    display: 'flex',
                                    flexDirection: 'column' as const,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 3,
                                    flex: '1 0 auto',
                                    textAlign: 'center' as const,
                                  }
                                : {}),
                            }}
                            title={available ? undefined : 'Sold out — select to request this size'}
                          >
                            {swatch?.color || swatch?.image?.previewImage?.url ? (
                              <ProductOptionSwatch swatch={swatch} name={name} />
                            ) : (
                              name
                            )}
                            {isLength && (
                              <span
                                className="styx-length-pill-price"
                                style={{
                                  fontFamily: FONT.mono,
                                  fontSize: 10,
                                  letterSpacing: '0.04em',
                                  textTransform: 'none',
                                  textDecoration: 'none',
                                  color: selected ? STYX.graphite : STYX.silt2,
                                  lineHeight: 1,
                                }}
                              >
                                {pillPrice ? (
                                  <Money data={pillPrice} as="span" withoutTrailingZeros />
                                ) : (
                                  '—'
                                )}
                              </span>
                            )}
                          </Link>
                          );
                        },
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Blurb / Description */}
          {(chainBlurb || descriptionHtml) && (
            <div
              style={{
                fontFamily: FONT.cormorant,
                fontSize: 18,
                color: STYX.graphite,
                lineHeight: 1.7,
                marginTop: 28,
              }}
            >
              {chainBlurb && <p style={{margin: '0 0 12px', fontStyle: 'italic'}}>{chainBlurb}</p>}
              {descriptionHtml && (
                <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
              )}
            </div>
          )}

          {/* Journal Link */}
          {chainOrigin && (
            <Link
              to={`/journal/${chainOrigin.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 16,
                fontFamily: FONT.cormorant,
                fontSize: 15,
                fontStyle: 'italic',
                color: STYX.gold,
                textDecoration: 'none',
                borderBottom: `1px solid ${STYX.gold}`,
                paddingBottom: 2,
              }}
            >
              Read the history of the {chainOrigin} →
            </Link>
          )}

          {/* ── Shipping line ── */}
          <div
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 11,
              fontVariant: 'small-caps',
              letterSpacing: '0.2em',
              color: STYX.gold,
              textAlign: 'center',
              marginTop: 32,
            }}
          >
            Free Shipping &middot; Insured &middot; Priority
          </div>

          {/* ── Add to Cart ── */}
          {selectedVariant && (
            <div style={{marginTop: 16}}>
              <div style={{display: 'flex', gap: 12}}>
                {isOutOfStock ? (
                  <div style={{flex: 1}}>
                    <button
                      type="button"
                      onClick={() => {
                        setOfferMode('request');
                        setOfferStatus('idle');
                        setOfferOpen(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '22px 24px',
                        background: STYX.ink,
                        color: STYX.bone,
                        fontFamily: FONT.cinzel,
                        fontSize: 13,
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        transition: 'all 0.25s ease',
                      }}
                    >
                      <span>Request This Size</span>
                      <span style={{opacity: 0.4}}>&middot;</span>
                      <span style={{color: STYX.gold}}>Made to Order</span>
                    </button>
                    <div
                      style={{
                        marginTop: 10,
                        fontFamily: FONT.mono,
                        fontSize: 10,
                        letterSpacing: '0.06em',
                        color: STYX.silt,
                        textAlign: 'center',
                      }}
                    >
                      This size is sold out — send a request and we&rsquo;ll source it for you.
                    </div>
                  </div>
                ) : (
                  <div style={{flex: 1}}>
                    <AddToCartButton
                      lines={[
                        {
                          merchandiseId: selectedVariant.id!,
                          quantity: 1,
                        },
                      ]}
                      analytics={{
                        id: product.id,
                        title: product.title,
                        price: selectedVariant?.price?.amount || '0',
                        quantity: 1,
                        variantTitle: selectedVariant?.title,
                      }}
                      variant="primary"
                      data-test="add-to-cart"
                      className="styx-add-to-cart"
                      style={{
                        width: '100%',
                        padding: '22px 24px',
                        background: STYX.ink,
                        color: STYX.bone,
                        fontFamily: FONT.cinzel,
                        fontSize: 13,
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 14,
                        transition: 'all 0.25s ease',
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 12,
                        }}
                      >
                        <span>Add to Cart</span>
                        <span style={{opacity: 0.4}}>&middot;</span>
                        <Money
                          data={selectedVariant.price!}
                          as="span"
                        />
                        {isOnSale && selectedVariant.compareAtPrice && (
                          <Money
                            data={selectedVariant.compareAtPrice}
                            as="span"
                            style={{opacity: 0.5, textDecoration: 'line-through'}}
                          />
                        )}
                      </span>
                    </AddToCartButton>
                  </div>
                )}
              </div>

              {/* Make an Offer — quiet text link, deliberately demoted below ATC */}
              {!isOutOfStock && (
                <div style={{marginTop: 14, textAlign: 'center'}}>
                  <button
                    type="button"
                    onClick={() => {
                      setOfferMode('offer');
                      setOfferStatus('idle');
                      setOfferOpen(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      fontFamily: FONT.cormorant,
                      fontSize: 14,
                      fontStyle: 'italic',
                      color: STYX.silt,
                      textDecoration: 'underline',
                      textUnderlineOffset: 3,
                      textDecorationColor: 'rgba(74,68,59,0.45)',
                    }}
                  >
                    Make an offer on this piece
                  </button>
                </div>
              )}

              {/* Favorites + Compare + Print — three equal actions */}
              <div style={{marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8}}>
                <button
                  type="button"
                  onClick={() => wishlist.toggle(product.handle)}
                  aria-label={wished ? 'Remove from favorites' : 'Add to favorites'}
                  title={wished ? 'Saved to favorites' : 'Save to favorites'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    border: `1px solid ${wished ? STYX.gold : STYX.line}`,
                    background: wished ? 'rgba(184,146,74,0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: FONT.mono,
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: wished ? STYX.gold : STYX.silt,
                    width: '100%',
                  }}
                >
                  <svg
                    width="15"
                    height="14"
                    viewBox="0 0 22 20"
                    fill={wished ? STYX.gold : 'none'}
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M11 18.5C11 18.5 1.5 13 1.5 6.5C1.5 3.46 3.96 1 7 1C8.8 1 10.37 1.89 11 3.18C11.63 1.89 13.2 1 15 1C18.04 1 20.5 3.46 20.5 6.5C20.5 13 11 18.5 11 18.5Z" />
                  </svg>
                  <span>{wished ? 'Saved' : 'Favorite'}</span>
                </button>
                <CompareButton
                  handle={product.handle}
                  length={selectedLength}
                  style={{width: '100%', justifyContent: 'center'}}
                />
                <PrintListButton
                  handle={product.handle}
                  style={{width: '100%', justifyContent: 'center'}}
                />
              </div>

              {/* ── Divider ── */}
              <div style={{marginTop: 24, borderTop: `1px solid ${STYX.line}`, paddingTop: 20}} />

              {/* ── Trust Signals ── */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px 16px',
                }}
              >
                {[
                  {text: `Authentic ${karat}K Gold`},
                  {text: 'Free Insured Shipping'},
                  {text: '14-Day Returns'},
                  {text: 'Hallmarked & Tested'},
                  {text: '5-Year Buyback Guarantee', href: '#ferrymans-pact'},
                ].map(({text, href}) => {
                  const rowStyle: React.CSSProperties = {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: FONT.inter,
                    fontSize: 11,
                    color: STYX.silt,
                    letterSpacing: '0.02em',
                  };
                  return href ? (
                    <a
                      key={text}
                      href={href}
                      onClick={(e) => {
                        e.preventDefault();
                        document
                          .getElementById(href.slice(1))
                          ?.scrollIntoView({behavior: 'smooth'});
                      }}
                      style={{
                        ...rowStyle,
                        textDecoration: 'underline',
                        textDecorationColor: STYX.gold,
                        textUnderlineOffset: 3,
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{color: STYX.gold, flexShrink: 0}}>&bull;</span>
                      {text}
                    </a>
                  ) : (
                    <div key={text} style={rowStyle}>
                      <span style={{color: STYX.gold, flexShrink: 0}}>&bull;</span>
                      {text}
                    </div>
                  );
                })}
              </div>

              {/* Delivery promise — exact terms from the shipping policy:
                  ships in 1–2 business days, domestic transit 3–5,
                  fully insured with signature on delivery. */}
              <div
                style={{
                  marginTop: 16,
                  textAlign: 'center',
                  fontFamily: FONT.cormorant,
                  fontSize: 14,
                  fontStyle: 'italic',
                  color: STYX.silt,
                  lineHeight: 1.5,
                }}
              >
                Ships fully insured in 1&ndash;2 business days &mdash; domestic
                delivery typically 3&ndash;5 business days, signature on
                arrival.
              </div>

              {/* FAQ link — same quiet idiom as the Make-an-Offer link */}
              <div style={{marginTop: 8, textAlign: 'center'}}>
                <Link
                  to="/faq"
                  style={{
                    fontFamily: FONT.cormorant,
                    fontSize: 14,
                    fontStyle: 'italic',
                    color: STYX.silt,
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                    textDecorationColor: 'rgba(74,68,59,0.45)',
                  }}
                >
                  Questions? Read the FAQ
                </Link>
              </div>
            </div>
          )}

          {/* ── Make an Offer Modal ── */}
          {offerOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(26,24,21,0.6)',
                backdropFilter: 'blur(4px)',
              }}
              onClick={(e) => { if (e.target === e.currentTarget) setOfferOpen(false); }}
            >
              <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 600px) {
                  .offer-card { padding: 20px 18px !important; max-height: 88vh !important; width: 94vw !important; }
                  .offer-eyebrow { margin-bottom: 4px !important; }
                  .offer-title { font-size: 15px !important; }
                  .offer-head { margin-bottom: 14px !important; }
                  .offer-details { padding: 11px 14px !important; margin-bottom: 14px !important; gap: 3px !important; }
                  .offer-rules { font-size: 12px !important; margin-bottom: 14px !important; padding-bottom: 12px !important; }
                  .offer-form { gap: 12px !important; }
                  .offer-form input, .offer-form textarea { font-size: 16px !important; }
                }
              `}} />
              <div
                className="offer-card"
                style={{
                  background: STYX.bone,
                  maxWidth: 520,
                  width: '90vw',
                  maxHeight: '90vh',
                  overflow: 'auto',
                  padding: '40px 36px',
                }}
              >
                {/* Header */}
                <div className="offer-head" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24}}>
                  <div>
                    <div className="offer-eyebrow" style={{fontFamily: FONT.cinzel, fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: STYX.gold, marginBottom: 8}}>
                      {offerMode === 'request' ? 'Request This Size' : 'Make an Offer'}
                    </div>
                    <div className="offer-title" style={{fontFamily: FONT.cinzel, fontSize: 20, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.04em', color: STYX.ink}}>
                      {title}
                    </div>
                  </div>
                  <button
                    onClick={() => setOfferOpen(false)}
                    style={{background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: STYX.ink}}
                    aria-label="Close"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Product details (auto-filled) */}
                <div
                  className="offer-details"
                  style={{
                    background: STYX.paper,
                    padding: '16px 20px',
                    marginBottom: 24,
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    letterSpacing: '0.04em',
                    color: STYX.silt,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div>SKU: {selectedVariant?.sku || 'N/A'}</div>
                  <div>Variant: {selectedVariant?.title}</div>
                  {selectedVariant?.selectedOptions?.map((o: any) => (
                    <div key={o.name}>{o.name}: {o.value}</div>
                  ))}
                  <div style={{color: STYX.ink, fontWeight: 500, marginTop: 4}}>
                    Listed price: ${parseFloat(selectedVariant?.price?.amount || '0').toFixed(2)}
                  </div>
                </div>

                {offerStatus === 'success' ? (
                  /* Inline confirmation — replaces the form once the submission lands */
                  <div style={{padding: '8px 0 4px', textAlign: 'center'}}>
                    <div
                      style={{
                        fontFamily: FONT.cinzel,
                        fontSize: 11,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        color: STYX.gold,
                        marginBottom: 14,
                      }}
                    >
                      {offerMode === 'request' ? 'Request Received' : 'Offer Submitted'}
                    </div>
                    <p
                      style={{
                        fontFamily: FONT.cormorant,
                        fontSize: 17,
                        fontStyle: 'italic',
                        color: STYX.graphite,
                        lineHeight: 1.6,
                        margin: '0 0 24px',
                      }}
                    >
                      {offerMode === 'request'
                        ? 'Your request has been received. We will confirm availability, price, and timing within 24 hours.'
                        : 'Your offer has been submitted. We will respond within 24 hours.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setOfferOpen(false)}
                      style={{
                        padding: '14px 40px',
                        background: STYX.ink,
                        color: STYX.bone,
                        fontFamily: FONT.cinzel,
                        fontSize: 12,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Close
                    </button>
                  </div>
                ) : (
                <>
                {/* Rules */}
                <div
                  className="offer-rules"
                  style={{
                    fontFamily: FONT.cormorant,
                    fontSize: 14,
                    fontStyle: 'italic',
                    color: STYX.silt,
                    lineHeight: 1.6,
                    marginBottom: 24,
                    paddingBottom: 20,
                    borderBottom: `1px solid ${STYX.line}`,
                  }}
                >
                  {offerMode === 'request'
                    ? 'This size is currently sold out, but every piece is backorderable. Leave your details and we’ll confirm availability, price, and timing within 24 hours — then place the order for you.'
                    : 'Offers are reviewed within 24 hours. Once accepted, you have 48 hours to complete your purchase at the agreed price. Offers not completed within this window expire automatically.'}
                </div>

                {/* Form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const data = new FormData(form);
                    const payload = {
                      formId: offerMode === 'request' ? 'request-size' : 'make-offer',
                      formName: offerMode === 'request' ? 'request-size' : 'make-offer',
                      product: title,
                      sku: selectedVariant?.sku || '',
                      variant: selectedVariant?.title || '',
                      options: selectedVariant?.selectedOptions?.map((o: any) => `${o.name}: ${o.value}`).join(', ') || '',
                      listedPrice: selectedVariant?.price?.amount || '0',
                      offerAmount: data.get('offer'),
                      email: data.get('email'),
                      phone: data.get('phone'),
                      message: data.get('message'),
                    };
                    setOfferStatus('submitting');
                    try {
                      const res = await fetch('/api/form-submit', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload),
                      });
                      if (!res.ok) {
                        throw new Error(`Form submit failed: ${res.status}`);
                      }
                      setOfferStatus('success');
                    } catch {
                      setOfferStatus('error');
                    }
                  }}
                  className="offer-form"
                  style={{display: 'flex', flexDirection: 'column', gap: 16}}
                >
                  {offerMode === 'offer' && (
                  <div>
                    <label style={{fontFamily: FONT.cinzel, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: STYX.silt, display: 'block', marginBottom: 6}}>
                      Your Offer (USD)
                    </label>
                    <input
                      name="offer"
                      type="number"
                      required
                      placeholder="$"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: `1px solid ${STYX.line}`,
                        background: '#fff',
                        fontFamily: FONT.cinzel,
                        fontSize: 18,
                        color: STYX.ink,
                        outline: 'none',
                      }}
                    />
                  </div>
                  )}
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
                    <div>
                      <label style={{fontFamily: FONT.cinzel, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: STYX.silt, display: 'block', marginBottom: 6}}>
                        Email
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: `1px solid ${STYX.line}`,
                          background: '#fff',
                          fontFamily: FONT.inter,
                          fontSize: 13,
                          color: STYX.ink,
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{fontFamily: FONT.cinzel, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: STYX.silt, display: 'block', marginBottom: 6}}>
                        Phone
                      </label>
                      <input
                        name="phone"
                        type="tel"
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: `1px solid ${STYX.line}`,
                          background: '#fff',
                          fontFamily: FONT.inter,
                          fontSize: 13,
                          color: STYX.ink,
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{fontFamily: FONT.cinzel, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: STYX.silt, display: 'block', marginBottom: 6}}>
                      Message (optional)
                    </label>
                    <textarea
                      name="message"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: `1px solid ${STYX.line}`,
                        background: '#fff',
                        fontFamily: FONT.cormorant,
                        fontSize: 15,
                        color: STYX.ink,
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                  {offerStatus === 'error' && (
                    <div
                      role="alert"
                      style={{
                        fontFamily: FONT.cormorant,
                        fontSize: 15,
                        fontStyle: 'italic',
                        color: '#8A2E2E',
                        background: 'rgba(138,46,46,0.06)',
                        border: '1px solid rgba(138,46,46,0.35)',
                        padding: '12px 16px',
                        lineHeight: 1.5,
                      }}
                    >
                      Something went wrong &mdash; your{' '}
                      {offerMode === 'request' ? 'request' : 'offer'} was not
                      sent. Please try again in a moment.
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={offerStatus === 'submitting'}
                    style={{
                      padding: '16px 24px',
                      background: STYX.ink,
                      color: STYX.bone,
                      fontFamily: FONT.cinzel,
                      fontSize: 12,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      border: 'none',
                      cursor: offerStatus === 'submitting' ? 'wait' : 'pointer',
                      opacity: offerStatus === 'submitting' ? 0.6 : 1,
                      transition: 'background 0.2s',
                    }}
                  >
                    {offerStatus === 'submitting'
                      ? 'Sending…'
                      : offerMode === 'request'
                        ? 'Submit Request'
                        : 'Submit Offer'}
                  </button>
                </form>
                </>
                )}
              </div>
            </div>
          )}

          {/* ── Product Details ── */}
          <div
            style={{
              marginTop: 40,
              paddingTop: 32,
              borderTop: `1px solid ${STYX.line}`,
            }}
          >
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 10,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: STYX.silt,
                marginBottom: 20,
              }}
            >
              Product Details
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px 24px',
              }}
            >
              {[
                {label: 'Chain Style', value: chainStyle},
                {label: 'Thickness', value: chainThickness},
                {label: 'Construction', value: chainConstruction},
                {label: 'Weight', value: displayWeight ? `${displayWeight}g` : null},
                {label: 'Karat', value: karat ? `${karat}k Gold (${(selectedPurity * 100).toFixed(1)}% pure)` : null},
                {label: 'Color', value: selectedColor || 'Yellow Gold'},
                {label: 'Clasp', value: specClasp},
                {label: 'Our Cast', value: specCast},
                {label: 'Origin', value: chainOrigin},
                {label: 'Invented', value: yearInvented},
              ]
                .filter((row) => row.value)
                .map((row) => (
                  <div key={row.label}>
                    <div
                      style={{
                        fontFamily: FONT.cinzel,
                        fontSize: 9,
                        letterSpacing: '0.25em',
                        textTransform: 'uppercase',
                        color: STYX.silt,
                        marginBottom: 4,
                      }}
                    >
                      {row.label}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT.cormorant,
                        fontSize: 17,
                        color: STYX.ink,
                      }}
                    >
                      {row.value}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* ── See it at actual size on your screen (card-calibrated) ── */}
          <ActualSizeChainStrip
            thickness={chainThickness}
            chainStyle={chainStyle}
            title={title}
          />

          {/* ── Shipping / Returns Disclosure ── */}
          <div style={{marginTop: 40, paddingTop: 32, borderTop: `1px solid ${STYX.line}`}}>
              <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              {shippingPolicy?.body && (
                <StyxDisclosure
                  title="Shipping"
                  content={getExcerpt(shippingPolicy.body)}
                  learnMore={`/policies/${shippingPolicy.handle}`}
                />
              )}
              {refundPolicy?.body && (
                <StyxDisclosure
                  title="Returns"
                  content={getExcerpt(refundPolicy.body)}
                  learnMore={`/policies/${refundPolicy.handle}`}
                />
              )}
            </div>
          </div>

          {/* ── Transparency Receipt (below cart) — only with real weight data ── */}
          {selectedVariant?.price && displayWeight && (
            <div
              style={{
                marginTop: 40,
                background: STYX.ink,
                color: STYX.bone,
                padding: '28px 32px',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: '1px solid rgba(239,234,224,0.12)',
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#7DB86F',
                      boxShadow: '0 0 8px #7DB86F',
                      display: 'inline-block',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 10,
                      letterSpacing: '0.25em',
                      textTransform: 'uppercase',
                      color: STYX.gold,
                    }}
                  >
                    Live Price &middot; No Hidden Math
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(239,234,224,0.45)',
                  }}
                >
                  Live Gold Price
                </span>
              </div>

              {/* Receipt Rows */}
              <div style={{fontFamily: FONT.mono, fontSize: 13, lineHeight: 1}}>
                {(() => {
                  const ourPrice = parseFloat(selectedVariant.price.amount);
                  const pureGoldGrams = displayWeight * selectedPurity;
                  const meltValue = pureGoldGrams * (spotPerOz / 31.1035);
                  const difference = ourPrice - meltValue;
                  const wirePrice = Math.round(ourPrice * 0.96 * 100) / 100;
                  return (
                    <>
                      <ReceiptSection label="MELT VALUE" />
                      <ReceiptRow label={`${displayWeight}g total weight`} value={`${karat}K gold`} />
                      <ReceiptRow label={`${pureGoldGrams.toFixed(2)}g pure gold (${(selectedPurity * 100).toFixed(0)}%)`} value={`@ $${(spotPerOz / 31.1035).toFixed(2)}/g`} />
                      <ReceiptRow label="Gold melt value" value={`$${meltValue.toFixed(2)}`} highlight />

                      <div style={{height: 20}} />
                      <ReceiptSection label="DIFFERENCE" />
                      <ReceiptRow label="Labor, craftsmanship, overhead" value={`$${difference.toFixed(2)}`} highlight />

                      <div style={{height: 20}} />
                      <ReceiptSection label="OUR PRICE" />
                      <ReceiptRow label="Melt value + markup" value={`$${ourPrice.toFixed(2)}`} highlight />

                      <div style={{height: 12}} />
                      <ReceiptRow label="Wire transfer (save 4%)" value={`$${wirePrice.toFixed(2)}`} />
                    </>
                  );
                })()}
              </div>

              {/* Divider */}
              <div style={{borderTop: '1px dashed rgba(239,234,224,0.2)', margin: '18px 0'}} />

              {/* Total */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 13,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: STYX.bone,
                  }}
                >
                  Your Toll
                </span>
                <span
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 32,
                    fontWeight: 600,
                    color: STYX.bone,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <Money data={selectedVariant.price} as="span" />
                </span>
              </div>
            </div>
          )}

          {/* ── Cross-Sell: Pairs Well With (below cart + live price receipt) ── */}
          <Suspense fallback={null}>
            <Await resolve={crossSell} errorElement={null}>
              {(products) =>
                products && products.length > 0 ? (
                  <RecommendedProducts products={products} heading="Pairs Well With" />
                ) : null
              }
            </Await>
          </Suspense>
        </div>
      </div>

      {/* ── Transparency Narrative Section — only with real weight data ── */}
      {displayWeight && (
      <section
        style={{
          background: STYX.paper,
          borderTop: `1px solid ${STYX.line}`,
        }}
      >
        <div className="styx-product-transparency" style={{maxWidth: 1440, margin: '0 auto', padding: '100px 56px'}}>
        <StyxLabel>On Transparency &middot; VI</StyxLabel>
        <h2
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 44,
            fontWeight: 400,
            color: STYX.ink,
            margin: '12px 0 0',
            lineHeight: 1.1,
          }}
        >
          Every number,{' '}
          <span
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontWeight: 400,
            }}
          >
            in the open.
          </span>
        </h2>

        <div
          className="styx-transparency-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 64,
            alignItems: 'start',
            marginTop: 48,
          }}
        >
          <div
            style={{
              fontFamily: FONT.cormorant,
              fontSize: 19,
              fontStyle: 'italic',
              color: STYX.ink,
              lineHeight: 1.7,
            }}
          >
            {storyBody || (
              <>
                Most jewelers mark gold up 8 to 12 times. That is not because gold is
                expensive &mdash; gold is a commodity, priced openly on global markets
                &mdash; it is because the business is built on mystery. We are not.
              </>
            )}
          </div>
          <div
            style={{
              fontFamily: FONT.inter,
              fontSize: 15,
              color: STYX.ink,
              lineHeight: 1.75,
            }}
          >
            This piece weighs {displayWeight}g of solid {karat}k gold. At today&rsquo;s
            live market price, that is ${goldBreakdown ? goldBreakdown.materialCost.toFixed(2) : (displayWeight * perGramSelected).toFixed(2)} in raw material.
            We add ${goldBreakdown ? goldBreakdown.laborCost.toFixed(2) : laborCost.toFixed(2)} for manufacturing and finishing,
            and our margin keeps the lights on. That is the whole math. Nothing hidden in a velvet box.
          </div>
        </div>

        </div>
      </section>
      )}

      {/* ── Pull Quote ── (specs live in Product Details above) */}
      {pullQuote && (
        <section
          style={{
            background: STYX.paper,
            borderTop: `1px solid ${STYX.line}`,
          }}
        >
          <div
            style={{
              maxWidth: 1440,
              margin: '0 auto',
              padding: '96px 56px',
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 80,
              alignItems: 'start',
            }}
            className="styx-product-specs-grid"
          >
            {/* Pull Quote */}
            {pullQuote && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    fontFamily: FONT.cormorant,
                    fontSize: 32,
                    fontStyle: 'italic',
                    fontWeight: 400,
                    lineHeight: 1.35,
                    color: STYX.ink,
                    position: 'relative',
                    paddingLeft: 32,
                    borderLeft: `3px solid ${STYX.gold}`,
                  }}
                >
                  &ldquo;{pullQuote}&rdquo;
                </div>
                {pullQuoteAttr && (
                  <div
                    style={{
                      marginTop: 24,
                      paddingLeft: 32,
                      fontFamily: FONT.cinzel,
                      fontSize: 11,
                      letterSpacing: '0.25em',
                      color: STYX.silt,
                      textTransform: 'uppercase',
                    }}
                  >
                    &mdash; {pullQuoteAttr}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Ferryman's Pact Banner ── */}
      <section
        id="ferrymans-pact"
        style={{
          background: STYX.taupe,
          color: STYX.bone,
          scrollMarginTop: 96,
        }}
      >
        <div className="styx-pact-banner" style={{maxWidth: 1440, margin: '0 auto', padding: 56, display: 'flex', alignItems: 'center', gap: 40}}>
        <Obol size={64} color={STYX.goldLight} speed={6} />
        <div style={{flex: 1}}>
          <div
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 11,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: STYX.goldLight,
              marginBottom: 8,
            }}
          >
            The Ferryman&rsquo;s Pact
          </div>
          <p
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontSize: 20,
              lineHeight: 1.6,
              color: STYX.bone,
              margin: 0,
              maxWidth: 640,
            }}
          >
            Every piece carries a 5-year buyback guarantee. If you ever wish to
            return to shore, we will buy back your gold at the prevailing market
            price&mdash;minus only the original labor. The metal never loses its
            passage.
          </p>
        </div>
        </div>
      </section>

      {/* ── Recommended Products ── */}
      <Suspense
        fallback={
          <div
            className="styx-product-related"
            style={{
              padding: '80px 56px',
              textAlign: 'center',
              fontFamily: FONT.cormorant,
              fontSize: 18,
              color: STYX.silt2,
            }}
          >
            Loading recommendations...
          </div>
        }
      >
        <Await
          errorElement="There was a problem loading related products"
          resolve={recommended}
        >
          {(products) =>
            products &&
            products.nodes &&
            products.nodes.length > 0 && (
              <section className="styx-product-related" style={{maxWidth: 1440, margin: '0 auto', padding: '80px 56px'}}>
                <StyxLabel>Continue the Crossing</StyxLabel>
                <h2
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 36,
                    fontWeight: 400,
                    color: STYX.ink,
                    margin: '8px 0 40px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  You Might Also Carry
                </h2>
                <div
                  className="styx-product-related-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 24,
                  }}
                >
                  {products.nodes.slice(0, 4).map((product: any, i: number) => (
                    <StyxProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>
              </section>
            )
          }
        </Await>
      </Suspense>

      {/* ── Recently Viewed (localStorage, client-only) ── */}
      <RecentlyViewed excludeHandle={product.handle} />

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />

      <StyxFooter />
    </div>
  );
}

/* ─────────────────────────── Helper Components ─────────────────────────── */

function ReceiptSection({label}: {label: string}) {
  return (
    <div
      style={{
        fontFamily: FONT.cinzel,
        fontSize: 9,
        letterSpacing: '0.35em',
        textTransform: 'uppercase',
        color: STYX.gold,
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: '1px solid rgba(239,234,224,0.08)',
      }}
    >
      {label}
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: highlight ? '8px 0' : '5px 0',
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 13,
          color: highlight ? STYX.bone : 'rgba(239,234,224,0.5)',
          letterSpacing: '0.03em',
          fontWeight: highlight ? 500 : 400,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: highlight ? 16 : 13,
          color: highlight ? STYX.gold : STYX.bone,
          fontWeight: highlight ? 600 : 400,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ZoomableImage({
  data,
  sizes,
  alt,
  loading,
}: {
  data: any;
  sizes: string;
  alt?: string;
  loading?: 'eager' | 'lazy';
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
      onMouseMove={handleMouseMove}
      style={{
        overflow: 'hidden',
        cursor: zoomed ? 'zoom-out' : 'zoom-in',
      }}
    >
      <Image
        data={data}
        alt={data?.altText ?? alt ?? ''}
        sizes={sizes}
        loading={loading}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
          transform: zoomed ? 'scale(2)' : 'scale(1)',
          transformOrigin: origin,
          transition: zoomed ? 'transform 0.1s ease-out' : 'transform 0.3s ease',
        }}
      />
    </div>
  );
}

function ProductOptionSwatch({
  swatch,
  name,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return name;

  return (
    <div
      aria-label={name}
      style={{
        width: 32,
        height: 32,
        backgroundColor: color || 'transparent',
        border: `1px solid ${STYX.line}`,
      }}
    >
      {!!image && (
        <img
          src={image}
          alt={name}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      )}
    </div>
  );
}

function StyxDisclosure({
  title,
  content,
  learnMore,
}: {
  title: string;
  content: string;
  learnMore?: string;
}) {
  return (
    <Disclosure
      key={title}
      as="div"
      defaultOpen
      style={{borderBottom: `1px solid ${STYX.line}`}}
    >
      {({open}) => (
        <>
          <Disclosure.Button
            style={{
              width: '100%',
              padding: '18px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 13,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: STYX.ink,
              }}
            >
              {title}
            </span>
            <IconClose
              className={clsx(
                'transition-transform transform-gpu duration-200',
                !open && 'rotate-[45deg]',
              )}
            />
          </Disclosure.Button>

          <Disclosure.Panel style={{paddingBottom: 18}}>
            <div
              style={{
                fontFamily: FONT.cormorant,
                fontSize: 16,
                lineHeight: 1.7,
                color: STYX.graphite,
              }}
              dangerouslySetInnerHTML={{__html: content}}
            />
            {learnMore && (
              <div style={{marginTop: 10}}>
                <Link
                  to={learnMore}
                  style={{
                    fontFamily: FONT.cormorant,
                    fontSize: 14,
                    color: STYX.silt,
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                >
                  Learn more
                </Link>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

/* ─────────────────────────── GraphQL Fragments ─────────────────────────── */

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    id
    availableForSale
    selectedOptions {
      name
      value
    }
    image {
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    sku
    title
    weight
    unitPrice {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    productType
    tags
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    collections(first: 5) {
      nodes {
        handle
        title
      }
    }
    seo {
      description
      title
    }
    media(first: 7) {
      nodes {
        ...Media
      }
    }
    weight_grams: metafield(namespace: "custom", key: "weight_grams") {
      value
    }
    karat: metafield(namespace: "chain", key: "karat") {
      value
    }
    chain_thickness: metafield(namespace: "chain", key: "thickness") {
      value
    }
    chain_construction: metafield(namespace: "chain", key: "construction") {
      value
    }
    chain_style: metafield(namespace: "chain", key: "chain_style") {
      value
    }
    labor_cost: metafield(namespace: "custom", key: "labor_cost") {
      value
    }
    margin_percent: metafield(namespace: "custom", key: "margin_percent") {
      value
    }
    chain_origin: metafield(namespace: "custom", key: "chain_origin") {
      value
    }
    year_invented: metafield(namespace: "custom", key: "year_invented") {
      value
    }
    roman_numeral: metafield(namespace: "custom", key: "roman_numeral") {
      value
    }
    chain_blurb: metafield(namespace: "custom", key: "chain_blurb") {
      value
    }
    story_heading: metafield(namespace: "custom", key: "story_heading") {
      value
    }
    story_body: metafield(namespace: "custom", key: "story_body") {
      value
    }
    pull_quote: metafield(namespace: "custom", key: "pull_quote") {
      value
    }
    pull_quote_attr: metafield(namespace: "custom", key: "pull_quote_attr") {
      value
    }
    spec_weave: metafield(namespace: "custom", key: "spec_weave") {
      value
    }
    spec_profile: metafield(namespace: "custom", key: "spec_profile") {
      value
    }
    spec_clasp: metafield(namespace: "custom", key: "spec_clasp") {
      value
    }
    spec_cast: metafield(namespace: "custom", key: "spec_cast") {
      value
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
    shop {
      name
      primaryDomain {
        url
      }
      shippingPolicy {
        body
        handle
      }
      refundPolicy {
        body
        handle
      }
    }
  }
  ${MEDIA_FRAGMENT}
  ${PRODUCT_FRAGMENT}
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query productRecommendations(
    $productId: ID!
    $count: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    recommended: productRecommendations(productId: $productId) {
      ...ProductCard
    }
    additional: products(first: $count, sortKey: BEST_SELLING) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

const COLLECTION_PRODUCTS_QUERY = `#graphql
  query collectionProducts(
    $handle: String!
    $count: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: $count, sortKey: PRICE) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;

async function getRecommendedProducts(
  storefront: Storefront,
  productId: string,
  collectionHandle?: string,
) {
  // If we know the chain collection, fetch from it (same type, sorted by price)
  if (collectionHandle) {
    const result = await storefront.query(COLLECTION_PRODUCTS_QUERY, {
      variables: {handle: collectionHandle, count: 12},
    });
    const nodes = (result.collection?.products?.nodes ?? [])
      .filter((p: any) => p.id !== productId);
    if (nodes.length > 0) {
      return {nodes};
    }
  }

  // Fallback to Shopify's recommendations + best sellers
  const products = await storefront.query(RECOMMENDED_PRODUCTS_QUERY, {
    variables: {productId, count: 12},
  });

  invariant(products, 'No data returned from Shopify API');

  const mergedProducts = (products.recommended ?? [])
    .concat(products.additional.nodes)
    .filter(
      (value: any, index: number, array: any[]) =>
        array.findIndex((value2) => value2.id === value.id) === index,
    );

  const originalProduct = mergedProducts.findIndex(
    (item: any) => item.id === productId,
  );

  if (originalProduct >= 0) mergedProducts.splice(originalProduct, 1);

  return {nodes: mergedProducts};
}

/* ──────────────────── Cross-Sell ("Pairs Well With") ──────────────────── */

const CROSS_SELL_QUERY = `#graphql
  query crossSellProducts(
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
            id
            availableForSale
            image {
              url
              altText
              width
              height
            }
            price {
              amount
              currencyCode
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
` as const;

/** Parse first mm number out of a thickness string or title. */
function parseMm(value?: string | null): number | null {
  if (!value) return null;
  const m = value.match(/(\d+(?:\.\d+)?)\s*mm/i) ?? value.match(/(\d+(?:\.\d+)?)/);
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

/**
 * Cross-sell is strict: only the true counterpart piece — same weave, same
 * thickness, same karat, opposite product type (chain <-> bracelet).
 * A 3mm rope chain pairs with the 3mm rope chain bracelet, or nothing at all.
 * Returns [] when there is no exact counterpart.
 */
async function getCrossSellProducts(
  storefront: Storefront,
  product: any,
): Promise<CrossSellProduct[]> {
  const styleTitle = (product?.title as string) || '';
  const myTags = (product?.tags ?? []) as string[];
  const style = parseStyle(product?.chain_style?.value, myTags, styleTitle);
  const construction = parseConstruction(
    product?.chain_construction?.value,
    myTags,
    styleTitle,
  );
  const myType = normalize(product?.productType); // "chain" | "bracelet"
  const myMm =
    parseMm(product?.chain_thickness?.value) ?? parseMm(styleTitle);
  const myKarat = parseKarat(product?.karat?.value, styleTitle);

  // Without a known style, width, and karat we can't guarantee a true
  // counterpart — suggest nothing rather than something unrelated.
  if (!style || myMm == null || myKarat == null) return [];
  if (myType !== 'chain' && myType !== 'bracelet') return [];

  const pairType = myType === 'chain' ? 'Bracelet' : 'Chain';
  // The weave is stored as a product tag (e.g. "Cuban Link").
  const query = `tag:'${style}' AND product_type:${pairType}`;

  let result: any;
  try {
    result = await storefront.query(CROSS_SELL_QUERY, {
      variables: {query, count: 30},
    });
  } catch {
    return [];
  }

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
        parseConstruction(c.chain_construction?.value, c.tags, c.title) === construction
          ? 1
          : 0;
      const stockScore = (c: any) =>
        (c.variants?.nodes ?? []).some((v: any) => v.availableForSale) ? 1 : 0;
      return (conScore(b) - conScore(a)) || (stockScore(b) - stockScore(a));
    });

  return matches.slice(0, 2).map((c: any) => ({
    id: c.id,
    title: c.title,
    handle: c.handle,
    productType: c.productType,
    variants: c.variants,
    reason: myType === 'chain' ? 'The Matching Bracelet' : 'The Matching Necklace',
  }));
}
