import {useState, useCallback} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import {Link} from '@remix-run/react';
import {STYX, FONT} from './constants';
import {PlaceholderImage} from './PlaceholderImage';
import {Obol} from './Obol';

type VariantNode = {
  id: string;
  availableForSale?: boolean;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
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

type ProductNode = {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  variants: {
    nodes: VariantNode[];
  };
};

/**
 * Convert variant weight to grams based on weightUnit.
 */
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

/**
 * StyxProductCard — displays a single product variant card.
 *
 * @param product       The full product node (with all variants).
 * @param variantIndex  Which variant to feature (defaults to 0).
 *                      When exploding by color on collection pages,
 *                      pass the index of a specific color variant.
 */
export function StyxProductCard({
  product,
  variantIndex = 0,
  index = 0,
}: {
  product: ProductNode;
  variantIndex?: number;
  index?: number;
}) {
  const variant = product.variants.nodes[variantIndex] ?? product.variants.nodes[0];
  const [imageLoaded, setImageLoaded] = useState(false);
  const onImageLoad = useCallback(() => setImageLoaded(true), []);
  if (!variant) return null;

  // Detect karat from the displayed variant's selected options
  const karatOpt = variant.selectedOptions?.find(
    (o) => o.name.toLowerCase() === 'karat',
  );
  const karat = karatOpt ? parseInt(karatOpt.value, 10) : 14;

  // Detect color from displayed variant
  const colorOpt = variant.selectedOptions?.find(
    (o) => o.name.toLowerCase() === 'color',
  );
  const colorLabel = colorOpt?.value || null;

  // Prices: get range from all variants sharing the same color (if available)
  const sameColorVariants = colorLabel
    ? product.variants.nodes.filter((v) =>
        v.selectedOptions?.some(
          (o) => o.name.toLowerCase() === 'color' && o.value === colorLabel,
        ),
      )
    : product.variants.nodes;

  const prices = sameColorVariants.map((v) => parseFloat(v.price.amount));
  const minPrice = Math.min(...prices);
  const hasRange = Math.max(...prices) > minPrice;

  // Customer cost per gram: total price / total weight in grams
  const variantPrice = parseFloat(variant.price.amount);
  const weightGrams =
    variant.weight != null && variant.weight > 0
      ? toGrams(variant.weight, variant.weightUnit)
      : null;
  const costPerGram = weightGrams ? variantPrice / weightGrams : null;

  // Build URL query to pre-select the color
  const variantQuery = colorLabel
    ? `?Color=${encodeURIComponent(colorLabel)}`
    : '';

  // Color swatch hex for the badge
  const COLOR_HEX: Record<string, string> = {
    'Yellow Gold': '#C5A059',
    'Rose Gold': '#C08572',
    'White Gold': '#D4D2CC',
  };
  const swatchHex = colorLabel ? COLOR_HEX[colorLabel] : null;

  return (
    <Link
      to={`/products/${product.handle}${variantQuery}`}
      style={{textDecoration: 'none', display: 'block', position: 'relative'}}
      prefetch="intent"
      onMouseEnter={(e) => {
        const slats = e.currentTarget.querySelector('[data-slats]') as HTMLElement;
        if (slats) slats.style.opacity = '0.04';
      }}
      onMouseLeave={(e) => {
        const slats = e.currentTarget.querySelector('[data-slats]') as HTMLElement;
        if (slats) slats.style.opacity = '0';
      }}
    >
      {/* Image */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          aspectRatio: '4/5',
          background: STYX.parchment,
        }}
      >
        {/* Obol coin-flip loader — visible until image loads */}
        {variant.image && !imageLoaded && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <Obol
              size={48}
              color={STYX.gold}
              speed={3}
              flyIn
              delay={index * 150}
            />
          </div>
        )}
        {variant.image ? (
          <Image
            data={variant.image}
            aspectRatio="4/5"
            sizes="(min-width: 1200px) 25vw, 50vw"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
            onLoad={onImageLoad}
          />
        ) : (
          <PlaceholderImage
            aspect="4/5"
            label={colorLabel ? `${product.title} · ${colorLabel}` : product.title}
          />
        )}

        {/* Color swatch badge — top left */}
        {swatchHex && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(239,234,224,0.92)',
              backdropFilter: 'blur(8px)',
              padding: '6px 12px 6px 8px',
              borderRadius: 20,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: swatchHex,
                boxShadow: 'inset 0 0 0 1px rgba(26,24,21,0.12)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 9,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: STYX.ink,
              }}
            >
              {colorLabel}
            </span>
          </div>
        )}

        {/* Cost-per-gram footer — always visible */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            padding: '8px 12px',
            background: STYX.ink,
            color: STYX.bone,
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.1em',
            display: 'flex',
            gap: 10,
          }}
        >
          <span>{karat}k</span>
          <span style={{color: STYX.gold}}>·</span>
          <span>
            {costPerGram != null
              ? `$${costPerGram.toFixed(0)}/g`
              : `$${minPrice.toLocaleString()}`}
          </span>
        </div>

        {/* Vertical slats on hover */}
        <div
          data-slats
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0 23px, rgba(26,24,21,0.06) 23px 24px)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Info */}
      <div
        style={{
          paddingTop: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 15,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: STYX.ink,
          }}
        >
          {product.title}
        </div>
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 14,
            color: STYX.ink,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {hasRange ? 'from ' : ''}${minPrice.toLocaleString()}
        </div>
      </div>
    </Link>
  );
}
