import {describe, expect, it} from 'vitest';
import {CARD_SLIDE_LIMIT, cardGallerySlides} from './StyxProductCard';

const base = 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/';
const img = (name: string, altText: string | null = null) => ({
  url: `${base}${name}`,
  altText,
  width: 2000,
  height: 2000,
});
const variant = (color: string, image: ReturnType<typeof img> | null) => ({
  id: `gid://shopify/ProductVariant/${color}`,
  price: {amount: '100.00', currencyCode: 'USD'},
  selectedOptions: [
    {name: 'Color', value: color},
    {name: 'Length', value: '20"'},
  ],
  image,
});

describe('cardGallerySlides', () => {
  const yellow = variant('Yellow Gold', img('cuban_yellow_0.jpg'));
  const white = variant('White Gold', img('cuban_white_0.jpg'));
  const product = {
    variants: {nodes: [yellow, white]},
    media: {
      nodes: [
        {id: '1', image: img('cuban_yellow_0.jpg')},
        {id: '2', image: img('cuban_yellow_1.jpg', 'Cuban chain yellow gold clasp')},
        {id: '3', image: img('cuban_white_0.jpg')},
        {id: '4', image: img('cuban_white_1.jpg', 'Cuban chain white gold clasp')},
        {id: '5', image: img('cuban_yellow_0_921618ac-2596-4c47-be2a-09a009d6beec.jpg')},
        {}, // video / 3D node from the fragment
      ],
    },
  };

  it('leads with the variant image and only adds that color', () => {
    expect(cardGallerySlides(product, yellow).map((s) => s.url)).toEqual([
      `${base}cuban_yellow_0.jpg`,
      `${base}cuban_yellow_1.jpg`,
    ]);
    expect(cardGallerySlides(product, white).map((s) => s.url)).toEqual([
      `${base}cuban_white_0.jpg`,
      `${base}cuban_white_1.jpg`,
    ]);
  });

  it('drops unlabelled photos on a multi-color product', () => {
    const untagged = {
      ...product,
      media: {nodes: [{id: 'x', image: img('mystery_angle.jpg')}]},
    };
    expect(cardGallerySlides(untagged, yellow)).toHaveLength(1);
  });

  it('caps the strip', () => {
    const single = variant('Yellow Gold', img('rope_0.jpg'));
    const many = {
      variants: {nodes: [single]},
      media: {
        nodes: Array.from({length: 10}, (_, i) => ({
          id: String(i),
          image: img(`rope_${i}.jpg`),
        })),
      },
    };
    expect(cardGallerySlides(many, single)).toHaveLength(CARD_SLIDE_LIMIT);
  });

  it('returns nothing when the product has no images', () => {
    const bare = variant('Yellow Gold', null);
    expect(cardGallerySlides({variants: {nodes: [bare]}, media: null}, bare)).toEqual(
      [],
    );
  });
});
