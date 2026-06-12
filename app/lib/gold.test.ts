import {describe, expect, it} from 'vitest';

import {KARAT_PURITY, computeGoldPrice} from '~/lib/gold';

// Troy ounce used by the implementation. spot = 3110.35 makes pure gold
// exactly $100/gram, which keeps the expected values easy to verify by hand.
const TROY_OZ_GRAMS = 31.1035;
const SPOT_100_PER_GRAM = 3110.35;

describe('KARAT_PURITY', () => {
  it('uses exact karat/24 fractions, not rounded decimals', () => {
    expect(KARAT_PURITY[10]).toBe(10 / 24);
    expect(KARAT_PURITY[14]).toBe(14 / 24);
    expect(KARAT_PURITY[18]).toBe(18 / 24);
    expect(KARAT_PURITY[22]).toBe(22 / 24);
    expect(KARAT_PURITY[24]).toBe(1.0);
  });

  it('18K is exactly 0.75 (the only fraction that is exact in decimal)', () => {
    expect(KARAT_PURITY[18]).toBe(0.75);
    // 10K must NOT be the commonly rounded 0.417
    expect(KARAT_PURITY[10]).not.toBe(0.417);
  });
});

describe('computeGoldPrice', () => {
  it('computes the full breakdown for 24K with known inputs', () => {
    // $100/g pure gold, 10g, 24K, default labor 280, default margin 0.55
    const b = computeGoldPrice({
      spotPerOz: SPOT_100_PER_GRAM,
      weight: 10,
      karat: 24,
    });

    expect(b.purity).toBe(1);
    expect(b.goldPerGram).toBe(100);
    expect(b.materialCost).toBe(1000);
    expect(b.laborCost).toBe(280);
    expect(b.margin).toBe(0.55);
    // retail = round((1000 + 280) * 1.55) = round(1984) = 1984
    expect(b.retailPrice).toBe(1984);
    // markup = 1984 / 1000 = 1.984 → rounded to 1 decimal = 2
    expect(b.markupMultiple).toBe(2);
  });

  it('defaults karat to 18 (0.75 purity)', () => {
    const b = computeGoldPrice({spotPerOz: SPOT_100_PER_GRAM, weight: 1});
    expect(b.karat).toBe(18);
    expect(b.purity).toBe(0.75);
    expect(b.goldPerGram).toBe(75);
  });

  it('falls back to 0.75 purity for unknown karats', () => {
    const b = computeGoldPrice({
      spotPerOz: SPOT_100_PER_GRAM,
      weight: 1,
      karat: 9,
    });
    expect(b.purity).toBe(0.75);
    expect(b.karat).toBe(9); // echoes the requested karat
  });

  it('respects custom labor and margin', () => {
    const b = computeGoldPrice({
      spotPerOz: SPOT_100_PER_GRAM,
      weight: 10,
      karat: 24,
      laborCost: 0,
      margin: 0,
    });
    // retail = round((1000 + 0) * 1) = 1000
    expect(b.retailPrice).toBe(1000);
    expect(b.markupMultiple).toBe(1);
  });

  it('rounds retailPrice to a whole dollar', () => {
    const b = computeGoldPrice({
      spotPerOz: SPOT_100_PER_GRAM,
      weight: 1.234,
      karat: 24,
    });
    expect(Number.isInteger(b.retailPrice)).toBe(true);
    expect(b.retailPrice).toBe(
      Math.round((100 * 1.234 + 280) * 1.55),
    );
  });

  it('handles zero weight: labor-only retail, markupMultiple 0', () => {
    const b = computeGoldPrice({
      spotPerOz: SPOT_100_PER_GRAM,
      weight: 0,
      karat: 24,
    });
    expect(b.materialCost).toBe(0);
    // retail = round((0 + 280) * 1.55) = round(434) = 434
    expect(b.retailPrice).toBe(434);
    // guarded against divide-by-zero
    expect(b.markupMultiple).toBe(0);
  });

  it('derives goldPerGram from spot / troy-oz × purity', () => {
    const spot = 4700; // current fallback spot in gold.server.ts
    const b = computeGoldPrice({spotPerOz: spot, weight: 1, karat: 10});
    const expected = +((spot / TROY_OZ_GRAMS) * (10 / 24)).toFixed(2);
    expect(b.goldPerGram).toBe(expected);
  });

  it('returns per-gram prices for every karat in KARAT_PURITY', () => {
    const b = computeGoldPrice({
      spotPerOz: SPOT_100_PER_GRAM,
      weight: 1,
      karat: 18,
    });
    expect(b.perGramByKarat).toEqual({
      10: +(100 * (10 / 24)).toFixed(2), // 41.67
      14: +(100 * (14 / 24)).toFixed(2), // 58.33
      18: 75,
      22: +(100 * (22 / 24)).toFixed(2), // 91.67
      24: 100,
    });
  });
});
