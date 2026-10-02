import {STYX, FONT} from './constants';
import {CTAButton} from './CTAButton';

// Shopify CDN serves resized variants via the `width` query param; the
// original is 1.38 MB; these keep the LCP image proportional to the viewport.
// Exported so the homepage route can emit a <link rel="preload"> for the
// LCP image with matching srcset/sizes.
export const HERO_IMAGE =
  'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-hero.jpg?v=1779151485';
export const HERO_WIDTHS = [768, 1280, 1600, 2048];

export function HeroGallery() {
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
      {/* Full-bleed background image (LCP: load eagerly at high priority) */}
      <img
        className="styx-hero-image"
        src={`${HERO_IMAGE}&width=1600`}
        srcSet={HERO_WIDTHS.map((w) => `${HERO_IMAGE}&width=${w} ${w}w`).join(
          ', ',
        )}
        sizes="100vw"
        width={2048}
        height={869}
        loading="eager"
        // React 18 only forwards this attribute in lowercase
        {...({fetchpriority: 'high'} as any)}
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
        className="styx-hero-shade"
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            105deg,
            rgba(26,27,28,0.88) 0%,
            rgba(26,27,28,0.72) 35%,
            rgba(26,27,28,0.25) 65%,
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
            'linear-gradient(to top, rgba(26,27,28,0.5) 0%, transparent 30%)',
          zIndex: 1,
        }}
      />

      <div className="styx-hero-frame" aria-hidden="true" />

      {/* Content */}
      <div
        className="styx-hero-content"
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '120px 56px 80px',
          maxWidth: 760,
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
          Three generations in the gold trade
        </div>

        {/* Main heading */}
        <h1
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 60,
            fontWeight: 400,
            letterSpacing: '0.03em',
            color: STYX.bone,
            textTransform: 'uppercase',
            lineHeight: 1,
            margin: 0,
          }}
        >
          Gold, priced by{' '}
          <span
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              textTransform: 'none',
              fontSize: '0.95em',
              fontWeight: 400,
              letterSpacing: '0.01em',
              color: STYX.goldLight,
            }}
          >
            weight.
          </span>
          <br />
          Not by mystery.
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: FONT.cormorant,
            fontSize: 20,
            color: 'rgba(235,235,232,0.8)',
            maxWidth: 470,
            lineHeight: 1.7,
            margin: '28px 0 40px',
          }}
        >
          Every chain shows you what its gold is worth today, what the craft
          costs, and what we&apos;ll pay to buy it back.
        </p>

        {/* CTAs */}
        <div
          className="styx-hero-actions"
          style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}
        >
          <CTAButton
            variant="primary"
            href="/collections"
            style={{
              background: STYX.gold,
              borderColor: STYX.gold,
              color: STYX.ink,
            }}
          >
            Shop chains
          </CTAButton>
          <CTAButton
            variant="gold"
            href="#how-we-price"
            style={{
              color: STYX.bone,
              borderColor: 'rgba(235,235,232,0.45)',
            }}
          >
            How we price
          </CTAButton>
        </div>
      </div>
    </section>
  );
}
