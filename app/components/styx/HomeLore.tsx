import {STYX, FONT} from './constants';
import {CTAButton} from './CTAButton';
import {Obol} from './Obol';
import {HomeH2, Em} from './HomePrimitives';

/**
 * "The lore" teaser. The 16:9 slot is reserved for the short silhouette
 * film (coin placed, the crossing, the coin arrives); until it exists the
 * Obol turns in its place.
 */
export function HomeLore() {
  return (
    <section
      className="styx-home-lore"
      style={{
        background: STYX.ink,
        color: STYX.bone,
        padding: '110px 56px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 50% 40% at 50% 100%, ${STYX.gold}14, transparent)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{position: 'relative', maxWidth: 1440, margin: '0 auto'}}>
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 11,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: STYX.gold,
            marginBottom: 14,
          }}
        >
          The lore
        </div>
        <HomeH2 color={STYX.bone}>
          The only thing that <Em>crosses over</Em>.
        </HomeH2>
        <p
          data-reveal=""
          style={{
            fontFamily: FONT.cormorant,
            fontStyle: 'italic',
            fontSize: 21,
            lineHeight: 1.5,
            color: 'rgba(239,234,224,0.72)',
            maxWidth: 560,
            margin: '22px auto 0',
          }}
        >
          The ancients buried their dead with a coin for Charon, the ferryman
          of the Styx. Everything else stayed behind. The gold went with them.
        </p>

        <div
          data-reveal=""
          className="styx-home-lore-film"
          aria-hidden="true"
          style={{
            maxWidth: 980,
            margin: '48px auto 0',
            aspectRatio: '16/9',
            position: 'relative',
            background:
              `radial-gradient(ellipse at 50% 60%, ${STYX.gold}33, transparent 55%), ` +
              'linear-gradient(160deg, #2a2622, #0f0e0c)',
            border: '1px solid rgba(239,234,224,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Obol size={84} speed={7} />
          <div
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 14,
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(239,234,224,0.4)',
              textAlign: 'left',
            }}
          >
            The crossing
          </div>
        </div>

        <div style={{marginTop: 40}}>
          <CTAButton variant="gold" href="/lore" style={{color: STYX.bone}}>
            Read the story
          </CTAButton>
        </div>
      </div>
    </section>
  );
}
