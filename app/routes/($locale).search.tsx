import {
  type MetaArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import {Form, useLoaderData} from 'react-router';
import {useEffect} from 'react';
import {Pagination, getPaginationVariables, Analytics} from '@shopify/hydrogen';

import {trackSearch} from '~/components/GTMDataLayer';
import {Link} from '~/components/Link';
import {STYX, FONT} from '~/components/styx';
import {StyxProductCard} from '~/components/styx/StyxProductCard';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {seoPayload} from '~/lib/seo.server';
import {getStyxSeoMeta} from '~/lib/seo-meta';
import {validateLocale} from '~/lib/utils';

export async function loader({
  request,
  params,
  context: {storefront},
}: LoaderFunctionArgs) {
  validateLocale(params);
  const searchParams = new URL(request.url).searchParams;
  const searchTerm = searchParams.get('q') ?? '';
  const variables = getPaginationVariables(request, {pageBy: 8});

  const {products} = await storefront.query(SEARCH_QUERY, {
    variables: {
      searchTerm,
      ...variables,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  const seo = {
    ...seoPayload.collection({
      url: request.url,
      collection: {
        id: 'search',
        title: 'Search',
        handle: 'search',
        descriptionHtml: 'Search results',
        description: 'Search results',
        seo: {
          title: 'Search',
          description: `Showing ${products.nodes.length} search results for "${searchTerm}"`,
        },
        metafields: [],
        products,
        updatedAt: new Date().toISOString(),
      },
    }),
    // Search results are query-driven duplicates — keep them out of the index
    // (also disallowed in robots.txt).
    robots: {noIndex: true, noFollow: false},
  };

  return {seo, searchTerm, products};
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getStyxSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Search() {
  const {searchTerm, products} = useLoaderData<typeof loader>();
  const hasQuery = Boolean(searchTerm);
  const noResults = hasQuery && products?.nodes?.length === 0;

  // GTM search event — effect (not render body) so it fires once per term,
  // not on every re-render.
  useEffect(() => {
    if (searchTerm) trackSearch(searchTerm);
  }, [searchTerm]);

  return (
    <div style={{maxWidth: 1200, margin: '0 auto'}}>
      {/* ───── Heading + search form ───── */}
      <div style={{textAlign: 'center', marginBottom: 40}}>
        <h1
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: '0.08em',
            color: STYX.ink,
            marginBottom: 8,
          }}
        >
          Search
        </h1>
        <p
          style={{
            fontFamily: FONT.cormorant,
            fontSize: 17,
            fontStyle: 'italic',
            color: STYX.silt,
            margin: '0 0 28px',
          }}
        >
          Find your chain by weave, karat or width.
        </p>

        <Form
          method="get"
          style={{
            display: 'flex',
            maxWidth: 560,
            margin: '0 auto',
            border: `1px solid ${STYX.line}`,
            background: STYX.paper,
          }}
        >
          <input
            className="styx-search-input"
            defaultValue={searchTerm}
            name="q"
            type="search"
            placeholder="Cuban, 14k, 5mm…"
            aria-label="Search products"
            style={{
              flex: 1,
              padding: '14px 18px',
              border: 'none',
              background: 'transparent',
              fontFamily: FONT.inter,
              // 16px minimum so iOS Safari doesn't zoom the page on focus
              fontSize: 16,
              color: STYX.ink,
              outline: 'none',
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0 26px',
              background: STYX.ink,
              color: STYX.bone,
              border: 'none',
              fontFamily: FONT.cinzel,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </Form>
      </div>

      {/* ───── Results / empty states ───── */}
      {!hasQuery ? (
        <p
          style={{
            textAlign: 'center',
            fontFamily: FONT.mono,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: STYX.silt,
            padding: '24px 0 64px',
          }}
        >
          Type a search above to begin
        </p>
      ) : noResults ? (
        <div style={{textAlign: 'center', padding: '32px 0 80px'}}>
          <p
            style={{
              fontFamily: FONT.cormorant,
              fontSize: 20,
              color: STYX.ink,
              margin: '0 auto 10px',
              maxWidth: 520,
            }}
          >
            No results for &ldquo;{searchTerm}&rdquo;
          </p>
          <p
            style={{
              fontFamily: FONT.inter,
              fontSize: 13,
              color: STYX.silt,
              margin: '0 auto 30px',
              maxWidth: 460,
            }}
          >
            Try a different spelling, a weave name like cuban or rope, or
            explore the full collection.
          </p>
          <Link
            to="/collections/chains"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              background: STYX.ink,
              color: STYX.bone,
              fontFamily: FONT.cinzel,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Explore the Collection
          </Link>
        </div>
      ) : (
        <Pagination connection={products}>
          {({nodes, isLoading, hasNextPage, NextLink, PreviousLink}) => (
            <>
              {/* Result count */}
              <p
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: STYX.silt,
                  textAlign: 'center',
                  margin: '0 0 32px',
                }}
              >
                <span style={{color: STYX.goldDeep}}>
                  {nodes.length}
                  {hasNextPage ? '+' : ''}
                </span>{' '}
                result{nodes.length !== 1 || hasNextPage ? 's' : ''} for
                &ldquo;{searchTerm}&rdquo;
              </p>

              <div style={{display: 'flex', justifyContent: 'center', marginBottom: 28}}>
                <PreviousLink style={paginationLinkStyle}>
                  {isLoading ? 'Loading…' : 'Previous'}
                </PreviousLink>
              </div>

              {/* One card per product — no per-color explosion on search */}
              <div
                data-test="product-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '48px 32px',
                }}
              >
                {nodes.map((product: any, i: number) => (
                  <StyxProductCard key={product.id} product={product} index={i} />
                ))}
              </div>

              <div style={{display: 'flex', justifyContent: 'center', marginTop: 48}}>
                <NextLink style={paginationLinkStyle}>
                  {isLoading ? 'Loading…' : 'Load More'}
                </NextLink>
              </div>
            </>
          )}
        </Pagination>
      )}

      <Analytics.SearchView data={{searchTerm, searchResults: products}} />
    </div>
  );
}

const paginationLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '12px 26px',
  border: `1px solid ${STYX.line}`,
  background: 'transparent',
  fontFamily: FONT.cinzel,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: STYX.ink,
  textDecoration: 'none',
};

const SEARCH_QUERY = `#graphql
  query PaginatedProductsSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $searchTerm: String
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      sortKey: RELEVANCE,
      query: $searchTerm
    ) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }

  ${PRODUCT_CARD_FRAGMENT}
` as const;
