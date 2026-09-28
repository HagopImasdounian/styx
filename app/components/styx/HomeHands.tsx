import {STYX, FONT} from './constants';
import {StyxLabel} from './StyxLabel';
import {CTAButton} from './CTAButton';
import {PlaceholderImage} from './PlaceholderImage';
import {HomeH2, Em, HomeBody} from './HomePrimitives';

/**
 * "The hands behind it": the workshop portrait. Photo slots stay as
 * PlaceholderImage until the shoot lands (uncle at the crucible, the scale,
 * the bench). Swap each PlaceholderImage for an <img> with the same aspect.
 */
export function HomeHands() {
  return (
    <section
      className="styx-home-hands"
      style={{background: STYX.bone, padding: '110px 56px'}}
    >
      <div
        className="styx-home-hands-grid"
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          gap: 72,
          alignItems: 'center',
        }}
      >
        <div data-reveal="">
          <PlaceholderImage
            aspect="4/5"
            tone="dark"
            label="Our uncle at the crucible"
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
              marginTop: 14,
            }}
          >
            <PlaceholderImage aspect="1/1" tone="silt" label="The scale" />
            <PlaceholderImage aspect="1/1" tone="stone" label="The bench" />
          </div>
        </div>

        <div>
          <StyxLabel>The hands behind it</StyxLabel>
          <HomeH2>
            Our uncle still casts <Em>by hand</Em>, in a crucible older than
            most jewelers.
          </HomeH2>
          <HomeBody>
            Our family has weighed, tested and traded gold for fifty years. We
            know what it costs to make a chain properly, so we show you.
          </HomeBody>
          <div
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontSize: 17,
              color: STYX.silt2,
              margin: '-12px 0 32px',
            }}
          >
            10K and 14K gold. Weighed when it arrives, weighed again before it
            ships.
          </div>
          <CTAButton variant="primary" href="/about">
            Our story
          </CTAButton>
        </div>
      </div>
    </section>
  );
}
