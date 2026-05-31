import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {STYX, FONT} from './constants';
import {PlaceholderImage} from './PlaceholderImage';

/**
 * Cross-sell "You may also like" module shown directly under the live price box
 * on the product page. Candidates are pre-ranked in the route loader by:
 *   1. Same chain style / weave
 *   2. Same construction (hollow vs solid)
 *   3. Nearest width / thickness
 *   4. Necklace <-> bracelet pairing (the key upsell)
 * It renders nothing when there are no good matches.
 */

type CrossSellVariant = {
  id: string;
  availableForSale?: boolean;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  price: {amount: string; currencyCode: string};
  selectedOptions?: Array<{name: string; value: string}>;
};

export type CrossSellProduct = {
  id: string;
  title: string;
  handle: string;
  productType?: string | null;
  variants: {nodes: CrossSellVariant[]};
  /** Short reason badge, e.g. "Matching bracelet" or "5mm · Cuban Link" */
  reason?: string | null;
};

function pickVariant(product: CrossSellProduct): CrossSellVariant | null {
  const nodes = product.variants?.nodes ?? [];
  return nodes.find((v) => v.image?.url) ?? nodes[0] ?? null;
}

export function RecommendedProducts({
  products,
  heading = 'Pairs Well With',
}: {
  products: CrossSellProduct[];
  heading?: string;
}) {
  const items = (products ?? []).filter(Boolean).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 32,
        paddingTop: 24,
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
          marginBottom: 16,
        }}
      >
        {heading}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {items.map((product) => {
          const variant = pickVariant(product);
          if (!variant) return null;

          const prices = (product.variants?.nodes ?? [])
            .map((v) => parseFloat(v.price.amount))
            .filter((n) => !Number.isNaN(n));
          const minPrice = prices.length ? Math.min(...prices) : null;
          const hasRange = prices.length
            ? Math.max(...prices) > (minPrice ?? 0)
            : false;

          return (
            <Link
              key={product.id}
              to={`/products/${product.handle}`}
              prefetch="intent"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                textDecoration: 'none',
                border: `1px solid ${STYX.line}`,
                background: STYX.paper,
                padding: 10,
                transition: 'border-color 0.2s ease, background 0.2s ease',
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  flexShrink: 0,
                  overflow: 'hidden',
                  background: '#FFFFFF',
                }}
              >
                {variant.image ? (
                  <Image
                    data={variant.image}
                    aspectRatio="1/1"
                    sizes="72px"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit:
                        variant.image.width &&
                        variant.image.height &&
                        variant.image.width / variant.image.height > 2.5
                          ? 'contain'
                          : 'cover',
                    }}
                  />
                ) : (
                  <PlaceholderImage aspect="1/1" label={product.title} />
                )}
              </div>

              {/* Text */}
              <div style={{flex: 1, minWidth: 0}}>
                {product.reason && (
                  <div
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 9,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: STYX.gold,
                      marginBottom: 4,
                    }}
                  >
                    {product.reason}
                  </div>
                )}
                <div
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 12,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    lineHeight: 1.35,
                    color: STYX.ink,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {product.title}
                </div>
                {minPrice != null && (
                  <div
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 12,
                      color: STYX.silt,
                      marginTop: 3,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {hasRange && (
                      <span
                        style={{
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginRight: 4,
                          opacity: 0.7,
                        }}
                      >
                        from
                      </span>
                    )}
                    ${minPrice.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Arrow */}
              <span
                style={{
                  flexShrink: 0,
                  color: STYX.silt,
                  fontFamily: FONT.cinzel,
                  fontSize: 16,
                  paddingRight: 6,
                }}
                aria-hidden
              >
                &rarr;
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
