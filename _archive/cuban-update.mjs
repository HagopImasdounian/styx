/**
 * Cuban Link Chain — Shopify Weight + Price + Variant Update Script
 *
 * Updates weights, prices, adds missing length variants (up to 30"),
 * and creates missing products (7.6mm, 14K 10.7mm, 14K 13mm).
 *
 * Pricing: $180/g for 10K, $253/g for 14K
 * Weights: From ShinyJewellers weighed data (confirmed by Hagop)
 *
 * NOTE: 5.3mm products SKIPPED — weight data was wrong (copy-paste of 10.7mm).
 *       Will address separately once correct weights are confirmed.
 */

const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const STORE = 'styxgold.myshopify.com';
const BASE = `https://${STORE}/admin/api/2024-10`;

const RATE_10K = 180;   // $/g
const RATE_14K = 253;   // $/g

// ── Confirmed weight data (g/inch) from weighed measurements ──
const G_PER_INCH = {
  '6.4mm':  { '10k': 2.85,  '14k': 3.14  },
  '7.6mm':  { '10k': 3.69,  '14k': 3.95  },
  '8.6mm':  { '10k': 4.30,  '14k': 4.97  },
  '10.7mm': { '10k': 7.05,  '14k': 7.69  },
  '13mm':   { '10k': 12.70, '14k': 13.50  },
};

// All target lengths for necklaces
const LENGTHS = [16, 18, 20, 22, 24, 26, 28, 30];

function calcWeight(gpi, len) { return +(gpi * len).toFixed(2); }
function calcPrice(weight, rate) { return (weight * rate).toFixed(2); }

// ── Existing product → variant mapping ──
// Built from Shopify data fetched earlier

const EXISTING_PRODUCTS = [
  // ─── 10K 6.5mm (6.4mm) ───
  {
    productId: 8503214506163,
    title: '10K Gold 6.5mm Cuban Link Chain',
    width: '6.4mm', karat: '10k',
    colors: ['Yellow Gold'],
    skuBase: '2157B',
    existingVariants: [
      { vid: 45526605988019, length: 16, color: 'Yellow Gold' },
      { vid: 45526606020787, length: 18, color: 'Yellow Gold' },
      { vid: 45526606053555, length: 20, color: 'Yellow Gold' },
      { vid: 45526606086323, length: 22, color: 'Yellow Gold' },
    ],
  },
  // ─── 10K 8.5mm (8.6mm) ───
  {
    productId: 8503214604467,
    title: '10K Gold 8.5mm Cuban Link Chain',
    width: '8.6mm', karat: '10k',
    colors: ['White Gold', 'Yellow Gold'],
    skuBase: '2158',
    skuBaseWhite: '2158W',
    existingVariants: [
      { vid: 45526606282931, length: 16, color: 'White Gold' },
      { vid: 45526606315699, length: 16, color: 'Yellow Gold' },
      { vid: 45526606348467, length: 18, color: 'White Gold' },
      { vid: 45526606381235, length: 18, color: 'Yellow Gold' },
      { vid: 45526606414003, length: 20, color: 'White Gold' },
      { vid: 45526606446771, length: 20, color: 'Yellow Gold' },
      { vid: 45526606479539, length: 22, color: 'White Gold' },
      { vid: 45526606512307, length: 22, color: 'Yellow Gold' },
      { vid: 45526606545075, length: 24, color: 'White Gold' },
      { vid: 45526606577843, length: 24, color: 'Yellow Gold' },
    ],
  },
  // ─── 10K 10.5mm (10.7mm) ───
  {
    productId: 8503214735539,
    title: '10K Gold 10.5mm Cuban Link Chain',
    width: '10.7mm', karat: '10k',
    colors: ['White Gold', 'Yellow Gold'],
    skuBase: '2159',
    skuBaseWhite: '2159W',
    existingVariants: [
      { vid: 45526606872755, length: 16, color: 'White Gold' },
      { vid: 45526606905523, length: 16, color: 'Yellow Gold' },
      { vid: 45526606938291, length: 18, color: 'White Gold' },
      { vid: 45526606971059, length: 18, color: 'Yellow Gold' },
      { vid: 45526607003827, length: 20, color: 'White Gold' },
      { vid: 45526607036595, length: 20, color: 'Yellow Gold' },
      { vid: 45526607069363, length: 22, color: 'White Gold' },
      { vid: 45526607102131, length: 22, color: 'Yellow Gold' },
      { vid: 45526607134899, length: 24, color: 'White Gold' },
      { vid: 45526607167667, length: 24, color: 'Yellow Gold' },
      { vid: 45526607200435, length: 26, color: 'White Gold' },
      { vid: 45526607233203, length: 26, color: 'Yellow Gold' },
    ],
  },
  // ─── 10K 13mm ───
  {
    productId: 8503214866611,
    title: '10K Gold 13mm Cuban Link Chain',
    width: '13mm', karat: '10k',
    colors: ['White Gold', 'Yellow Gold'],
    skuBase: '2160',
    skuBaseWhite: '2160W',
    existingVariants: [
      { vid: 45526607528115, length: 16, color: 'White Gold' },
      { vid: 45526607560883, length: 16, color: 'Yellow Gold' },
      { vid: 45526607593651, length: 18, color: 'White Gold' },
      { vid: 45526607626419, length: 18, color: 'Yellow Gold' },
      { vid: 45526607659187, length: 20, color: 'White Gold' },
      { vid: 45526607691955, length: 20, color: 'Yellow Gold' },
      { vid: 45526607724723, length: 22, color: 'White Gold' },
      { vid: 45526607757491, length: 22, color: 'Yellow Gold' },
      { vid: 45526607790259, length: 24, color: 'White Gold' },
      { vid: 45526607823027, length: 24, color: 'Yellow Gold' },
    ],
  },
  // ─── 14K 6.5mm (6.4mm) ───
  {
    productId: 8503214538931,
    title: '14K Gold 6.5mm Cuban Link Chain',
    width: '6.4mm', karat: '14k',
    colors: ['Yellow Gold'],
    skuBase: '2157B -14 Karat',
    existingVariants: [
      { vid: 45526606119091, length: 16, color: 'Yellow Gold' },
      { vid: 45526606151859, length: 18, color: 'Yellow Gold' },
      { vid: 45526606184627, length: 20, color: 'Yellow Gold' },
      { vid: 45526606217395, length: 22, color: 'Yellow Gold' },
    ],
  },
  // ─── 14K 8.5mm (8.3mm) ───
  {
    productId: 8503214670003,
    title: '14K Gold 8.5mm Cuban Link Chain',
    width: '8.6mm', karat: '14k',  // same g/in as 8.6mm
    colors: ['Yellow Gold'],
    skuBase: '2158 -14 Karat',
    existingVariants: [
      { vid: 45526606676147, length: 16, color: 'Yellow Gold' },
      { vid: 45526606708915, length: 18, color: 'Yellow Gold' },
      { vid: 45526606741683, length: 20, color: 'Yellow Gold' },
      { vid: 45526606774451, length: 22, color: 'Yellow Gold' },
      { vid: 45526606807219, length: 24, color: 'Yellow Gold' },
    ],
  },
];

