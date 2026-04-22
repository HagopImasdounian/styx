import {type MetaFunction} from '@shopify/remix-oxygen';
import {Link} from '@remix-run/react';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel, Obol} from '~/components/styx';

export const meta: MetaFunction = () => {
  return [{title: 'About — STYX'}, {name: 'description', content: 'Three generations. Fifty years of gold. The story behind Styx.'}];
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
            Fifty years of gold. Three generations of hands
            that have weighed, tested, and traded more precious metal
            than most jewelers will see in a lifetime. This is where we come from.
          </div>
        </div>
      </section>

      {/* The Legacy */}
      <section style={{background: STYX.paper}}>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '100px 56px',
          }}
          className="styx-about-story"
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr',
              gap: 40,
              alignItems: 'start',
            }}
          >
            <Obol size={64} color={STYX.gold} speed={6} />
            <div>
              <h2
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
                <p style={{margin: 0}}>
                  It starts with an uncle who still works the way goldsmiths did a century ago.
                  Carving wax models by hand under a single lamp. Casting in a crucible he's
                  used for thirty years. Setting stones with tools older than most of his
                  apprentices. He doesn't use CAD. He doesn't need to. His hands remember
                  what the software is still trying to learn.
                </p>
                <p style={{margin: 0}}>
                  On the other side of the family — one of the largest wholesale jewelry
                  operations in Canada. Not a boutique. Not a brand. The kind of business
                  that supplies the businesses. The one the retailers call when they need
                  volume, when they need it right, and when they need to trust the assay.
                  For over fifty years, this operation has moved gold at a scale that most
                  consumer brands will never understand.
                </p>
                <p style={{margin: 0}}>
                  We grew up between these two worlds. The craftsman's bench
                  and the wholesaler's vault. We watched our uncle turn raw metal into
                  art, and we watched the family move tonnage across borders. We learned
                  what gold costs — actually costs — before we learned what retail meant.
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
            <p style={{margin: 0}}>
              Gold is a commodity. It's priced openly in London twice a day. There's
              nothing mysterious about what it costs. And yet the jewelry industry
              has been built on that mystery — hiding margins behind "retail price"
              and hoping you don't ask questions. The typical markup? Eight to twelve
              times what the gold is worth.
            </p>
            <p style={{margin: 0}}>
              We've consulted for some of the biggest names in hip-hop jewelry.
              We've seen the invoices. We know what a Cuban link costs to cast,
              finish, and ship. And we know what it sells for in a display case
              on Fifth Avenue or in a music video. The gap is obscene.
            </p>
            <p style={{margin: 0}}>
              So we did something our family has never done before: we went direct.
              Same gold. Same foundries. Same quality our wholesale clients demand.
              But sold to you at wholesale-adjacent pricing, with the full cost
              breakdown visible on every product page.
            </p>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section style={{background: STYX.paper}}>
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '100px 56px',
          }}
        >
          <StyxLabel>What We Stand For</StyxLabel>
          <h2
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 36,
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              color: STYX.ink,
              margin: '12px 0 56px',
            }}
          >
            The Ferryman's Code
          </h2>

          <div
            className="styx-about-values"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 2,
              background: STYX.line,
            }}
          >
            {[
              {
                num: 'I',
                title: 'Radical Transparency',
                body: 'Every piece shows its full price breakdown. Gold cost, labor, margin — nothing hidden. We show you the London fix and our math.',
              },
              {
                num: 'II',
                title: 'Solid Gold Only',
                body: "No hollow chains. No gold-fill. No plating. Every piece is solid karat gold, through and through. We don't sell decoration.",
              },
              {
                num: 'III',
                title: 'Live Pricing',
                body: "Our prices move with the London gold fix. When gold goes down, so do our prices. When it goes up, we don't pretend otherwise.",
              },
              {
                num: 'IV',
                title: 'Wholesale Heritage',
                body: "Fifty years of wholesale relationships mean we buy gold at prices most brands can't access. That advantage goes to you.",
              },
              {
                num: 'V',
                title: 'Direct to You',
                body: "No wholesalers. No department stores. No middlemen adding their cut. From our family's network to your door.",
              },
              {
                num: 'VI',
                title: 'Tested & Certified',
                body: 'Every piece is weighed and tested multiple times to meet or exceed the stamped karat weight. Old-school diligence, no shortcuts.',
              },
            ].map((val) => (
              <div
                key={val.num}
                style={{
                  background: STYX.bone,
                  padding: '40px 32px',
                }}
              >
                <div
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 20,
                    color: STYX.gold,
                    marginBottom: 16,
                  }}
                >
                  {val.num}
                </div>
                <h3
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: STYX.ink,
                    margin: '0 0 12px',
                  }}
                >
                  {val.title}
                </h3>
                <p
                  style={{
                    fontFamily: FONT.cormorant,
                    fontSize: 16,
                    fontStyle: 'italic',
                    lineHeight: 1.6,
                    color: STYX.graphite,
                    margin: 0,
                  }}
                >
                  {val.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Future — expansion */}
      <section>
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
            <p style={{margin: 0}}>
              We've spent fifty years building one of Canada's most trusted wholesale
              gold operations. Now we're taking that knowledge — and those prices — south.
              Styx is how our family enters the American market: not as another luxury brand,
              but as the source.
            </p>
            <p style={{margin: 0}}>
              We don't need to convince you gold is valuable. You already know.
              We just need to show you what it should actually cost.
            </p>
          </div>
        </div>
      </section>

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
              Questions?
            </div>
            <p
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
              We're real people who know gold. Ask us anything — about a piece,
              about pricing, about how chains are made. We'll give you a straight answer.
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
              border: '1px solid rgba(239,234,224,0.3)',
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
