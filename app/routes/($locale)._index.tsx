import {
    type MetaArgs,
  type LoaderFunctionArgs,
  type LinksFunction,
} from 'react-router';
import {Suspense} from 'react';
import {Await, data, useLoaderData} from 'react-router';
import {getSeoMeta} from '@shopify/hydrogen';

import {seoPayload} from '~/lib/seo.server';
import {getStyxSeoMeta} from '~/lib/seo-meta';
import {CACHE_SHORT, routeHeaders} from '~/data/cache';

import {
  GoldTicker,
  StyxNav,
  HeroGallery,
  Ribbon,
  CategoryTiles,
  FeaturedRow,
  Lookbook,
  CraftStrip,
  ToolsStrip,
  Newsletter,
  StyxFooter,
} from '~/components/styx';
import {HERO_IMAGE, HERO_WIDTHS} from '~/components/styx';

export const headers = routeHeaders;

// Preload the hero (LCP) image from the document head so the browser starts
// fetching it alongside the CSS instead of waiting for the <img> in the body.
export const links: LinksFunction = () => [
  {
    rel: 'preload',
    as: 'image',
    href: `${HERO_IMAGE}&width=1600`,
    imageSrcSet: HERO_WIDTHS.map((w) => `${HERO_IMAGE}&width=${w} ${w}w`).join(
      ', ',
    ),
    imageSizes: '100vw',
    // React Router types don't know fetchpriority yet — passes through to the tag.
    ...({fetchpriority: 'high'} as any),
  },
];

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

  return data(
    {...deferredData, ...criticalData},
    {headers: {'Cache-Control': CACHE_SHORT}},
  );
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
    // Only the 4 best-value picks reach the client — the full 50-product
    // scan happens server-side in bestValueProducts().
    featuredProducts: bestValueProducts(products?.nodes || []),
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
  return getStyxSeoMeta(...matches.map((match) => (match.data as any).seo));
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
  const {featuredProducts, collections} = useLoaderData<typeof loader>();

  return (
    <div style={{background: '#EFEAE0'}}>
      <GoldTicker />
      <StyxNav collections={collections} />
      <HeroGallery />
      <Ribbon />
      <Lookbook collections={collections} />
      <FeaturedRow products={featuredProducts} />
      <ToolsStrip />
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

// Trimmed to exactly what bestValueProducts() (price + weight per variant)
// and the FeaturedRow StyxProductCards (image, price, options, weight,
// stock) consume.
const STYX_ALL_PRODUCTS_QUERY = `#graphql
  query styxAllProducts($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: 50) {
      nodes {
        id
        title
        handle
        variants(first: 10) {
          nodes {
            id
            availableForSale
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
        cutout: metafield(namespace: "custom", key: "cutout_image") {
          reference {
            ... on MediaImage {
              image {
                url
              }
            }
          }
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
