export const MEDIA_FRAGMENT = `#graphql
  fragment Media on Media {
    __typename
    mediaContentType
    alt
    previewImage {
      url
    }
    ... on MediaImage {
      id
      image {
        id
        url
        width
        height
      }
    }
    ... on Video {
      id
      sources {
        mimeType
        url
      }
    }
    ... on Model3d {
      id
      sources {
        mimeType
        url
      }
    }
    ... on ExternalVideo {
      id
      embedUrl
      host
    }
  }
`;

// variants(first: 30) covers the real catalog maximum (10 lengths x 3 colors)
// and fetches only the fields the cards actually read: price/compareAtPrice
// (price + Sale label), selectedOptions (color-exploded cards + karat),
// image (per-color imagery + hover), weight (grams badge), availableForSale
// (stock dot). media(first: 8) feeds the mobile swipe strip on the card (color
// filtered client side, capped at 6 slides).
export const PRODUCT_CARD_FRAGMENT = `#graphql
  fragment ProductCard on Product {
    id
    title
    publishedAt
    handle
    productType
    tags
    media(first: 8) {
      nodes {
        ... on MediaImage {
          id
          image {
            url
            altText
            width
            height
          }
        }
      }
    }
    variants(first: 30) {
      nodes {
        id
        sku
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
    chain_construction: metafield(namespace: "chain", key: "construction") {
      value
    }
  }
`;

export const FEATURED_COLLECTION_FRAGMENT = `#graphql
  fragment FeaturedCollectionDetails on Collection {
    id
    title
    handle
    image {
      altText
      width
      height
      url
    }
  }
`;
