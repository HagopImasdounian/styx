import {Link} from 'react-router';
import {STYX, FONT} from './constants';
import type {ChainProduct} from '~/lib/shiny.server';

const COLOR_HEX: Record<string, string> = {
  yellow: '#C5A059',
  white: '#D4D2CC',
  rose: '#C08572',
};

export function ChainProductCard({
  product,
  index = 0,
}: {
  product: ChainProduct;
  index?: number;
}) {
  const {variants, priceRange, karat, thickness, isHollow, category} = product;
  if (variants.length === 0) return null;

  // Get unique colors
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

  // Weight range
  const weights = variants.map((v) => v.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightLabel =
    minWeight === maxWeight
      ? `${minWeight}g`
      : `${minWeight}–${maxWeight}g`;

  // Length range
  const lengths = variants
    .map((v) => parseFloat(v.length))
    .filter((l) => l > 0)
    .sort((a, b) => a - b);
  const uniqueLengths = [...new Set(lengths)];

  // Construction
  const construction = isHollow ? 'Hollow' : 'Solid';

  // Display name cleanup
  const displayName = product.name
    .replace(/^10K\s*(Italian\s*Chains?\s*-?\s*)?/i, '')
    .replace(/^14K?\s*(Italian\s*Chains?\s*-?\s*)?/i, '')
    .replace(/^Italian\s*Chains?\s*-?\s*14K\s*-?\s*/i, '')
    .replace(/Hollow\s*(Italian\s*Chains?\s*-?\s*)?/i, '')
    .replace(/^\s*-\s*/, '')
    .replace(/\s*DIAMOND\s*CUT\s*/i, ' ')
    .replace(/\s*SOLID\s*/i, ' ')
    .trim();

  const url =
    category === 'bracelet'
      ? `/chains/bracelet/${product.slug}`
      : `/chains/${category}/${product.slug}`;

  return (
    <Link
      to={url}
      style={{textDecoration: 'none', display: 'block'}}
      prefetch="intent"
    >
      {/* Image */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          aspectRatio: '4/5',
          background: '#FFFFFF',
        }}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading={index < 4 ? 'eager' : 'lazy'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: STYX.bone,
            }}
          >
            <span
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 14,
                color: STYX.silt,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                textAlign: 'center',
                padding: 20,
              }}
            >
              {displayName}
            </span>
          </div>
        )}

        {/* Karat + construction badge — top left */}
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
            padding: '5px 10px',
            borderRadius: 20,
          }}
        >
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: STYX.ink,
            }}
          >
            {karat}K · {construction}
          </span>
        </div>

        {/* Color swatches — top right */}
        {colors.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              display: 'flex',
              gap: 4,
            }}
          >
            {colors.map((color) => (
              <span
                key={color}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: COLOR_HEX[color] || STYX.gold,
                  boxShadow:
                    'inset 0 0 0 1px rgba(26,24,21,0.1), 0 1px 3px rgba(0,0,0,0.1)',
                }}
                title={`${color} gold`}
              />
            ))}
          </div>
        )}

        {/* Thickness badge — bottom right */}
        {thickness && (
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
            <span style={{color: STYX.gold}}>{thickness}</span>
            <span style={{opacity: 0.5, margin: '0 5px'}}>|</span>
            <span style={{opacity: 0.7}}>{weightLabel}</span>
          </div>
        )}
      </div>

      {/* Info Block */}
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
          {displayName || product.name}
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
          {priceRange.min !== priceRange.max && (
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
          ${priceRange.min.toLocaleString()}
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
            flexWrap: 'wrap',
            gap: 0,
          }}
        >
          <span>{karat}K</span>
          <span style={{margin: '0 6px', opacity: 0.35}}>·</span>
          <span>{construction}</span>
          {thickness && (
            <>
              <span style={{margin: '0 6px', opacity: 0.35}}>·</span>
              <span>{thickness}</span>
            </>
          )}
          {uniqueLengths.length > 0 && (
            <>
              <span style={{margin: '0 6px', opacity: 0.35}}>·</span>
              <span>
                {uniqueLengths.length === 1
                  ? `${uniqueLengths[0]}"`
                  : `${uniqueLengths[0]}"–${uniqueLengths[uniqueLengths.length - 1]}"`}
              </span>
            </>
          )}
        </div>

        {/* Live pricing indicator */}
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
            Live Priced
          </span>
        </div>
      </div>
    </Link>
  );
}
