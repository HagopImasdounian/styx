import {STYX, FONT} from './constants';
import {StyxLabel} from './StyxLabel';

/**
 * The Ferryman's Code: the six principles from the About page's
 * "What We Stand For" section, lifted into a shared component so the
 * homepage and About can render the same list.
 */
export const FERRYMANS_CODE = [
  {
    num: 'I',
    title: 'Radical Transparency',
    body: "We show you the weight, the karat, and how our pricing works. No hidden margins, no mystery markups. You see what you're paying for.",
  },
  {
    num: 'II',
    title: 'Solid & Hollow Gold',
    body: 'Solid for investment and longevity. Hollow for lighter everyday wear. Both are real karat gold: no plating, no gold-fill, no imitations. Choose the construction that suits you.',
  },
  {
    num: 'III',
    title: 'Wholesale Pricing',
    body: "We price from our wholesale cost, not from retail markups. Our family buys gold at prices most brands can't access. That advantage goes directly to you.",
  },
  {
    num: 'IV',
    title: 'Wholesale Heritage',
    body: 'Fifty years of wholesale relationships built on trust and volume. The same supply chain that serves retailers now serves you.',
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
] as const;

export function FerrymansCode({
  background = STYX.paper,
  label = 'What We Stand For',
}: {
  background?: string;
  label?: string;
}) {
  return (
    <section
      className="styx-home-code"
      style={{background, borderTop: `1px solid ${STYX.line}`}}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '100px 56px',
        }}
        className="styx-home-code-inner"
      >
        <StyxLabel>{label}</StyxLabel>
        <h2
          data-reveal=""
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
          The Ferryman&apos;s Code
        </h2>

        <div
          className="styx-home-code-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
            background: STYX.line,
          }}
        >
          {FERRYMANS_CODE.map((val) => (
            <div
              key={val.num}
              data-reveal=""
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
  );
}
