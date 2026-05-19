import {useState, useRef, useCallback, useEffect, Suspense} from 'react';
import {Disclosure, Listbox} from '@headlessui/react';
import {
    type MetaArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import {useLoaderData, Await, useRouteLoaderData} from 'react-router';
import {
  getSeoMeta,
  Money,
  Image,
  ShopPayButton,
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
import {getExcerpt} from '~/lib/utils';
import {seoPayload} from '~/lib/seo.server';
import {computeGoldPrice, KARAT_PURITY} from '~/lib/gold';
import type {Storefront} from '~/lib/type';
import {trackProductView} from '~/components/GTMDataLayer';
import {routeHeaders} from '~/data/cache';
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
  Obol,
} from '~/components/styx';

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const {productHandle} = args.params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return ({...deferredData, ...criticalData});
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
function loadDeferredData(args: LoaderFunctionArgs) {
  // Put any API calls that are not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

/* ─────────────────────────── Main Product Page ─────────────────────────── */

export default function Product() {
  const {product, shop, recommended, variants, storeDomain} =
    useLoaderData<typeof loader>();
  const {media, title, vendor, descriptionHtml} = product;
  const {shippingPolicy, refundPolicy} = shop;
  const [offerOpen, setOfferOpen] = useState(false);

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
  const specWeave = p.spec_weave?.value || null;
  const specProfile = p.spec_profile?.value || null;
  const specClasp = p.spec_clasp?.value || null;
  const specCast = p.spec_cast?.value || null;
  const hasSpecs = specWeave || specProfile || specClasp || specCast;

  // Use variant weight if available (from Shopify variant grams), else metafield, else fake
  const variantWeight = (selectedVariant as any)?.weight
    ? parseFloat((selectedVariant as any).weight)
    : null;

  const fakeWeight = (() => {
    if (weightGrams || variantWeight) return weightGrams || variantWeight!;
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0;
    }
    return Math.round(((Math.abs(hash) % 390) + 30) / 10 * 10) / 10;
  })();

  // Variant weight takes priority (changes with length), then metafield, then fake
  const displayWeight = variantWeight || weightGrams || fakeWeight;

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

  // Compute gold transparency breakdown (only when we have weight)
  const hasTransparency = weightGrams !== null && weightGrams > 0;
  const goldBreakdown = hasTransparency
    ? computeGoldPrice({spotPerOz, weight: weightGrams!, karat, laborCost, margin: marginPercent})
    : null;

  // Per-gram price for the selected karat
  const selectedPurity = KARAT_PURITY[karat] ?? 0.75;
  const perGramSelected = (spotPerOz / 31.1035) * selectedPurity;

  // Gallery
  const mediaNodes = media?.nodes ?? [];

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
              <nav
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
            </div>
          </div>
        );
      })()}

      {/* ── Main Two-Column Grid ── */}
      <div
        className="styx-product-grid"
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          gap: 80,
          padding: '64px 56px 100px',
          alignItems: 'start',
        }}
      >
        {/* ── Left Column — Stacked Gallery ── */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          {/* Lead image — variant image if available, else first media */}
          {(() => {
            const variantImg = (selectedVariant as any)?.image;
            const firstMedia = mediaNodes[0];
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
                    sizes="(min-width: 1200px) 55vw, 90vw"
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

          {/* Remaining media — large, stacked */}
          {mediaNodes.slice(1, 8).map((m: any, i: number) => {
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
                  sizes="(min-width: 1200px) 55vw, 90vw"
                />
              </div>
            );
          })}

        </div>

        {/* ── Right Column — Product Info (sticky) ── */}
        <div className="styx-product-info" style={{position: 'sticky', top: 88, paddingTop: 8}}>
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
              const wirePrice = basePrice * 0.97;
              const currencyCode = selectedVariant.price.currencyCode;
              const fmt = (n: number) =>
                new Intl.NumberFormat('en-US', {style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2}).format(n);
              const pureGoldWeight = +(displayWeight * selectedPurity).toFixed(1);
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
                          color: STYX.silt,
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
                        3% discount
                      </div>
                    </div>
                  </div>

                  {/* Weight row: Gold weight + Total weight */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      marginTop: 14,
                      fontFamily: FONT.mono,
                      fontSize: 12,
                      color: STYX.silt,
                    }}
                  >
                    <span>
                      <span style={{color: STYX.gold}}>Au</span>{' '}
                      {pureGoldWeight}g pure ({karat}K / 24K)
                    </span>
                    <span style={{color: STYX.line}}>|</span>
                    <span>{displayWeight}g total</span>
                  </div>
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
                                textDecoration: 'none',
                                padding: '16px 0',
                                textAlign: 'center',
                                background: selected ? STYX.ink : 'transparent',
                                color: selected ? STYX.gold : STYX.ink,
                                borderRight: `1px solid ${STYX.line}`,
                                cursor: 'pointer',
                                opacity: available ? 1 : 0.35,
                                transition: 'all 0.25s ease',
                                position: 'relative',
                              }}
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
                      /* Color: text pills with small swatch dot */
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
                                fontSize: 12,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                textDecoration: 'none',
                                padding: '14px 0',
                                textAlign: 'center',
                                background: selected ? STYX.ink : 'transparent',
                                color: selected ? STYX.bone : STYX.ink,
                                borderRight: `1px solid ${STYX.line}`,
                                cursor: 'pointer',
                                opacity: available ? 1 : 0.35,
                                transition: 'all 0.25s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                position: 'relative',
                              }}
                            >
                              <span
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background: colorSwatches[name] || STYX.silt2,
                                  boxShadow: selected
                                    ? 'inset 0 0 0 1px rgba(239,234,224,0.3)'
                                    : 'inset 0 0 0 1px rgba(26,24,21,0.12)',
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
                      /* Default: pill buttons */
                      option.optionValues.map(
                        ({isDifferentProduct, name, variantUriQuery, handle, selected, available, swatch}) => (
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
                              textDecoration: 'none',
                              padding: '12px 24px',
                              background: selected ? STYX.ink : 'transparent',
                              color: selected ? STYX.bone : STYX.ink,
                              border: `1px solid ${selected ? STYX.ink : STYX.line}`,
                              cursor: 'pointer',
                              opacity: available ? 1 : 0.35,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {swatch?.color || swatch?.image?.previewImage?.url ? (
                              <ProductOptionSwatch swatch={swatch} name={name} />
                            ) : (
                              name
                            )}
                          </Link>
                        ),
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
                  <div
                    style={{
                      flex: 1,
                      padding: '18px 24px',
                      background: STYX.silt2,
                      color: STYX.bone,
                      fontFamily: FONT.cinzel,
                      fontSize: 13,
                      letterSpacing: '0.25em',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      cursor: 'not-allowed',
                      opacity: 0.6,
                    }}
                  >
                    Sold Out
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
                {/* Wishlist Heart */}
                <button
                  style={{
                    width: 64,
                    border: `1px solid ${STYX.line}`,
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.25s ease',
                  }}
                  aria-label="Add to wishlist"
                >
                  <svg
                    width="22"
                    height="20"
                    viewBox="0 0 22 20"
                    fill="none"
                    stroke={STYX.ink}
                    strokeWidth="1.5"
                  >
                    <path d="M11 18.5C11 18.5 1.5 13 1.5 6.5C1.5 3.46 3.96 1 7 1C8.8 1 10.37 1.89 11 3.18C11.63 1.89 13.2 1 15 1C18.04 1 20.5 3.46 20.5 6.5C20.5 13 11 18.5 11 18.5Z" />
                  </svg>
                </button>
              </div>

              {/* ShopPay */}
              {!isOutOfStock && (
                <div style={{marginTop: 12}}>
                  <ShopPayButton
                    width="100%"
                    variantIds={[selectedVariant.id!]}
                    storeDomain={storeDomain}
                  />
                </div>
              )}

              {/* Make an Offer */}
              {!isOutOfStock && (
                <button
                  onClick={() => setOfferOpen(true)}
                  style={{
                    marginTop: 16,
                    background: 'none',
                    border: `1px solid ${STYX.graphite}`,
                    cursor: 'pointer',
                    fontFamily: FONT.cinzel,
                    fontSize: 12,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: STYX.graphite,
                    padding: '16px 24px',
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  Make an Offer
                </button>
              )}
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
              <div
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
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24}}>
                  <div>
                    <div style={{fontFamily: FONT.cinzel, fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: STYX.gold, marginBottom: 8}}>
                      Make an Offer
                    </div>
                    <div style={{fontFamily: FONT.cinzel, fontSize: 20, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.04em', color: STYX.ink}}>
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

                {/* Rules */}
                <div
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
                  Offers are reviewed within 24 hours. Once accepted, you have 48 hours to complete your purchase at the agreed price. Offers not completed within this window expire automatically.
                </div>

                {/* Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const data = new FormData(form);
                    const payload = {
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
                    // For now, log to console. Hook up to API/email later.
                    console.log('Offer submitted:', payload);
                    alert('Your offer has been submitted. We will respond within 24 hours.');
                    setOfferOpen(false);
                  }}
                  style={{display: 'flex', flexDirection: 'column', gap: 16}}
                >
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
                  <button
                    type="submit"
                    style={{
                      padding: '16px 24px',
                      background: STYX.ink,
                      color: STYX.bone,
                      fontFamily: FONT.cinzel,
                      fontSize: 12,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    Submit Offer
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Shipping / Returns Disclosure ── */}
          <div style={{marginTop: 48, paddingTop: 40, borderTop: `1px solid ${STYX.line}`}}>
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
                {label: 'Karat', value: karat ? `${karat}k Gold` : null},
                {label: 'Color', value: selectedColor || 'Yellow Gold'},
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

          {/* ── Transparency Receipt (below cart) ── */}
          {selectedVariant?.price && (
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
        </div>
      </div>

      {/* ── Transparency Narrative Section ── */}
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

        {/* Honest Ledger Grid */}
        <div
          className="styx-product-ledger"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            background: STYX.bone,
            border: `1px solid ${STYX.line}`,
            marginTop: 56,
          }}
        >
          {[
            {
              n: 'I',
              label: 'Gold Weight',
              value: `${displayWeight}g`,
              sub: `solid ${karat}k gold`,
            },
            {
              n: 'II',
              label: 'Material Cost',
              value: goldBreakdown ? `$${goldBreakdown.materialCost.toFixed(2)}` : `$${(displayWeight * perGramSelected).toFixed(2)}`,
              sub: 'at market price',
            },
            {
              n: 'III',
              label: 'Hand Labor',
              value: goldBreakdown ? `$${goldBreakdown.laborCost.toFixed(2)}` : `$${laborCost.toFixed(2)}`,
              sub: 'cast & hand-finished',
            },
            {
              n: 'IV',
              label: 'Your Toll',
              value: goldBreakdown
                ? `$${goldBreakdown.retailPrice.toFixed(2)}`
                : selectedVariant?.price
                  ? `$${parseFloat(selectedVariant.price.amount).toFixed(2)}`
                  : '—',
              sub: goldBreakdown
                ? `${goldBreakdown.markupMultiple}x material`
                : 'final price',
            },
          ].map((cell) => (
            <div
              key={cell.label}
              style={{
                padding: '32px 24px',
                borderRight: `1px solid ${STYX.line}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{fontFamily: FONT.cinzel, fontSize: 14, color: STYX.gold, fontWeight: 500}}>
                {cell.n}
              </div>
              <div
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 11,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: STYX.silt,
                }}
              >
                {cell.label}
              </div>
              <div
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 28,
                  fontWeight: 600,
                  color: STYX.ink,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {cell.value}
              </div>
              <div
                style={{
                  fontFamily: FONT.cormorant,
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: STYX.silt2,
                  marginTop: 6,
                }}
              >
                {cell.sub}
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ── Specifications + Pull Quote ── */}
      {(hasSpecs || pullQuote) && (
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
              gridTemplateColumns: hasSpecs && pullQuote ? '1fr 1.2fr' : '1fr',
              gap: 80,
              alignItems: 'start',
            }}
            className="styx-product-specs-grid"
          >
            {/* Specifications */}
            {hasSpecs && (
              <div>
                <StyxLabel>Specifications</StyxLabel>
                <div
                  style={{
                    marginTop: 28,
                    background: STYX.bone,
                    border: `1px solid ${STYX.line}`,
                    padding: 28,
                  }}
                >
                  {([
                    ['Weave', specWeave],
                    ['Profile', specProfile],
                    ['Clasp', specClasp],
                    ['Our Cast', specCast],
                    ['Origin', chainOrigin],
                    ['Year', yearInvented],
                    ['Karat', `${karat}k (${(selectedPurity * 100).toFixed(1)}% pure)`],
                    ['Weight', `${displayWeight}g`],
                  ] as const).filter(([, v]) => v).map(([k, v], i, arr) => (
                    <div
                      key={k}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        padding: '14px 0',
                        borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${STYX.line}`,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: FONT.cinzel,
                          fontSize: 10,
                          letterSpacing: '0.25em',
                          color: STYX.silt,
                          textTransform: 'uppercase',
                        }}
                      >
                        {k}
                      </div>
                      <div
                        style={{
                          fontFamily: FONT.inter,
                          fontSize: 14,
                          color: STYX.ink,
                          fontWeight: 500,
                          textAlign: 'right',
                          maxWidth: '60%',
                        }}
                      >
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
        style={{
          background: STYX.taupe,
          color: STYX.bone,
        }}
      >
        <div style={{maxWidth: 1440, margin: '0 auto', padding: 56, display: 'flex', alignItems: 'center', gap: 40}}>
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

function ZoomableImage({data, sizes}: {data: any; sizes: string}) {
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
        sizes={sizes}
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
