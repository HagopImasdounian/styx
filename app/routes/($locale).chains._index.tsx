import {type LoaderFunctionArgs, type MetaArgs} from 'react-router';
import {useLoaderData, Link} from 'react-router';
import {getSeoMeta} from '@shopify/hydrogen';
import {routeHeaders} from '~/data/cache';
import {
  STYX,
  FONT,
  GoldTicker,
  StyxNav,
  StyxFooter,
  StyxLabel,
  Obol,
} from '~/components/styx';
import {
  getChainProducts,
  getNecklaceCategories,
  CATEGORY_LABELS,
  type ChainCategory,
} from '~/lib/shiny.server';

export const headers = routeHeaders;

export async function loader({request, context}: LoaderFunctionArgs) {
  const [{collections}, products] = await Promise.all([
    context.storefront.query(NAV_COLLECTIONS_QUERY, {
      variables: {
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
    getChainProducts(),
  ]);

  // Group products by category
  const byCategory: Record<string, number> = {};
  const priceByCategory: Record<string, {min: number; max: number}> = {};
  for (const p of products) {
    const cat = p.category;
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    if (!priceByCategory[cat]) {
      priceByCategory[cat] = {min: p.priceRange.min, max: p.priceRange.max};
    } else {
      priceByCategory[cat].min = Math.min(
        priceByCategory[cat].min,
        p.priceRange.min,
      );
      priceByCategory[cat].max = Math.max(
        priceByCategory[cat].max,
        p.priceRange.max,
      );
    }
  }

  const categories = getNecklaceCategories().map((c) => ({
    ...c,
    count: byCategory[c.slug] || 0,
    priceFrom: priceByCategory[c.slug]?.min || 0,
  }));

  const braceletCount = byCategory['bracelet'] || 0;
  const braceletPriceFrom = priceByCategory['bracelet']?.min || 0;

  return {
    collections: collections?.nodes || [],
    categories,
    braceletCount,
    braceletPriceFrom,
    totalProducts: products.length,
    spotPerOz: products[0]?.spotPerOz || 0,
  };
}

export const meta = ({data}: MetaArgs<typeof loader>) => {
  return getSeoMeta({
    title: 'Gold Chains — Live Priced from the London Fix | Styx Gold',
    description:
      'Cuban, Box, Curb, and Rope chains in 10K and 14K solid gold. Every piece priced transparently from the live gold spot price. No markup mystery.',
  });
};

const CATEGORY_IMAGES: Record<string, {src: string; alt: string}> = {
  cuban: {
    src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-cuban-link.jpg?v=1779151358',
    alt: 'Cuban Link gold chain',
  },
  box: {
    src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-box-chain.png?v=1779151351',
    alt: 'Box gold chain',
  },
  curb: {
    src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-curb-chain.png?v=1779151362',
    alt: 'Curb gold chain',
  },
  rope: {
    src: 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-categories-rope-chain.png?v=1779151380',
    alt: 'Rope gold chain',
  },
};

export default function ChainsIndex() {
  const {
    collections,
    categories,
    braceletCount,
    braceletPriceFrom,
    totalProducts,
    spotPerOz,
  } = useLoaderData<typeof loader>();

  return (
    <div style={{background: STYX.paper}}>
      <GoldTicker />
      <StyxNav collections={collections} />

      {/* Hero */}
      <section
        style={{
          background: STYX.bone,
          padding: '96px 56px 64px',
          borderBottom: `1px solid ${STYX.line}`,
        }}
        className="styx-chains-hero"
      >
        <StyxLabel>The Vault</StyxLabel>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 40,
            flexWrap: 'wrap',
          }}
        >
          <h1
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 56,
              fontWeight: 400,
              letterSpacing: '0.03em',
              lineHeight: 1,
              margin: '16px 0 0',
              color: STYX.ink,
              textTransform: 'uppercase',
            }}
          >
            Gold Chains
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <span
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                fontSize: 16,
                color: STYX.silt,
              }}
            >
              {totalProducts} pieces · priced from spot
            </span>
            <Obol size={32} color={STYX.gold} speed={14} />
          </div>
        </div>

        {spotPerOz > 0 && (
          <div
            style={{
              marginTop: 24,
              fontFamily: FONT.mono,
              fontSize: 11,
              color: STYX.silt,
              letterSpacing: '0.04em',
            }}
          >
            Gold spot: ${spotPerOz.toLocaleString()}/oz · Prices update in
            real-time
          </div>
        )}
      </section>

      {/* Category Grid */}
      <section style={{padding: '80px 56px'}} className="styx-chains-grid">
        <StyxLabel>By Chain Family</StyxLabel>
        <h2
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 36,
            fontWeight: 400,
            color: STYX.ink,
            margin: '12px 0 48px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Every weave we carry.
        </h2>

        <div
          className="styx-chains-category-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}
        >
          {categories.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>
      </section>

      {/* Bracelets Banner */}
      {braceletCount > 0 && (
        <Link
          to="/chains/bracelet"
          prefetch="intent"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '28px 56px',
            background: STYX.ink,
            color: STYX.bone,
            textDecoration: 'none',
            borderTop: `1px solid rgba(239,234,224,0.08)`,
            borderBottom: `1px solid rgba(239,234,224,0.08)`,
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <span
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 14,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              Bracelets
            </span>
            <span
              style={{fontFamily: FONT.mono, fontSize: 11, color: STYX.gold}}
            >
              {braceletCount} pieces · from $
              {braceletPriceFrom.toLocaleString()}
            </span>
          </div>
          <span
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 11,
              letterSpacing: '0.2em',
              color: STYX.gold,
              textTransform: 'uppercase',
            }}
          >
            Shop Bracelets →
          </span>
        </Link>
      )}

      <StyxFooter collections={collections} />
    </div>
  );
}

