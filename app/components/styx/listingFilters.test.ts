import {describe, expect, it} from 'vitest';
import {
  activeFacetChips,
  applyFacets,
  cardLengths,
  cardMinPrice,
  countActive,
  emptySelection,
  explodeByColor,
  facetCounts,
  facetOptions,
  parseFacetSelection,
  parseInches,
  priceBucketValue,
  toggleFacetValue,
  writeFacetSelection,
} from './listingFilters';

const variant = (opts: Record<string, string>, price: string) => ({
  id: `v-${Object.values(opts).join('-')}`,
  price: {amount: price, currencyCode: 'USD'},
  availableForSale: true,
  selectedOptions: Object.entries(opts).map(([name, value]) => ({name, value})),
});

const product = (
  id: string,
  title: string,
  variants: any[],
  construction?: string,
) => ({
  id,
  title,
  chain_construction: construction ? {value: construction} : null,
  variants: {nodes: variants},
});

// Two-color 14K 3mm curb, 18"/20"/22", $600+
const curb14 = product(
  'p1',
  '14K Gold 3mm Solid Curb Chain',
  [
    variant({Color: 'Yellow Gold', Length: '18"'}, '600.00'),
    variant({Color: 'Yellow Gold', Length: '20"'}, '700.00'),
    variant({Color: 'Yellow Gold', Length: '22"'}, '800.00'),
    variant({Color: 'White Gold', Length: '18"'}, '650.00'),
    variant({Color: 'White Gold', Length: '22"'}, '850.00'),
  ],
  'solid',
);
// Single-color 10K hollow 6mm curb, 20"/24", $1,600+
const curb10 = product('p2', '10K Gold 6mm Hollow Curb Chain', [
  variant({Length: '20"'}, '1600.00'),
  variant({Length: '24"'}, '2100.00'),
]);
// 10K 3mm curb bracelet, 8.5", $300 (has a $0 catalog-error variant)
const bracelet = product('p3', '10K Gold 3mm Curb Bracelet', [
  variant({Length: '7.5"'}, '0.00'),
  variant({Length: '8.5"'}, '300.00'),
]);

const cards = explodeByColor([curb14, curb10, bracelet]);

describe('explodeByColor', () => {
  it('makes one card per color and one for colorless products', () => {
    expect(cards.map((c) => c.key)).toEqual(['p1-Yellow Gold', 'p1-White Gold', 'p2', 'p3']);
  });
});

describe('card readers', () => {
  it('parses inches from Length option values', () => {
    expect(parseInches('18"')).toBe(18);
    expect(parseInches('8.5"')).toBe(8.5);
    expect(parseInches('20 in')).toBe(20);
    expect(parseInches(null)).toBeNull();
  });
  it('lists lengths for the card color only', () => {
    expect(cardLengths(cards[0])).toEqual(['18', '20', '22']);
    expect(cardLengths(cards[1])).toEqual(['18', '22']);
  });
  it('prices from the lowest positive variant of the card color', () => {
    expect(cardMinPrice(cards[0])).toBe(600);
    expect(cardMinPrice(cards[1])).toBe(650);
    expect(cardMinPrice(cards[3])).toBe(300);
  });
  it('buckets prices', () => {
    expect(priceBucketValue(300)).toBe('under-500');
    expect(priceBucketValue(500)).toBe('500-1500');
    expect(priceBucketValue(1600)).toBe('1500-5000');
    expect(priceBucketValue(9000)).toBe('5000-plus');
    expect(priceBucketValue(null)).toBeNull();
  });
});

