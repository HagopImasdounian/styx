/**
 * Rope Chain — Shopify Weight + Price + Variant Update Script
 *
 * Updates weights, prices, adds missing length variants (up to 30" for solids).
 * g/inch rates derived from existing prices (which used ShinyJewellers base weights).
 *
 * NOTE: 6mm already done separately with confirmed weighed data (2.38 g/in).
 * These rates are ESTIMATES — need Shiny to weigh for confirmation.
 */

const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const STORE = 'styxgold.myshopify.com';
const BASE = `https://${STORE}/admin/api/2024-10`;
const RATE = 180; // $/g for 10K

let reqCount = 0;
async function shopify(method, path, body) {
  reqCount++;
  if (reqCount % 2 === 0) await sleep(600);
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) { const t = await res.text(); throw new Error(`${method} ${path} → ${res.status}: ${t}`); }
  return res.json();
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function calcWeight(gpi, len) { return +(gpi * len).toFixed(2); }
function calcPrice(weight) { return (weight * RATE).toFixed(2); }

// ── All rope products ──
const PRODUCTS = [
  // ─── 3mm Solid ───
  {
    productId: 8503215653043,
    title: '10K Gold 3mm Rope Chain',
    gpi: 1.05,  // 23.1g base ÷ 22"
    colors: ['Rose Gold', 'White Gold', 'Yellow Gold'],
    skuMap: { 'Rose Gold': '2153R', 'White Gold': '2153W', 'Yellow Gold': '2153' },
    targetLengths: [16, 18, 20, 22, 24, 26, 28, 30],
    existingVariants: [
      { vid: 45526620635315, length: 16, color: 'Rose Gold' },
      { vid: 45526620668083, length: 16, color: 'White Gold' },
      { vid: 45526620700851, length: 16, color: 'Yellow Gold' },
      { vid: 45526620733619, length: 18, color: 'Rose Gold' },
      { vid: 45526620766387, length: 18, color: 'White Gold' },
      { vid: 45526620799155, length: 18, color: 'Yellow Gold' },
      { vid: 45526620831923, length: 20, color: 'Rose Gold' },
      { vid: 45526620864691, length: 20, color: 'White Gold' },
      { vid: 45526620897459, length: 20, color: 'Yellow Gold' },
      { vid: 45526620930227, length: 22, color: 'Rose Gold' },
      { vid: 45526620962995, length: 22, color: 'White Gold' },
      { vid: 45526620995763, length: 22, color: 'Yellow Gold' },
      { vid: 45526621028531, length: 24, color: 'Rose Gold' },
      { vid: 45526621061299, length: 24, color: 'White Gold' },
      { vid: 45526621094067, length: 24, color: 'Yellow Gold' },
      { vid: 45526621126835, length: 26, color: 'Rose Gold' },
      { vid: 45526621159603, length: 26, color: 'White Gold' },
      { vid: 45526621192371, length: 26, color: 'Yellow Gold' },
    ],
  },
  // ─── 4mm Solid ───
  {
    productId: 8503215685811,
    title: '10K Gold 4mm Rope Chain',
    gpi: 1.83,  // 43.92g base ÷ 24"
    colors: ['Rose Gold', 'White Gold', 'Yellow Gold'],
    skuMap: { 'Rose Gold': '2154B', 'White Gold': '2154A', 'Yellow Gold': '2154' },
    targetLengths: [16, 18, 20, 22, 24, 26, 28, 30],
    existingVariants: [
      { vid: 45526621225139, length: 16, color: 'Rose Gold' },
      { vid: 45526621257907, length: 16, color: 'White Gold' },
      { vid: 45526621290675, length: 16, color: 'Yellow Gold' },
      { vid: 45526621323443, length: 18, color: 'Rose Gold' },
      { vid: 45526621356211, length: 18, color: 'White Gold' },
      { vid: 45526621388979, length: 18, color: 'Yellow Gold' },
      { vid: 45526621421747, length: 20, color: 'Rose Gold' },
      { vid: 45526621454515, length: 20, color: 'White Gold' },
      { vid: 45526621487283, length: 20, color: 'Yellow Gold' },
      { vid: 45526621520051, length: 22, color: 'Rose Gold' },
      { vid: 45526621552819, length: 22, color: 'White Gold' },
      { vid: 45526621585587, length: 22, color: 'Yellow Gold' },
      { vid: 45526621618355, length: 24, color: 'Rose Gold' },
      { vid: 45526621651123, length: 24, color: 'White Gold' },
      { vid: 45526621683891, length: 24, color: 'Yellow Gold' },
      { vid: 45526621716659, length: 26, color: 'Rose Gold' },
      { vid: 45526621749427, length: 26, color: 'White Gold' },
      { vid: 45526621782195, length: 26, color: 'Yellow Gold' },
    ],
  },
  // ─── 5mm Solid ───
  {
    productId: 8503215718579,
    title: '10K Gold 5mm Rope Chain',
    gpi: 2.48,  // 54.48g base ÷ 22"
    colors: ['Yellow Gold'],
    skuMap: { 'Yellow Gold': '2155' },
    targetLengths: [16, 18, 20, 22, 24, 26, 28, 30],
    existingVariants: [
      { vid: 45526621814963, length: 16, color: 'Yellow Gold' },
      { vid: 45526621847731, length: 18, color: 'Yellow Gold' },
      { vid: 45526621880499, length: 20, color: 'Yellow Gold' },
      { vid: 45526621913267, length: 22, color: 'Yellow Gold' },
      { vid: 45526621946035, length: 24, color: 'Yellow Gold' },
      { vid: 45526621978803, length: 26, color: 'Yellow Gold' },
      { vid: 45526622011571, length: 28, color: 'Yellow Gold' },
    ],
  },
  // ─── 7mm Solid ───
  {
    productId: 8503215784115,
    title: '10K Gold 7mm Rope Chain',
    gpi: 6.87,  // 151.2g base ÷ 22"
    colors: ['Yellow Gold'],
    skuMap: { 'Yellow Gold': '2157' },
    targetLengths: [16, 18, 20, 22, 24, 26, 28, 30],
    existingVariants: [
      { vid: 45526622634163, length: 16, color: 'Yellow Gold' },
      { vid: 45526622666931, length: 18, color: 'Yellow Gold' },
      { vid: 45526622699699, length: 20, color: 'Yellow Gold' },
      { vid: 45526622732467, length: 22, color: 'Yellow Gold' },
      { vid: 45526622765235, length: 24, color: 'Yellow Gold' },
      { vid: 45526622798003, length: 26, color: 'Yellow Gold' },
    ],
  },
  // ─── 2.5mm Hollow ───
  {
    productId: 8503215161523,
    title: '10K Gold 2.5mm Hollow Rope Chain',
    gpi: 0.20,  // 3.2g base ÷ 16"
    colors: ['Yellow Gold'],
    skuMap: { 'Yellow Gold': '120' },
    targetLengths: [16, 18, 20, 22, 24],  // keep existing range for hollows
    existingVariants: [
      { vid: 45526617456819, length: 16, color: 'Yellow Gold' },
      { vid: 45526617489587, length: 18, color: 'Yellow Gold' },
      { vid: 45526617522355, length: 20, color: 'Yellow Gold' },
      { vid: 45526617555123, length: 22, color: 'Yellow Gold' },
      { vid: 45526617587891, length: 24, color: 'Yellow Gold' },
    ],
  },
  // ─── 3mm Hollow ───
  {
    productId: 8503215194291,
    title: '10K Gold 3mm Hollow Rope Chain',
    gpi: 0.31,  // 5.6g base ÷ 18"
    colors: ['Yellow Gold'],
    skuMap: { 'Yellow Gold': '121' },
    targetLengths: [16, 18, 20, 22, 24],  // keep existing range for hollows
    existingVariants: [
      { vid: 45526617620659, length: 16, color: 'Yellow Gold' },
      { vid: 45526617653427, length: 18, color: 'Yellow Gold' },
      { vid: 45526617686195, length: 20, color: 'Yellow Gold' },
      { vid: 45526617718963, length: 22, color: 'Yellow Gold' },
      { vid: 45526617751731, length: 24, color: 'Yellow Gold' },
    ],
  },
];

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Rope Chain — Shopify Update Script             ║');
  console.log('║  Pricing: $180/g (10K)                         ║');
  console.log('║  6mm already done (2.38 g/in confirmed)        ║');
  console.log('╚══════════════════════════════════════════════════╝');

  let totalUpdated = 0;
  let totalAdded = 0;

  for (const prod of PRODUCTS) {
    console.log(`\n── ${prod.title} (${prod.gpi} g/in) ──`);

    // Phase 1: Update existing variants
    for (const v of prod.existingVariants) {
      const w = calcWeight(prod.gpi, v.length);
      const price = calcPrice(w);
      try {
        await shopify('PUT', `/variants/${v.vid}.json`, {
          variant: { id: v.vid, weight: w, weight_unit: 'g', price }
        });
        console.log(`  ✓ ${v.length}" ${v.color}: ${w}g → $${price}`);
        totalUpdated++;
      } catch (err) {
        console.error(`  ✗ ${v.length}" ${v.color}: ${err.message}`);
      }
    }

    // Phase 2: Add missing lengths
    const existingKeys = new Set(prod.existingVariants.map(v => `${v.length}-${v.color}`));
    for (const len of prod.targetLengths) {
      for (const color of prod.colors) {
        if (existingKeys.has(`${len}-${color}`)) continue;
        const w = calcWeight(prod.gpi, len);
        const price = calcPrice(w);
        const sku = `${prod.skuMap[color]} - ${len}"`;
        try {
          await shopify('POST', `/products/${prod.productId}/variants.json`, {
            variant: {
              option1: `${len}"`,
              option2: color,
              price,
              weight: w,
              weight_unit: 'g',
              sku,
              inventory_management: 'shopify',
              requires_shipping: true,
              taxable: true,
            }
          });
          console.log(`  + ${len}" ${color}: ${w}g → $${price} (SKU: ${sku})`);
          totalAdded++;
        } catch (err) {
          console.error(`  ✗ ADD ${len}" ${color}: ${err.message}`);
        }
      }
    }
  }

  console.log('\n══════ SUMMARY ══════');
  console.log(`Variants updated: ${totalUpdated}`);
  console.log(`Variants added: ${totalAdded}`);
  console.log(`API requests: ${reqCount}`);
  console.log('\nNOTE: g/inch rates for 3mm, 4mm, 5mm, 7mm are ESTIMATES');
  console.log('from ShinyJewellers base weights. Add to Shiny to-do for confirmation.');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
