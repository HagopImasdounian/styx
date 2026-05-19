import {Link} from 'react-router';
import {STYX, FONT} from './constants';
import {CTAButton} from './CTAButton';
import {Obol} from './Obol';

export function HeroGallery({products = []}: {products?: any[]}) {
  return (
    <section
      className="styx-hero"
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Full-bleed background image */}
      <img
        src="https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-hero.jpg?v=1779151485"
        alt="Man wearing a gold chain in a vintage convertible"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 0,
        }}
      />

      {/* Gradient overlay for text legibility */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            105deg,
            rgba(26,24,21,0.88) 0%,
            rgba(26,24,21,0.72) 35%,
            rgba(26,24,21,0.25) 65%,
            transparent 100%
          )`,
          zIndex: 1,
        }}
      />

      {/* Subtle bottom vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(26,24,21,0.5) 0%, transparent 30%)',
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        className="styx-hero-content"
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '120px 56px 80px',
          maxWidth: 640,
        }}
      >
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
            fontSize: 72,
            fontWeight: 400,
            letterSpacing: '0.03em',
            color: STYX.bone,
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
            fontSize: 20,
            color: 'rgba(239,234,224,0.8)',
            maxWidth: 440,
            lineHeight: 1.7,
            margin: '28px 0 40px',
          }}
        >
          Solid gold chains priced at what they're worth — not what the
          industry pretends. Every piece weighed, tested, and priced from the
          London fix. No markup mystery.
        </p>

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

    </section>
  );
}
