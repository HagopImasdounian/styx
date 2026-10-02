import {data, type LoaderFunctionArgs, type MetaArgs} from 'react-router';
import {Link} from 'react-router';
import {
  STYX,
  FONT,
  GoldTicker,
  StyxNav,
  StyxFooter,
  StyxLabel,
  Obol,
} from '~/components/styx';
import {getStyxSeoMeta} from '~/lib/seo-meta';
import {validateLocale} from '~/lib/utils';
import {CACHE_LONG, routeHeaders} from '~/data/cache';

/** This route renders its own GoldTicker + StyxNav + StyxFooter. */
export const handle = {ownChrome: true};

export const headers = routeHeaders;

export async function loader({request, params}: LoaderFunctionArgs) {
  validateLocale(params);
  return data({url: request.url}, {headers: {'Cache-Control': CACHE_LONG}});
}

export const meta = ({data}: MetaArgs<typeof loader>) => {
  return getStyxSeoMeta({
    title: 'The Lore',
    titleTemplate: '%s | STYX Gold',
    description:
      'Charon, the obol, and the crossing. Why a gold chain company is named after the river of the dead, and why gold is the only thing that crosses over.',
    url: data?.url,
  });
};

/* Gutter collapses to 16px at phone width, 56px on desktop. */
const GUTTER = 'clamp(16px, 4vw, 56px)';

/* ── Lore image ──
   One generated still of the crossing (Nano Banana Pro, 2026-10-02): a
   ferryman on black water in a marble hall, cool palette, a single gold coin
   on the near shore. Hosted on Shopify Files. */
const LORE_IMAGE = {
  src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-lore-hero.jpg?v=1790902484',
  alt: 'A hooded ferryman poling a wooden boat across still black water in a marble hall; a single gold coin rests on the near shore',
  width: 2400,
  height: 1029,
};
/* Same frame as a 20 s ping-pong loop (Seedance, mist drifting, camera locked),
   transcoded by Shopify to 720p. Poster = first frame. Reduced-motion users get
   the still. */
const LORE_LOOP = {
  mp4: 'https://cdn.shopify.com/videos/c/vp/4e4fa72ede9c456db755899feab8e28c/4e4fa72ede9c456db755899feab8e28c.HD-720p-1.6Mbps-96190684.mp4',
  poster:
    'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-lore-hero-poster.jpg?v=1790917824',
};

/* ── Relics gallery ──
   Six stills from the same series (dark basalt, one raking light, cool greys,
   gold the only colour). Hosted on Shopify Files. */
const RELICS: Array<{src: string; alt: string; caption: string}> = [
  {
    src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-relic-obol.jpg?v=1790902498',
    alt: 'A single gold obol resting on dark stone',
    caption: 'The Obol',
  },
  {
    src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-relic-ferry.jpg?v=1790902495',
    alt: 'The ferryman’s pole cutting still black water',
    caption: 'The Ferry',
  },
  {
    src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-relic-river.jpg?v=1790902500',
    alt: 'Mist over the river at the near shore',
    caption: 'The River',
  },
  {
    src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-relic-fare.jpg?v=1790902492',
    alt: 'A gold chain coiled where a coin would be placed',
    caption: 'The Fare',
  },
  {
    src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-relic-far-shore.jpg?v=1790902489',
    alt: 'Light on the far bank',
    caption: 'The Far Shore',
  },
  {
    src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-relic-crossing.jpg?v=1790902486',
    alt: 'A chain draped over the edge of a scale',
    caption: 'The Crossing',
  },
];

const STORY: string[] = [
  'The Greeks told it plainly. When you died, a river stood between you and whatever came next. Charon kept the ferry across it, and he did not row for free.',
  'So the living placed a coin under the tongue of the dead before burial: the obol. A small disc of metal, worth almost nothing to a man with a full purse, worth everything to one standing on that bank. Without it, the story goes, you waited on the shore.',
  'Everything else stayed behind. The house, the title, the name people used for you. Cloth rots. Paper burns. Even the body is left on the near side. The coin went across, because metal was the only thing the ferryman would take, and metal was the only thing that held its worth on both sides of the water.',
  'That is the whole idea behind the name. Gold has been the fare for three thousand years, weighed and traded across every border, and it does not care what century it is. A chain from our foundries is a row of small coins, worn where the obol was carried: at the throat.',
  'The Ferryman’s Pact is our version of the old arrangement. Every piece carries a 5-year buyback guarantee. If you ever wish to return to shore, we buy back your gold at the prevailing market price, minus only the original labor. The style may date. The clasp may wear. The metal never loses its passage.',
  'That is what we mean when we say gold is the only thing that crosses over. It is not a slogan. It is a property of the element.',
];

