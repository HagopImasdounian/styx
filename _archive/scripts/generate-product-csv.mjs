#!/usr/bin/env node
/**
 * Generate a Shopify-compatible product CSV for all Styx Gold chain products.
 *
 * Each chain type × thickness = one product.
 * Variants: Color (Yellow/Rose/White Gold) × Karat (14k/18k) × Length (18"/20"/22"/24")
 * = 24 variants per product.
 *
 * Usage:  node scripts/generate-product-csv.mjs
 * Output: scripts/shopify-products.csv  (import via Shopify Admin > Products > Import)
 */

import {writeFileSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Chain catalog ──────────────────────────────────────────────

const CHAINS = [
  // Classic Curb Weaves
  {name: 'Cuban Link Chain', density: 1.8, labor: 320, thicknesses: [3,4,5,6,7,8,10,12], group: 'classic-curb'},
  {name: 'Curb Chain', density: 1.4, labor: 240, thicknesses: [2,3,4,5,6,7], group: 'classic-curb'},
  {name: 'Figaro Chain', density: 1.3, labor: 260, thicknesses: [2,3,4,5,6,7], group: 'classic-curb'},
  {name: 'Franco Chain', density: 1.5, labor: 300, thicknesses: [2,2.5,3,4,5], group: 'classic-curb'},
  {name: 'Mariner Chain', density: 1.2, labor: 250, thicknesses: [3,4,5,6,7], group: 'classic-curb'},
  {name: 'Gucci Link', density: 1.6, labor: 340, thicknesses: [4,5,6], group: 'classic-curb'},
  {name: 'Panther Link', density: 1.7, labor: 380, thicknesses: [5,6,7,8], group: 'classic-curb'},

  // Woven & Braided
  {name: 'Rope Chain', density: 1.1, labor: 280, thicknesses: [1.5,2,2.5,3,4,5,6], group: 'woven-braided'},
  {name: 'Wheat Chain', density: 0.9, labor: 260, thicknesses: [1.5,2,2.5,3,4], group: 'woven-braided'},
  {name: 'Byzantine Chain', density: 1.4, labor: 360, thicknesses: [3,4,5,6], group: 'woven-braided'},
  {name: 'Foxtail Chain', density: 1.0, labor: 300, thicknesses: [2,3,4], group: 'woven-braided'},
  {name: 'Bismark Chain', density: 1.5, labor: 340, thicknesses: [4,5,6,7], group: 'woven-braided'},
  {name: 'San Marco Chain', density: 1.6, labor: 380, thicknesses: [5,6,7,8], group: 'woven-braided'},
  {name: 'Criss-Cross Chain', density: 0.7, labor: 220, thicknesses: [1.5,2,3], group: 'woven-braided'},
  {name: 'Forsantina Chain', density: 0.8, labor: 240, thicknesses: [2,3,4], group: 'woven-braided'},
  {name: 'Tinsel Chain', density: 0.5, labor: 200, thicknesses: [1,1.5,2], group: 'woven-braided'},

  // Round & Rolling
  {name: 'Rolo Chain', density: 0.9, labor: 220, thicknesses: [2,3,4,5], group: 'round-rolling'},
  {name: 'Cable Chain', density: 0.5, labor: 180, thicknesses: [1,1.5,2,3,4], group: 'round-rolling'},
  {name: 'Ball Chain', density: 1.0, labor: 200, thicknesses: [1.5,2,3,4,5], group: 'round-rolling'},
  {name: 'Popcorn Chain', density: 0.8, labor: 220, thicknesses: [2,3,4], group: 'round-rolling'},
  {name: 'Singapore Chain', density: 0.6, labor: 200, thicknesses: [1,1.5,2,3], group: 'round-rolling'},
  {name: 'Satellite Chain', density: 0.5, labor: 210, thicknesses: [1,1.5,2], group: 'round-rolling'},
  {name: 'Rosary Chain', density: 0.7, labor: 240, thicknesses: [2,3,4], group: 'round-rolling'},

  // Flat & Architectural
  {name: 'Herringbone Chain', density: 1.3, labor: 280, thicknesses: [2,3,4,5,6], group: 'flat-architectural'},
  {name: 'Snake Chain', density: 0.9, labor: 240, thicknesses: [1,1.5,2,3,4], group: 'flat-architectural'},
  {name: 'Omega Chain', density: 1.4, labor: 320, thicknesses: [4,6,8], group: 'flat-architectural'},
  {name: 'Box Chain', density: 0.7, labor: 200, thicknesses: [1,1.5,2,2.5,3,4], group: 'flat-architectural'},
  {name: 'Mesh Chain', density: 1.1, labor: 300, thicknesses: [3,4,5], group: 'flat-architectural'},
  {name: 'Mirror Chain', density: 1.0, labor: 260, thicknesses: [2,3,4,5], group: 'flat-architectural'},
  {name: 'Cobra Chain', density: 1.2, labor: 300, thicknesses: [3,4,5], group: 'flat-architectural'},
  {name: 'Bar Chain', density: 0.6, labor: 220, thicknesses: [2,3], group: 'flat-architectural'},
  {name: 'Ladder Chain', density: 0.8, labor: 260, thicknesses: [3,4,5], group: 'flat-architectural'},
  {name: 'Paperclip Chain', density: 0.6, labor: 200, thicknesses: [3,4,5], group: 'flat-architectural'},

  // Figural & Decorative
  {name: 'Heart Chain', density: 0.8, labor: 280, thicknesses: [3,4,5], group: 'figural-decorative'},
  {name: 'Tulip Chain', density: 0.7, labor: 260, thicknesses: [3,4], group: 'figural-decorative'},
  {name: 'Peanut Chain', density: 0.9, labor: 240, thicknesses: [3,4,5], group: 'figural-decorative'},
  {name: 'Valentino Chain', density: 0.7, labor: 260, thicknesses: [2,3,4], group: 'figural-decorative'},
  {name: 'Scroll Chain', density: 0.8, labor: 280, thicknesses: [3,4,5], group: 'figural-decorative'},
  {name: 'S-Link Chain', density: 0.7, labor: 240, thicknesses: [3,4,5], group: 'figural-decorative'},
  {name: 'Tennis Chain', density: 1.3, labor: 400, thicknesses: [3,4,5], group: 'figural-decorative'},
];

const COLORS = ['Yellow Gold', 'Rose Gold', 'White Gold'];
const KARATS = ['14k', '18k'];
const LENGTHS = ['18"', '20"', '22"', '24"'];

const COLOR_HANDLES = {
  'Yellow Gold': 'yellow-gold',
  'Rose Gold': 'rose-gold',
  'White Gold': 'white-gold',
};

const KARAT_PURITY = {'14k': 0.585, '18k': 0.75};
const SPOT_PER_OZ = 2420; // current approximate gold spot
const SPOT_PER_GRAM = SPOT_PER_OZ / 31.1035;
const MARGIN = 0.55;

// ─── Weight calculation ─────────────────────────────────────────

function computeWeight(density, thicknessMm, lengthInches) {
  // Empirical formula: density × thickness^1.5 × length_factor
  const lengthFactor = lengthInches / 20;
  return Math.round(density * Math.pow(thicknessMm, 1.5) * lengthFactor * 10) / 10;
}

function computePrice(weightGrams, karat, laborBase) {
  const purity = KARAT_PURITY[karat];
  const goldCost = weightGrams * SPOT_PER_GRAM * purity;
  const labor = laborBase;
  const retail = (goldCost + labor) * (1 + MARGIN);
  return Math.round(retail / 5) * 5; // round to nearest $5
}

function lengthToInches(len) {
  return parseInt(len.replace('"', ''), 10);
}

// ─── Handle / SKU generation ────────────────────────────────────

function toHandle(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function thicknessLabel(mm) {
  return mm % 1 === 0 ? `${mm}mm` : `${mm}mm`;
}

// ─── Chain blurbs for product descriptions ──────────────────────

const BLURBS = {
  'Cuban Link Chain': 'The heavyweight. Interlocking flat links originally forged in the streets of Miami.',
  'Curb Chain': 'Twisted flat links that lie perfectly against the chest. The foundation of every chain collection.',
  'Figaro Chain': 'An Italian classic — alternating short and long links in a rhythmic pattern.',
  'Franco Chain': 'Four-sided V-shaped links woven into a square profile. Invented in Italy, perfected in New York.',
  'Mariner Chain': 'Oval links with a bar through the center, inspired by anchor chains of the Mediterranean.',
  'Gucci Link': 'Interlocking G-shaped links. Bold, geometric, unmistakable.',
  'Panther Link': 'Wide, flat, articulated links that drape like armor. The heaviest flat chain in the archive.',
  'Rope Chain': 'Two strands of metal twisted together into a spiral that catches light from every angle.',
  'Wheat Chain': 'Four strands of oval links braided into a teardrop cross-section. Also known as spiga.',
  'Byzantine Chain': 'An ancient weave of interlocking rings dating to the Eastern Roman Empire.',
  'Foxtail Chain': 'Pairs of flat links woven at 45-degree angles. Smooth to the touch, complex to the eye.',
  'Bismark Chain': 'Interlocking links in a herringbone-like pattern. Russian origin, serious weight.',
  'San Marco Chain': 'Wide hollow links with a satin finish. Named for the piazza.',
  'Criss-Cross Chain': 'Thin links crossing over each other in an X pattern. Delicate, modern.',
  'Forsantina Chain': 'Flat, hammered oval links connected at right angles. An artisan favorite.',
  'Tinsel Chain': 'Ultra-fine strands grouped into a glittering ribbon. The lightest chain we make.',
  'Rolo Chain': 'Symmetrical round links. Simple, strong, and endlessly versatile.',
  'Cable Chain': 'The most fundamental chain — uniform oval links connected one to the next.',
  'Ball Chain': 'Spherical beads connected by short rods. Industrial origin, luxurious in gold.',
  'Popcorn Chain': 'Hollow textured links that look like kernels of popcorn. Lightweight with serious volume.',
  'Singapore Chain': 'Twisted curb links that form a flat, braided ribbon. Catches light like nothing else.',
  'Satellite Chain': 'A thin cable chain dotted with small beads at regular intervals.',
  'Rosary Chain': 'Beads separated by chain segments. Originally devotional, now purely decorative.',
  'Herringbone Chain': 'Flat V-shaped links layered into a liquid-smooth ribbon. Handle with reverence.',
  'Snake Chain': 'Tightly fitted rings forming a smooth, flexible tube. No visible links.',
  'Omega Chain': 'A rigid collar of interlocking plates on a mesh backing. The most architectural chain.',
  'Box Chain': 'Square links connected at right angles. Clean, geometric, modern.',
  'Mesh Chain': 'Woven sheets of fine wire forming a flexible metal fabric.',
  'Mirror Chain': 'Flat, diamond-cut links that act as tiny mirrors. Maximum sparkle per gram.',
  'Cobra Chain': 'A close-fitting flat chain with a serpentine flex. Named for the way it moves.',
  'Bar Chain': 'Thin bars connected by small links. Minimalist, architectural.',
  'Ladder Chain': 'Two parallel strands connected by cross-bars. Structured and geometric.',
  'Paperclip Chain': 'Elongated oval links inspired by the office staple. The modern classic.',
  'Heart Chain': 'Heart-shaped links connected in series. Romantic without being precious.',
  'Tulip Chain': 'Petal-shaped links cupping into each other. Dutch origin.',
  'Peanut Chain': 'Figure-eight links pinched in the middle. Textural and distinctive.',
  'Valentino Chain': 'Flat, diamond-shaped links with pyramid-cut facets.',
  'Scroll Chain': 'S-curved links creating a flowing, script-like pattern.',
  'S-Link Chain': 'S-shaped links connected end to end. Organic, flowing.',
  'Tennis Chain': 'A continuous line of individually set stones. The red carpet standard.',
};

// ─── CSV generation ─────────────────────────────────────────────

const HEADERS = [
  'Handle','Title','Body (HTML)','Vendor','Product Category','Type','Tags',
  'Published','Option1 Name','Option1 Value','Option2 Name','Option2 Value',
  'Option3 Name','Option3 Value','Variant SKU','Variant Grams',
  'Variant Inventory Tracker','Variant Inventory Qty',
  'Variant Inventory Policy','Variant Fulfillment Service','Variant Price',
  'Variant Compare At Price','Variant Requires Shipping','Variant Taxable',
  'Image Src','Image Position','Image Alt Text',
  'SEO Title','SEO Description','Variant Weight Unit','Status',
];

function escapeCSV(val) {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const rows = [HEADERS.map(escapeCSV).join(',')];
let productCount = 0;
let variantCount = 0;

for (const chain of CHAINS) {
  for (const thickness of chain.thicknesses) {
    const tLabel = thicknessLabel(thickness);
    const title = `${chain.name} ${tLabel}`;
    const handle = toHandle(title);
    const chainHandle = toHandle(chain.name);

    const blurb = BLURBS[chain.name] || '';
    const body = `<p>${blurb}</p><p>Solid gold. ${tLabel} width. Cast and finished by hand in New York City.</p>`;

    // Build tags for automated collections
    const tags = [
      'chain',
      chainHandle,
      chain.group,
      `thickness-${tLabel}`,
      // Add individual color and karat tags so automated collections can match
      ...COLORS.map(c => COLOR_HANDLES[c]),
      ...KARATS.map(k => k),
    ].join(', ');

    const seoTitle = `${title} | Solid Gold | Styx Gold`;
    const seoDesc = `${blurb} Available in Yellow, Rose & White Gold. 14k and 18k. Free shipping over $800.`;

    let isFirstRow = true;

    for (const color of COLORS) {
      for (const karat of KARATS) {
        for (const length of LENGTHS) {
          const inches = lengthToInches(length);
          const weight = computeWeight(chain.density, thickness, inches);
          const price = computePrice(weight, karat, chain.labor);
          const sku = `${chainHandle}-${tLabel}-${COLOR_HANDLES[color]}-${karat}-${inches}in`
            .replace(/\./g, '-');

          const row = {
            Handle: handle,
            Title: isFirstRow ? title : '',
            'Body (HTML)': isFirstRow ? body : '',
            Vendor: isFirstRow ? 'Styx Gold' : '',
            'Product Category': isFirstRow ? 'Apparel & Accessories > Jewelry > Necklaces' : '',
            Type: isFirstRow ? 'Chain' : '',
            Tags: isFirstRow ? tags : '',
            Published: isFirstRow ? 'TRUE' : '',
            'Option1 Name': 'Color',
            'Option1 Value': color,
            'Option2 Name': 'Karat',
            'Option2 Value': karat,
            'Option3 Name': 'Length',
            'Option3 Value': length,
            'Variant SKU': sku,
            'Variant Grams': Math.round(weight),
            'Variant Inventory Tracker': 'shopify',
            'Variant Inventory Qty': 10,
            'Variant Inventory Policy': 'deny',
            'Variant Fulfillment Service': 'manual',
            'Variant Price': price.toFixed(2),
            'Variant Compare At Price': '',
            'Variant Requires Shipping': 'TRUE',
            'Variant Taxable': 'TRUE',
            'Image Src': '',
            'Image Position': '',
            'Image Alt Text': '',
            'SEO Title': isFirstRow ? seoTitle : '',
            'SEO Description': isFirstRow ? seoDesc : '',
            'Variant Weight Unit': 'g',
            Status: isFirstRow ? 'active' : '',
          };

          rows.push(HEADERS.map(h => escapeCSV(row[h])).join(','));
          isFirstRow = false;
          variantCount++;
        }
      }
    }
    productCount++;
  }
}

const outPath = join(__dirname, 'shopify-products.csv');
writeFileSync(outPath, rows.join('\n'), 'utf-8');

console.log(`Generated ${outPath}`);
console.log(`  ${productCount} products`);
console.log(`  ${variantCount} total variants`);
console.log(`  ${CHAINS.length} chain types`);
console.log(`\nImport via: Shopify Admin > Products > Import`);
console.log(`\nAfter import, create automated collections with tag conditions:`);
console.log(`  - "cuban-link-chain" tag → Cuban Link collection`);
console.log(`  - "yellow-gold" tag → Yellow Gold collection`);
console.log(`  - "thickness-5mm" tag → 5mm Thickness collection`);
console.log(`  - "14k" tag → 14k Gold collection`);
console.log(`  - etc.`);
