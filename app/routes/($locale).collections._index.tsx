import {
  json,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData, Link} from '@remix-run/react';
import {Image, getSeoMeta} from '@shopify/hydrogen';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';
import {
  STYX,
  FONT,
  GoldTicker,
  StyxNav,
  StyxFooter,
  StyxLabel,
  Obol,
  PlaceholderImage,
} from '~/components/styx';
import type {CollectionNode} from '~/components/styx/constants';

export const headers = routeHeaders;

export const loader = async ({
  request,
  context: {storefront},
}: LoaderFunctionArgs) => {
  const {collections} = await storefront.query(COLLECTIONS_QUERY, {
    variables: {
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  const seo = seoPayload.listCollections({
    collections,
    url: request.url,
  });

  return json({collections: collections.nodes as any[], seo});
};

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function CollectionsIndex() {
  const {collections} = useLoaderData<typeof loader>();

  // Only show collections that have at least 1 product, exclude frontpage/hydrogen
  const live = collections.filter(
    (c: any) =>
      c.handle !== 'frontpage' &&
      c.handle !== 'hydrogen' &&
      c.handle !== 'automated-collection' &&
      (c.productsCount?.count ?? c.productsCount ?? 0) > 0,
  );

  // Split into "chain type" collections and "filter" collections (metal, karat, etc.)
  const chainTypes = live.filter(
    (c: any) =>
      !['yellow-gold', 'white-gold', 'rose-gold', '14k-gold', '10k-gold', 'chains'].includes(
        c.handle,
      ),
  );
  const filterCollections = live.filter((c: any) =>
    ['yellow-gold', 'white-gold', 'rose-gold', '14k-gold', '10k-gold'].includes(c.handle),
  );
  const allChains = live.find((c: any) => c.handle === 'chains');

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
      >
        <StyxLabel>The Vault</StyxLabel>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 40,
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
            Collections
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
              {live.length} collections · {chainTypes.length} chain families
            </span>
            <Obol size={32} color={STYX.gold} speed={14} />
          </div>
        </div>
      </section>

      {/* All Chains banner */}
      {allChains && (
        <Link
          to={`/collections/${allChains.handle}`}
          prefetch="intent"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '28px 56px',
            background: STYX.ink,
            color: STYX.bone,
            textDecoration: 'none',
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
              All Chains
            </span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                color: STYX.gold,
              }}
            >
              {allChains.productsCount?.count ?? allChains.productsCount} pieces
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
            Browse all →
          </span>
        </Link>
      )}

      {/* Chain families grid */}
      <section style={{padding: '80px 56px'}}>
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
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}
        >
          {chainTypes.map((collection: any, i: number) => (
            <CollectionTile
              key={collection.id}
              collection={collection}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* Filter collections (metal, karat) */}
      {filterCollections.length > 0 && (
        <section
          style={{
            padding: '64px 56px 80px',
            background: STYX.bone,
            borderTop: `1px solid ${STYX.line}`,
          }}
        >
          <StyxLabel>By Metal & Karat</StyxLabel>
          <h2
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 28,
              fontWeight: 400,
              color: STYX.ink,
              margin: '12px 0 40px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Shop by material.
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(filterCollections.length, 5)}, 1fr)`,
              gap: 2,
              background: STYX.line,
            }}
          >
            {filterCollections.map((c: any) => (
              <Link
                key={c.id}
                to={`/collections/${c.handle}`}
                prefetch="intent"
                style={{
                  background: STYX.paper,
                  padding: '32px 28px',
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = STYX.parchment)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = STYX.paper)
                }
              >
                <div
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 16,
                    letterSpacing: '0.06em',
                    color: STYX.ink,
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  {c.title}
                </div>
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    color: STYX.gold,
                  }}
                >
                  {c.productsCount?.count ?? c.productsCount} pieces
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <StyxFooter collections={collections} />
    </div>
  );
}

/* ─── Collection tile ─── */

function CollectionTile({
  collection,
  index,
}: {
  collection: any;
  index: number;
}) {
  return (
    <Link
      to={`/collections/${collection.handle}`}
      prefetch="intent"
      style={{
        display: 'block',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        const overlay = e.currentTarget.querySelector(
          '[data-overlay]',
        ) as HTMLElement;
        if (overlay) overlay.style.opacity = '0.6';
      }}
      onMouseLeave={(e) => {
        const overlay = e.currentTarget.querySelector(
          '[data-overlay]',
        ) as HTMLElement;
        if (overlay) overlay.style.opacity = '0';
      }}
    >
      {/* Image */}
      <div style={{aspectRatio: '4/5', position: 'relative', overflow: 'hidden'}}>
        {collection.image ? (
          <Image
            data={collection.image}
            aspectRatio="4/5"
            sizes="(min-width: 1200px) 25vw, 50vw"
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : (
          <PlaceholderImage
            aspect="4/5"
            label={collection.title}
            tone="warm"
          />
        )}

        {/* Hover overlay */}
        <div
          data-overlay
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(transparent 40%, ${STYX.ink})`,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          }}
        />

        {/* Product count badge */}
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
          {collection.productsCount?.count ?? collection.productsCount}
        </div>
      </div>

      {/* Info */}
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
          {collection.title}
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

/* ─── Query ─── */

const COLLECTIONS_QUERY = `#graphql
  query StyxCollectionsIndex(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collections(first: 100, sortKey: TITLE) {
      nodes {
        id
        title
        handle
        description
        productsCount {
          count
        }
        image {
          url
          altText
          width
          height
        }
        seo {
          description
          title
        }
      }
    }
  }
` as const;
