import {Image} from '@shopify/hydrogen';
import {Link} from '@remix-run/react';
import {STYX, FONT} from './constants';
import {StoneBg} from './StoneBg';
import {CTAButton} from './CTAButton';
import {Obol} from './Obol';

export function HeroGallery({products = []}: {products?: any[]}) {
  // Pick a hero product (first one with a variant image)
  const heroProduct =
    products.find((p: any) => p.variants?.nodes?.[0]?.image?.url) ||
    products[0];
  const heroImage = heroProduct?.variants?.nodes?.[0]?.image ?? null;

  return (
    <StoneBg
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        padding: '64px 56px',
        minHeight: '70vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left: Copy */}
      <div style={{maxWidth: 560}}>
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 11,
            letterSpacing: '0.3em',
            color: STYX.gold,
            marginBottom: 24,
            textTransform: 'uppercase',
          }}
        >
          Launch · 1g free per $1,500 spent
        </div>

        {/* Main heading */}
        <h1
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 64,
            fontWeight: 400,
            letterSpacing: '0.03em',
            color: STYX.ink,
            textTransform: 'uppercase',
            lineHeight: 0.95,
            margin: 0,
          }}
        >
          Gold That
          <br />
          Holds Its
          <br />
          <span
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              textTransform: 'none',
              fontSize: '0.85em',
              fontWeight: 400,
              letterSpacing: '0.01em',
            }}
          >
            weight.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: FONT.cormorant,
            fontSize: 19,
            color: STYX.graphite,
            maxWidth: 420,
            lineHeight: 1.7,
            margin: '24px 0 36px',
          }}
        >
          Solid gold chains priced at what they're worth — not what the
          industry pretends. Every piece weighed, tested, and priced from the
          London fix. No markup mystery.
        </p>

        {/* Trust points */}
        <div
          style={{
            display: 'flex',
            gap: 32,
            marginBottom: 36,
            fontFamily: FONT.inter,
            fontSize: 11,
            letterSpacing: '0.1em',
            color: STYX.silt,
            textTransform: 'uppercase',
          }}
        >
          <span>Weighed & tested multiple times</span>
          <span style={{color: STYX.gold}}>·</span>
          <span>10K & 14K</span>
          <span style={{color: STYX.gold}}>·</span>
          <span>Meets or exceeds stamped karat</span>
        </div>

        {/* CTAs */}
        <div style={{display: 'flex', gap: 16}}>
          <CTAButton variant="primary" href="/collections">
            Shop Chains
          </CTAButton>
          <CTAButton variant="ghost" href="/about">
            Our Promise
          </CTAButton>
        </div>
      </div>

      {/* Right: Hero Product */}
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <div style={{position: 'relative', maxWidth: 420, width: '100%'}}>
          {/* Glow behind product */}
          <div
            style={{
              position: 'absolute',
              inset: -40,
              background: `radial-gradient(ellipse at center, ${STYX.goldLight}18 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          {heroImage ? (
            <Link to={`/products/${heroProduct.handle}`} style={{display: 'block'}}>
              <Image
                data={heroImage}
                sizes="(min-width: 1200px) 35vw, 50vw"
                style={{width: '100%', height: 'auto', display: 'block', position: 'relative'}}
              />
            </Link>
          ) : (
            <div
              style={{
                aspectRatio: '4/5',
                background: STYX.paper,
                border: `1px solid ${STYX.line}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                fontSize: 16,
                color: STYX.silt2,
                position: 'relative',
              }}
            >
              Hero Product
            </div>
          )}

          {/* Product name badge */}
          {heroProduct && (
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                background: 'rgba(26,24,21,0.85)',
                backdropFilter: 'blur(8px)',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 11,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: STYX.bone,
                }}
              >
                {heroProduct.title}
              </span>
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  color: STYX.gold,
                }}
              >
                Shop →
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Obol coin */}
      <div style={{position: 'absolute', bottom: 24, right: 56}}>
        <Obol size={36} color={STYX.gold} speed={12} />
      </div>
    </StoneBg>
  );
}
