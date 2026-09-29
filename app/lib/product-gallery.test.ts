import {describe, expect, it} from 'vitest';
import {galleryImageKey, remainingGalleryMedia} from './product-gallery';

const base = 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/';
const image = (name: string) => ({image: {url: `${base}${name}`}});
const suffix = '921618ac-2596-4c47-be2a-09a009d6beec';

describe('remainingGalleryMedia', () => {
  it('removes duplicate catalog uploads of both the lead and alternate photo', () => {
    const lead = image('cuban_0_shiny.jpg');
    const alternate = image('cuban_1_keep.jpg');
    expect(
      remainingGalleryMedia(
        [
          lead,
          alternate,
          image(`cuban_0_shiny_${suffix}.jpg`),
          image(`cuban_1_keep_${suffix}.jpg`),
        ],
        lead.image,
      ),
    ).toEqual([alternate]);
  });

  it('matches Shopify renditions while preserving distinct angles and colors', () => {
    const lead = image('cuban_0_shiny.jpg?v=1');
    const alternate = image('cuban_1_keep.jpg');
    const rose = image('rose-cuban_0_shiny.jpg');
    expect(
      remainingGalleryMedia(
        [image('cuban_0_shiny.jpg?v=2&width=800'), alternate, rose],
        lead.image,
      ),
    ).toEqual([alternate, rose]);
  });

  it('handles preview images and missing media without blank gallery slots', () => {
    const preview = {previewImage: {url: `${base}detail.jpg`}};
    expect(remainingGalleryMedia([{}, preview, preview])).toEqual([preview]);
    expect(remainingGalleryMedia([], null)).toEqual([]);
  });

  it('does not merge unrelated UUID filenames or external query-based images', () => {
    expect(galleryImageKey(`${base}detail_${suffix}.jpg`)).not.toBe(
      galleryImageKey(`${base}detail.jpg`),
    );
    expect(galleryImageKey('https://example.com/image?id=1')).not.toBe(
      galleryImageKey('https://example.com/image?id=2'),
    );
  });
});

import {altLength, selectedGalleryMedia} from './product-gallery';
const selected = {
  image: {url: `${base}white.jpg`},
  selectedOptions: [
    {name: 'Color', value: 'White Gold'},
    {name: 'Length', value: '18"'},
  ],
};
const yellow = {
  image: {url: `${base}yellow.jpg`},
  selectedOptions: [
    {name: 'Color', value: 'Yellow Gold'},
    {name: 'Length', value: '18"'},
  ],
};

describe('selectedGalleryMedia', () => {
  it('does not mount unassigned photos or other variant images on multicolor products', () => {
    const white = image('white.jpg');
    expect(
      selectedGalleryMedia(
        [white, image('yellow.jpg'), image('unknown.jpg')],
        selected,
        [selected, yellow],
        ['White Gold', 'Yellow Gold'],
      ),
    ).toEqual([white]);
  });

  it('switches visible images with the selected finish and retains explicit shared details', () => {
    const whiteDetail = {...image('white-detail.jpg'), alt: 'White Gold clasp'};
    const yellowDetail = {
      ...image('yellow-detail.jpg'),
      alt: 'Yellow Gold clasp',
    };
    const shared = {...image('packaging.jpg'), alt: '[shared] STYX packaging'};
    const media = [
      image('white.jpg'),
      image('yellow.jpg'),
      whiteDetail,
      yellowDetail,
      shared,
    ];
    expect(
      selectedGalleryMedia(
        media,
        yellow,
        [selected, yellow],
        ['White Gold', 'Yellow Gold'],
      ),
    ).toEqual([media[1], yellowDetail, shared]);
  });

  it('retains unlabeled alternates for products with only one finish', () => {
    const detail = image('detail.jpg');
    expect(
      selectedGalleryMedia([detail], selected, [selected], ['White Gold']),
    ).toEqual([detail]);
  });

  it('does not treat an image for another length as selected', () => {
    const longer = {
      ...selected,
      image: {url: `${base}longer.jpg`},
      selectedOptions: [
        {name: 'Color', value: 'White Gold'},
        {name: 'Length', value: '24"'},
      ],
    };
    expect(
      selectedGalleryMedia(
        [image('longer.jpg')],
        selected,
        [selected, longer],
        ['White Gold'],
      ),
    ).toEqual([]);
  });

  it('respects explicit color metadata even with a stale variant assignment', () => {
    const wrong = {...image('white.jpg'), alt: 'Yellow Gold chain'};
    expect(
      selectedGalleryMedia(
        [wrong],
        selected,
        [selected],
        ['White Gold', 'Yellow Gold'],
      ),
    ).toEqual([]);
  });

  it("shows only the selected length's photos, right after the cover", () => {
    const cover = {...image('white.jpg'), alt: 'Chain, White Gold, main'};
    const hung = {...image('hung.jpg'), alt: 'Chain, White Gold, hanging'};
    const scale16 = {
      ...image('w16.jpg'),
      alt: 'Chain, White Gold, 16 in, on the scale showing its real weight',
    };
    const scale18 = {
      ...image('w18.jpg'),
      alt: 'Chain, White Gold, 18 in, on the scale showing its real weight',
    };
    const clasp18 = {
      ...image('c18.jpg'),
      alt: 'Chain, White Gold, 18 in, clasp detail',
    };
    const yellow18 = {
      ...image('y18.jpg'),
      alt: 'Chain, Yellow Gold, 18 in, on the scale',
    };
    expect(
      selectedGalleryMedia(
        [cover, hung, scale16, scale18, clasp18, yellow18],
        selected,
        [selected, yellow],
        ['White Gold', 'Yellow Gold'],
      ),
    ).toEqual([cover, scale18, clasp18, hung]);
  });

  it('keeps shared views when the selected length has no photos of its own', () => {
    const cover = {...image('white.jpg'), alt: 'Chain, White Gold, main'};
    const hung = {...image('hung.jpg'), alt: 'Chain, White Gold, hanging'};
    const scale16 = {
      ...image('w16.jpg'),
      alt: 'Chain, White Gold, 16 in, on the scale',
    };
    expect(
      selectedGalleryMedia(
        [cover, hung, scale16],
        selected,
        [selected, yellow],
        ['White Gold', 'Yellow Gold'],
      ),
    ).toEqual([cover, hung]);
  });

  it('does not read millimetre widths in titles as lengths', () => {
    expect(
      altLength('10k gold 8.6mm cuban link chain, white gold, main'),
    ).toBeNull();
    expect(altLength('chain, yellow gold, 22 in, on the scale')).toBe(22);
    expect(altLength('chain 20" hanging')).toBe(20);
  });
});
