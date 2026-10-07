import {
  galleryImageKey,
  remainingGalleryMedia,
  selectedGalleryMedia,
} from '~/lib/product-gallery';
import {useState, useRef, useCallback, useEffect, Suspense} from 'react';
import {Disclosure} from '@headlessui/react';
import {type MetaArgs, type LoaderFunctionArgs} from 'react-router';
import {
  data,
  useLoaderData,
  Await,
  useRouteLoaderData,
  useNavigate,
} from 'react-router';
import {
  Money,
  Image,
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
  getProductOptions,
} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';
import clsx from 'clsx';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';

import type {RootLoader} from '~/root';
import {Link} from '~/components/Link';
import {AddToCartButton} from '~/components/AddToCartButton';
import {IconClose} from '~/components/Icon';
import {getExcerpt, validateLocale} from '~/lib/utils';
import {seoPayload} from '~/lib/seo.server';
import {getStyxSeoMeta} from '~/lib/seo-meta';
import {computeGoldPrice, KARAT_PURITY, formatUSD} from '~/lib/gold';
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
  Obol,
  ActualSizeImagePanel,
  recordRecentlyViewed,
  ImageLightbox,
} from '~/components/styx';
import {CompareButton} from '~/components/styx/CompareButton';
import {RelatedTabs} from '~/components/styx/RelatedTabs';
import {StickyBuyBar} from '~/components/styx/StickyBuyBar';
import {DeliveryReturns} from '~/components/styx/DeliveryReturns';
import {TrueSizeControls} from '~/components/styx/TrueSizeControls';
import {SizeGuide} from '~/components/styx/SizeGuide';
import {useWishlist} from '~/context/WishlistContext';
import {useScaleCalibration} from '~/context/ScaleCalibrationContext';
import {parseMm as parseThicknessMm} from '~/lib/chains';

/** This route renders its own GoldTicker + StyxNav + StyxFooter. */
export const handle = {ownChrome: true};

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  validateLocale(args.params);
  const {productHandle} = args.params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  // PDP prices float with the gold spot price, never cache longer than
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
  const excludeCollections = new Set([
    'chains',
    '10k-gold',
    '14k-gold',
    'frontpage',
    'automated-collection',
  ]);
  const chainCollection = product.collections?.nodes?.find(
    (c: any) => !excludeCollections.has(c.handle),
  );
  const recommended = getRecommendedProducts(
    context.storefront,
    product.id,
    chainCollection?.handle,
  );

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
    seo,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData(_args: LoaderFunctionArgs) {
  // Put any API calls that are not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getStyxSeoMeta(...matches.map((match) => (match.data as any).seo));
};

/* ─────────────────────────── Main Product Page ─────────────────────────── */

