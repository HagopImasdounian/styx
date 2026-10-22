import {data, type LoaderFunctionArgs, type MetaArgs} from 'react-router';
import {Link} from 'react-router';
import {
  STYX,
  FONT,
  GoldTicker,
  StyxNav,
  StyxFooter,
  StyxLabel,
  FerrymansCode,
} from '~/components/styx';

// The obol, pictured: one still from the Lore relic series (Shopify Files).
const OBOL_IMAGE = {
  src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-relic-obol.jpg?v=1790902498',
  alt: 'A single gold obol resting on dark stone',
};
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
    title: 'About',
    titleTemplate: '%s | STYX Gold',
    description:
      'Three generations and fifty years in the gold trade. The story behind STYX: real karat gold chains priced honestly from the London fix.',
    url: data?.url,
  });
};

export default function About() {
  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      {/* Hero */}
      <section style={{borderBottom: `1px solid ${STYX.line}`}}>
        <div
          className="styx-about-hero"
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '100px 56px 80px',
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: 80,
            alignItems: 'end',
          }}
        >
          <div>
            <StyxLabel>About &middot; The Crossing</StyxLabel>
            <h1
              data-reveal=""
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 72,
                fontWeight: 400,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                color: STYX.ink,
                lineHeight: 0.95,
                margin: '12px 0 0',
              }}
            >
              Three
              <br />
              <span
                style={{
                  fontFamily: FONT.cormorant,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  textTransform: 'none',
                  letterSpacing: 0,
                  fontSize: '0.7em',
                }}
              >
                generations.
              </span>
            </h1>
          </div>
          <div
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontSize: 20,
              color: STYX.graphite,
              lineHeight: 1.7,
            }}
          >
            Fifty years of gold. Three generations of hands that have weighed,
            tested, and traded more precious metal than most jewelers will see
            in a lifetime. This is where we come from.
          </div>
        </div>
      </section>

      {/* The Legacy */}
      <section style={{background: STYX.paper}}>
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '100px 56px',
          }}
          className="styx-about-story"
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 320px) 1fr',
              gap: 'clamp(28px, 4vw, 56px)',
              alignItems: 'start',
            }}
            className="styx-about-legacy"
          >
            <img
              data-reveal=""
              src={`${OBOL_IMAGE.src}&width=800`}
              alt={OBOL_IMAGE.alt}
              width={800}
              height={1000}
              loading="lazy"
              decoding="async"
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                aspectRatio: '4 / 5',
                objectFit: 'cover',
                border: `1px solid ${STYX.line}`,
                position: 'sticky',
                top: 120,
              }}
            />
            <div>
              <h2
                data-reveal=""
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 32,
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: STYX.ink,
                  margin: '0 0 32px',
                }}
              >
                The Old World
              </h2>
              <div
                style={{
                  fontFamily: FONT.inter,
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: STYX.graphite,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                }}
              >
                <p data-reveal="" style={{margin: 0}}>
                  It starts with our uncle who still works the way goldsmiths
                  did a century ago. Carving wax models by hand under a single
                  lamp. Casting in a crucible he's used for thirty years.
                  Setting stones with tools older than most of his apprentices.
                  He doesn't use CAD. He doesn't need to. His hands remember
                  what the software is still trying to learn.
                </p>
                <p data-reveal="" style={{margin: 0}}>
                  On the other side of the family: one of the largest wholesale
                  jewelry operations in Canada. Not a boutique. Not a brand. The
                  kind of business that supplies the businesses. The one the
                  retailers call when they need volume, when they need it right,
                  and when they need to trust the assay. For over fifty years,
                  this operation has moved gold at a scale that most consumer
                  brands will never understand.
                </p>
                <p data-reveal="" style={{margin: 0}}>
                  We grew up between these two worlds. The craftsman's bench and
                  the wholesaler's vault. We watched our uncle turn raw metal
                  into art, and we watched the family move tonnage across
                  borders. We learned what gold costs, actually costs, before we
                  learned what retail meant.
                </p>
                <p data-reveal="" style={{margin: 0}}>
                  Our chains are made by Italy&rsquo;s best machine makers. Our
                  family&rsquo;s job is knowing gold well enough to choose them,
                  test them, and price them straight.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section>
        <div
          className="styx-about-problem"
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '100px 56px',
          }}
        >
          <StyxLabel>The Problem</StyxLabel>
          <h2
            data-reveal=""
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 32,
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: STYX.ink,
              margin: '12px 0 32px',
            }}
          >
            The Markup Is the Mystery
          </h2>
          <div
            style={{
              fontFamily: FONT.inter,
              fontSize: 16,
              lineHeight: 1.8,
              color: STYX.graphite,
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              maxWidth: 720,
            }}
          >
            <p data-reveal="" style={{margin: 0}}>
              Gold is a commodity. It trades around the clock on live markets,
              and there's nothing mysterious about what it costs. And yet the
              jewelry industry has been built on that mystery, hiding margins
              behind "retail price" and hoping you don't ask questions. The
              typical markup? Eight to twelve times what the gold is worth.
            </p>
            <p data-reveal="" style={{margin: 0}}>
              We've consulted for some of the biggest names in hip-hop jewelry.
              We've seen the invoices. We know what a Cuban link costs to craft,
              finish, and ship. And we know what it sells for in a display case
              on Fifth Avenue or in a music video. The gap is obscene.
            </p>
            <p data-reveal="" style={{margin: 0}}>
              So we did something our family has never done before: we went
              direct. Same gold. Same Italian makers. Same quality our wholesale
              clients demand. But sold to you at wholesale-adjacent pricing,
              with the full cost breakdown visible on every product page.
            </p>
          </div>
        </div>
      </section>

      {/* The Future: expansion */}
      <section style={{background: STYX.paper}}>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '100px 56px',
          }}
          className="styx-about-future"
        >
          <StyxLabel>What's Next</StyxLabel>
          <h2
            data-reveal=""
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 32,
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: STYX.ink,
              margin: '12px 0 32px',
            }}
          >
            Crossing the Border
          </h2>
          <div
            style={{
              fontFamily: FONT.inter,
              fontSize: 16,
              lineHeight: 1.8,
              color: STYX.graphite,
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              maxWidth: 720,
            }}
          >
            <p data-reveal="" style={{margin: 0}}>
              We've spent fifty years building one of Canada's most trusted
              wholesale gold operations. Now we're taking that knowledge, and
              those prices, south. Styx is how our family enters the American
              market: not as another luxury brand, but as the source.
            </p>
            <p data-reveal="" style={{margin: 0}}>
              We don't need to convince you gold is valuable. You already know.
              We just need to show you what it should actually cost.
            </p>
          </div>
        </div>
      </section>

      {/* Values Grid: shared with the homepage */}
      <FerrymansCode background={STYX.bone} />

      {/* CTA Banner */}
      <section style={{background: STYX.taupe, color: STYX.bone}}>
        <div
          className="styx-about-cta"
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '80px 56px',
            display: 'flex',
            alignItems: 'center',
            gap: 40,
          }}
        >
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
              Questions?
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
              We're real people who know gold. Ask us anything: about a piece,
              about pricing, about how chains are made. We'll give you a
              straight answer.
            </p>
          </div>
          <Link
            to="/contact"
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
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            Contact Us →
          </Link>
        </div>
      </section>

      <StyxFooter />
    </div>
  );
}
