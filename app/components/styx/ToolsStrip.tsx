import {Link} from 'react-router';
import {STYX, FONT} from './constants';
import {StyxLabel} from './StyxLabel';

/**
 * "Tools of the Trade" — homepage band that surfaces the two buying tools
 * nobody discovers on their own: side-by-side comparison and print-to-scale.
 */

const TOOLS = [
  {
    numeral: 'I',
    title: 'Compare',
    copy:
      'Line up to four chains side by side — width, weight, melt value, price per gram of pure gold. Decide like a dealer, not a guesser.',
    cta: 'Open the Comparison Table',
    href: '/compare',
  },
  {
    numeral: 'II',
    title: 'Print to Scale',
    copy:
      'Print any chain at its true physical width — hold the paper up and see exactly how it wears before you spend a dollar.',
    cta: 'See It at True Size',
    href: '/print-list',
  },
];

export function ToolsStrip() {
  return (
    <section
      className="styx-tools"
      style={{
        background: STYX.paper,
        borderTop: `1px solid ${STYX.line}`,
        padding: '100px 56px',
      }}
    >
      <div style={{maxWidth: 1440, margin: '0 auto'}}>
        <StyxLabel>Tools of the Trade &middot; V</StyxLabel>
        <h2
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 44,
            fontWeight: 500,
            letterSpacing: '0.02em',
            lineHeight: 1.1,
            margin: '16px 0 0',
            color: STYX.ink,
            textTransform: 'uppercase',
          }}
        >
          Buy it{' '}
          <span
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontWeight: 400,
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            like you mean it.
          </span>
        </h2>

        <div
          className="styx-tools-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            marginTop: 48,
          }}
        >
          {TOOLS.map((tool) => (
            <Link
              key={tool.title}
              to={tool.href}
              prefetch="intent"
              style={{
                display: 'block',
                textDecoration: 'none',
                background: STYX.bone,
                border: `1px solid ${STYX.line}`,
                padding: '40px 36px',
                transition: 'border-color 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = STYX.gold;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = STYX.line;
              }}
            >
              <div
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 14,
                  color: STYX.gold,
                  fontWeight: 500,
                  marginBottom: 14,
                }}
              >
                {tool.numeral}
              </div>
              <div
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 24,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: STYX.ink,
                  marginBottom: 12,
                }}
              >
                {tool.title}
              </div>
              <p
                style={{
                  fontFamily: FONT.cormorant,
                  fontStyle: 'italic',
                  fontSize: 17,
                  lineHeight: 1.65,
                  color: STYX.silt,
                  margin: '0 0 20px',
                }}
              >
                {tool.copy}
              </p>
              <span
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: STYX.goldDeep,
                  borderBottom: `1px solid ${STYX.gold}`,
                  paddingBottom: 3,
                }}
              >
                {tool.cta} &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
