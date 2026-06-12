import {data, type LoaderFunctionArgs} from 'react-router';

import {CACHE_SHORT, routeHeaders} from '~/data/cache';

export const headers = routeHeaders;

export type PredictiveSearchProduct = {
  id: string;
  handle: string;
  title: string;
  featuredImage: {url: string; altText: string | null} | null;
  priceRange: {minVariantPrice: {amount: string; currencyCode: string}};
};

export type PredictiveSearchCollection = {
  id: string;
  handle: string;
  title: string;
};

export type PredictiveSearchResult = {
  products: PredictiveSearchProduct[];
  collections: PredictiveSearchCollection[];
};

const EMPTY: PredictiveSearchResult = {products: [], collections: []};

/**
 * Predictive search suggestions for the nav search (desktop overlay +
 * mobile menu). GET /api/predictive-search?q=6mm+cuban
 *
 * Queries the Storefront API `predictiveSearch` endpoint for up to 6
 * products + collections. Queries under 2 characters return empty results
 * without hitting the API.
 */
export async function loader({
  request,
  context: {storefront},
}: LoaderFunctionArgs) {
  const q = (new URL(request.url).searchParams.get('q') ?? '').trim();

  if (q.length < 2) {
    return data(EMPTY, {headers: {'Cache-Control': CACHE_SHORT}});
  }

  try {
    const i18n = {
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    };

    const {predictiveSearch} = (await storefront.query(
      PREDICTIVE_SEARCH_QUERY,
      {
        variables: {q, ...i18n},
        cache: storefront.CacheShort(),
      },
    )) as {predictiveSearch: PredictiveSearchResult | null};

    let products = predictiveSearch?.products ?? [];

    // Spec-style queries ("6mm cuban") often miss in predictiveSearch's
    // prefix matching but hit in the products(query:) search the /search
    // page runs — fall back to it so suggestions agree with full results.
    if (products.length === 0) {
      const fallback = (await storefront.query(FALLBACK_PRODUCTS_QUERY, {
        variables: {q, ...i18n},
        cache: storefront.CacheShort(),
      })) as {products: {nodes: PredictiveSearchProduct[]} | null};
      products = fallback.products?.nodes ?? [];
    }

    return data(
      {
        products,
        collections: predictiveSearch?.collections ?? [],
      },
      {headers: {'Cache-Control': CACHE_SHORT}},
    );
  } catch {
    // Suggestions are an enhancement — never let a Storefront hiccup break
    // the nav. The full /search page remains the reliable path.
    return data(EMPTY, {headers: {'Cache-Control': 'no-store'}});
  }
}

// Mirrors the /search page's products(query:) search (RELEVANCE) so
// suggestions agree with the full results page for spec-style queries.
const FALLBACK_PRODUCTS_QUERY = `#graphql
  query StyxPredictiveFallback(
    $q: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 6, sortKey: RELEVANCE, query: $q) {
      nodes {
        id
        handle
        title
        featuredImage {
          url
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;

const PREDICTIVE_SEARCH_QUERY = `#graphql
  query StyxPredictiveSearch(
    $q: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(query: $q, limit: 6, types: [PRODUCT, COLLECTION]) {
      products {
        id
        handle
        title
        featuredImage {
          url
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
      collections {
        id
        handle
        title
      }
    }
  }
` as const;

// Resource route — intentionally no default export so GET requests return
// the loader's JSON directly instead of a rendered HTML document.
