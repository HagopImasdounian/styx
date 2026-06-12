import {describe, expect, it} from 'vitest';

import {
  compareKey,
  encodeCompareItems,
  parseCompareItems,
  type CompareItem,
} from '~/context/CompareContext';

describe('compareKey', () => {
  it('is the bare handle when no length is given', () => {
    expect(compareKey('cuban-link-10k')).toBe('cuban-link-10k');
    expect(compareKey('cuban-link-10k', null)).toBe('cuban-link-10k');
    expect(compareKey('cuban-link-10k', undefined)).toBe('cuban-link-10k');
  });

  it('appends ::length when a length is given', () => {
    expect(compareKey('cuban-link-10k', '18"')).toBe('cuban-link-10k::18"');
  });

  it('distinguishes lengths of the same product but not no-length entries', () => {
    expect(compareKey('h', '16"')).not.toBe(compareKey('h', '18"'));
    expect(compareKey('h')).toBe(compareKey('h', null));
  });
});

describe('encodeCompareItems / parseCompareItems', () => {
  it('round-trips items with and without lengths', () => {
    const items: CompareItem[] = [
      {handle: 'cuban-link-10k', length: '18"'},
      {handle: 'rope-chain-14k', length: null},
      {handle: 'box-chain', length: '24"'},
    ];
    expect(parseCompareItems(encodeCompareItems(items))).toEqual(items);
  });

  it('encodes lengths URI-escaped after a ~ separator', () => {
    expect(
      encodeCompareItems([{handle: 'cuban-link-10k', length: '18"'}]),
    ).toBe('cuban-link-10k~18%22');
  });

  it('encodes length-less items as the bare handle', () => {
    expect(encodeCompareItems([{handle: 'rope-chain', length: null}])).toBe(
      'rope-chain',
    );
  });

  it('parses legacy plain-handle params (pre-variant format) as null lengths', () => {
    expect(parseCompareItems('a,b,c')).toEqual([
      {handle: 'a', length: null},
      {handle: 'b', length: null},
      {handle: 'c', length: null},
    ]);
  });

  it('ignores empty tokens and trims whitespace', () => {
    expect(parseCompareItems(' a , ,, b~16%22 ,')).toEqual([
      {handle: 'a', length: null},
      {handle: 'b', length: '16"'},
    ]);
  });

  it('returns [] for an empty param', () => {
    expect(parseCompareItems('')).toEqual([]);
  });

  it('caps parsed items at the 4-item compare limit', () => {
    const parsed = parseCompareItems('a,b,c,d,e,f');
    expect(parsed).toHaveLength(4);
    expect(parsed.map((i) => i.handle)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('splits on the FIRST ~ so lengths containing ~ survive a round trip', () => {
    const items: CompareItem[] = [{handle: 'h', length: '16~18'}];
    expect(parseCompareItems(encodeCompareItems(items))).toEqual(items);
  });
});
