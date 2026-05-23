import {useState} from 'react';
import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {STYX, FONT} from './constants';
import {PlaceholderImage} from './PlaceholderImage';

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
  chain_construction?: {value: string} | null;
};

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
  const [isHovered, setIsHovered] = useState(false);
  if (!variant) return null;

  // Hover image from a different variant
  const hoverImage = (() => {
    const primaryUrl = variant.image?.url;
    if (!primaryUrl) return null;
    const other = product.variants.nodes.find(
      (v) => v.image?.url && v.image.url !== primaryUrl,
    );
    return other?.image ?? null;
  })();

  // Karat: variant option > title parsing > default 10
  const karatOpt = variant.selectedOptions?.find(
    (o) => o.name.toLowerCase() === 'karat',
  );
  const karat = karatOpt
    ? parseInt(karatOpt.value, 10)
    : /18\s*k/i.test(product.title) ? 18
    : /14\s*k/i.test(product.title) ? 14
    : 10;

  // Color
  const colorOpt = variant.selectedOptions?.find(
    (o) => o.name.toLowerCase() === 'color',
  );
  const colorLabel = colorOpt?.value || null;
  const swatchHex = colorLabel ? COLOR_HEX[colorLabel] : null;

  // Weight — use displayed variant's weight, or fall back to any variant with weight
  const rawWeight = variant.weight != null && variant.weight > 0
    ? {w: variant.weight, u: variant.weightUnit}
    : (() => {
        const fallback = product.variants.nodes.find(
          (v) => v.weight != null && v.weight > 0,
        );
        return fallback ? {w: fallback.weight!, u: fallback.weightUnit} : null;
      })();
  const weightGrams = rawWeight ? toGrams(rawWeight.w, rawWeight.u) : null;

  // Pure gold content
  const purity = KARAT_PURITY[karat] ?? 10 / 24;
  const pureGold = weightGrams ? weightGrams * purity : null;

  // Construction from metafield (fallback to title)
  const constructionMeta = product.chain_construction?.value;
  const construction = constructionMeta || (/hollow/i.test(product.title) ? 'Hollow' : 'Solid');

  // Prices
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

  // Stock
  const inStock = sameColorVariants.some((v) => v.availableForSale);

  // URL
  const variantQuery = colorLabel
    ? `?Color=${encodeURIComponent(colorLabel)}`
    : '';

  return (
    <Link
      to={`/products/${product.handle}${variantQuery}`}
      style={{textDecoration: 'none', display: 'block'}}
      prefetch="intent"
      onMouseEnter={() => {
        if (hoverImage) setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      {/* ── Image ── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          aspectRatio: '4/5',
          background: '#FFFFFF',
        }}
      >
        {variant.image ? (
          <Image
            data={variant.image}
            aspectRatio="4/5"
            sizes="(min-width: 1200px) 25vw, 50vw"
            style={{
              width: '100%',
              height: '100%',
              objectFit:
                variant.image.width && variant.image.height &&
                variant.image.width / variant.image.height > 2.5
                  ? 'contain'
                  : 'cover',
            }}
          />
        ) : (
          <PlaceholderImage
            aspect="4/5"
            label={colorLabel ? `${product.title} · ${colorLabel}` : product.title}
          />
        )}

        {/* Hover image */}
        {hoverImage && (
          <Image
            data={hoverImage}
            aspectRatio="4/5"
            sizes="(min-width: 1200px) 25vw, 50vw"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit:
                hoverImage.width && hoverImage.height &&
                hoverImage.width / hoverImage.height > 2.5
                  ? 'contain'
                  : 'cover',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.4s ease',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Color swatch — top left */}
        {swatchHex && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(8px)',
              padding: '5px 10px 5px 7px',
              borderRadius: 20,
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
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: STYX.ink,
              }}
            >
              {colorLabel}
            </span>
          </div>
        )}

        {/* Pure gold badge — bottom right */}
        {pureGold != null && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              padding: '7px 11px',
              background: 'rgba(26,24,21,0.88)',
              backdropFilter: 'blur(6px)',
              color: STYX.bone,
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: '0.06em',
            }}
          >
            <span style={{color: STYX.gold}}>{pureGold.toFixed(1)}g</span>
            <span style={{opacity: 0.5, margin: '0 5px'}}>|</span>
            <span style={{opacity: 0.7}}>pure gold</span>
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
      </div>

      {/* ── Info Block ── */}
      <div style={{paddingTop: 14}}>
        {/* Title */}
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 12,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            lineHeight: 1.4,
            color: STYX.ink,
            marginBottom: 4,
          }}
        >
          {product.title}
          {colorLabel && (
            <span style={{color: STYX.silt, fontWeight: 400}}>{' '}&mdash; {colorLabel}</span>
          )}
        </div>

        {/* Price */}
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 18,
            fontWeight: 400,
            color: STYX.ink,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.02em',
            marginBottom: 6,
          }}
        >
          {hasRange && (
            <span
              style={{
                fontFamily: FONT.inter,
                fontSize: 10,
                fontWeight: 400,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: STYX.silt,
                marginRight: 4,
              }}
            >
              from
            </span>
          )}
          ${minPrice.toFixed(2)}
        </div>

        {/* Spec line */}
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.04em',
            color: STYX.silt,
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
        </div>

        {/* Stock indicator */}
        {inStock && (
          <div
            style={{
              marginTop: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: STYX.gold,
                boxShadow: `0 0 6px ${STYX.gold}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                background: `linear-gradient(90deg, ${STYX.goldDeep} 0%, ${STYX.goldLight} 25%, ${STYX.gold} 50%, ${STYX.goldLight} 75%, ${STYX.goldDeep} 100%)`,
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'styx-shimmer 3s linear infinite',
              }}
            >
              In Stock
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
