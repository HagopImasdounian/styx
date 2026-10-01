import {useRef, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {STYX, FONT} from './constants';
import {PlaceholderImage} from './PlaceholderImage';
import {CompareButton} from './CompareButton';
import {PrintListButton} from './PrintListButton';
import {WishlistButton} from './WishlistButton';
import {galleryImageKey, selectedGalleryMedia} from '~/lib/product-gallery';

type CardImage = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

type VariantNode = {
  sku?: string | null;
  id: string;
  availableForSale?: boolean;
  image?: CardImage | null;
  price: {
    amount: string;
    currencyCode: string;
  };
  compareAtPrice?: {
    amount: string;
    currencyCode: string;
  } | null;
  selectedOptions?: Array<{
    name: string;
    value: string;
  }>;
  weight?: number | null;
  weightUnit?: string | null;
};

/** Non-image media (video, 3D) come back as `{}` from the card fragment. */
type MediaNode = {
  id?: string;
  image?: CardImage | null;
};

type ProductNode = {
  id: string;
  title: string;
  handle: string;
  vendor?: string;
  variants: {
    nodes: VariantNode[];
  };
  media?: {
    nodes: MediaNode[];
  } | null;
  chain_construction?: {value: string} | null;
};

/** Mobile swipe strip cap: keeps the DOM and lazy requests bounded per card. */
export const CARD_SLIDE_LIMIT = 6;

/**
 * Slides for one card: the selected variant's image first (this is the SSR
 * visible image, so LCP/CLS are untouched), then the product media that
 * belongs to that variant's color only. Reuses the PDP gallery color logic
 * (alt text finish names, variant image ownership, [shared] marker) so a
 * yellow gold card never shows a white gold angle. Deduped on
 * galleryImageKey and capped at CARD_SLIDE_LIMIT.
 */
export function cardGallerySlides(
  product: Pick<ProductNode, 'variants' | 'media'>,
  variant: VariantNode,
): CardImage[] {
  const colors = [
    ...new Set(
      product.variants.nodes
        .map(
          (v) =>
            v.selectedOptions?.find((o) => o.name.toLowerCase() === 'color')
              ?.value,
        )
        .filter((c): c is string => Boolean(c)),
    ),
  ];
  const media = (product.media?.nodes ?? []).filter(
    (m): m is MediaNode & {image: CardImage} => Boolean(m?.image?.url),
  );
  const matching = selectedGalleryMedia(
    media,
    variant,
    product.variants.nodes,
    colors,
  );

  const slides: CardImage[] = [];
  const seen = new Set<string>();
  const push = (img: CardImage | null | undefined) => {
    if (!img?.url || slides.length >= CARD_SLIDE_LIMIT) return;
    const key = galleryImageKey(img.url);
    if (seen.has(key)) return;
    seen.add(key);
    slides.push(img);
  };
  push(variant.image);
  matching.forEach((m) => push(m.image));
  return slides;
}

const KARAT_PURITY: Record<number, number> = {
  10: 10 / 24,
  14: 14 / 24,
  18: 18 / 24,
  22: 22 / 24,
  24: 1.0,
};

function toGrams(weight: number, unit?: string | null): number {
  switch (unit) {
    case 'KILOGRAMS':
      return weight * 1000;
    case 'OUNCES':
      return weight * 28.3495;
    case 'POUNDS':
      return weight * 453.592;
    case 'GRAMS':
    default:
      return weight;
  }
}

const COLOR_HEX: Record<string, string> = {
  'Yellow Gold': '#C5A059',
  'Rose Gold': '#C08572',
  'White Gold': '#D4D2CC',
};

function imageFit(img: CardImage): 'contain' | 'cover' {
  return img.width && img.height && img.width / img.height > 2.5
    ? 'contain'
    : 'cover';
}

export function StyxProductCard({
  product,
  variantIndex = 0,
  index = 0,
  belowFold = false,
}: {
  product: ProductNode;
  variantIndex?: number;
  index?: number;
  /** Set when the card renders below the fold (e.g. homepage FeaturedRow)
   * keeps its images lazy so they don't compete with the page's LCP image. */
  belowFold?: boolean;
}) {
  const variant =
    product.variants.nodes[variantIndex] ?? product.variants.nodes[0];
  const [isHovered, setIsHovered] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  if (!variant) return null;

  // First 4 cards are above the fold on collection grids, load them eagerly,
  // and give the very first card top fetch priority (lowercase attribute:
  // React 18 doesn't forward camelCase fetchPriority to the DOM).
  const eager = !belowFold && index < 4;
  const priorityProps = (
    !belowFold && index === 0 ? {fetchpriority: 'high'} : {}
  ) as Record<string, string>;

  // Karat: variant option > title parsing > default 10
  const karatOpt = variant.selectedOptions?.find(
    (o) => o.name.toLowerCase() === 'karat',
  );
  const karat = karatOpt
    ? parseInt(karatOpt.value, 10)
    : /18\s*k/i.test(product.title)
    ? 18
    : /14\s*k/i.test(product.title)
    ? 14
    : 10;

  // Color
  const colorOpt = variant.selectedOptions?.find(
    (o) => o.name.toLowerCase() === 'color',
  );
  const colorLabel = colorOpt?.value || null;
  const swatchHex = colorLabel ? COLOR_HEX[colorLabel] : null;
  const altBase = colorLabel
    ? `${product.title} · ${colorLabel}`
    : product.title;

  // Weight, use displayed variant's weight, or fall back to any variant with weight
  const rawWeight =
    variant.weight != null && variant.weight > 0
      ? {w: variant.weight, u: variant.weightUnit}
      : (() => {
          const fallback = product.variants.nodes.find(
            (v) => v.weight != null && v.weight > 0,
          );
          return fallback
            ? {w: fallback.weight!, u: fallback.weightUnit}
            : null;
        })();
  const weightGrams = rawWeight ? toGrams(rawWeight.w, rawWeight.u) : null;

  // Pure gold content
  const purity = KARAT_PURITY[karat] ?? 10 / 24;
  const pureGold = weightGrams ? weightGrams * purity : null;

  // Construction from metafield (fallback to title)
  const constructionMeta = product.chain_construction?.value;
  const construction =
    constructionMeta || (/hollow/i.test(product.title) ? 'Hollow' : 'Solid');

  // Prices
  const sameColorVariants = colorLabel
    ? product.variants.nodes.filter((v) =>
        v.selectedOptions?.some(
          (o) => o.name.toLowerCase() === 'color' && o.value === colorLabel,
        ),
      )
    : product.variants.nodes;

  // $0 variants are catalog errors, never let them set a "from $0.00" floor.
  const prices = sameColorVariants
    .map((v) => parseFloat(v.price.amount))
    .filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const hasRange = prices.length ? Math.max(...prices) > minPrice : false;

  // Stock
  const inStock = sameColorVariants.some((v) => v.availableForSale);

  // URL
  const variantQuery = colorLabel
    ? `?Color=${encodeURIComponent(colorLabel)}`
    : '';

  // Images: slide 0 is the variant image (SSR visible on every viewport);
  // slides 1+ only scroll into view on touch/narrow viewports (see plp.css).
  const slides = cardGallerySlides(product, variant);
  const hasStrip = slides.length > 1;

  return (
    <Link
      data-reveal=""
      className="styx-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      to={`/products/${product.handle}${variantQuery}`}
      style={{textDecoration: 'none', display: 'block'}}
      prefetch="intent"
    >
      {/* ── Image ── */}
      <div
        className="styx-card-media"
        style={{
          position: 'relative',
          overflow: 'hidden',
          aspectRatio: '4/5',
          background: '#FFFFFF',
        }}
      >
        {slides.length ? (
          <div
            ref={stripRef}
            className="styx-card-strip"
            data-slides={slides.length}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              overflow: 'hidden',
            }}
            onScroll={
              hasStrip
                ? (e) => {
                    const el = e.currentTarget;
                    if (!el.clientWidth) return;
                    const next = Math.round(el.scrollLeft / el.clientWidth);
                    if (next !== activeSlide) setActiveSlide(next);
                  }
                : undefined
            }
          >
            {slides.map((img, i) => (
              <div
                className="styx-card-slide"
                key={galleryImageKey(img.url)}
                aria-hidden={i > 0 ? true : undefined}
                style={{flex: '0 0 100%', width: '100%', height: '100%'}}
              >
                <Image
                  data={img}
                  alt={
                    img.altText ??
                    (i === 0 ? altBase : `${altBase}, view ${i + 1}`)
                  }
                  aspectRatio="4/5"
                  sizes="(min-width: 1200px) 25vw, 50vw"
                  loading={i === 0 && eager ? 'eager' : 'lazy'}
                  {...(i === 0 ? priorityProps : {})}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: imageFit(img),
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <PlaceholderImage aspect="4/5" label={altBase} />
        )}

        {/* Prev / next arrows, desktop hover only (app.css). Inside the card
            link, so stop the click from navigating. */}
        {hasStrip && (
          <>
            <button
              type="button"
              className="styx-card-arrow"
              data-dir="prev"
              aria-label="Previous photo"
              disabled={activeSlide === 0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const el = stripRef.current;
                if (el) el.scrollTo({left: (activeSlide - 1) * el.clientWidth});
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M15 5l-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="styx-card-arrow"
              data-dir="next"
              aria-label="Next photo"
              disabled={activeSlide >= slides.length - 1}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const el = stripRef.current;
                if (el) el.scrollTo({left: (activeSlide + 1) * el.clientWidth});
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}

        {/* Swipe dots, mobile only (plp.css) */}
        {hasStrip && (
          <div
            className="styx-card-dots"
            aria-hidden="true"
            style={{display: 'none'}}
          >
            {slides.map((img, i) => (
              <span
                key={galleryImageKey(img.url)}
                className="styx-card-dot"
                data-active={i === activeSlide ? '' : undefined}
              />
            ))}
          </div>
        )}

        {/* Color swatch, top left */}
        {swatchHex && (
          <div
            className="styx-card-swatch"
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(247,245,240,0.92)',
              border: '1px solid var(--styx-border)',
              padding: '4px 9px 4px 6px',
              borderRadius: 3,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: swatchHex,
                boxShadow: 'inset 0 0 0 1px rgba(26,24,21,0.1)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: FONT.inter,
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: '0.01em',
                color: STYX.ink,
              }}
              className="styx-card-swatch-label"
            >
              {colorLabel}
            </span>
          </div>
        )}

        {/* Pure gold badge, bottom right */}
        {pureGold != null && (
          <div
            className="styx-card-gold"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              padding: '5px 8px',
              background: '#242a24',
              color: '#f7f5f0',
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: '0.04em',
              pointerEvents: 'none',
            }}
          >
            <span style={{color: STYX.goldLight}}>{pureGold.toFixed(1)}g</span>
            <span style={{opacity: 0.7, marginLeft: 5}}>pure gold</span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(26,24,21,0.03)',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          }}
        />

        {/* Compare + print-size buttons, top right */}
        <div
          className="styx-card-actions"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 4,
            opacity: isHovered ? 1 : 0.6,
            transition: 'opacity 0.3s ease',
          }}
        >
          <CompareButton handle={product.handle} compact />
          <PrintListButton handle={product.handle} compact />
          <WishlistButton handle={product.handle} compact />
        </div>
      </div>

      {/* ── Info Block ── */}
      <div className="styx-card-info" style={{paddingTop: 14}}>
        {/* Title */}
        <div
          className="styx-card-title"
          style={{
            fontFamily: FONT.inter,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.005em',
            lineHeight: 1.45,
            color: '#1a1815',
            marginBottom: 2,
          }}
        >
          {product.title}
          {colorLabel && (
            <span style={{color: 'var(--styx-muted)', fontWeight: 400}}>
              {' '}
              {colorLabel}
            </span>
          )}
        </div>

        {/* Price */}
        <div
          className="styx-card-price"
          style={{
            fontFamily: FONT.cormorant,
            fontSize: 22,
            fontWeight: 500,
            lineHeight: 1.2,
            color: '#1a1815',
            fontVariantNumeric: 'lining-nums tabular-nums',
            letterSpacing: '-0.01em',
            marginBottom: 6,
          }}
        >
          {hasRange && (
            <span
              style={{
                fontFamily: FONT.inter,
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: '0.01em',
                color: 'var(--styx-muted)',
                marginRight: 6,
              }}
            >
              From
            </span>
          )}
          {minPrice > 0
            ? `$${minPrice.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            : 'Price on request'}
        </div>

        {/* Spec line */}
        <div
          className="styx-card-meta"
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.02em',
            color: 'var(--styx-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 0,
          }}
        >
          {weightGrams != null && (
            <>
              <span>{weightGrams}g</span>
              <span style={{margin: '0 6px', opacity: 0.35}}>·</span>
            </>
          )}
          <span>{karat}k</span>
          <span style={{margin: '0 6px', opacity: 0.35}}>·</span>
          <span>{construction}</span>
          {variant.sku && (
            <>
              <span
                className="styx-card-meta-sep"
                style={{margin: '0 6px', opacity: 0.35}}
              >
                ·
              </span>
              <span
                className="styx-card-sku"
                title="Model number"
                style={{fontFamily: FONT.mono, letterSpacing: '0.02em'}}
              >
                #{variant.sku.replace(/\s*-\s*/g, '-')}
              </span>
            </>
          )}
        </div>

        {/* Stock indicator */}
        {inStock && (
          <div
            style={{
              marginTop: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#a98648',
                flexShrink: 0,
              }}
            />
            <span
              className="styx-card-stock"
              style={{
                fontFamily: FONT.inter,
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: '0.01em',
                color: 'var(--styx-muted)',
              }}
            >
              In stock
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