export default function Product() {
  const {product, shop, recommended, variants} = useLoaderData<typeof loader>();
  const {media, title, descriptionHtml} = product;
  const {shippingPolicy, refundPolicy} = shop;
  const [offerOpen, setOfferOpen] = useState(false);
  // 'offer' = haggling on an in-stock piece; 'request' = backorder a sold-out size
  const [offerMode, setOfferMode] = useState<'offer' | 'request'>('offer');
  // Inline submission state for the offer/request form (no native alert()s)
  const [offerStatus, setOfferStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const wishlist = useWishlist();
  // Actual-size swaps the LEAD IMAGE in place (Alex Moss pattern), no strip
  // in the spec column, no scrolling. Off (or unparseable width) → photo.
  const {actualSizeOn, pxPerMm, setActualSizeOn} = useScaleCalibration();
  // Every product page starts on the photo; actual size never carries over
  // from another product or a previous visit (Hagop, 2026-10-01).
  useEffect(() => {
    setActualSizeOn(false);
  }, [product.handle, setActualSizeOn]);
  const wished = wishlist.has(product.handle);
  // Watched by the mobile sticky buy bar: bar shows when this scrolls away.
  const atcRef = useRef<HTMLDivElement>(null);

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
      price: selectedVariant?.price?.amount || '0',
      variantId: selectedVariant?.id,
      variantTitle: selectedVariant?.title,
    });
  }, [product.id, selectedVariant?.id]);

  // Track variant selection (skip initial load)
  const initialVariantRef = useRef(selectedVariant?.id);
  useEffect(() => {
    if (
      selectedVariant?.id &&
      selectedVariant.id !== initialVariantRef.current
    ) {
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
  // Data guard: a $0 variant is a catalog error, never a sellable price.
  // Route it into the request-this-size flow instead of a free checkout.
  const isUnpriced = parseFloat(selectedVariant?.price?.amount ?? '0') <= 0;
  const isOnSale =
    selectedVariant?.price?.amount &&
    selectedVariant?.compareAtPrice?.amount &&
    selectedVariant?.price?.amount < selectedVariant?.compareAtPrice?.amount;

  // Extract metafields
  const p = product as any;
  const weightGrams = p.weight_grams?.value
    ? parseFloat(p.weight_grams.value)
    : null;
  // Karat: metafield > title parsing > default 10K
  const metafieldKarat = p.karat?.value
    ? parseInt(p.karat.value, 10)
    : /18\s*k/i.test(title)
    ? 18
    : /14\s*k/i.test(title)
    ? 14
    : 10;
  const chainThickness =
    p.chain_thickness?.value ||
    (title.match(/(\d+(?:\.\d+)?)\s*mm/i)?.[0] ?? null);
  const showActualSize =
    actualSizeOn &&
    pxPerMm != null &&
    parseThicknessMm(chainThickness, title) != null;
  // One-line helper under the on-image true-size pills; gone after first tap.
  const [trueSizeHintDismissed, setTrueSizeHintDismissed] = useState(false);
  // Size guide modal (lengths drawn on a neck-size model); follows the Length pills.
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const navigate = useNavigate();
  const trueSizeControls = chainThickness ? (
    <TrueSizeControls
      handle={product.handle}
      showHint={!trueSizeHintDismissed}
      onInteract={() => setTrueSizeHintDismissed(true)}
    />
  ) : null;
  const chainConstruction = p.chain_construction?.value || null;
  const chainStyle = p.chain_style?.value || null;
  const laborCost = p.labor_cost?.value ? parseFloat(p.labor_cost.value) : 280;
  const marginPercent = p.margin_percent?.value
    ? parseFloat(p.margin_percent.value) / 100
    : 0.55;
  const chainOrigin = p.chain_origin?.value || null;
  const yearInvented = p.year_invented?.value || null;
  const romanNumeral = p.roman_numeral?.value || null;
  const chainBlurb = p.chain_blurb?.value || null;
  const storyBody = p.story_body?.value || null;
  const pullQuote = p.pull_quote?.value || null;
  const pullQuoteAttr = p.pull_quote_attr?.value || null;
  // spec_weave / spec_profile intentionally not shown, redundant with Chain Style
  const specClasp = p.spec_clasp?.value || null;
  const specCast = p.spec_cast?.value || null;
  // Link style as seen in the photo (Plain / Beveled / Concave / Diamond Cut)
  const specStyle = p.spec_style?.value || null;

  // Use variant weight if available (from Shopify variant grams), else metafield
  const variantWeight = (selectedVariant as any)?.weight
    ? parseFloat((selectedVariant as any).weight)
    : null;

  // Variant weight takes priority (changes with length), then metafield
  // No fake weights, only show transparency when we have real data
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
    ? computeGoldPrice({
        spotPerOz,
        weight: weightGrams!,
        karat,
        laborCost,
        margin: marginPercent,
      })
    : null;

  // Per-gram price for the selected karat
  const selectedPurity = KARAT_PURITY[karat] ?? 0.75;
  const perGramSelected = (spotPerOz / 31.1035) * selectedPurity;

  // Only mount media associated with this selection. Unknown finish photos
  // are excluded on multi-color products instead of downloading every finish.
  const galleryColors =
    product.options
      .find((option: {name: string}) => option.name.toLowerCase() === 'color')
      ?.optionValues.map((option: {name: string}) => option.name) ?? [];
  const colorFilteredMedia = selectedGalleryMedia(
    media?.nodes ?? [],
    selectedVariant ?? {},
    knownVariants,
    galleryColors,
  );
  const firstGalleryMedia = colorFilteredMedia[0];
  const selectedImage = (selectedVariant as any)?.image;
  const assignedMedia = media?.nodes?.find(
    (item: any) =>
      selectedImage?.url &&
      galleryImageKey(item.image?.url || item.previewImage?.url || '') ===
        galleryImageKey(selectedImage.url),
  ) ?? {image: selectedImage};
  const assignedImageMatches =
    selectedGalleryMedia(
      [assignedMedia],
      selectedVariant ?? {},
      knownVariants,
      galleryColors,
    ).length > 0;
  const leadImage =
    (assignedImageMatches ? selectedImage : null) ||
    firstGalleryMedia?.image ||
    firstGalleryMedia?.previewImage;
  const remainingMedia = remainingGalleryMedia(
    colorFilteredMedia,
    leadImage,
  ).slice(0, 8);
  // Viewer set for the desktop gallery: hero first, then the grid in order.
  const desktopGalleryImages = [
    leadImage,
    ...remainingMedia.map((m: any) => m.image || m.previewImage),
  ].filter((im: any) => im?.url);

  // Mobile swipe-carousel slides: the color-checked lead image first (same
  // `leadImage` the desktop gallery uses, so a stale cross-color variant
  // assignment can never sneak in), then every color-matched media node
  // (images and hosted videos), deduped by normalized gallery key.
  const gallerySlides = (() => {
    const slides: Array<{key: string; kind: 'image' | 'video'; media: any}> =
      [];
    const seen = new Set<string>();
    if (leadImage?.url) {
      slides.push({key: 'lead', kind: 'image', media: leadImage});
      seen.add(galleryImageKey(leadImage.url));
    }
    for (const m of colorFilteredMedia as any[]) {
      if (m?.mediaContentType === 'VIDEO' && m.sources?.length) {
        const url = m.sources[0]?.url;
        if (url && !seen.has(url)) {
          seen.add(url);
          slides.push({key: m.id || url, kind: 'video', media: m});
        }
        continue;
      }
      const img = m?.image || m?.previewImage;
      const imgKey = img?.url ? galleryImageKey(img.url) : null;
      if (imgKey && !seen.has(imgKey)) {
        seen.add(imgKey);
        slides.push({key: m.id || img.url, kind: 'image', media: img});
      }
    }
    return slides.slice(0, 10);
  })();

  // Chain-type collection for the breadcrumb (exclude umbrella/karat collections)
  const breadcrumbExclude = new Set([
    'chains',
    '10k-gold',
    '14k-gold',
    'frontpage',
    'automated-collection',
  ]);
  const chainCollection = (product as any).collections?.nodes?.find(
    (c: any) => !breadcrumbExclude.has(c.handle),
  );

  return (
    <div
      className="styx-pdp-page styx-pdp-refined"
      style={{background: STYX.bone, minHeight: '100vh'}}
    >
      <GoldTicker />
      <StyxNav />

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
          // Row 1 hugs the lead image; the tall spanning info column dumps all
          // its extra height into row 2, otherwise row 1 stretches and opens
          // a gap between the lead image and the rest of the gallery.
          gridTemplateRows: 'auto 1fr',
          columnGap: 80,
          rowGap: 8,
          padding: '24px 56px 100px',
          alignItems: 'start',
        }}
      >
        {/* ── Gallery. Mobile swipe carousel (hidden on desktop via CSS;
            phones swipe through every image/video instead of scrolling a
            stacked column) ── */}
        <div className="styx-gallery-carousel">
          {showActualSize ? (
            <ActualSizeImagePanel
              thickness={chainThickness}
              chainStyle={chainStyle}
              title={title}
              controls={trueSizeControls}
            />
          ) : (
            <MobileMediaCarousel
              slides={gallerySlides}
              title={title}
              firstSlideOverlay={
                <>
                  {trueSizeControls}
                  {(romanNumeral || yearInvented) && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        background: STYX.bone,
                        border: `1px solid ${STYX.line}`,
                        padding: '10px 14px',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: FONT.cinzel,
                          fontSize: 9,
                          letterSpacing: '0.3em',
                          color: STYX.silt,
                          textTransform: 'uppercase',
                          marginBottom: 3,
                        }}
                      >
                        Invented
                      </div>
                      <div
                        style={{
                          fontFamily: FONT.cinzel,
                          fontSize: 18,
                          letterSpacing: '0.12em',
                          color: STYX.ink,
                          fontWeight: 600,
                        }}
                      >
                        {romanNumeral || yearInvented}
                      </div>
                    </div>
                  )}
                </>
              }
            />
          )}
        </div>

        {/* ── Gallery. Lead Image (desktop stacked gallery) ── */}
        <div
          className="styx-gallery-lead"
          style={{gridColumn: '1 / 2', gridRow: '1', background: '#FFFFFF'}}
        >
          {/* Lead image, variant image if available, else first color-matched
              media. When actual-size is on, the true-size panel swaps in where
              the photo was. */}
          {showActualSize ? (
            <ActualSizeImagePanel
              thickness={chainThickness}
              chainStyle={chainStyle}
              title={title}
              controls={trueSizeControls}
            />
          ) : (
            (() => {
              // Same color-checked `leadImage` as remainingMedia / the mobile
              // slides, so the desktop lead can't show another finish's photo.
              return (
                <div
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {leadImage ? (
                    <ZoomableImage
                      data={leadImage}
                      alt={title}
                      sizes="(min-width: 1200px) 55vw, 90vw"
                      loading="eager"
                      gallery={{images: desktopGalleryImages, index: 0}}
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

                  {/* True-size tools, pinned to the bottom edge of the photo:
                      actual size swaps this photo for the panel in place,
                      print adds it to the 1:1 sheet */}
                  {leadImage && trueSizeControls}

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
                        <div
                          style={{
                            fontFamily: FONT.mono,
                            fontSize: 10,
                            color: STYX.silt,
                            marginTop: 6,
                          }}
                        >
                          = {yearInvented}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>

        {/* ── Gallery. Remaining Media (desktop stacked gallery) ── */}
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
          {/* Remaining media, large, stacked; skip whichever image leads */}
          {remainingMedia.map((m: any, i: number) => {
            const img = m.image || m.previewImage;
            if (!img) return null;
            // White-background product shots (flat / clasp / hanging) are
            // multiplied onto the grey studio tile in CSS so the chain floats
            // on the same backdrop as the hero (Patil #21: no white boxes);
            // scale-readout photos are real scenes and stay as-is.
            const alt = String(m.alt || '').toLowerCase();
            const kind = /laid flat|clasp|hanging/.test(alt)
              ? 'studio'
              : /scale/.test(alt)
              ? 'scale'
              : 'photo';
            return (
              <div key={m.id || i} data-kind={kind}>
                <ZoomableImage
                  data={img}
                  alt={title}
                  sizes="(min-width: 1200px) 28vw, 45vw"
                  loading="lazy"
                  gallery={{images: desktopGalleryImages, index: i + 1}}
                />
              </div>
            );
          })}
        </div>

        {/* ── Right Column. Product Info (sticky) ── */}
        <div
          className="styx-product-info"
          style={{
            gridColumn: '2 / 3',
            gridRow: '1 / 3',
            position: 'sticky',
            // Pin under the real header height (StyxNav publishes it as a CSS
            // var, 0 while the header auto-hides) instead of a fixed 88px.
            top: 'calc(var(--styx-header-offset, 88px) + 16px)',
            paddingTop: 8,
          }}
        >
          {/* ── Breadcrumb, lives above the title (not in its own top bar)
              so the lead image stays fully above the fold ── */}
          <div style={{marginBottom: 18}}>
            {/* Full trail, desktop / tablet */}
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
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <Link to="/" style={{color: STYX.silt, textDecoration: 'none'}}>
                Home
              </Link>
              <span style={{opacity: 0.4}}>/</span>
              {chainCollection ? (
                <Link
                  to={`/collections/${chainCollection.handle}`}
                  style={{color: STYX.silt, textDecoration: 'none'}}
                >
                  {chainCollection.title}
                </Link>
              ) : (
                <Link
                  to="/collections"
                  style={{color: STYX.silt, textDecoration: 'none'}}
                >
                  Collections
                </Link>
              )}
            </nav>
            {/* Single back link, mobile (product name is in the H1 right below) */}
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
                to={
                  chainCollection
                    ? `/collections/${chainCollection.handle}`
                    : '/collections'
                }
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
              {chainOrigin}
              {romanNumeral ? ` · ${romanNumeral}` : ''}
            </div>
          )}

          {/* Title */}
          <h1
            data-reveal=""
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 38,
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              lineHeight: 1.05,
              color: STYX.ink,
              margin: 0,
            }}
          >
            {title}
          </h1>
          {selectedVariant?.sku && (
            <div
              className="styx-pdp-model"
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: STYX.silt,
                marginTop: 8,
              }}
            >
              Model #{selectedVariant.sku.replace(/\s*-\s*/g, '-')}
            </div>
          )}
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

          {/* Price and payment alternatives share one quiet, readable block. */}
          {selectedVariant?.price && (
            <div className="styx-pdp-pricing">
              <div className="styx-pdp-price-line">
                <div>
                  <span className="styx-pdp-price-label">
                    {isUnpriced ? 'Price on request' : 'Your price'}
                  </span>
                  <div className="styx-pdp-price-value">
                    {isUnpriced ? null : (
                      <Money data={selectedVariant.price} as="span" />
                    )}
                    {!isUnpriced && (
                      <span className="styx-pdp-currency">
                        {selectedVariant.price.currencyCode}
                      </span>
                    )}
                  </div>
                </div>
                {displayWeight && !isUnpriced && (
                  <a href="#price-breakdown" className="styx-pdp-price-link">
                    See the breakdown <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
              {!isUnpriced && (
                <p className="styx-pdp-wire">
                  <Money
                    data={{
                      ...selectedVariant.price,
                      amount: (
                        parseFloat(selectedVariant.price.amount) * 0.96
                      ).toFixed(2),
                    }}
                    as="span"
                  />{' '}
                  with wire transfer <span>Save 4%</span>
                </p>
              )}
              {displayWeight && (
                <div className="styx-pdp-weight">
                  <span>
                    {karat}K gold <span aria-hidden="true">·</span>{' '}
                    {displayWeight}g total
                  </span>
                  <p>
                    Approximate weight. Each piece is hand-finished and may vary
                    by a few percent.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Variant Selectors ── */}
          <div
            className="styx-pdp-options"
            style={{
              marginTop: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 28,
            }}
          >
            {productOptions
              .filter((option) => {
                // Hide "Title" option with only "Default Title" value
                if (option.name.toLowerCase() === 'title') {
                  return !(
                    option.optionValues.length === 1 &&
                    option.optionValues[0].name === 'Default Title'
                  );
                }
                return true;
              })
              .map((option) => {
                const isKarat = option.name.toLowerCase() === 'karat';
                const isColor = option.name.toLowerCase() === 'color';

                // Gold color swatches
                const colorSwatches: Record<string, string> = {
                  'Yellow Gold': '#D4A844',
                  'Rose Gold': '#C9877A',
                  'White Gold': '#D5D0C8',
                };

                return (
                  <div
                    key={option.name}
                    className="styx-pdp-option"
                    data-option={option.name.toLowerCase()}
                  >
                    <div
                      className="styx-pdp-option-label"
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
                      {option.name.toLowerCase() === 'length' && (
                        <button
                          type="button"
                          className="styx-sizeguide-trigger"
                          onClick={() => setSizeGuideOpen(true)}
                        >
                          Size guide
                        </button>
                      )}
                      {isKarat && (
                        <span
                          style={{
                            fontFamily: FONT.mono,
                            fontSize: 10,
                            color: STYX.silt2,
                            letterSpacing: '0.05em',
                            textTransform: 'none',
                          }}
                        >
                          ${perGramSelected.toFixed(2)}/g
                        </span>
                      )}
                      {isColor && selectedColor && (
                        <span
                          style={{
                            fontFamily: FONT.cormorant,
                            fontSize: 13,
                            fontStyle: 'italic',
                            color: STYX.silt2,
                            letterSpacing: 0,
                            textTransform: 'none',
                          }}
                        >
                          {selectedColor}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: isColor ? 12 : 0,
                      }}
                    >
                      {isKarat ? (
                        /* Karat: full-width segmented control with gold accent */
                        <div
                          style={{
                            display: 'flex',
                            width: '100%',
                            border: `1px solid ${STYX.line}`,
                          }}
                        >
                          {option.optionValues.map(
                            ({
                              isDifferentProduct,
                              name,
                              variantUriQuery,
                              handle,
                              selected,
                              available,
                            }) => (
                              <Link
                                key={option.name + name}
                                className="styx-pdp-choice"
                                data-selected={selected}
                                aria-current={selected ? 'true' : undefined}
                                {...(!isDifferentProduct
                                  ? {rel: 'nofollow'}
                                  : {})}
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
                                  background: selected
                                    ? STYX.ink
                                    : 'transparent',
                                  color: selected
                                    ? STYX.gold
                                    : available
                                    ? STYX.ink
                                    : STYX.silt2,
                                  borderRight: `1px solid ${STYX.line}`,
                                  cursor: 'pointer',
                                  opacity: available ? 1 : 0.5,
                                  textDecoration: available
                                    ? 'none'
                                    : 'line-through',
                                  textDecorationThickness: available
                                    ? undefined
                                    : '1.5px',
                                  transition: 'all 0.25s ease',
                                  position: 'relative',
                                }}
                                title={
                                  available
                                    ? undefined
                                    : 'Sold out. Select to request this size'
                                }
                              >
                                {name}
                                {selected && (
                                  <span
                                    className="styx-pdp-selection-mark"
                                    style={{
                                      position: 'absolute',
                                      bottom: 0,
                                      left: '20%',
                                      right: '20%',
                                      height: 2,
                                      background: STYX.gold,
                                    }}
                                  />
                                )}
                              </Link>
                            ),
                          )}
                        </div>
                      ) : isColor ? (
                        /* Color: outline pills with swatch dot, gold accent when selected */
                        <div
                          className="styx-color-pills"
                          style={{
                            display: 'flex',
                            width: '100%',
                            border: `1px solid ${STYX.line}`,
                          }}
                        >
                          {option.optionValues.map(
                            ({
                              isDifferentProduct,
                              name,
                              variantUriQuery,
                              handle,
                              selected,
                              available,
                            }) => (
                              <Link
                                key={option.name + name}
                                className="styx-pdp-choice"
                                data-selected={selected}
                                aria-current={selected ? 'true' : undefined}
                                {...(!isDifferentProduct
                                  ? {rel: 'nofollow'}
                                  : {})}
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
                                  background: selected
                                    ? STYX.paper
                                    : 'transparent',
                                  color: selected
                                    ? STYX.ink
                                    : available
                                    ? STYX.silt
                                    : STYX.silt2,
                                  borderRight: `1px solid ${STYX.line}`,
                                  cursor: 'pointer',
                                  opacity: available ? 1 : 0.5,
                                  textDecoration: available
                                    ? 'none'
                                    : 'line-through',
                                  textDecorationThickness: available
                                    ? undefined
                                    : '1.5px',
                                  transition: 'all 0.25s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 8,
                                  position: 'relative',
                                }}
                                title={
                                  available
                                    ? undefined
                                    : 'Sold out. Select to request this color'
                                }
                              >
                                <span
                                  style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    background:
                                      colorSwatches[name] || STYX.silt2,
                                    boxShadow:
                                      'inset 0 0 0 1px rgba(26,27,28,0.12)',
                                    flexShrink: 0,
                                  }}
                                />
                                {name}
                                {selected && (
                                  <span
                                    className="styx-pdp-selection-mark"
                                    style={{
                                      position: 'absolute',
                                      bottom: 0,
                                      left: '20%',
                                      right: '20%',
                                      height: 2,
                                      background: STYX.gold,
                                    }}
                                  />
                                )}
                              </Link>
                            ),
                          )}
                        </div>
                      ) : (
                        /* Default: outline pill buttons, gold underline when selected.
                         Length pills also show that length's price (current color). */
                        option.optionValues.map(
                          ({
                            isDifferentProduct,
                            name,
                            variantUriQuery,
                            handle,
                            selected,
                            available,
                            swatch,
                            firstSelectableVariant,
                          }) => {
                            const isLength =
                              option.name.toLowerCase() === 'length';
                            const pillVariant = isLength
                              ? findVariantForLength(name) ??
                                firstSelectableVariant ??
                                null
                              : null;
                            const pillPrice =
                              isLength && available && pillVariant?.price
                                ? pillVariant.price
                                : null;
                            return (
                              <Link
                                key={option.name + name}
                                className="styx-pdp-choice"
                                data-selected={selected}
                                aria-current={selected ? 'true' : undefined}
                                {...(!isDifferentProduct
                                  ? {rel: 'nofollow'}
                                  : {})}
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
                                  background: selected
                                    ? STYX.paper
                                    : 'transparent',
                                  color: selected
                                    ? STYX.ink
                                    : available
                                    ? STYX.silt
                                    : STYX.silt2,
                                  border: `1px solid ${
                                    selected ? STYX.graphite : STYX.line
                                  }`,
                                  borderBottom: selected
                                    ? `2px solid ${STYX.gold}`
                                    : `1px solid ${STYX.line}`,
                                  cursor: 'pointer',
                                  opacity: available ? 1 : 0.5,
                                  textDecoration: available
                                    ? 'none'
                                    : 'line-through',
                                  textDecorationThickness: available
                                    ? undefined
                                    : '1.5px',
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
                                title={
                                  available
                                    ? undefined
                                    : 'Sold out. Select to request this size'
                                }
                              >
                                {swatch?.color ||
                                swatch?.image?.previewImage?.url ? (
                                  <ProductOptionSwatch
                                    swatch={swatch}
                                    name={name}
                                  />
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
                                      color: selected
                                        ? STYX.graphite
                                        : STYX.silt2,
                                      lineHeight: 1,
                                    }}
                                  >
                                    {pillPrice ? (
                                      <Money
                                        data={pillPrice}
                                        as="span"
                                        withoutTrailingZeros
                                      />
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

          {/* ── Shipping line ── */}
          <div
            className="styx-pdp-shipping"
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
              <div ref={atcRef} style={{display: 'flex', gap: 12}}>
                {isOutOfStock || isUnpriced ? (
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
                      {isOutOfStock
                        ? 'This size is sold out. Send a request and we’ll source it for you.'
                        : 'Pricing for this piece is being updated. Send a request and we’ll quote it for you.'}
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
                        <Money data={selectedVariant.price!} as="span" />
                        {isOnSale && selectedVariant.compareAtPrice && (
                          <Money
                            data={selectedVariant.compareAtPrice}
                            as="span"
                            style={{
                              opacity: 0.5,
                              textDecoration: 'line-through',
                            }}
                          />
                        )}
                      </span>
                    </AddToCartButton>
                  </div>
                )}
              </div>

              {/* Make an Offer, quiet text link, deliberately demoted below ATC */}
              {!isOutOfStock && !isUnpriced && (
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
                      textDecorationColor: 'rgba(70,72,74,0.45)',
                    }}
                  >
                    Make an offer on this piece
                  </button>
                </div>
              )}

              {/* Favorites + Compare, two equal actions. Download Print moved
                  onto the lead image next to View actual size. */}
              <div
                className="styx-pdp-tools"
                style={{
                  marginTop: 16,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => wishlist.toggle(product.handle)}
                  aria-label={
                    wished ? 'Remove from favorites' : 'Add to favorites'
                  }
                  title={wished ? 'Saved to favorites' : 'Save to favorites'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    border: `1px solid ${wished ? STYX.gold : STYX.line}`,
                    background: wished
                      ? 'rgba(168,146,92,0.08)'
                      : 'transparent',
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
              </div>
            </div>
          )}

          {/* Blurb / Description */}
          {(chainBlurb || descriptionHtml) && (
            <div
              className="styx-pdp-description"
              style={{
                fontFamily: FONT.cormorant,
                fontSize: 18,
                color: STYX.graphite,
                lineHeight: 1.7,
                marginTop: 28,
              }}
            >
              {chainBlurb && (
                <p style={{margin: '0 0 12px', fontStyle: 'italic'}}>
                  {chainBlurb}
                </p>
              )}
              {descriptionHtml && (
                <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
              )}
            </div>
          )}

          {/* Journal Link */}
          {chainOrigin && (
            <Link
              to={`/journal/${chainOrigin
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')}`}
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

          {/* ── Product Details, the piece's specs come before the boilerplate
              trust signals ── */}
          <div
            className="styx-pdp-specifications"
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
              className="styx-pdp-spec-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px 24px',
              }}
            >
              {[
                {label: 'Chain Style', value: chainStyle},
                {label: 'Link Style', value: specStyle},
                {label: 'Thickness', value: chainThickness},
                {label: 'Model', value: selectedVariant?.sku || null},
                {label: 'Construction', value: chainConstruction},
                {
                  label: 'Weight',
                  value: displayWeight ? `${displayWeight}g` : null,
                },
                {
                  label: 'Karat',
                  value: karat
                    ? `${karat}k Gold (${(selectedPurity * 100).toFixed(
                        1,
                      )}% pure)`
                    : null,
                },
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
                        // Cormorant defaults to old-style figures, where "1"
                        // reads as a dotless i ("1mm" → "ımm"), force lining
                        // numerals so spec values stay unambiguous.
                        fontVariantNumeric: 'lining-nums',
                      }}
                    >
                      {row.value}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* ── Trust Signals ── */}
          <div
            style={{
              marginTop: 32,
              borderTop: `1px solid ${STYX.line}`,
              paddingTop: 24,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px 16px',
              }}
            >
              {[
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
                    <span style={{color: STYX.gold, flexShrink: 0}}>
                      &bull;
                    </span>
                    {text}
                  </a>
                ) : (
                  <div key={text} style={rowStyle}>
                    <span style={{color: STYX.gold, flexShrink: 0}}>
                      &bull;
                    </span>
                    {text}
                  </div>
                );
              })}
            </div>

            {/* Delivery promise row + Delivery & Returns drawer, exact terms
                from the shipping policy: ships in 1 to 2 business days,
                domestic transit 3 to 5, fully insured, signature on arrival. */}
            <DeliveryReturns />

            {/* FAQ link, same quiet idiom as the Make-an-Offer link */}
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
                  textDecorationColor: 'rgba(70,72,74,0.45)',
                }}
              >
                Questions? Read the FAQ
              </Link>
            </div>
          </div>

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
                background: 'rgba(26,27,28,0.6)',
                backdropFilter: 'blur(4px)',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setOfferOpen(false);
              }}
            >
              <style
                dangerouslySetInnerHTML={{
                  __html: `
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
              `,
                }}
              />
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
                <div
                  className="offer-head"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <div
                      className="offer-eyebrow"
                      style={{
                        fontFamily: FONT.cinzel,
                        fontSize: 10,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        color: STYX.gold,
                        marginBottom: 8,
                      }}
                    >
                      {offerMode === 'request'
                        ? 'Request This Size'
                        : 'Make an Offer'}
                    </div>
                    <div
                      className="offer-title"
                      style={{
                        fontFamily: FONT.cinzel,
                        fontSize: 20,
                        fontWeight: 400,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: STYX.ink,
                      }}
                    >
                      {title}
                    </div>
                  </div>
                  <button
                    onClick={() => setOfferOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      color: STYX.ink,
                    }}
                    aria-label="Close"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
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
                    <div key={o.name}>
                      {o.name}: {o.value}
                    </div>
                  ))}
                  <div style={{color: STYX.ink, fontWeight: 500, marginTop: 4}}>
                    Listed price:{' '}
                    {formatUSD(
                      parseFloat(selectedVariant?.price?.amount || '0'),
                    )}
                  </div>
                </div>

                {offerStatus === 'success' ? (
                  /* Inline confirmation, replaces the form once the submission lands */
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
                      {offerMode === 'request'
                        ? 'Request Received'
                        : 'Offer Submitted'}
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
                        ? 'This size is currently sold out, but every piece is backorderable. Leave your details and we’ll confirm availability, price, and timing within 24 hours, then place the order for you.'
                        : 'Offers are reviewed within 24 hours. Once accepted, you have 48 hours to complete your purchase at the agreed price. Offers not completed within this window expire automatically.'}
                    </div>

                    {/* Form */}
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const data = new FormData(form);
                        const payload = {
                          formId:
                            offerMode === 'request'
                              ? 'request-size'
                              : 'make-offer',
                          formName:
                            offerMode === 'request'
                              ? 'request-size'
                              : 'make-offer',
                          product: title,
                          sku: selectedVariant?.sku || '',
                          variant: selectedVariant?.title || '',
                          options:
                            selectedVariant?.selectedOptions
                              ?.map((o: any) => `${o.name}: ${o.value}`)
                              .join(', ') || '',
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
                            throw new Error(
                              `Form submit failed: ${res.status}`,
                            );
                          }
                          setOfferStatus('success');
                        } catch {
                          setOfferStatus('error');
                        }
                      }}
                      className="offer-form"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                      }}
                    >
                      {offerMode === 'offer' && (
                        <div>
                          <label
                            style={{
                              fontFamily: FONT.cinzel,
                              fontSize: 9,
                              letterSpacing: '0.2em',
                              textTransform: 'uppercase',
                              color: STYX.silt,
                              display: 'block',
                              marginBottom: 6,
                            }}
                          >
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
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 12,
                        }}
                      >
                        <div>
                          <label
                            style={{
                              fontFamily: FONT.cinzel,
                              fontSize: 9,
                              letterSpacing: '0.2em',
                              textTransform: 'uppercase',
                              color: STYX.silt,
                              display: 'block',
                              marginBottom: 6,
                            }}
                          >
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
                          <label
                            style={{
                              fontFamily: FONT.cinzel,
                              fontSize: 9,
                              letterSpacing: '0.2em',
                              textTransform: 'uppercase',
                              color: STYX.silt,
                              display: 'block',
                              marginBottom: 6,
                            }}
                          >
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
                        <label
                          style={{
                            fontFamily: FONT.cinzel,
                            fontSize: 9,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: STYX.silt,
                            display: 'block',
                            marginBottom: 6,
                          }}
                        >
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
                          Something went wrong: your{' '}
                          {offerMode === 'request' ? 'request' : 'offer'} was
                          not sent. Please try again in a moment.
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
                          cursor:
                            offerStatus === 'submitting' ? 'wait' : 'pointer',
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

          {/* ── Shipping / Returns Disclosure ── */}
          <div
            style={{
              marginTop: 40,
              paddingTop: 32,
              borderTop: `1px solid ${STYX.line}`,
            }}
          >
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
        </div>
      </div>

      {/* ── Transparency Narrative Section, only with real weight data.
          Skipped for unpriced ($0) variants: the labor math would go negative. ── */}
      {displayWeight && !isUnpriced && (
        <section
          style={{
            background: STYX.paper,
            borderTop: `1px solid ${STYX.line}`,
          }}
        >
          <div
            id="price-breakdown"
            className="styx-product-transparency"
            style={{maxWidth: 1440, margin: '0 auto', padding: '100px 56px'}}
          >
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
              {/* Narrative, story + the plain-math paragraph, stacked */}
              <div style={{display: 'flex', flexDirection: 'column', gap: 28}}>
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
                      Most jewelers mark gold up 8 to 12 times. That is not
                      because gold is expensive. Gold is a commodity, priced
                      openly on global markets. It is because the business is
                      built on mystery. We are not.
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
                  This piece weighs {displayWeight}g of {karat}k gold. At
                  today&rsquo;s live gold price, the gold alone is worth{' '}
                  {formatUSD(displayWeight * perGramSelected)}. The rest,{' '}
                  {formatUSD(
                    Math.max(
                      0,
                      parseFloat(selectedVariant?.price?.amount ?? '0') -
                        displayWeight * perGramSelected,
                    ),
                  )}
                  {', '}is the craft: casting, finishing, testing, insured
                  shipping, and our margin, said out loud. That is the whole
                  math. Nothing hidden in a velvet box.
                </div>
              </div>

              {/* Live-price receipt, the numbers behind the narrative */}
              {selectedVariant?.price && (
                <LivePriceReceipt
                  price={selectedVariant.price}
                  displayWeight={displayWeight}
                  selectedPurity={selectedPurity}
                  karat={karat}
                  spotPerOz={spotPerOz}
                />
              )}
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
                    {pullQuoteAttr}
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
        <div
          className="styx-pact-banner"
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 40,
          }}
        >
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
              Every piece carries a 5-year buyback guarantee. If you ever wish
              to return to shore, we will buy back your gold at the prevailing
              market price, minus only the original labor. The metal never loses
              its passage.
            </p>
          </div>
        </div>
      </section>

      {/* ── You may also like / Recently viewed, one tabbed module ── */}
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
          {(products) => (
            <RelatedTabs
              recommended={products?.nodes ?? []}
              excludeHandle={product.handle}
            />
          )}
        </Await>
      </Suspense>

      {/* ── Mobile sticky buy bar (<= 768px), mirrors the main Add to Cart ── */}
      {selectedVariant && (
        <StickyBuyBar
          targetRef={atcRef}
          title={product.title}
          handle={product.handle}
          price={selectedVariant.price}
          compareAtPrice={isOnSale ? selectedVariant.compareAtPrice : null}
          lines={[{merchandiseId: selectedVariant.id!, quantity: 1}]}
          analytics={{
            id: product.id,
            title: product.title,
            price: selectedVariant?.price?.amount || '0',
            quantity: 1,
            variantTitle: selectedVariant?.title,
          }}
          fallback={
            isOutOfStock || isUnpriced
              ? {
                  label: 'Request This Size',
                  onClick: () => {
                    setOfferMode('request');
                    setOfferStatus('idle');
                    setOfferOpen(true);
                  },
                }
              : null
          }
        />
      )}

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: 'STYX Gold',
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />

      <SizeGuide
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        availableLengths={
          product.options
            ?.find((o: any) => o.name?.toLowerCase() === 'length')
            ?.optionValues?.map((v: any) => v.name) ?? []
        }
        selectedLength={selectedLength}
        thicknessMm={parseThicknessMm(chainThickness, product.title)}
        productTitle={product.title}
        onPickLength={(value) => {
          const v = findVariantForLength(value);
          if (!v) return;
          const params = new URLSearchParams();
          for (const o of v.selectedOptions ?? []) params.set(o.name, o.value);
          navigate(`?${params.toString()}`, {
            replace: true,
            preventScrollReset: true,
          });
        }}
      />
      <StyxFooter />
    </div>
  );
}