function SectionHeading({kicker, title}: {kicker: string; title: string}) {
  return (
    <div style={{marginBottom: 40}}>
      <StyxLabel>{kicker}</StyxLabel>
      <h2
        data-reveal=""
        style={{
          fontFamily: FONT.cinzel,
          fontSize: 'clamp(24px, 3vw, 32px)',
          fontWeight: 400,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: STYX.ink,
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

export default function Lore() {
  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      {/* Hero: the crossing, full bleed, mist drifting */}
      <section className="styx-lore-hero" aria-label="The Lore">
        <video
          className="styx-lore-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={LORE_LOOP.poster}
          aria-hidden="true"
        >
          <source src={LORE_LOOP.mp4} type="video/mp4" />
        </video>
        <img
          className="styx-lore-hero-still"
          src={LORE_IMAGE.src}
          alt={LORE_IMAGE.alt}
          width={LORE_IMAGE.width}
          height={LORE_IMAGE.height}
          decoding="async"
          fetchPriority="high"
        />
        <div className="styx-lore-hero-copy">
          <div>
            <StyxLabel greek="ΜΥΘΟΣ" light>
              The Lore &middot; River Styx
            </StyxLabel>
            <h1 data-reveal="">
              The
              <br />
              <em>lore.</em>
            </h1>
          </div>
          <p data-reveal="">The only thing that crosses over.</p>
        </div>
      </section>

      {/* The story */}
      <section>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: `clamp(56px, 7vw, 100px) ${GUTTER}`,
          }}
        >
          {/* Obol sits beside the text on desktop and wraps above it on phones. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'clamp(20px, 3vw, 40px)',
              flexWrap: 'wrap',
            }}
          >
            <Obol size={64} color={STYX.gold} speed={6} />
            <div style={{flex: '1 1 280px', minWidth: 0}}>
              <SectionHeading
                kicker="I &middot; The Story"
                title="Charon, the Obol, the Crossing"
              />
              <div
                style={{
                  fontFamily: FONT.inter,
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: STYX.graphite,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                  maxWidth: 680,
                }}
              >
                {STORY.map((para) => (
                  <p key={para.slice(0, 24)} data-reveal="" style={{margin: 0}}>
                    {para}
                  </p>
                ))}
              </div>
              <p
                style={{
                  fontFamily: FONT.cormorant,
                  fontStyle: 'italic',
                  fontSize: 17,
                  color: STYX.silt,
                  marginTop: 36,
                }}
              >
                Read the terms of the pact on{' '}
                <Link to="/buyback" prefetch="intent" style={{color: STYX.ink}}>
                  the buyback page
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Relics gallery */}
      <section style={{background: STYX.paper}}>
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: `clamp(56px, 7vw, 100px) ${GUTTER}`,
          }}
        >
          <SectionHeading kicker="II &middot; The Gallery" title="Relics" />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
              gap: 'clamp(16px, 2vw, 28px)',
            }}
          >
            {RELICS.map((relic, i) => (
              <figure
                key={`${relic.caption}-${i}`}
                data-reveal=""
                style={{margin: 0, minWidth: 0}}
              >
                <div
                  style={{border: `1px solid ${STYX.line}`, overflow: 'hidden'}}
                >
                  <img
                    src={relic.src}
                    alt={relic.alt}
                    loading="lazy"
                    decoding="async"
                    style={{
                      display: 'block',
                      width: '100%',
                      aspectRatio: '4 / 5',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                <figcaption
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 12,
                    padding: '12px 0 0',
                    fontFamily: FONT.cinzel,
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: STYX.ink,
                  }}
                >
                  <span>{relic.caption}</span>
                  <span style={{color: STYX.gold}}>
                    {['I', 'II', 'III', 'IV', 'V', 'VI'][i]}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section style={{background: STYX.taupe, color: STYX.bone}}>
        <div
          className="styx-about-cta"
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: `clamp(48px, 5vw, 80px) ${GUTTER}`,
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
              data-reveal=""
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                fontSize: 22,
                lineHeight: 1.5,
                color: STYX.bone,
                margin: 0,
                maxWidth: 600,
              }}
            >
              Carry the fare. If you ever want to return to shore, we buy the
              gold back for five years. The metal never loses its passage.
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              flexShrink: 0,
              justifyContent: 'center',
            }}
          >
            <Link
              to="/collections"
              prefetch="intent"
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 12,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: STYX.taupeDeep,
                background: STYX.goldLight,
                textDecoration: 'none',
                padding: '18px 32px',
                border: `1px solid ${STYX.goldLight}`,
                transition: 'all 0.2s',
              }}
            >
              The Collections
            </Link>
            <Link
              to="/buyback"
              prefetch="intent"
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 12,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: STYX.bone,
                textDecoration: 'none',
                padding: '18px 32px',
                border: '1px solid rgba(235,235,232,0.3)',
                transition: 'all 0.2s',
              }}
            >
              The Buyback
            </Link>
          </div>
        </div>
      </section>

      <StyxFooter />
    </div>
  );
}
