/**
 * ALL REMAINING CHAINS — Weight fix + Color verification
 *
 * For each product:
 * 1. Derive g/inch from existing prices (price / $180 per gram for 10K, $253 for 14K)
 * 2. Set correct weight on every variant
 * 3. Report color mismatches vs ShinyJewellers
 */

const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const STORE = 'styxgold.myshopify.com';
const BASE = `https://${STORE}/admin/api/2024-10`;
const RATE_10K = 180;
const RATE_14K = 253;

let reqCount = 0;
async function shopify(method, path, body) {
  reqCount++;
  if (reqCount % 2 === 0) await sleep(550);
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── ShinyJewellers color data by SKU prefix ──
// Built from API data. Maps SKU prefix → available colors
const SHINY_COLORS = {
  // Box
  '2021': ['white', 'yellow'], '2022': ['white', 'yellow'],
  '2021A': ['rose', 'white', 'yellow'], '2023': ['rose', 'white', 'yellow'], '2013': ['rose', 'white', 'yellow'],
  '2021B': ['white', 'yellow'], '2024': ['white', 'yellow'],
  '2021B-1': ['white', 'yellow'], '2024A': ['white', 'yellow'],
  '2021C': ['white', 'yellow'], '2025': ['white', 'yellow'],
  '510': ['white', 'yellow'], '511': ['white', 'yellow'],
  '2831': ['white', 'yellow'], '2832': ['white', 'yellow'],
  // Curb - standard
  '2026': ['white', 'yellow'], '2026Y': ['white', 'yellow'],
  '2027': ['white', 'yellow'], '2027Y': ['white', 'yellow'],
  '2121A': ['white', 'yellow'], '2121B': ['white', 'yellow'],
  '2121C': ['white', 'yellow'], '2121D': ['white', 'yellow'],
  '2121E': ['yellow'], // 2.5mm - yellow only
  '2121F': ['yellow'], // 3mm - yellow only
  '2121H': ['yellow'], // 4.3mm - yellow only
  '2121I': ['yellow'], // 5.3mm - yellow only
  '2123': ['white'], // white only
  // Curb - concave
  '2135A': ['yellow'],
  '2136': ['white', 'yellow'], '2143': ['white', 'yellow'],
  '2137': ['yellow'],
  '2138': ['yellow'],
  '2139': ['yellow'],
  '2140': ['yellow'],
  '2140A': ['yellow'],
  // Curb - beveled
  '2124': ['white', 'yellow'], '2130': ['white', 'yellow'],
  '2125': ['white', 'yellow'], '2131': ['white', 'yellow'],
  '2125A': ['yellow'],
  '2126': ['white', 'yellow'], '2132': ['white', 'yellow'],
  '2127': ['white', 'yellow'], '2133': ['white', 'yellow'],
  '2135': ['white'], // 6.5mm beveled - white only
  // Curb - marine
  '2101': ['white', 'yellow'], '2106': ['white', 'yellow'],
  '2102': ['white', 'yellow'], '2107': ['white', 'yellow'],
  '2103': ['yellow'],
  '2103A': ['yellow'],
  '2104': ['yellow'],
  // Curb - hollow
  '2801': ['white', 'yellow'], '2802': ['white', 'yellow'],
  '2803': ['white', 'yellow'], '2804': ['white', 'yellow'],
  '2817': ['white', 'yellow'], '2818': ['white', 'yellow'],
  // Curb - 14K
  '512': ['white', 'yellow'], '513': ['white', 'yellow'],
  '514': ['white', 'yellow'], '515': ['white', 'yellow'],
  // Franco
  '2148A': ['white', 'yellow'],
  '2152A': ['white', 'yellow'],
  '2152B': ['white', 'yellow'],
  '2151': ['yellow'],
  '2837': ['yellow'], // hollow franco
  // Rolo
  '2034': ['white', 'yellow'],
  '2035': ['white', 'yellow'],
  '2014': ['rose', 'white', 'yellow'],
  '2031': ['yellow'],
  '2032': ['yellow'],
  '2038': ['white'],
  '2013A': ['rose', 'white', 'yellow'],
  '2035A': ['white', 'yellow'],
  '2037A': ['white'],
  '2015': ['rose'],
  '502': ['white', 'yellow'], // 14K rolo
  '504': ['white', 'yellow'],
  '505': ['yellow'],
  '508': ['white', 'yellow'], '509': ['white', 'yellow'],
  // Cable
  '2036A': ['white', 'yellow'],
  '2031B': ['yellow'],
  '2031C': ['white', 'yellow'], '2037B': ['white', 'yellow'],
  'Cable060': ['yellow'],
  '509B': ['white', 'yellow'], '509C': ['yellow'],
  '2032A': ['yellow'],
  // Wheat
  '2010': ['rose', 'white', 'yellow'],
  '2011': ['rose', 'white', 'yellow'],
  '2059': ['white', 'yellow'],
  '518': ['rose', 'white', 'yellow'],
  '521': ['rose', 'white', 'yellow'],
  '523': ['white', 'yellow'],
  // Singapore
  '2012': ['rose', 'white', 'yellow'],
  '2048': ['white', 'yellow'],
  '2049': ['white', 'yellow'],
  '2050': ['white', 'yellow'],
  '2051': ['white'],
  // Snake
  '2002': ['white', 'yellow'],
  'ORO W13': ['white', 'yellow'], 'ORO Y13': ['white', 'yellow'],
  // Herringbone
  '9317': ['white', 'yellow'], // 3mm regular
  '9317A': ['yellow'], // 3mm braided
  '9318': ['yellow'], // 4mm
  '9318A': ['yellow'], // 5mm
  // Paperclip
  '9319': ['white'], // 4mm hollow
  '9320': ['yellow'], // 5.5mm hollow
  // Figaro
  '2811A': ['yellow'],
  // Adjustable
  '2004': ['white', 'yellow'],
  'ORO W4': ['white', 'yellow'], 'ORO Y4': ['white', 'yellow'],
};

function normalizeColor(title) {
  const t = title.toLowerCase();
  if (t.includes('rose')) return 'rose';
  if (t.includes('white')) return 'white';
  return 'yellow';
}

function getShinyColors(sku) {
  // Try exact match first, then prefix
  if (SHINY_COLORS[sku]) return SHINY_COLORS[sku];
  // Strip length suffix
  const base = sku.replace(/\s*[-/]\s*\d+["']?\s*$/, '').replace(/\s*[-/]\s*BR\s*$/i, '').trim();
  if (SHINY_COLORS[base]) return SHINY_COLORS[base];
  // Try first part before dash
  const first = base.split(/\s*[-/]\s*/)[0].trim();
  if (SHINY_COLORS[first]) return SHINY_COLORS[first];
  return null; // unknown
}

// ── Main ──
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  ALL CHAINS — Weight Fix + Color Verification       ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  // Fetch all products
  let allProducts = [];
  let sinceId = 0;
  while (true) {
    const d = await shopify('GET', `/products.json?limit=250&since_id=${sinceId}`);
    if (!d.products || d.products.length === 0) break;
    allProducts.push(...d.products);
    sinceId = d.products[d.products.length - 1].id;
  }

  console.log(`\nTotal products: ${allProducts.length}`);

  // Skip cubans and ropes (already done)
  const skip = /cuban|rope/i;
  const remaining = allProducts.filter(p =>
    !skip.test(p.title) && !skip.test(p.product_type || '')
  );
  console.log(`Remaining to process: ${remaining.length}`);

  let totalWeightUpdates = 0;
  let totalColorRemovals = 0;
  const colorReport = [];
  const noRateProducts = [];

  for (const product of remaining) {
    const is14k = /14k/i.test(product.title);
    const rate = is14k ? RATE_14K : RATE_10K;
    const variants = product.variants;

    if (variants.length === 0) continue;

    // Parse lengths and prices to derive g/inch
    const variantData = variants.map(v => {
      const titleParts = v.title.split(' / ');
      const lengthStr = titleParts[0].replace(/"/g, '').trim();
      const lengthNum = parseFloat(lengthStr) || 0;
      const color = titleParts.length > 1 ? titleParts[titleParts.length - 1] : '';
      return { ...v, lengthNum, colorName: color, lengthStr };
    });

    // Find a variant with a valid length to derive g/inch
    const withLength = variantData.filter(v => v.lengthNum > 0);
    if (withLength.length === 0) {
      // Single-size products (adjustable, etc) — just skip weight update
      continue;
    }

    // Derive g/inch from the first variant with a length
    const ref = withLength[0];
    const refWeight = parseFloat(ref.price) / rate;
    const gpi = refWeight / ref.lengthNum;

    if (gpi <= 0 || !isFinite(gpi) || gpi > 50) {
      noRateProducts.push({ title: product.title, price: ref.price, length: ref.lengthNum });
      continue;
    }

    // Verify g/inch is consistent across variants of same length (different prices = different lengths)
    let inconsistent = false;
    for (const v of withLength) {
      const expectedWeight = gpi * v.lengthNum;
      const expectedPrice = expectedWeight * rate;
      const priceDiff = Math.abs(parseFloat(v.price) - expectedPrice);
      if (priceDiff > 1) { // more than $1 difference
        inconsistent = true;
        break;
      }
    }

    if (inconsistent) {
      // Prices don't follow a consistent g/inch — skip (might be adjustable or special pricing)
      noRateProducts.push({ title: product.title, note: 'inconsistent g/in across variants' });
      continue;
    }

    console.log(`\n── ${product.title} (${gpi.toFixed(4)} g/in, $${rate}/g) ──`);

    // Phase 1: Update weights
    for (const v of variantData) {
      if (v.lengthNum <= 0) continue;

      const correctWeight = +(gpi * v.lengthNum).toFixed(2);
      const currentWeight = v.weight;

      if (Math.abs(currentWeight - correctWeight) < 0.01) {
        // Weight is already correct
        continue;
      }

      try {
        await shopify('PUT', `/variants/${v.id}.json`, {
          variant: { id: v.id, weight: correctWeight, weight_unit: 'g' }
        });
        console.log(`  ✓ ${v.title}: ${currentWeight}g → ${correctWeight}g`);
        totalWeightUpdates++;
      } catch (err) {
        console.error(`  ✗ ${v.title}: ${err.message}`);
      }
    }

    // Phase 2: Check colors against Shiny data
    const sampleSku = variants[0]?.sku || '';
    const shinyColors = getShinyColors(sampleSku);

    if (shinyColors) {
      for (const v of variantData) {
        const vColor = normalizeColor(v.colorName);
        if (!shinyColors.includes(vColor)) {
          colorReport.push({
            product: product.title,
            productId: product.id,
            variant: v.title,
            variantId: v.id,
            color: vColor,
            sku: v.sku,
            availableColors: shinyColors,
          });
        }
      }
    }
  }

  // Phase 3: Remove unavailable color variants
  if (colorReport.length > 0) {
    console.log(`\n══════ COLOR MISMATCHES — Removing ${colorReport.length} variants ══════\n`);
    for (const item of colorReport) {
      try {
        await shopify('DELETE', `/products/${item.productId}/variants/${item.variantId}.json`);
        console.log(`  ✗ Removed: ${item.product} — ${item.variant} (${item.color} not available, only: ${item.availableColors.join(', ')})`);
        totalColorRemovals++;
      } catch (err) {
        // Can't delete if it's the last variant
        console.error(`  ! Cannot remove ${item.variant}: ${err.message.slice(0, 100)}`);
      }
    }
  }

  console.log('\n══════ SUMMARY ══════');
  console.log(`Weight updates: ${totalWeightUpdates}`);
  console.log(`Color removals: ${totalColorRemovals}`);
  console.log(`API requests: ${reqCount}`);

  if (noRateProducts.length > 0) {
    console.log(`\nSkipped (couldn't derive g/inch):`);
    noRateProducts.forEach(p => console.log(`  - ${p.title} ${p.note || ''}`));
  }
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