function CategoryCard({
  category,
}: {
  category: {slug: string; label: string; count: number; priceFrom: number};
}) {
  const img = CATEGORY_IMAGES[category.slug];

  return (
    <Link
      to={`/chains/${category.slug}`}
      prefetch="intent"
      style={{
        display: 'block',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          aspectRatio: '4/5',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {img ? (
          <img
            src={img.src}
            alt={img.alt}
            loading="lazy"
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: STYX.bone,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 24,
                color: STYX.silt,
                textTransform: 'uppercase',
              }}
            >
              {category.label}
            </span>
          </div>
        )}

        {/* Count badge */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(239,234,224,0.92)',
            backdropFilter: 'blur(8px)',
            padding: '5px 10px',
            borderRadius: 20,
            fontFamily: FONT.mono,
            fontSize: 10,
            color: STYX.ink,
            letterSpacing: '0.05em',
          }}
        >
          {category.count}
        </div>

        {/* Price from — bottom */}
        {category.priceFrom > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '8px 12px',
              background: 'rgba(26,24,21,0.8)',
              backdropFilter: 'blur(6px)',
              fontFamily: FONT.mono,
              fontSize: 10,
              color: STYX.bone,
              letterSpacing: '0.04em',
            }}
          >
            <span style={{opacity: 0.6}}>from </span>
            <span style={{color: STYX.gold}}>
              ${category.priceFrom.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Label */}
      <div
        style={{
          paddingTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 14,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: STYX.ink,
          }}
        >
          {category.label}
        </div>
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 10,
            letterSpacing: '0.2em',
            color: STYX.gold,
            textTransform: 'uppercase',
          }}
        >
          Shop →
        </div>
      </div>
    </Link>
  );
}

const NAV_COLLECTIONS_QUERY = `#graphql
  query ChainsNavCollections($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 50, sortKey: TITLE) {
      nodes {
        id
        title
        handle
        products(first: 1) { nodes { id } }
      }
    }
  }
` as const;
