import {STYX, FONT} from './constants';

const PILLARS = [
  {
    num: 'I',
    title: 'Priced from the live gold price',
    body: 'The gold in your chain, valued to the gram, shown on every piece.',
  },
  {
    num: 'II',
    title: 'Bought back for five years',
    body: 'Sell it back to us for the value of its gold, whenever you choose.',
  },
  {
    num: 'III',
    title: 'Weighed and tested',
    body: 'Every piece checked against its stamped karat before it ships.',
  },
];

/** The three promises, directly under the hero. */
export function HomePillars() {
  return (
    <section
      className="styx-home-pillars"
      aria-label="Our three promises"
      style={{
        background: STYX.parchment,
        borderTop: `1px solid ${STYX.line}`,
        borderBottom: `1px solid ${STYX.line}`,
        padding: '0 56px',
      }}
    >
      <div
        className="styx-home-pillars-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          maxWidth: 1440,
          margin: '0 auto',
        }}
      >
        {PILLARS.map((p, i) => (
          <div
            key={p.num}
            data-reveal=""
            className="styx-home-pillar"
            style={{
              padding: i === 0 ? '36px 28px 36px 0' : '36px 28px',
              borderLeft: i === 0 ? 'none' : `1px solid ${STYX.line}`,
            }}
          >
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 12,
                letterSpacing: '0.28em',
                color: STYX.gold,
                marginBottom: 12,
              }}
            >
              {p.num}
            </div>
            <h3
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: STYX.ink,
                margin: '0 0 8px',
                lineHeight: 1.35,
              }}
            >
              {p.title}
            </h3>
            <p
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                fontSize: 17,
                lineHeight: 1.55,
                color: STYX.silt,
                margin: 0,
              }}
            >
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
