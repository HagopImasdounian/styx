import {STYX, FONT} from './constants';
import {StyxLabel} from './StyxLabel';

const USPS = [
  {num: '01', title: 'Solid Gold', desc: 'Every gram is real karat gold. 10K and 14K — no plating, no fill.'},
  {num: '02', title: 'Weighed & Tested', desc: 'Every piece is weighed and tested multiple times to meet or exceed the stamped karat weight.'},
  {num: '03', title: 'Transparent Price', desc: 'We show you the spot price, the weight, the labor, and our margin. That\'s it.'},
];

export function CraftStrip() {
  return (
    <section
      className="styx-craft"
      style={{
        background: STYX.parchment,
        borderTop: `1px solid ${STYX.line}`,
        borderBottom: `1px solid ${STYX.line}`,
        padding: '96px 56px',
      }}
    >
      <div
        data-grid=""
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
        }}
      >
        {/* Left: text */}
        <div>
          <StyxLabel>The Promise · V</StyxLabel>
          <h2
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 40,
              fontWeight: 400,
              color: STYX.ink,
              margin: '0 0 40px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              lineHeight: 1.2,
            }}
          >
            Gold as an{' '}
            <span
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                textTransform: 'lowercase',
                fontWeight: 400,
              }}
            >
              asset
            </span>
            .
          </h2>

          <p
            style={{
              fontFamily: FONT.inter,
              fontSize: 15,
              color: STYX.graphite,
              lineHeight: 1.7,
              marginBottom: 32,
              maxWidth: 440,
            }}
          >
            Diamond-encrusted chains lose 90% of their value the moment you walk
            out the store. Solid gold holds its weight — literally. We believe gold
            is going up, and we want you holding real metal, not decoration.
          </p>

          <div style={{display: 'flex', flexDirection: 'column', gap: 28}}>
            {USPS.map((usp) => (
              <div key={usp.num} style={{display: 'flex', gap: 16, alignItems: 'flex-start'}}>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    color: STYX.gold,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {usp.num}
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 14,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: STYX.ink,
                      marginBottom: 4,
                    }}
                  >
                    {usp.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT.inter,
                      fontSize: 14,
                      color: STYX.silt,
                      lineHeight: 1.5,
                    }}
                  >
                    {usp.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Launch promo card */}
        <div
          style={{
            background: STYX.ink,
            color: STYX.bone,
            padding: '48px 40px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse 60% 40% at 80% 20%, ${STYX.gold}15, transparent)`,
              pointerEvents: 'none',
            }}
          />
          <div style={{position: 'relative'}}>
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 10,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: STYX.gold,
                marginBottom: 20,
              }}
            >
              Launch Offer
            </div>
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 44,
                fontWeight: 500,
                lineHeight: 1,
                color: STYX.bone,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              1g Gold
            </div>
            <div
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                fontSize: 22,
                color: 'rgba(239,234,224,0.7)',
                marginTop: 8,
              }}
            >
              free for every $1,500 spent
            </div>
            <div
              style={{
                fontFamily: FONT.inter,
                fontSize: 14,
                color: 'rgba(239,234,224,0.5)',
                lineHeight: 1.6,
                marginTop: 24,
                maxWidth: 320,
              }}
            >
              We don't do sales. Instead, we give you more gold. Spend $3,000,
              get 2g free. Spend $7,500, get 5g. Real weight, real value.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
