/**
 * Migrate ALL non-Cuban products to styxgold.myshopify.com
 * Reads pre-exported data from /tmp/styx-products-data.json and /tmp/styx-memberships.json
 *
 * - 6 lengths: 16", 18", 20", 22", 24", 26"
 * - 3 colors: Yellow Gold, White Gold, Rose Gold
 * - Pricing: weight(g) × vendor rate × 1.65
 * - Zero out variants where weight is unknown
 */

import { readFileSync } from 'fs';

const NEW_DOMAIN = 'styxgold.myshopify.com';
const NEW_TOKEN = 'process.env.SHOPIFY_ADMIN_TOKEN';

const VENDOR_RATE = { 10: 117.30, 14: 163.04, 18: 207.00 };
const MARKUP = 1.65;
const LENGTHS = ['16"', '18"', '20"', '22"', '24"', '26"'];
const COLORS = ['Yellow Gold', 'White Gold', 'Rose Gold'];

// Collections to create on new store (style-based + karat + color + catch-all)
const COLLECTIONS_TO_CREATE = [
  { handle: 'box', title: 'Box Chains', body: '<p>Shop Box Chains — solid gold box chains in 10K and 14K. Every piece priced transparently by weight. Free insured shipping.</p>' },
  { handle: 'cable', title: 'Cable Chains', body: '<p>Shop Cable Chains — solid gold cable chains in 10K and 14K. Every piece priced transparently by weight. Free insured shipping.</p>' },
  { handle: 'curb', title: 'Curb Chains', body: '<p>Shop Curb Chains — solid and hollow gold curb chains in 10K and 14K. Every piece priced transparently by weight. Free insured shipping.</p>' },
  { handle: 'figaro', title: 'Figaro Chains', body: '<p>Shop Figaro Chains — solid and hollow gold figaro chains in 10K and 14K. Every piece priced transparently by weight. Free insured shipping.</p>' },
  { handle: 'rolo', title: 'Rolo Chains', body: '<p>Shop Rolo Chains — solid gold rolo chains in 10K and 14K. Every piece priced transparently by weight. Free insured shipping.</p>' },
  { handle: 'rope', title: 'Rope Chains', body: '<p>Shop Rope Chains — solid and hollow gold rope chains in 10K and 14K. Every piece priced transparently by weight. Free insured shipping.</p>' },
  { handle: 'singapore', title: 'Singapore Chains', body: '<p>Shop Singapore Chains — solid gold singapore chains in 10K and 14K. Every piece priced transparently by weight. Free insured shipping.</p>' },
  { handle: 'wheat', title: 'Wheat Chains', body: '<p>Shop Wheat Chains — solid gold wheat chains in 10K and 14K. Every piece priced transparently by weight. Free insured shipping.</p>' },
  { handle: '10k-gold', title: '10K Gold Chains', body: '<p>Shop 10K Gold Chains — the most durable karat, priced transparently by weight. Free insured shipping.</p>' },
  { handle: '14k-gold', title: '14K Gold Chains', body: '<p>Shop 14K Gold Chains — the American standard for fine jewelry, priced transparently by weight. Free insured shipping.</p>' },
  { handle: 'chains', title: 'Chains', body: '<p>Shop all gold chains — solid and hollow, 10K and 14K. Every piece priced transparently by weight. Free insured shipping.</p>' },
  { handle: 'yellow-gold', title: 'Yellow Gold', body: '<p>Shop Yellow Gold chains. Classic warm gold in every style.</p>' },
  { handle: 'white-gold', title: 'White Gold', body: '<p>Shop White Gold chains. Cool, contemporary finish in every style.</p>' },
  { handle: 'rose-gold', title: 'Rose Gold', body: '<p>Shop Rose Gold chains. Warm copper-pink gold in every style.</p>' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function calcPrice(weightGrams, karat) {
  if (!weightGrams || weightGrams <= 0) return 0;
  const rate = VENDOR_RATE[karat] || VENDOR_RATE[10];
  return Math.round(weightGrams * rate * MARKUP * 100) / 100;
}

async function shopify(endpoint, method = 'GET', body = null) {
  const url = `https://${NEW_DOMAIN}/admin/api/2024-01/${endpoint}`;
  const opts = {
    method,
    headers: {
      'X-Shopify-Access-Token': NEW_TOKEN,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const limit = res.headers.get('X-Shopify-Shop-Api-Call-Limit');
  if (limit) {
    const [used, max] = limit.split('/').map(Number);
    if (used > max - 5) {
      await sleep(2000);
    }
  }
  if (res.status === 429) {
    console.log('  Rate limited, waiting 5s...');
    await sleep(5000);
    return shopify(endpoint, method, body);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${endpoint}: ${res.status} — ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function makeCleanHandle(product) {
  const k = product.karat;
  const c = product.construction.toLowerCase();
  const t = product.thickness.replace(/\s+/g, '');
  const style = product.type.toLowerCase().replace(/\s+chain$/,'').replace(/\s+/g, '-');
  return `${k}k-${c}-${t}-${style}`.replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-');
}

function makeSkuPrefix(product) {
  const styleMap = {
    'Box Chain': 'BOX', 'Cable Chain': 'CAB', 'Curb Chain': 'CRB',
    'Figaro Chain': 'FIG', 'Rolo Chain': 'ROL', 'Rope Chain': 'ROP',
    'Singapore Chain': 'SNG', 'Wheat Chain': 'WHT',
  };
  return `STX-${product.karat}K-${styleMap[product.type] || 'CHN'}`;
}

async function main() {
  // Load pre-exported data
  const products = JSON.parse(readFileSync('/tmp/styx-products-data.json', 'utf8'));
  const memberships = JSON.parse(readFileSync('/tmp/styx-memberships.json', 'utf8'));

  console.log(`=== Migrating ${products.length} products to styxgold ===\n`);

  // 1. Create all collections
  console.log('Creating collections...');
  const collectionIds = {};
  for (const c of COLLECTIONS_TO_CREATE) {
    try {
      const result = await shopify('custom_collections.json', 'POST', {
        custom_collection: {
          title: c.title,
          handle: c.handle,
          body_html: c.body,
          published: true,
          sort_order: 'price-asc',
        }
      });
      collectionIds[c.handle] = result.custom_collection.id;
      console.log(`  ${c.title}: ID ${collectionIds[c.handle]}`);
      await sleep(300);
    } catch (err) {
      console.error(`  ERROR creating ${c.title}: ${err.message}`);
    }
  }
  console.log('');

  // 2. Migrate each product
  let created = 0;
  let errors = 0;
  let totalPriced = 0;
  let totalZeroed = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    try {
      // Determine weights for each length
      // weightsByLength from old store has format like { '20" / Yellow Gold': 0.35, ... } or { '20"': 0.35 }
      // We need to normalize to just length keys
      const knownWeights = {};
      for (const [key, weight] of Object.entries(p.weightsByLength)) {
        // Handle keys like '20" / Yellow Gold' or just '20"'
        const lengthMatch = key.match(/^(\d+")[^"]*$/);
        if (lengthMatch) {
          const len = lengthMatch[1];
          if (!knownWeights[len] || weight > 0) {
            knownWeights[len] = weight;
          }
        }
      }

      // Also use base_weight if we have no per-length data
      if (Object.keys(knownWeights).length === 0 && p.base_weight > 0) {
        // Assign base_weight to 20" as default
        knownWeights['20"'] = p.base_weight;
      }

      // Build 18 variants
      const variants = [];
      let priced = 0;
      let zeroed = 0;
      for (const length of LENGTHS) {
        const weight = knownWeights[length] || 0;
        const price = calcPrice(weight, p.karat);
        for (const color of COLORS) {
          variants.push({
            option1: length,
            option2: color,
            price: price.toFixed(2),
            weight: weight,
            weight_unit: 'g',
            sku: weight > 0 ? `${makeSkuPrefix(p)}-${p.thickness}-${length.replace('"','')}` : '',
            inventory_management: 'shopify',
            inventory_policy: 'deny',
            requires_shipping: true,
            taxable: true,
          });
          if (price > 0) priced++; else zeroed++;
        }
      }

      const cleanHandle = makeCleanHandle(p);

      // Create product
      const result = await shopify('products.json', 'POST', {
        product: {
          title: p.title,
          handle: cleanHandle,
          body_html: p.body_html || '',
          vendor: 'STYX Gold',
          product_type: p.type,
          tags: p.tags,
          published: true,
          options: [
            { name: 'Length', values: LENGTHS },
            { name: 'Color', values: COLORS },
          ],
          variants,
          images: (p.images || []).map((img, idx) => ({
            src: img.src,
            position: idx + 1,
            alt: img.alt || p.title,
          })),
        },
      });

      const newProductId = result.product.id;
      totalPriced += priced;
      totalZeroed += zeroed;
      await sleep(500);

      // Add metafields
      const metafields = [
        { namespace: 'chain', key: 'construction', value: p.construction, type: 'single_line_text_field' },
        { namespace: 'chain', key: 'thickness', value: p.thickness, type: 'single_line_text_field' },
        { namespace: 'chain', key: 'chain_style', value: p.chain_style, type: 'single_line_text_field' },
        { namespace: 'global', key: 'title_tag', value: p.title_tag, type: 'single_line_text_field' },
        { namespace: 'global', key: 'description_tag', value: p.description_tag, type: 'multi_line_text_field' },
      ].filter(m => m.value);

      for (const mf of metafields) {
        await shopify(`products/${newProductId}/metafields.json`, 'POST', { metafield: mf });
        await sleep(200);
      }

      // Add to collections based on old memberships
      const oldCollections = memberships[String(p.id)] || [];
      for (const handle of oldCollections) {
        if (collectionIds[handle]) {
          try {
            await shopify('collects.json', 'POST', {
              collect: { product_id: newProductId, collection_id: collectionIds[handle] },
            });
            await sleep(200);
          } catch (e) {
            // Collection might not exist or duplicate, skip
          }
        }
      }

      created++;
      console.log(`[${created}/${products.length}] ${p.title} — ${cleanHandle} — priced: ${priced}, zeroed: ${zeroed}, collections: ${oldCollections.length}`);

    } catch (err) {
      errors++;
      console.error(`ERROR [${p.title}]: ${err.message}`);
      await sleep(2000);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Created: ${created} products`);
  console.log(`Errors: ${errors}`);
  console.log(`Total priced variants: ${totalPriced}`);
  console.log(`Total zeroed variants (need weights): ${totalZeroed}`);
}

main().catch(console.error);
