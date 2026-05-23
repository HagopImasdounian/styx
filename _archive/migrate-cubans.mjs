/**
 * Migrate Cuban Link products to styxgold.myshopify.com
 *
 * - 6 lengths: 16", 18", 20", 22", 24", 26"
 * - 3 colors: Yellow Gold, White Gold, Rose Gold
 * - Pricing: weight(g) × vendor rate × 1.65
 * - Zero out variants where weight is unknown
 */

const OLD_DOMAIN = 'styx-onnsz4sk.myshopify.com';
const OLD_TOKEN = 'process.env.SHOPIFY_ADMIN_TOKEN';
const NEW_DOMAIN = 'styxgold.myshopify.com';
const NEW_TOKEN = 'process.env.SHOPIFY_ADMIN_TOKEN';

const VENDOR_RATE = { 10: 117.30, 14: 163.04, 18: 207.00 };
const MARKUP = 1.65;
const LENGTHS = ['16"', '18"', '20"', '22"', '24"', '26"'];
const COLORS = ['Yellow Gold', 'White Gold', 'Rose Gold'];

// Known weights from Shiny Jewellers (keyed by old product handle)
// Format: { "length": weightInGrams } — only lengths with real data
const KNOWN_WEIGHTS = {
  // 10K 5.3mm Cuban - has per-length weights
  '10k-5-3-mm-miami-cuban-link-chain': { '20"': 57, '22"': 47, '24"': 51, '26"': 57 },
  // 10K 6.4mm Cuban - base weight 57g at 20"
  '6mm-miami-cuban-link-chain-20-inch-10-karat': { '20"': 57 },
  // 10K 7.6mm Cuban - base weight 74g at 20"
  '7mm-miami-cuban-link-chain-20-inch-10-karat': { '20"': 74 },
  // 10K 8.6mm Cuban - base weight 96g at 20"
  '8mm-miami-cuban-link-chain-20-inch-10-karat': { '20"': 96 },
  // 10K 10.7mm Cuban - base weight 143g (variations show 22-26)
  '10mm-miami-cuban-link-chain-20-inch-10-karat': { '22"': 143 },
  // 10K 13mm Cuban - base weight 245g (variations show 22-24)
  '13mm-miami-cuban-link-chain-20-inch-10-karat': { '22"': 245 },
  // 14K 5.3mm Cuban - base weight 204g at 20"
  '10mm-miami-cuban-link-chain-26-inch-14-karat': { '20"': 204 },
  // 14K 6.4mm Cuban - base weight 63g at 20"
  '6mm-miami-cuban-link-chain-20-inch-14-karat': { '20"': 63 },
  // 14K 8.3mm Cuban - base weight 102g at 20"
  '8mm-miami-cuban-link-chain-20-inch-14-karat': { '20"': 102 },
  // 14K 10.7mm Cuban - base weight 157g at 20"
  '10mm-miami-cuban-link-chain-20-inch-14-karat': { '20"': 157 },
  // 10K 6.4mm Hollow Cuban - 18.7g at 20"
  '10k-hollow-italian-chains-cuban-22': { '20"': 18.7 },
  // 10K 7.3mm Hollow Cuban - 18.7g at 22"
  '10k-hollow-italian-chains-cuban-22-2': { '22"': 18.7 },
  // 10K 8.6mm Hollow Cuban - 18.7g at 20"
  '10k-hollow-italian-chains-cuban': { '20"': 18.7 },
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function calcPrice(weightGrams, karat) {
  if (!weightGrams || weightGrams <= 0) return 0;
  const rate = VENDOR_RATE[karat] || VENDOR_RATE[10];
  return Math.round(weightGrams * rate * MARKUP * 100) / 100;
}

async function shopifyRequest(domain, token, endpoint, method = 'GET', body = null) {
  const url = `https://${domain}/admin/api/2024-01/${endpoint}`;
  const opts = {
    method,
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);

  // Rate limit handling
  const limit = res.headers.get('X-Shopify-Shop-Api-Call-Limit');
  if (limit) {
    const [used, max] = limit.split('/').map(Number);
    if (used > max - 4) {
      console.log('  (rate limit pause)');
      await sleep(1000);
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${endpoint}: ${res.status} — ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function main() {
  console.log('=== Migrating Cuban Links to styxgold ===\n');

  // 1. Get Cuban collection products from old store
  const collectionProducts = await shopifyRequest(
    OLD_DOMAIN, OLD_TOKEN,
    'collections/310570254422/products.json?limit=250&fields=id,title,handle'
  );
  const productIds = collectionProducts.products.map(p => ({ id: p.id, title: p.title, handle: p.handle }));
  console.log(`Found ${productIds.length} Cuban products on old store\n`);

  // 2. Create Cuban Links collection on new store
  console.log('Creating Cuban Links collection...');
  const newCollection = await shopifyRequest(NEW_DOMAIN, NEW_TOKEN, 'custom_collections.json', 'POST', {
    custom_collection: {
      title: 'Cuban Links',
      handle: 'cuban',
      body_html: '<p>Shop Cuban Links — solid and hollow gold chains in 10K and 14K. Every piece priced transparently by weight. Free insured shipping.</p>',
      published: true,
      sort_order: 'price-asc',
    }
  });
  const collectionId = newCollection.custom_collection.id;
  console.log(`  Collection created: ID ${collectionId}\n`);
  await sleep(500);

  // 3. Migrate each product
  let created = 0;
  let errors = 0;

  for (const { id, title, handle } of productIds) {
    try {
      console.log(`\n--- ${title} (${handle}) ---`);

      // Fetch full product from old store
      const { product: oldProduct } = await shopifyRequest(OLD_DOMAIN, OLD_TOKEN, `products/${id}.json`);
      await sleep(200);

      // Fetch metafields from old store
      const { metafields } = await shopifyRequest(OLD_DOMAIN, OLD_TOKEN, `products/${id}/metafields.json`);
      await sleep(200);

      const mfMap = {};
      for (const m of metafields) {
        mfMap[`${m.namespace}.${m.key}`] = m.value;
      }

      const karat = parseInt(mfMap['chain.karat']) || 10;
      const thickness = mfMap['chain.thickness'] || '';
      const construction = mfMap['chain.construction'] || 'Solid';
      const chainStyle = mfMap['chain.chain_style'] || 'Cuban Link';
      const titleTag = mfMap['global.title_tag'] || '';
      const descTag = mfMap['global.description_tag'] || '';

      // Get known weights for this product
      const weights = KNOWN_WEIGHTS[handle] || {};

      // Build variants: 6 lengths × 3 colors
      const variants = [];
      for (const length of LENGTHS) {
        const weight = weights[length] || 0;
        const price = calcPrice(weight, karat);
        for (const color of COLORS) {
          variants.push({
            option1: length,
            option2: color,
            price: price.toFixed(2),
            weight: weight,
            weight_unit: 'g',
            sku: weight > 0 ? `STX-${karat}K-CUB-${thickness}-${length.replace('"','')}` : '',
            inventory_management: 'shopify',
            inventory_policy: 'deny',
            requires_shipping: true,
            taxable: true,
          });
        }
      }

      // Build clean handle
      const cleanHandle = `${karat}k-${construction.toLowerCase()}-${thickness}-cuban-link`.replace(/\s+/g, '-');

      // Build product body
      const newProduct = {
        product: {
          title: oldProduct.title,
          handle: cleanHandle,
          body_html: oldProduct.body_html || '',
          vendor: 'STYX Gold',
          product_type: 'Cuban Link',
          tags: oldProduct.tags,
          published: true,
          options: [
            { name: 'Length', values: LENGTHS },
            { name: 'Color', values: COLORS },
          ],
          variants,
          // Migrate images
          images: (oldProduct.images || []).map((img, i) => ({
            src: img.src,
            position: i + 1,
            alt: img.alt || oldProduct.title,
          })),
        },
      };

      // Create product on new store
      const result = await shopifyRequest(NEW_DOMAIN, NEW_TOKEN, 'products.json', 'POST', newProduct);
      const newProductId = result.product.id;
      console.log(`  Created product ID: ${newProductId}`);
      console.log(`  Handle: ${cleanHandle}`);
      console.log(`  Variants: ${result.product.variants.length}`);

      const pricedVariants = result.product.variants.filter(v => parseFloat(v.price) > 0);
      const zeroedVariants = result.product.variants.filter(v => parseFloat(v.price) === 0);
      console.log(`  Priced: ${pricedVariants.length}, Zeroed: ${zeroedVariants.length}`);
      await sleep(500);

      // Add metafields to new product
      const metafieldsToCreate = [
        { namespace: 'chain', key: 'construction', value: construction, type: 'single_line_text_field' },
        { namespace: 'chain', key: 'thickness', value: thickness, type: 'single_line_text_field' },
        { namespace: 'chain', key: 'chain_style', value: chainStyle, type: 'single_line_text_field' },
        { namespace: 'global', key: 'title_tag', value: titleTag, type: 'single_line_text_field' },
        { namespace: 'global', key: 'description_tag', value: descTag, type: 'multi_line_text_field' },
      ];

      for (const mf of metafieldsToCreate) {
        if (!mf.value) continue;
        await shopifyRequest(NEW_DOMAIN, NEW_TOKEN, `products/${newProductId}/metafields.json`, 'POST', {
          metafield: mf,
        });
        await sleep(200);
      }
      console.log(`  Metafields: ${metafieldsToCreate.filter(m => m.value).length} created`);

      // Add to collection
      await shopifyRequest(NEW_DOMAIN, NEW_TOKEN, 'collects.json', 'POST', {
        collect: { product_id: newProductId, collection_id: collectionId },
      });
      console.log(`  Added to Cuban Links collection`);
      await sleep(300);

      created++;
    } catch (err) {
      errors++;
      console.error(`  ERROR: ${err.message}`);
      await sleep(1000);
    }
  }

  console.log(`\n=== Done! Created ${created} products, ${errors} errors ===`);
}

main().catch(console.error);
