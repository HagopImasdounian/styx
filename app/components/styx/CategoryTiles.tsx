import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {STYX, FONT, type CollectionNode} from './constants';
import {StyxLabel} from './StyxLabel';

// Lifestyle images come from each collection's image in Shopify (no hardcoding)

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
        {imageData ? (
          <Image
            data={imageData}
            alt={imageData.altText ?? collection.title}
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
