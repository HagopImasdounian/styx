import {type MetaArgs, type LoaderFunctionArgs} from 'react-router';
import {data, useLoaderData} from 'react-router';
import invariant from 'tiny-invariant';
import {
  Pagination,
  getPaginationVariables,
  getSeoMeta,
} from '@shopify/hydrogen';

import {StyxProductCard} from '~/components/styx/StyxProductCard';
import {
  GridDensityScript,
  GridDensityToggle,
  gridDensityClass,
  useGridDensity,
} from '~/components/styx/ListingControls';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {seoPayload} from '~/lib/seo.server';
import {getStyxSeoMeta} from '~/lib/seo-meta';
import {validateLocale} from '~/lib/utils';
import {routeHeaders} from '~/data/cache';

const PAGE_BY = 8;

export const headers = routeHeaders;

export async function loader({
  request,
  params,
  context: {storefront},
}: LoaderFunctionArgs) {
  validateLocale(params);
  const variables = getPaginationVariables(request, {pageBy: PAGE_BY});

  const result = await storefront.query(ALL_PRODUCTS_QUERY, {
    variables: {
      ...variables,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  invariant(result, 'No data returned from Shopify API');

  const seo = seoPayload.collection({
    url: request.url,
    collection: {
      id: 'all-products',
      title: 'All Products',
      handle: 'products',
      descriptionHtml: 'All the store products',
      description: 'All the store products',
      seo: {
        title: 'All Products',
        description: 'All the store products',
      },
      metafields: [],
      products: result.products,
      updatedAt: '',
    },
  });

  return data({
    products: result.products,
    seo,
  });
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getStyxSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function AllProducts() {
  const {products} = useLoaderData<typeof loader>();
  const [density, setDensity] = useGridDensity();

  return (
    <div
      className="styx-listing-page styx-catalog styx-catalog-chrome"
      style={{background: 'var(--styx-surface)', minHeight: '100vh'}}
    >
      <header className="styx-catalog-header">
        <h1 className="styx-catalog-title">All products</h1>
      </header>
      <div className="styx-catalog-toolbar">
        <span className="styx-catalog-count">Every piece we carry</span>
        <GridDensityToggle density={density} onChange={setDensity} />
      </div>
      <div className="styx-catalog-body">
        <Pagination connection={products}>
          {({nodes, isLoading, NextLink, PreviousLink}) => {
            const itemsMarkup = nodes.map((product: any, i: number) => (
              <StyxProductCard key={product.id} product={product} index={i} />
            ));

            return (
              <>
                <div className="styx-catalog-pager">
                  <PreviousLink className="styx-ctl styx-catalog-more">
                    {isLoading ? 'Loading...' : 'Previous'}
                  </PreviousLink>
                </div>
                <div
                  className={`styx-plp-grid ${gridDensityClass(
                    density,
                  )}`.trim()}
                  data-test="product-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '40px 32px',
                  }}
                  // GridDensityScript may add the density classes pre-hydration
                  suppressHydrationWarning
                >
                  {itemsMarkup}
                </div>
                <GridDensityScript />
                <div className="styx-catalog-pager">
                  <NextLink className="styx-ctl styx-catalog-more">
                    {isLoading ? 'Loading...' : 'Next'}
                  </NextLink>
                </div>
              </>
            );
          }}
        </Pagination>
      </div>
    </div>
  );
}

const ALL_PRODUCTS_QUERY = `#graphql
  query AllProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
