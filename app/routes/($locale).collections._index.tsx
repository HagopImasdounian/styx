import {type MetaArgs, type LoaderFunctionArgs} from 'react-router';
import {data, useLoaderData, Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {seoPayload} from '~/lib/seo.server';
import {getStyxSeoMeta} from '~/lib/seo-meta';
import {validateLocale} from '~/lib/utils';
import {CACHE_LONG, routeHeaders} from '~/data/cache';
import {
  GoldTicker,
  StyxNav,
  StyxFooter,
  PlaceholderImage,
} from '~/components/styx';

/** This route renders its own GoldTicker + StyxNav + StyxFooter. */
export const handle = {ownChrome: true};

export const headers = routeHeaders;

export const loader = async ({
  request,
  params,
  context: {storefront},
}: LoaderFunctionArgs) => {
  validateLocale(params);

  const {collections, allChains} = await storefront.query(COLLECTIONS_QUERY, {
    variables: {
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  const seo = seoPayload.listCollections({
    collections,
    url: request.url,
  });

  return data(
    {
      collections: collections.nodes as any[],
      allChainsCount: allChains?.products?.nodes?.length ?? null,
      seo,
    },
    {headers: {'Cache-Control': CACHE_LONG}},
  );
};

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getStyxSeoMeta(...matches.map((match) => (match.data as any).seo));
};

/** "17 designs", "1 design", or "100+ designs" when the fetch cap was hit.
 * "Designs" (products), deliberately not "pieces", collection pages count
 * color-split cards, so the same collection shows a higher "pieces" number. */
function designCount(n: number, cap = 100) {
  if (n >= cap) return `${cap}+ designs`;
  return `${n} ${n === 1 ? 'design' : 'designs'}`;
}

export default function CollectionsIndex() {
  const {collections, allChainsCount} = useLoaderData<typeof loader>();

  // Only show collections that have at least 1 product, exclude frontpage/hydrogen
  const live = collections.filter(
    (c: any) =>
      c.handle !== 'frontpage' &&
      c.handle !== 'hydrogen' &&
      c.handle !== 'automated-collection' &&
      (c.products?.nodes?.length ?? 0) > 0,
  );

  // Split into "chain type" collections and "filter" collections (metal, karat, thickness, etc.)
  const filterHandles = new Set([
    'yellow-gold',
    'white-gold',
    'rose-gold',
    '10k-gold',
    '14k-gold',
    '18k-gold',
    'chains',
    'classic-curb',
    'woven-braided',
    'round-rolling',
    'flat-architectural',
    'figural-decorative',
  ]);
  const isThickness = (handle: string) => handle.startsWith('thickness-');

  const chainTypes = live.filter(
    (c: any) => !filterHandles.has(c.handle) && !isThickness(c.handle),
  );
  const filterCollections = live.filter((c: any) =>
    [
      'yellow-gold',
      'white-gold',
      'rose-gold',
      '10k-gold',
      '14k-gold',
      '18k-gold',
    ].includes(c.handle),
  );
  const allChains = live.find((c: any) => c.handle === 'chains');

  const allChainsDesigns = allChains
    ? designCount(allChainsCount ?? allChains.products?.nodes?.length ?? 0, 250)
    : null;

  return (
    <div className="styx-catalog" style={{background: 'var(--styx-surface)'}}>
      <GoldTicker />
      <StyxNav collections={collections} />

      {/* Chain families: same card system as the homepage collection edit */}
      <section className="styx-collection-edit styx-ci-edit">
        <div className="styx-section-heading">
          <div>
            <p className="styx-eyebrow">
              Collections · {live.length} collections, {chainTypes.length}{' '}
              chain families
            </p>
            <h1 className="styx-catalog-heading">
              Every weave <em>we carry.</em>
            </h1>
          </div>
          {allChains && (
            <Link
              to={`/collections/${allChains.handle}`}
              prefetch="intent"
              className="styx-text-link"
            >
              Shop all chains
              {allChainsDesigns ? (
                <span className="styx-catalog-link-meta">
                  {allChainsDesigns}
                </span>
              ) : null}
              <span aria-hidden="true">↗</span>
            </Link>
          )}
        </div>

        <div className="styx-collection-edit-grid styx-ci-grid">
          {chainTypes.map((collection: any, index: number) => (
            <CollectionTile
              key={collection.id}
              collection={collection}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* Filter collections (metal, karat) */}
      {filterCollections.length > 0 && (
        <section className="styx-ci-materials">
          <div className="styx-section-heading">
            <div>
              <h2 data-reveal="">
                Shop by <em>material.</em>
              </h2>
            </div>
          </div>
          <div className="styx-ci-materials-grid">
            {filterCollections.map((c: any) => (
              <Link
                data-reveal=""
                key={c.id}
                to={`/collections/${c.handle}`}
                prefetch="intent"
                className="styx-ci-material"
              >
                <span className="styx-ci-material-title">{c.title}</span>
                <span className="styx-ci-material-meta">
                  {designCount(c.products?.nodes?.length ?? 0)}
                </span>
                <span className="styx-collection-card-arrow" aria-hidden="true">
                  ↗
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <StyxFooter collections={collections} />
    </div>
  );
}

function CollectionTile({
  collection,
  index,
}: {
  collection: any;
  index: number;
}) {
  return (
    <Link
      data-reveal=""
      to={`/collections/${collection.handle}`}
      prefetch="intent"
      className="styx-collection-card"
    >
      <div className="styx-collection-card-image">
        <span className="styx-collection-card-number" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        {collection.image ? (
          <Image
            data={collection.image}
            alt={collection.image.altText ?? collection.title}
            aspectRatio="1/1"
            sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
          />
        ) : (
          <PlaceholderImage aspect="1/1" label={collection.title} tone="warm" />
        )}
        <span className="styx-collection-card-arrow" aria-hidden="true">
          ↗
        </span>
      </div>
      <div className="styx-collection-card-info">
        <h3>{collection.title}</h3>
        <span>{designCount(collection.products?.nodes?.length ?? 0)}</span>
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
    # exact count for the "All Chains" banner (the catalog is well under 250)
    allChains: collection(handle: "chains") {
      products(first: 250) {
        nodes {
          id
        }
      }
    }
    collections(first: 100, sortKey: TITLE) {
      nodes {
        id
        title
        handle
        description
        # ids only, rendered as the per-collection piece count (capped at 100)
        products(first: 100) {
          nodes {
            id
          }
        }
        image {
          url
          altText
          width
          height
        }
        cutout: metafield(namespace: "custom", key: "cutout_image") {
          reference {
            ... on MediaImage {
              image {
                url
              }
            }
          }
        }
        seo {
          description
          title
        }
      }
    }
  }
` as const;