/* ─────────────────────────── Helper Components ─────────────────────────── */

/** Dark "The price, in full" receipt: the itemized gold vs. craft math.
    Lives in the transparency section, beside the narrative it substantiates.
    Same math as before, new framing: the non-gold portion is "the craft"
    with its contents named, the buyback floor sits inside the box, and the
    price appears exactly once. */
function LivePriceReceipt({
  price,
  displayWeight,
  selectedPurity,
  karat,
  spotPerOz,
}: {
  price: {amount: string; currencyCode: string};
  displayWeight: number;
  selectedPurity: number;
  karat: number;
  spotPerOz: number;
}) {
  const ourPrice = parseFloat(price.amount);
  // Guards: a $0 variant or missing weight must never render negative or
  // broken numbers. The caller already skips those cases, but be defensive.
  const safeWeight = displayWeight > 0 ? displayWeight : 0;
  const perGramPure = spotPerOz / 31.1035;
  const pureGoldGrams = safeWeight * selectedPurity;
  const meltValue = pureGoldGrams * perGramPure;
  const priced = ourPrice > 0;
  // "The craft": everything that is not gold. Clamped so a price below melt
  // (a catalog error) never shows a negative line.
  const craft = priced ? Math.max(0, ourPrice - meltValue) : 0;
  const wirePrice = Math.round(ourPrice * 0.96 * 100) / 100;
  const goldShare = priced ? Math.min(1, Math.max(0, meltValue / ourPrice)) : 0;
  const goldPct = Math.round(goldShare * 100);
  const craftPct = 100 - goldPct;
  const dim = 'rgba(235,235,232,0.5)';
  const line = 'rgba(235,235,232,0.12)';

  return (
    <div
      style={{
        background: STYX.ink,
        color: STYX.bone,
        padding: '28px clamp(20px, 4vw, 32px)',
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: `1px solid ${line}`,
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
              flexShrink: 0,
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
            The price, in full
          </span>
        </div>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 11,
            letterSpacing: '0.08em',
            color: 'rgba(235,235,232,0.45)',
            whiteSpace: 'nowrap',
          }}
        >
          Gold ${perGramPure.toFixed(2)}/g &middot; live
        </span>
      </div>

      {/* Receipt Rows */}
      <div style={{fontFamily: FONT.mono, fontSize: 13, lineHeight: 1}}>
        <ReceiptSection label="The gold" greek="ΧΡΥΣΟΣ" />
        <ReceiptRow
          label={`${safeWeight}g total weight`}
          value={`${karat}K gold`}
        />
        <ReceiptRow
          label={`${pureGoldGrams.toFixed(2)}g pure gold (${(
            selectedPurity * 100
          ).toFixed(0)}%)`}
          value={`@ $${perGramPure.toFixed(2)}/g`}
        />
        <ReceiptRow
          label="Worth today, by weight"
          value={formatUSD(meltValue)}
          highlight
        />

        <div style={{height: 20}} />
        <ReceiptSection label="The craft" greek="ΤΕΧΝΗ" />
        <ReceiptRow
          label="Casting, finishing, testing, insured shipping & our margin"
          value={priced ? formatUSD(craft) : '—'}
          highlight
        />
      </div>

      {/* Proportional split: GOLD | CRAFT */}
      <div
        role="img"
        aria-label={`Gold ${goldPct}%, craft ${craftPct}%`}
        style={{
          display: 'flex',
          height: 6,
          margin: '18px 0 6px',
          background: line,
        }}
      >
        <div style={{width: `${goldPct}%`, background: STYX.gold}} />
        <div
          style={{width: `${craftPct}%`, background: 'rgba(235,235,232,0.28)'}}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: '0.12em',
          color: dim,
        }}
      >
        <span>GOLD {goldPct}%</span>
        <span>CRAFT {craftPct}%</span>
      </div>

      {/* Buyback floor, inside the box where the price anxiety happens */}
      <Link
        to="/buyback"
        prefetch="intent"
        style={{
          display: 'block',
          marginTop: 22,
          border: `1px solid ${STYX.gold}`,
          padding: '14px 16px',
          color: STYX.bone,
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 13,
              letterSpacing: '0.03em',
              fontWeight: 500,
              minWidth: 0,
            }}
          >
            We&rsquo;ll buy it back for its gold value
            <GreekSubLabel inline>ΝΟΣΤΟΣ</GreekSubLabel>
          </span>
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: STYX.gold,
              border: `1px solid ${STYX.gold}`,
              padding: '3px 7px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            5 yrs
          </span>
        </div>
        <div
          style={{
            fontFamily: FONT.cormorant,
            fontStyle: 'italic',
            fontSize: 15,
            lineHeight: 1.45,
            color: 'rgba(235,235,232,0.6)',
            marginTop: 6,
          }}
        >
          Whatever gold is worth on the day you sell it back.
        </div>
      </Link>

      {/* Divider */}
      <div
        style={{
          borderTop: '1px dashed rgba(235,235,232,0.2)',
          margin: '22px 0 18px',
        }}
      />

      {/* Total: the price appears once */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <span
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 13,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: STYX.gold,
            }}
          >
            The fare
          </span>
          <GreekSubLabel>ΝΑΥΛΟΝ</GreekSubLabel>
        </span>
        <span
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 32,
            fontWeight: 600,
            color: STYX.bone,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {priced ? <Money data={price as any} as="span" /> : '—'}
        </span>
      </div>
      {priced && (
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 12,
            color: dim,
            textAlign: 'right',
            marginTop: 4,
          }}
        >
          {formatUSD(wirePrice)} by wire transfer
        </div>
      )}
    </div>
  );
}

