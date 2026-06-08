import {Link} from 'react-router';
import {STYX, FONT, type CollectionNode} from './constants';
import {StyxLabel} from './StyxLabel';
import {CTAButton} from './CTAButton';
import {Obol} from './Obol';

// Lifestyle images come from each collection's image in Shopify (no hardcoding)
const COLLECTION_ORDER = ['cuban', 'curb', 'rope', 'box', 'figaro', 'cable', 'wheat', 'rolo', 'singapore'];

export function Lookbook({collections = []}: {collections?: CollectionNode[]}) {
  // Match collections to our ordered list
  const matched = COLLECTION_ORDER
    .map((handle) => {
      const coll = collections.find((c) => c.handle === handle);
      if (!coll?.image?.url) return null;
      return {
        handle,
        title: coll.title,
        src: coll.image.url,
        alt: coll.image.altText ?? coll.title,
      };
    })
    .filter(Boolean) as Array<{handle: string; title: string; src: string; alt: string}>;

  if (matched.length === 0) return null;

  return (
    <section
      className="styx-lookbook"
      style={{
        background: STYX.ink,
        color: STYX.bone,
        padding: '120px 0',
        position: 'relative',
      }}
    >
      <div
        style={{
          padding: '0 56px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 64,
        }}
      >
        <div>
          <StyxLabel>The Collection · IV</StyxLabel>
          <h2
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 52,
              fontWeight: 500,
              letterSpacing: '0.02em',
              lineHeight: 1,
              margin: '16px 0 0',
              color: STYX.bone,
              textTransform: 'uppercase',
            }}
          >
            {matched.length} weaves,{' '}
            <span
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                fontWeight: 400,
                textTransform: 'none',
                letterSpacing: 0,
                color: STYX.gold,
              }}
            >
              one metal.
            </span>
          </h2>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
          <StyxLabel>Each worn where it was born</StyxLabel>
        </div>
      </div>

      {/* Weave grid — rows of 4 on desktop, rows of 2 on mobile (no swiping) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 4,
          padding: '0 56px',
        }}
        className="styx-lookbook-grid"
      >
        {matched.map((item, i) => (
          <Link
            key={item.handle}
            to={`/collections/${item.handle}`}
            prefetch="intent"
            style={{
              display: 'block',
              position: 'relative',
              overflow: 'hidden',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              const img = e.currentTarget.querySelector('img') as HTMLElement;
              const overlay = e.currentTarget.querySelector('[data-overlay]') as HTMLElement;
              if (img) img.style.transform = 'scale(1.05)';
              if (overlay) overlay.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              const img = e.currentTarget.querySelector('img') as HTMLElement;
              const overlay = e.currentTarget.querySelector('[data-overlay]') as HTMLElement;
              if (img) img.style.transform = 'scale(1)';
              if (overlay) overlay.style.opacity = '0.7';
            }}
          >
            <div style={{aspectRatio: '3/4', position: 'relative', overflow: 'hidden'}}>
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.5s ease',
                }}
              />
              {/* Gradient overlay */}
              <div
                data-overlay
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(transparent 50%, rgba(26,24,21,0.75))',
                  opacity: 0.7,
                  transition: 'opacity 0.3s',
                  pointerEvents: 'none',
                }}
              />
              {/* Title */}
              <div
                className="styx-lookbook-tile-meta"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 24,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                <div>
                  <div
                    className="styx-lookbook-tile-title"
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 22,
                      color: STYX.bone,
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.title}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    color: STYX.gold,
                    letterSpacing: '0.1em',
                  }}
                >
                  0{i + 1}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{padding: '48px 56px 0', display: 'flex', justifyContent: 'center'}}>
        <CTAButton variant="gold" href="/collections">
          Browse All Collections
        </CTAButton>
      </div>
    </section>
  );
}