// ── New products to create ──
const NEW_PRODUCTS = [
  {
    title: '10K Gold 7.5mm Cuban Link Chain',
    width: '7.6mm', karat: '10k',
    colors: ['Yellow Gold'],
    skuBase: '2157C',
    handle: '10k-gold-7-6mm-cuban-link-chain',
    image: 'https://shinyjewellers.com/wp-content/uploads/2020/11/ShinyChain7mmbust__19478.1495125956.1280.1280.jpg',
    lengths: [20, 22, 24, 26, 28, 30],
  },
  {
    title: '14K Gold 7.5mm Cuban Link Chain',
    width: '7.6mm', karat: '14k',
    colors: ['Yellow Gold'],
    skuBase: '2157C -14K',
    handle: '14k-gold-7-6mm-cuban-link-chain',
    image: 'https://shinyjewellers.com/wp-content/uploads/2020/11/ShinyChain7mmbust__19478.1495125956.1280.1280.jpg',
    lengths: [20, 22, 24, 26, 28, 30],
  },
  {
    title: '14K Gold 10.5mm Cuban Link Chain',
    width: '10.7mm', karat: '14k',
    colors: ['Yellow Gold'],
    skuBase: '2159 -14K',
    handle: '14k-gold-10-7mm-cuban-link-chain',
    image: 'https://shinyjewellers.com/wp-content/uploads/2020/11/ShinyChain11mmbust__66347.1495127453.1280.1280.jpg',
    lengths: [20, 22, 24, 26, 28, 30],
  },
  {
    title: '14K Gold 13mm Cuban Link Chain',
    width: '13mm', karat: '14k',
    colors: ['Yellow Gold'],
    skuBase: '2160 -14K',
    handle: '14k-gold-13mm-cuban-link-chain',
    image: 'https://shinyjewellers.com/wp-content/uploads/2020/11/ShinyChain13mmbust__32987.1495128942.1280.1280.jpg',
    lengths: [20, 22, 24, 26, 28, 30],
  },
];

// Cuban collection ID
const CUBAN_COLLECTION_ID = 337468522675;

// ── API helpers ──
let requestCount = 0;