describe('facetOptions', () => {
  it('returns present values in display order', () => {
    const o = facetOptions(cards);
    expect(o.type.map((x) => x.label)).toEqual(['Necklaces', 'Bracelets']);
    expect(o.color.map((x) => x.value)).toEqual(['White Gold', 'Yellow Gold']);
    expect(o.karat.map((x) => x.value)).toEqual(['10K', '14K']);
    expect(o.width.map((x) => x.value)).toEqual(['3–5mm', '5–8mm']);
    expect(o.length.map((x) => x.label)).toEqual(['8.5"', '18"', '20"', '22"', '24"']);
    expect(o.price.map((x) => x.value)).toEqual(['under-500', '500-1500', '1500-5000']);
    expect(o.construction.map((x) => x.value)).toEqual(['Hollow', 'Solid']);
  });
});

describe('applyFacets', () => {
  it('is AND across facets, OR within a facet', () => {
    const sel = {...emptySelection(), length: ['20', '24']};
    expect(applyFacets(cards, sel).map((c) => c.key)).toEqual(['p1-Yellow Gold', 'p2']);
    const sel2 = {...sel, karat: ['10K']};
    expect(applyFacets(cards, sel2).map((c) => c.key)).toEqual(['p2']);
  });
  it('returns everything for an empty selection', () => {
    expect(applyFacets(cards, emptySelection())).toHaveLength(4);
  });
});

describe('facetCounts', () => {
  it('counts each value against the other facets only', () => {
    const options = facetOptions(cards);
    const sel = {...emptySelection(), karat: ['10K']};
    const counts = facetCounts(cards, options, sel);
    // Karat counts ignore the karat selection itself
    expect(counts.karat).toEqual({'10K': 2, '14K': 2});
    // Other facets are narrowed to 10K cards (p2 + bracelet)
    expect(counts.type).toEqual({Necklace: 1, Bracelet: 1});
    expect(counts.length).toEqual({'8.5': 1, '18': 0, '20': 1, '22': 0, '24': 1});
    expect(counts.price).toEqual({'under-500': 1, '500-1500': 0, '1500-5000': 1});
  });
});

describe('URL round trip', () => {
  it('parses comma-separated multi-values', () => {
    const p = new URLSearchParams('type=Bracelet&length=18,20&price=500-1500');
    const sel = parseFacetSelection(p);
    expect(sel.type).toEqual(['Bracelet']);
    expect(sel.length).toEqual(['18', '20']);
    expect(sel.price).toEqual(['500-1500']);
    expect(countActive(sel)).toBe(4);
  });
  it('writes and re-reads the same selection', () => {
    const sel = {...emptySelection(), color: ['Yellow Gold', 'White Gold'], width: ['2–3mm']};
    const p = writeFacetSelection(new URLSearchParams('sort=newest&cursor=abc'), sel);
    expect(p.get('sort')).toBe('newest');
    expect(p.has('cursor')).toBe(false);
    expect(parseFacetSelection(p)).toEqual(sel);
  });
  it('handles a metal collection preset color', () => {
    const preset = 'White Gold';
    expect(parseFacetSelection(new URLSearchParams(''), preset).color).toEqual([preset]);
    expect(parseFacetSelection(new URLSearchParams('color=all'), preset).color).toEqual([]);
    const cleared = writeFacetSelection(new URLSearchParams(), emptySelection(), preset);
    expect(cleared.get('color')).toBe('all');
    const same = writeFacetSelection(new URLSearchParams(), {...emptySelection(), color: [preset]}, preset);
    expect(same.has('color')).toBe(false);
  });
});

describe('toggleFacetValue / activeFacetChips', () => {
  it('adds then removes a value', () => {
    const a = toggleFacetValue(emptySelection(), 'karat', '14K');
    expect(a.karat).toEqual(['14K']);
    const b = toggleFacetValue(a, 'karat', '14K');
    expect(b.karat).toEqual([]);
  });
  it('lists chips with human labels', () => {
    const sel = {...emptySelection(), type: ['Bracelet'], length: ['18'], price: ['5000-plus']};
    expect(activeFacetChips(sel).map((c) => c.label)).toEqual(['Bracelets', '18"', '$5,000+']);
  });
});
