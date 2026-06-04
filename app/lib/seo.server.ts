import {type SeoConfig, getSeoMeta} from '@shopify/hydrogen';
import type {
  Article,
  Blog,
  Collection,
  Page,
  Product,
  ProductVariant,
  ShopPolicy,
  Image,
} from '@shopify/hydrogen/storefront-api-types';
import type {
  Article as SeoArticle,
  BreadcrumbList,
  Blog as SeoBlog,
  CollectionPage,
  Offer,
  Organization,
  Product as SeoProduct,
  WebPage,
} from 'schema-dts';

import type {ShopFragment} from 'storefrontapi.generated';

// Site-wide fallback social image (absolute URL required by OG/Twitter).
import {DEFAULT_OG_IMAGE_PATH} from './seo-meta';

function defaultOgImage(url: Request['url']): SeoConfig['media'] {
  try {
    return {
      type: 'image',
      url: new URL(DEFAULT_OG_IMAGE_PATH, new URL(url).origin).toString(),
      altText: 'STYX Gold — solid gold chains',
    };
  } catch {
    return undefined;
  }
}

function root({
  shop,
  url,
}: {
  shop: ShopFragment;
  url: Request['url'];
}): SeoConfig {
  return {
    title: shop?.name,
    titleTemplate: '%s | STYX Gold',
    description: truncate(
      shop?.description ??
        'Solid gold chains — 10K & 14K — priced transparently from the London fix. No markup mystery.',
    ),
    handle: '@styxgold',
    url,
    media: shop?.brand?.logo?.image?.url
      ? {
          type: 'image',
          url: shop.brand.logo.image.url,
          altText: 'STYX Gold',
        }
      : defaultOgImage(url),
    robots: {
      noIndex: false,
      noFollow: false,
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'JewelryStore',
      name: 'STYX Gold',
      logo: shop.brand?.logo?.image?.url,
      description:
        'Solid gold chains priced transparently from the London fix. Three generations in the gold trade.',
      sameAs: [
        'https://instagram.com/styxgold',
      ],
      url,
      priceRange: '$$$',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${url}search?q={search_term}`,
        query: "required name='search_term'",
      },
    },
  };
}

function home({url}: {url: Request['url']}): SeoConfig {
  return {
    title: 'Solid Gold Chains — Priced Honestly',
    titleTemplate: '%s | STYX Gold',
    description:
      'Solid gold chains — 10K & 14K — weighed, tested, and priced from the London fix. No markup mystery. Three generations in the gold trade.',
    url,
    media: defaultOgImage(url),
    robots: {
      noIndex: false,
      noFollow: false,
    },
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'STYX Gold — Solid Gold Chains',
        description:
          'Solid gold chains priced transparently from the London fix.',
        url,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'JewelryStore',
        name: 'STYX Gold',
        description:
          'Three generations in the gold trade. Solid gold chains — 10K & 14K — priced from the London fix.',
        url,
        priceRange: '$$$',
        currenciesAccepted: 'USD, CAD',
      },
    ],
  };
}

type SelectedVariantRequiredFields = Pick<ProductVariant, 'sku'> & {
  image?: null | Partial<Image>;
};

type ProductRequiredFields = Pick<
  Product,
  'title' | 'description' | 'vendor' | 'seo'
> & {
  variants: Array<
    Pick<
      ProductVariant,
      'sku' | 'price' | 'selectedOptions' | 'availableForSale'
    >
  >;
};

function productJsonLd({
  product,
  selectedVariant,
  url,
}: {
  product: ProductRequiredFields;
  selectedVariant: SelectedVariantRequiredFields;
  url: Request['url'];
}): SeoConfig['jsonLd'] {
  const origin = new URL(url).origin;
  const variants = product.variants;
  const description = truncate(
    product?.seo?.description ?? product?.description,
  );
  const offers: Offer[] = (variants || []).map((variant) => {
    const variantUrl = new URL(url);
    for (const option of variant.selectedOptions) {
      variantUrl.searchParams.set(option.name, option.value);
    }
    const availability = variant.availableForSale
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';

    return {
      '@type': 'Offer',
      availability,
      price: parseFloat(variant.price.amount),
      priceCurrency: variant.price.currencyCode,
      sku: variant?.sku ?? '',
      url: variantUrl.toString(),
    };
  });
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Products',
          item: `${origin}/products`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: product.title,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      brand: {
        '@type': 'Brand',
        name: product.vendor,
      },
      description,
      image: [selectedVariant?.image?.url ?? ''],
      name: product.title,
      offers,
      sku: selectedVariant?.sku ?? '',
      material: 'Gold',
      url,
    },
  ];
}

function product({
  product,
  url,
  selectedVariant,
}: {
  product: ProductRequiredFields;
  selectedVariant: SelectedVariantRequiredFields;
  url: Request['url'];
}): SeoConfig {
  // Keep the <title> tight: just the product name + brand suffix (via
  // titleTemplate). Variant/option detail (length, colour) is dropped so titles
  // stay under ~60 chars and don't read as duplicates across variants.
  const title = product?.seo?.title || product?.title;

  // Prefer Shopify's authored SEO description. Otherwise generate one from the
  // product body — strip HTML and any leftover spec lines, then truncate at a
  // word boundary. No templated "Shop the … in …" prefix (it duplicated the
  // title and ate the character budget).
  const description = truncate(
    product?.seo?.description || cleanText(product?.description ?? ''),
  );

  return {
    title,
    titleTemplate: '%s | STYX Gold',
    description,
    url,
    media: selectedVariant?.image,
    jsonLd: productJsonLd({product, selectedVariant, url}),
  };
}

type CollectionRequiredFields = Omit<
  Collection,
  'products' | 'descriptionHtml' | 'metafields' | 'image' | 'updatedAt'
> & {
  products: {nodes: Pick<Product, 'handle'>[]};
  image?: null | Pick<Image, 'url' | 'height' | 'width' | 'altText'>;
  descriptionHtml?: null | Collection['descriptionHtml'];
  updatedAt?: null | Collection['updatedAt'];
  metafields?: null | Collection['metafields'];
};

function collectionJsonLd({
  url,
  collection,
}: {
  url: Request['url'];
  collection: CollectionRequiredFields;
}): SeoConfig['jsonLd'] {
  const siteUrl = new URL(url);
  const itemListElement: CollectionPage['mainEntity'] =
    collection.products.nodes.map((product, index) => {
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `/products/${product.handle}`,
      };
    });

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Collections',
          item: `${siteUrl.host}/collections`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: collection.title,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: collection?.seo?.title ?? collection?.title ?? '',
      description: truncate(
        collection?.seo?.description ?? collection?.description ?? '',
      ),
      image: collection?.image?.url,
      url: `/collections/${collection.handle}`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement,
      },
    },
  ];
}

function collection({
  collection,
  url,
}: {
  collection: CollectionRequiredFields;
  url: Request['url'];
}): SeoConfig {
  const title = collection?.seo?.title || collection?.title;
  const description =
    truncate(
      collection?.seo?.description || cleanText(collection?.description ?? ''),
    ) ||
    `Shop ${collection?.title ?? 'solid gold chains'} — 10K & 14K, priced transparently from the London fix. No markup mystery.`;

  return {
    title,
    description,
    titleTemplate: '%s | STYX Gold',
    url,
    media: {
      type: 'image',
      url: collection?.image?.url,
      height: collection?.image?.height,
      width: collection?.image?.width,
      altText: collection?.image?.altText,
    },
    jsonLd: collectionJsonLd({collection, url}),
  };
}

type CollectionListRequiredFields = {
  nodes: Omit<CollectionRequiredFields, 'products'>[];
};

function collectionsJsonLd({
  url,
  collections,
}: {
  url: Request['url'];
  collections: CollectionListRequiredFields;
}): SeoConfig['jsonLd'] {
  const itemListElement: CollectionPage['mainEntity'] = collections.nodes.map(
    (collection, index) => {
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: `/collections/${collection.handle}`,
      };
    },
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Collections',
    description: 'All collections',
    url,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement,
    },
  };
}

function listCollections({
  collections,
  url,
}: {
  collections: CollectionListRequiredFields;
  url: Request['url'];
}): SeoConfig {
  return {
    title: 'Collections',
    titleTemplate: '%s | STYX Gold',
    description: 'Browse all solid gold chain collections — by style, weight, karat, and metal.',
    url,
    jsonLd: collectionsJsonLd({collections, url}),
  };
}

function article({
  article,
  url,
}: {
  article: Pick<
    Article,
    'title' | 'contentHtml' | 'seo' | 'publishedAt' | 'excerpt'
  > & {
    image?: null | Pick<
      NonNullable<Article['image']>,
      'url' | 'height' | 'width' | 'altText'
    >;
  };
  url: Request['url'];
}): SeoConfig {
  return {
    title: article?.seo?.title ?? article?.title,
    description: truncate(
      article?.seo?.description ||
        article?.excerpt ||
        cleanText(article?.contentHtml ?? ''),
    ),
    titleTemplate: '%s | STYX Gold',
    url,
    media: article?.image?.url
      ? {
          type: 'image',
          url: article.image.url,
          height: article?.image?.height,
          width: article?.image?.width,
          altText: article?.image?.altText,
        }
      : defaultOgImage(url),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      alternativeHeadline: article.title,
      articleBody: article.contentHtml,
      datePublished: article?.publishedAt,
      description: truncate(
        article?.seo?.description || article?.excerpt || '',
      ),
      headline: article?.seo?.title || '',
      image: article?.image?.url,
      url,
    },
  };
}

function blog({
  blog,
  url,
}: {
  blog: Pick<Blog, 'seo' | 'title'>;
  url: Request['url'];
}): SeoConfig {
  return {
    title: blog?.seo?.title,
    description: truncate(blog?.seo?.description || ''),
    titleTemplate: '%s | STYX Gold',
    url,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: blog?.seo?.title || blog?.title || '',
      description: blog?.seo?.description || '',
      url,
    },
  };
}

function page({
  page,
  url,
}: {
  page: Pick<Page, 'title' | 'seo'>;
  url: Request['url'];
}): SeoConfig {
  return {
    description: truncate(page?.seo?.description || ''),
    title: page?.seo?.title ?? page?.title,
    titleTemplate: '%s | STYX Gold',
    url,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: page.title,
    },
  };
}

function policy({
  policy,
  url,
}: {
  policy: Pick<ShopPolicy, 'title' | 'body'>;
  url: Request['url'];
}): SeoConfig {
  return {
    description: truncate(policy?.body ?? ''),
    title: policy?.title,
    titleTemplate: '%s | STYX Gold',
    url,
  };
}

function policies({
  policies,
  url,
}: {
  policies: Array<Pick<ShopPolicy, 'title' | 'handle'>>;
  url: Request['url'];
}): SeoConfig {
  const origin = new URL(url).origin;
  const itemListElement: BreadcrumbList['itemListElement'] = policies
    .filter(Boolean)
    .map((policy, index) => {
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: policy.title,
        item: `${origin}/policies/${policy.handle}`,
      };
    });
  return {
    title: 'Policies',
    titleTemplate: '%s | STYX Gold',
    description: 'STYX Gold store policies',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        description: 'STYX Gold store policies',
        name: 'Policies',
        url,
      },
    ],
  };
}

export const seoPayload = {
  article,
  blog,
  collection,
  home,
  listCollections,
  page,
  policies,
  policy,
  product,
  root,
};

/**
 * Truncate a string to a given length, adding an ellipsis if it was truncated
 * @param str - The string to truncate
 * @param num - The maximum length of the string
 * @returns The truncated string
 * @example
 * ```js
 * truncate('Hello world', 5) // 'Hello...'
 * ```
 */
function truncate(str: string, num = 155): string {
  if (typeof str !== 'string') return '';
  const clean = str.trim();
  if (clean.length <= num) {
    return clean;
  }
  // Truncate at the last word boundary before the limit so we never cut a word
  // in half, then append an ellipsis.
  const slice = clean.slice(0, num - 1);
  const lastSpace = slice.lastIndexOf(' ');
  const base = lastSpace > num * 0.5 ? slice.slice(0, lastSpace) : slice;
  return base.replace(/[\s.,;:!-]+$/, '') + '…';
}

/**
 * Strip HTML tags/entities and collapse whitespace so a product or collection
 * descriptionHtml can be reused as a plain-text meta description.
 */
function cleanText(html: string): string {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