async function shopifyRest(method, path, body) {
  requestCount++;
  // Respect rate limits: ~2 req/s
  if (requestCount % 2 === 0) await sleep(600);

  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getRate(karat) { return karat === '14k' ? RATE_14K : RATE_10K; }

function getSku(base, whiteBase, length, color) {
  const b = (color === 'White Gold' && whiteBase) ? whiteBase : base;
  return `${b} - ${length}"`;
}

// ── PHASE 1: Update existing variant weights + prices ──
async function updateExistingVariants() {
  console.log('\n══════ PHASE 1: Update existing variant weights + prices ══════\n');
  let updated = 0;

  for (const prod of EXISTING_PRODUCTS) {
    const gpi = G_PER_INCH[prod.width][prod.karat];
    const rate = getRate(prod.karat);
    console.log(`\n── ${prod.title} (${prod.width} ${prod.karat}, ${gpi} g/in, $${rate}/g) ──`);

    for (const v of prod.existingVariants) {
      const correctWeight = calcWeight(gpi, v.length);
      const correctPrice = calcPrice(correctWeight, rate);

      try {
        await shopifyRest('PUT', `/variants/${v.vid}.json`, {
          variant: {
            id: v.vid,
            weight: correctWeight,
            weight_unit: 'g',
            price: correctPrice,
          },
        });
        console.log(`  ✓ ${v.length}" ${v.color}: ${correctWeight}g → $${correctPrice}`);
        updated++;
      } catch (err) {
        console.error(`  ✗ ${v.length}" ${v.color}: ${err.message}`);
      }
    }
  }
  console.log(`\nPhase 1 done: ${updated} variants updated.`);
}

// ── PHASE 2: Add missing length variants to existing products ──
async function addMissingVariants() {
  console.log('\n══════ PHASE 2: Add missing length variants ══════\n');
  let added = 0;

  for (const prod of EXISTING_PRODUCTS) {
    const gpi = G_PER_INCH[prod.width][prod.karat];
    const rate = getRate(prod.karat);

    // Which lengths already exist?
    const existingLengths = new Set(prod.existingVariants.map(v => `${v.length}-${v.color}`));

    for (const len of LENGTHS) {
      for (const color of prod.colors) {
        const key = `${len}-${color}`;
        if (existingLengths.has(key)) continue;

        const weight = calcWeight(gpi, len);
        const price = calcPrice(weight, rate);
        const sku = getSku(prod.skuBase, prod.skuBaseWhite, len, color);

        try {
          await shopifyRest('POST', `/products/${prod.productId}/variants.json`, {
            variant: {
              option1: `${len}"`,
              option2: color,
              price,
              weight,
              weight_unit: 'g',
              sku,
              inventory_management: 'shopify',
              requires_shipping: true,
              taxable: true,
            },
          });
          console.log(`  ✓ ${prod.title}: added ${len}" ${color} — ${weight}g → $${price}`);
          added++;
        } catch (err) {
          console.error(`  ✗ ${prod.title}: ${len}" ${color} — ${err.message}`);
        }
      }
    }
  }
  console.log(`\nPhase 2 done: ${added} new variants added.`);
}

// ── PHASE 3: Create new products ──
async function createNewProducts() {
  console.log('\n══════ PHASE 3: Create new products ══════\n');
  const createdIds = [];

  for (const prod of NEW_PRODUCTS) {
    const gpi = G_PER_INCH[prod.width][prod.karat];
    const rate = getRate(prod.karat);

    const variants = [];
    for (const len of prod.lengths) {
      for (const color of prod.colors) {
        const weight = calcWeight(gpi, len);
        const price = calcPrice(weight, rate);
        const sku = getSku(prod.skuBase, null, len, color);
        variants.push({
          option1: `${len}"`,
          option2: color,
          price,
          weight,
          weight_unit: 'g',
          sku,
          inventory_management: 'shopify',
          requires_shipping: true,
          taxable: true,
        });
      }
    }

    const body = {
      product: {
        title: prod.title,
        handle: prod.handle,
        product_type: 'Cuban Link Chain',
        vendor: 'Styx',
        status: 'active',
        options: [
          { name: 'Length', values: prod.lengths.map(l => `${l}"`) },
          { name: 'Color', values: prod.colors },
        ],
        variants,
        images: [{ src: prod.image }],
        tags: `cuban, miami cuban, ${prod.karat === '14k' ? '14k' : '10k'}, gold chain, solid gold`,
      },
    };

    try {
      const result = await shopifyRest('POST', '/products.json', body);
      const newId = result.product.id;
      createdIds.push(newId);
      console.log(`✓ Created: ${prod.title} (ID: ${newId})`);
      console.log(`  ${variants.length} variants, ${prod.lengths.length} lengths`);

      // Log variant details
      for (const v of result.product.variants) {
        console.log(`  ${v.title} | $${v.price} | ${v.weight}${v.weight_unit} | SKU: ${v.sku}`);
      }
    } catch (err) {
      console.error(`✗ Failed to create ${prod.title}: ${err.message}`);
    }
  }
  return createdIds;
}

// ── PHASE 4: Add new products to Cuban collection + publish to sales channels ──
async function addToCollectionAndPublish(productIds) {
  console.log('\n══════ PHASE 4: Add to collection + publish ══════\n');

  // Add to Cuban collection via REST
  for (const pid of productIds) {
    try {
      await shopifyRest('POST', '/collects.json', {
        collect: {
          product_id: pid,
          collection_id: CUBAN_COLLECTION_ID,
        },
      });
      console.log(`✓ Added product ${pid} to Cuban collection`);
    } catch (err) {
      console.error(`✗ Collection add failed for ${pid}: ${err.message}`);
    }
  }

  // Also add to "Chains" collection (337469014195) and karat collections
  const chainsCollectionId = 337469014195;
  const tenKCollectionId = 337468948659;
  const fourteenKCollectionId = 337468981427;
  const yellowGoldCollectionId = 337469046963;

  for (const pid of productIds) {
    // Add to chains
    try {
      await shopifyRest('POST', '/collects.json', {
        collect: { product_id: pid, collection_id: chainsCollectionId },
      });
      console.log(`✓ Added product ${pid} to Chains collection`);
    } catch (err) {
      // May already be in collection
    }

    // Add to yellow gold
    try {
      await shopifyRest('POST', '/collects.json', {
        collect: { product_id: pid, collection_id: yellowGoldCollectionId },
      });
    } catch (err) {}
  }

  // Determine karat for each new product and add to karat collection
  for (let i = 0; i < NEW_PRODUCTS.length; i++) {
    const prod = NEW_PRODUCTS[i];
    const pid = productIds[i];
    if (!pid) continue;

    const collId = prod.karat === '14k' ? fourteenKCollectionId : tenKCollectionId;
    try {
      await shopifyRest('POST', '/collects.json', {
        collect: { product_id: pid, collection_id: collId },
      });
      console.log(`✓ Added product ${pid} to ${prod.karat} collection`);
    } catch (err) {}
  }

  // Publish to sales channels via GraphQL
  // We need the publication IDs — let's fetch them
  console.log('\nPublishing to sales channels...');
  try {
    const pubRes = await fetch(`${BASE.replace('/api/2024-10', '')}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': TOKEN,
      },
      body: JSON.stringify({
        query: `{ publications(first: 10) { nodes { id name } } }`,
      }),
    });
    const pubData = await pubRes.json();
    const publications = pubData?.data?.publications?.nodes || [];
    console.log('Available publications:', publications.map(p => `${p.name} (${p.id})`).join(', '));

    // Publish each product to all channels
    for (const pid of productIds) {
      const gid = `gid://shopify/Product/${pid}`;
      for (const pub of publications) {
        try {
          const mutation = `mutation {
            publishablePublish(id: "${gid}", input: { publicationId: "${pub.id}" }) {
              userErrors { field message }
            }
          }`;
          await fetch(`${BASE.replace('/api/2024-10', '')}/admin/api/2024-10/graphql.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': TOKEN,
            },
            body: JSON.stringify({ query: mutation }),
          });
          await sleep(300);
        } catch (err) {}
      }
      console.log(`✓ Published product ${pid} to ${publications.length} channels`);
    }
  } catch (err) {
    console.error('✗ Publishing failed:', err.message);
  }
}

// ── Main ──
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Cuban Link Chain — Shopify Update Script       ║');
  console.log('║  Pricing: $180/g (10K), $253/g (14K)           ║');
  console.log('║  Skipping: 5.3mm (weights unconfirmed)         ║');
  console.log('╚══════════════════════════════════════════════════╝');

  await updateExistingVariants();
  await addMissingVariants();
  const newProductIds = await createNewProducts();
  if (newProductIds.length > 0) {
    await addToCollectionAndPublish(newProductIds);
  }

  console.log('\n══════ SUMMARY ══════');
  console.log(`Total API requests: ${requestCount}`);
  console.log('New products created:', newProductIds.length);
  console.log('\nNOTE: 5.3mm (10K + 14K) products SKIPPED.');
  console.log('      Weight data was wrong (copy-paste of 10.7mm from ShinyJewellers).');
  console.log('      ShinyJewellers variant data suggests ~2.13 g/in for 10K 5.3mm.');
  console.log('      Need Shiny to weigh a 5.3mm chain to confirm before updating.');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
