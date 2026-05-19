import {
    type MetaArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import {Suspense} from 'react';
import {Await, useLoaderData} from 'react-router';
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

  return ({...deferredData, ...criticalData});
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
    isLoggedIn: customerAccount?.isLoggedIn() ?? Promise.resolve(false),
    cart: cart.get(),
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

/**
 * Pick the 4 best-value chains: lowest price-per-gram (least overhead as % of weight).
 * Only considers the cheapest variant of each product.
 */
function bestValueProducts(products: any[]) {
  const scored = products
    .map((p: any) => {
      const variants = p.variants?.nodes || [];
      if (variants.length === 0) return null;
      // Find cheapest variant with weight
      let best = null;
      for (const v of variants) {
        const price = parseFloat(v.price?.amount || '0');
        const weight = v.weight || 0;
        if (price > 0 && weight > 0) {
          const ppg = price / weight;
          if (!best || ppg < best.ppg) best = {ppg, price, weight};
        }
      }
      if (!best) return null;
      return {...p, _ppg: best.ppg};
    })
    .filter(Boolean);

  scored.sort((a: any, b: any) => a._ppg - b._ppg);
  return scored.slice(0, 4);
}

export default function Homepage() {
  const {allProducts, collections} = useLoaderData<typeof loader>();

  return (
    <div style={{background: '#EFEAE0'}}>
      <GoldTicker />
      <StyxNav collections={collections} />
      <HeroGallery products={allProducts} />
      <Ribbon />
      <Lookbook collections={collections} />
      <FeaturedRow products={bestValueProducts(allProducts)} />
      <CraftStrip />
      <Newsletter />
      <StyxFooter collections={collections} />
      <div
        style={{
          textAlign: 'center',
          padding: '16px 0',
          background: '#111',
          borderTop: '1px solid rgba(239,234,224,0.06)',
        }}
      >
        <a
          href="https://itshco.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            letterSpacing: '0.1em',
            color: 'rgba(239,234,224,0.35)',
            textDecoration: 'none',
          }}
        >
          Designed &amp; built by H&amp;Co
        </a>
      </div>
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
    products(first: 50) {
      nodes {
        id
        title
        handle
        vendor
        productType
        variants(first: 10) {
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