function ReceiptSection({label, greek}: {label: string; greek?: string}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        fontFamily: FONT.cinzel,
        fontSize: 9,
        letterSpacing: '0.35em',
        textTransform: 'uppercase',
        color: STYX.gold,
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: '1px solid rgba(235,235,232,0.08)',
      }}
    >
      {label}
      {greek && <GreekSubLabel>{greek}</GreekSubLabel>}
    </div>
  );
}

/** Tiny Greek accent under/next to a receipt label. Decorative only. */
function GreekSubLabel({
  children,
  inline,
}: {
  children: string;
  inline?: boolean;
}) {
  return (
    <span
      lang="el"
      aria-hidden="true"
      style={{
        fontFamily: FONT.mono,
        fontSize: 9,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: 'rgba(168,146,92,0.85)',
        fontWeight: 400,
        whiteSpace: 'nowrap',
        marginLeft: inline ? 10 : 0,
        verticalAlign: inline ? 'middle' : undefined,
      }}
    >
      {children}
    </span>
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
        gap: 16,
        padding: highlight ? '8px 0' : '5px 0',
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 13,
          lineHeight: 1.4,
          color: highlight ? STYX.bone : 'rgba(235,235,232,0.5)',
          letterSpacing: '0.03em',
          fontWeight: highlight ? 500 : 400,
          minWidth: 0,
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
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** Shopify-hosted product video: muted loop that plays only while on screen. */
function AutoplayVideo({media}: {media: any}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            el.play().catch(() => {});
          } else {
            el.pause();
          }
        }
      },
      {threshold: 0.5},
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  const source =
    media.sources?.find((s: any) => s.mimeType === 'video/mp4') ??
    media.sources?.[0];
  if (!source) return null;

  return (
    <video
      ref={ref}
      playsInline
      muted
      loop
      preload="metadata"
      poster={media.previewImage?.url}
      aria-label={media.alt || 'Product video'}
      style={{width: '100%', height: 'auto', display: 'block'}}
    >
      <source src={source.url} type={source.mimeType} />
    </video>
  );
}

