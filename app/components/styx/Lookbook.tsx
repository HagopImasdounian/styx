import {Link} from 'react-router';
import {STYX, FONT, type CollectionNode} from './constants';
import {StyxLabel} from './StyxLabel';
import {CTAButton} from './CTAButton';
import {Obol} from './Obol';

// Collection images — same map as CategoryTiles and collections index
const COLLECTION_IMAGES: Record<string, {src: string; alt: string}> = {
  'cuban': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-cuban-link.jpg?v=1779151358', alt: 'Cuban link chain on Ocean Drive, Miami'},
  'curb': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-curb-chain.png?v=1779151362', alt: 'Curb chain on a foggy London street'},
  'box': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-box-chain.png?v=1779151351', alt: 'Box chain in Venice with canal and gondola'},
  'rope': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-rope-chain.png?v=1779151380', alt: 'Rope chain at Mediterranean harbor'},
  'cable': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-cable-chain.png?v=1779151355', alt: 'Cable chain at Mesopotamian ruins'},
  'figaro': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-figaro-chain.png?v=1779151369', alt: 'Figaro chain in Vicenza, Italy'},
  'wheat': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-wheat-chain.png?v=1779151386', alt: 'Wheat chain in Tuscan vineyard'},
  'rolo': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-rolo-chain.png?v=1779151375', alt: 'Rolo chain in Victorian London'},
  'singapore': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-singapore-chain.png?v=1779151383', alt: 'Singapore chain at Asian waterfront'},
};

const COLLECTION_ORDER = ['cuban', 'curb', 'rope', 'box', 'figaro', 'cable', 'wheat', 'rolo', 'singapore'];

export function Lookbook({collections = []}: {collections?: CollectionNode[]}) {
  // Match collections to our ordered list
  const matched = COLLECTION_ORDER
    .map((handle) => {
      const coll = collections.find((c) => c.handle === handle);
      const img = COLLECTION_IMAGES[handle];
      if (!coll || !img) return null;
      return {handle, title: coll.title, ...img};
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

      {/* Horizontal scroll row */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '0 56px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
        className="styx-hide-scrollbar"
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
              flex: '0 0 calc(25% - 3px)',
              minWidth: 220,
              scrollSnapAlign: 'start',
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
