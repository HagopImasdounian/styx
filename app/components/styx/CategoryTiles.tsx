import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {STYX, FONT, type CollectionNode} from './constants';
import {StyxLabel} from './StyxLabel';

// Static lifestyle images for category tiles — keyed by collection handle
const CATEGORY_IMAGES: Record<string, {src: string; alt: string}> = {
  'cuban': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-cuban-link.jpg?v=1779151358', alt: 'Cuban link chain on Ocean Drive, Miami'},
  'curb': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-curb-chain.png?v=1779151362', alt: 'Curb chain on a foggy London street at dusk'},
  'box': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-box-chain.png?v=1779151351', alt: 'Box chain in Venice with canal and gondola'},
  'rope': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-rope-chain.png?v=1779151380', alt: 'Rope chain at a Mediterranean harbor at golden hour'},
  'cable': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-cable-chain.png?v=1779151355', alt: 'Cable chain at ancient Mesopotamian ruins'},
  'figaro': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-figaro-chain.png?v=1779151369', alt: 'Figaro chain in Vicenza, Italy at golden hour'},
  'wheat': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-wheat-chain.png?v=1779151386', alt: 'Wheat chain in Tuscan vineyard at sunset'},
  'rolo': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-rolo-chain.png?v=1779151375', alt: 'Rolo chain in Victorian London'},
  'singapore': {src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-singapore-chain.png?v=1779151383', alt: 'Singapore chain at Southeast Asian waterfront'},
};

export function CategoryTiles({
  collections = [],
  products = [],
}: {
  collections?: CollectionNode[];
  products?: any[];
}) {
  // Show the three hero chain families
  const desired = ['cuban', 'curb', 'rope', 'box', 'figaro', 'cable', 'wheat', 'rolo', 'singapore'];
  const cats = desired
    .map((h) => collections.find((c) => c.handle === h))
    .filter((c): c is CollectionNode => Boolean(c));

  if (cats.length === 0) return null;

  return (
    <section className="styx-categories" style={{background: STYX.paper, padding: '100px 56px'}}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 56,
        }}
      >
        <div>
          <StyxLabel>Categories · II</StyxLabel>
          <h2
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 48,
              fontWeight: 500,
              letterSpacing: '0.02em',
              lineHeight: 1,
              margin: '16px 0 0',
              color: STYX.ink,
              textTransform: 'uppercase',
            }}
          >
            {cats.length} forms,{' '}
            <span
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                textTransform: 'none',
                fontWeight: 400,
                letterSpacing: 0,
              }}
            >
              one material.
            </span>
          </h2>
        </div>
        <div
          style={{
            fontFamily: FONT.cormorant,
            fontSize: 16,
            lineHeight: 1.7,
            color: STYX.silt,
            maxWidth: 360,
            fontStyle: 'italic',
          }}
        >
          Solid and hollow gold chains — 10K and 14K. Every piece weighed, tested, and
          priced transparently from live gold markets.
        </div>
      </div>
      <div
        data-grid=""
        className="styx-categories-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        }}
      >
        {cats.map((cat, i) => (
          <CategoryCard
            key={cat.id}
            collection={cat}
            index={i + 1}
            products={products}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryCard({
  collection,
  index,
  products = [],
}: {
  collection: CollectionNode;
  index: number;
  products?: any[];
}) {
  // Use static lifestyle image if available, otherwise fall back to Shopify data
  const staticImg = CATEGORY_IMAGES[collection.handle];
  const imageData = collection.image;

  return (
    <Link
      to={`/collections/${collection.handle}`}
      prefetch="intent"
      style={{
        position: 'relative',
        display: 'block',
        textDecoration: 'none',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        const slats = e.currentTarget.querySelector('[data-slats]') as HTMLElement;
        const arrow = e.currentTarget.querySelector('[data-arrow]') as HTMLElement;
        if (slats) slats.style.opacity = '0.5';
        if (arrow) {
          arrow.style.borderColor = STYX.gold;
          arrow.style.background = STYX.gold;
        }
      }}
      onMouseLeave={(e) => {
        const slats = e.currentTarget.querySelector('[data-slats]') as HTMLElement;
        const arrow = e.currentTarget.querySelector('[data-arrow]') as HTMLElement;
        if (slats) slats.style.opacity = '0';
        if (arrow) {
          arrow.style.borderColor = 'rgba(239,234,224,0.6)';
          arrow.style.background = 'transparent';
        }
      }}
    >
      <div style={{position: 'relative', overflow: 'hidden', aspectRatio: '4/5'}}>
        {staticImg ? (
          <img
            src={staticImg.src}
            alt={staticImg.alt}
            loading="lazy"
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : imageData ? (
          <Image
            data={imageData}
            aspectRatio="4/5"
            sizes="(min-width: 1200px) 33vw, 50vw"
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: STYX.parchment,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontSize: 16,
              color: STYX.silt2,
            }}
          >
            {collection.title}
          </div>
        )}

        {/* Vertical slats on hover */}
        <div
          data-slats
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0 39px, rgba(26,24,21,0.08) 39px 40px)',
            opacity: 0,
            transition: 'opacity 0.35s',
          }}
        />

        {/* Bottom gradient overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 28,
            background: 'linear-gradient(transparent, rgba(26,24,21,0.65))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 28,
                color: STYX.bone,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {collection.title}
            </div>
            {collection.description && (
              <div
                style={{
                  fontFamily: FONT.inter,
                  fontSize: 11,
                  color: 'rgba(239,234,224,0.75)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                {collection.description.slice(0, 60)}
              </div>
            )}
          </div>
          <div
            data-arrow
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '1px solid rgba(239,234,224,0.6)',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s',
              flexShrink: 0,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 10 10"
              fill="none"
              stroke={STYX.bone}
              strokeWidth="1"
            >
              <path d="M2 5h6M5 2l3 3-3 3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom meta */}
      <div
        style={{
          marginTop: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <StyxLabel>
          0{index} · {collection.title}
        </StyxLabel>
        <StyxLabel>Shop →</StyxLabel>
      </div>
    </Link>
  );
}
