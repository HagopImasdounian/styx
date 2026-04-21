import {type MetaFunction} from '@shopify/remix-oxygen';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel, Obol} from '~/components/styx';

export const meta: MetaFunction = () => {
  return [{title: 'About — STYX'}, {name: 'description', content: 'The story behind Styx Gold. Transparent pricing, solid gold, no middlemen.'}];
};

export default function About() {
  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      {/* Hero */}
      <section
        style={{
          borderBottom: `1px solid ${STYX.line}`,
        }}
      >
        <div
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
              We sell
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
                honest gold.
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
            Most jewelers mark gold up 8 to 12 times. We don't. We show you
            the London spot price, the weight of your chain, the labor cost,
            and our margin. That's it.
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section style={{background: STYX.paper}}>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '100px 56px',
          }}
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
                The Problem We Solve
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
                  Gold is a commodity. It's priced openly in London twice a day. There's
                  nothing mysterious about what it costs. And yet the jewelry industry has
                  been built on that mystery — hiding margins behind "retail price" and
                  hoping you don't ask questions.
                </p>
                <p style={{margin: 0}}>
                  We started Styx because we were tired of the markup. We wanted to buy
                  solid gold chains — not hollow, not plated, not "gold-filled" — and
                  couldn't find anyone willing to tell us what we were actually paying for.
                </p>
                <p style={{margin: 0}}>
                  So we built the brand we wanted to buy from. Every piece on this site
                  shows you its full cost breakdown: the gold at today's spot price, the
                  weight, the labor, and our margin. No mystery. No velvet box surcharge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section>
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
                body: 'Every piece shows its full price breakdown. Gold cost, labor, margin — nothing hidden.',
              },
              {
                num: 'II',
                title: 'Solid Gold Only',
                body: 'No hollow chains. No gold-fill. No plating. Every piece is solid karat gold, through and through.',
              },
              {
                num: 'III',
                title: 'Live Pricing',
                body: 'Our prices move with the London gold fix. When gold goes down, so do our prices. Real time.',
              },
              {
                num: 'IV',
                title: 'The Buyback Pact',
                body: 'Every piece carries a 5-year buyback guarantee at the prevailing spot price, minus original labor.',
              },
              {
                num: 'V',
                title: 'Direct to You',
                body: 'No wholesalers. No department stores. No middlemen adding their cut. Factory to your door.',
              },
              {
                num: 'VI',
                title: 'Tested & Certified',
                body: 'Every piece is tested multiple times to meet or exceed the stamped karat weight. No guesswork.',
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

      {/* CTA Banner */}
      <section style={{background: STYX.taupe, color: STYX.bone}}>
        <div
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
          <a
            href="/contact"
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 12,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: STYX.bone,
              textDecoration: 'none',
              padding: '18px 32px',
              border: `1px solid rgba(239,234,224,0.3)`,
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            Contact Us →
          </a>
        </div>
      </section>

      <StyxFooter />
    </div>
  );
}
