import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {Suspense} from 'react';
import {Await, useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';

import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';

import {
  GoldTicker,
  StyxNav,
  HeroGallery,
  Ribbon,
  CategoryTiles,
  FeaturedRow,
  Lookbook,
  CraftStrip,
  Newsletter,
  StyxFooter,
} from '~/components/styx';

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const {params, context} = args;
  const {language, country} = context.storefront.i18n;

  if (
    params.locale &&
    params.locale.toLowerCase() !== `${language}-${country}`.toLowerCase()
  ) {
    throw new Response(null, {status: 404});
  }

  const criticalData = await loadCriticalData(args);
  const deferredData = loadDeferredData(args);

  return defer({...deferredData, ...criticalData});
}

async function loadCriticalData({context, request}: LoaderFunctionArgs) {
  const [{shop}, {products}, {collections}] = await Promise.all([
    context.storefront.query(HOMEPAGE_SEO_QUERY),
    context.storefront.query(STYX_ALL_PRODUCTS_QUERY, {
      variables: {
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
    context.storefront.query(STYX_COLLECTIONS_QUERY, {
      variables: {
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
  ]);

  return {
    shop,
    allProducts: products?.nodes || [],
    collections: (collections?.nodes || []).filter(
      (c: any) => c.products?.nodes?.length > 0,
    ),
    seo: seoPayload.home({url: request.url}),
  };
}

function loadDeferredData({context}: LoaderFunctionArgs) {
  const {cart, customerAccount} = context;
  return {
    isLoggedIn: customerAccount.isLoggedIn(),
    cart: cart.get(),
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Homepage() {
  const {allProducts, collections} = useLoaderData<typeof loader>();

  return (
    <div style={{background: '#EFEAE0'}}>
      <GoldTicker />
      <StyxNav collections={collections} />
      <HeroGallery products={allProducts} />
      <Ribbon />
      <CategoryTiles collections={collections} products={allProducts} />
      <FeaturedRow products={allProducts.slice(0, 4)} />
      <Lookbook products={allProducts.slice(0, 6)} />
      <CraftStrip />
      <Newsletter />
      <StyxFooter collections={collections} />
    </div>
  );
}

const HOMEPAGE_SEO_QUERY = `#graphql
  query styxHomepageSeo {
    shop {
      name
      description
    }
  }
` as const;

const STYX_ALL_PRODUCTS_QUERY = `#graphql
  query styxAllProducts($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 12) {
      nodes {
        id
        title
        handle
        vendor
        productType
        variants(first: 6) {
          nodes {
            id
            image {
              url
              altText
              width
              height
            }
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
            weight
            weightUnit
          }
        }
      }
    }
  }
` as const;

const STYX_COLLECTIONS_QUERY = `#graphql
  query styxCollections($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 50, sortKey: TITLE) {
      nodes {
        id
        title
        handle
        description
        image {
          url
          altText
          width
          height
        }
        products(first: 1) {
          nodes {
            id
          }
        }
      }
    }
  }
` as const;