/**
 * Media gallery carousel (every viewport). Swipe left/right is native touch
 * scrolling (works pre-hydration); JS adds the counter, prev/next arrows,
 * tappable dots, desktop thumbnails and keyboard arrows.
 */
function MobileMediaCarousel({
  slides,
  title,
  firstSlideOverlay,
}: {
  slides: Array<{key: string; kind: 'image' | 'video'; media: any}>;
  title: string;
  firstSlideOverlay?: React.ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const rafRef = useRef(0);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const track = trackRef.current;
      if (!track || track.clientWidth === 0) return;
      setIndex(
        Math.max(
          0,
          Math.min(
            slides.length - 1,
            Math.round(track.scrollLeft / track.clientWidth),
          ),
        ),
      );
    });
  }, [slides.length]);

  const scrollToSlide = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({left: i * track.clientWidth, behavior: 'smooth'});
  }, []);

  // Reset to the first slide when the slide set changes (variant/color switch).
  useEffect(() => {
    trackRef.current?.scrollTo({left: 0});
    setIndex(0);
  }, [slides.map((s) => s.key).join('|')]);

  if (slides.length === 0) {
    return (
      <div
        style={{
          aspectRatio: '4/5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFFFFF',
          color: STYX.silt2,
          fontFamily: FONT.cinzel,
          fontSize: 14,
        }}
      >
        No Image
      </div>
    );
  }

  const canPrev = index > 0;
  const canNext = index < slides.length - 1;
  const imageSlides = slides.filter((s) => s.kind === 'image' && s.media?.url);

  return (
    <div
      className="styx-carousel"
      style={{position: 'relative'}}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' && canNext) scrollToSlide(index + 1);
        if (e.key === 'ArrowLeft' && canPrev) scrollToSlide(index - 1);
      }}
    >
      <div
        ref={trackRef}
        className="styx-carousel-track"
        onScroll={onScroll}
        aria-label={`${title} media gallery, ${slides.length} items`}
        aria-roledescription="carousel"
        tabIndex={0}
      >
        {slides.map((slide, i) => (
          <div key={slide.key} className="styx-carousel-slide">
            {slide.kind === 'video' ? (
              <AutoplayVideo media={slide.media} />
            ) : (
              <ZoomableImage
                data={slide.media}
                alt={title}
                // Same sizes as the desktop lead so the eager first slide
                // resolves to the identical srcset URL (one shared download
                // even though both galleries render it).
                sizes="(min-width: 1200px) 55vw, 90vw"
                loading={i === 0 ? 'eager' : 'lazy'}
                gallery={{
                  images: imageSlides.map((s) => s.media),
                  index: imageSlides.findIndex((s) => s.key === slide.key),
                }}
              />
            )}
            {i === 0 ? firstSlideOverlay : null}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          {/* Prev / next arrows (desktop; phones swipe) */}
          <button
            type="button"
            className="styx-carousel-arrow"
            data-dir="prev"
            aria-label="Previous image"
            disabled={!canPrev}
            onClick={() => scrollToSlide(index - 1)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M15 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="styx-carousel-arrow"
            data-dir="next"
            aria-label="Next image"
            disabled={!canNext}
            onClick={() => scrollToSlide(index + 1)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M9 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Thumbnails (desktop only, see app.css) */}
          <div className="styx-carousel-thumbs" aria-label="Gallery thumbnails">
            {slides.map((slide, i) => (
              <button
                key={`thumb-${slide.key}`}
                type="button"
                className="styx-carousel-thumb"
                data-active={i === index ? '' : undefined}
                aria-label={`Show image ${i + 1} of ${slides.length}`}
                aria-current={i === index}
                onClick={() => scrollToSlide(i)}
              >
                {slide.kind === 'video' ? (
                  <span className="styx-carousel-thumb-video">▶</span>
                ) : (
                  <Image
                    data={slide.media}
                    alt=""
                    sizes="80px"
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Counter, top right, ledger style */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(26,27,28,0.72)',
              color: STYX.bone,
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: '0.1em',
              padding: '4px 8px',
              pointerEvents: 'none',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {index + 1} / {slides.length}
          </div>

          {/* Dots, tappable, 24px hit targets */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 4,
              paddingTop: 10,
            }}
          >
            {slides.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                aria-label={`Go to media ${i + 1} of ${slides.length}`}
                aria-current={i === index}
                onClick={() => scrollToSlide(i)}
                style={{
                  width: 24,
                  height: 24,
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    width: i === index ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === index ? STYX.gold : STYX.line,
                    transition: 'all 0.25s ease',
                  }}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ZoomableImage({
  data,
  sizes,
  alt,
  loading,
  gallery,
}: {
  data: any;
  sizes: string;
  alt?: string;
  loading?: 'eager' | 'lazy';
  /** Every image in the gallery + this one's index, so the viewer can step through. */
  gallery?: {images: any[]; index: number};
}) {
  // Click (or Enter/Space) opens the full-screen lightbox, which has pinch,
  // wheel and double-tap zoom. No hover zoom: Baba found it confusing.
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const resolvedAlt = data?.altText ?? alt ?? '';

  return (
    <>
      <div
        className="styx-zoomable"
        role="button"
        tabIndex={0}
        aria-label={`View ${resolvedAlt || 'image'} full screen`}
        onClick={() => setLightboxOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setLightboxOpen(true);
          }
        }}
        style={{overflow: 'hidden', cursor: 'zoom-in'}}
      >
        <Image
          data={data}
          alt={resolvedAlt}
          sizes={sizes}
          loading={loading}
          style={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
      <ImageLightbox
        image={
          lightboxOpen && data?.url
            ? {
                url: data.url,
                altText: resolvedAlt,
                width: data?.width,
                height: data?.height,
              }
            : null
        }
        images={gallery?.images.map((g) => ({
          url: g.url,
          altText: g.altText ?? alt ?? '',
          width: g.width,
          height: g.height,
        }))}
        startIndex={gallery?.index ?? 0}
        onClose={() => setLightboxOpen(false)}
      />
    </>
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
    media(first: 100) {
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
    spec_style: metafield(namespace: "custom", key: "spec_style") {
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
    const nodes = (result.collection?.products?.nodes ?? []).filter(
      (p: any) => p.id !== productId,
    );
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
