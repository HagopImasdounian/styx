/**
 * Clean import: ShinyJewellers -> Shopify
 *
 * - Pulls all data from ShinyJewellers WPGraphQL
 * - SEO-optimized titles, meta descriptions, rich HTML descriptions
 * - Length variants with weight-based pricing
 * - Metafields: weight, karat, thickness, construction, material_cost
 * - 4 categories: Cuban Link, Curb Chain, Box Chain, Rope Chain
 * - Plus karat collections: 10K, 14K
 */

const SHOPIFY_DOMAIN = 'styx-onnsz4sk.myshopify.com';
const SHOPIFY_TOKEN = 'process.env.SHOPIFY_ADMIN_TOKEN';
const SHINY_API = 'https://shinyjewellers.com/api';

const VENDOR_RATE = {10: 117.30, 14: 163.04, 18: 207.00};
const MARKUP = 1.65;

const CATEGORY_TITLES = {
  cuban: 'Cuban Link',
  box: 'Box Chain',
  curb: 'Curb Chain',
  rope: 'Rope Chain',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Shopify REST helper ──

async function shopify(endpoint, method = 'GET', body = null) {
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/${endpoint}`;
  const opts = {
    method,
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify ${method} ${endpoint}: ${res.status} — ${text}`);
  }
  const limit = res.headers.get('X-Shopify-Shop-Api-Call-Limit');
  if (limit) {
    const used = parseInt(limit.split('/')[0]);
    if (used > 36) await sleep(1000);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── ShinyJewellers fetch ──

const PRODUCTS_QUERY = `
  query ChainProducts($after: String) {
    products(first: 50, after: $after, where: {categoryIn: ["cuban", "box", "curb", "rope"]}) {
      nodes {
        ... on SimpleProduct {
          id databaseId name slug sku
          description(format: RAW) shortDescription(format: RAW)
          image { sourceUrl altText }
          galleryImages { nodes { sourceUrl altText } }
          productCategories { nodes { name slug } }
          attributes { nodes { name options label } }
          weight
          metaData { key value }
        }
        ... on VariableProduct {
          id databaseId name slug sku
          description(format: RAW) shortDescription(format: RAW)
          image { sourceUrl altText }
          galleryImages { nodes { sourceUrl altText } }
          productCategories { nodes { name slug } }
          attributes { nodes { name options label } }
          weight
          metaData { key value }
          variations(first: 50) {
            nodes { id databaseId name sku weight attributes { nodes { name value } } }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

async function fetchShinyProducts() {
  const all = [];
  let after = null;
  let hasNext = true;
  while (hasNext) {
    const res = await fetch(SHINY_API, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({query: PRODUCTS_QUERY, variables: {after}}),
    });
    const json = await res.json();
    const p = json?.data?.products;
    if (!p) break;
    all.push(...p.nodes);
    hasNext = p.pageInfo.hasNextPage;
    after = p.pageInfo.endCursor;
  }
  return all;
}

// ── Parsing helpers ──

function parseKarat(name, attrs) {
  // Check name first — most reliable
  if (/18\s*k/i.test(name) || /18\s*karat/i.test(name)) return 18;
  if (/14\s*k/i.test(name) || /14\s*karat/i.test(name)) return 14;
  if (/10\s*k/i.test(name) || /10\s*karat/i.test(name)) return 10;
  // Fall back to pricing-category attribute
  const pricingAttr = attrs.find((a) => a.name === 'pa_pricing-category');
  if (pricingAttr?.options?.[0]) {
    if (/18k/i.test(pricingAttr.options[0])) return 18;
    if (/14k/i.test(pricingAttr.options[0])) return 14;
    if (/10k/i.test(pricingAttr.options[0])) return 10;
  }
  // Fall back to Metal attribute
  const metalAttr = attrs.find((a) => a.name === 'Metal');
  if (metalAttr?.options?.[0]) {
    const m = metalAttr.options[0].match(/(\d+)K/i);
    if (m) return parseInt(m[1]);
  }
  return 10;
}

function parseCategory(cats) {
  for (const c of cats) {
    if (c.slug in CATEGORY_TITLES) return c.slug;
  }
  return null;
}

function parseThickness(name, attrs) {
  // Prefer name over attribute — ShinyJewellers attrs are often wrong
  const m = name.match(/([\d.]+)\s*mm/i);
  if (m) return `${m[1]}mm`;
  const ta = attrs.find((a) => a.name === 'Thickness');
  if (ta?.options?.[0]) return ta.options[0];
  return '';
}

function parseIsHollow(name) {
  return /hollow/i.test(name);
}

function parseLengths(attrs) {
  const la = attrs.find((a) => a.name === 'pa_length');
  if (la?.options) {
    return la.options.map((o) => {
      const m = o.match(/(\d+)/);
      return m ? parseInt(m[1]) : null;
    }).filter(Boolean);
  }
  return [];
}

function calcPrice(weightGrams, karat) {
  const rate = VENDOR_RATE[karat] || VENDOR_RATE[10];
  return Math.round(weightGrams * rate * MARKUP * 100) / 100;
}

// ── SEO helpers ──

function seoTitle(name, karat, thickness, category, isHollow) {
  // Build clean SEO title: "10K Gold 5.3mm Cuban Link Chain | Solid"
  const catLabel = CATEGORY_TITLES[category] || 'Chain';
  const parts = [];

  parts.push(`${karat}K Gold`);
  if (thickness) parts.push(thickness);
  if (isHollow) parts.push('Hollow');
  parts.push(catLabel);

  // Check if it's a "Miami" cuban
  if (/miami/i.test(name) && category === 'cuban') {
    parts.splice(parts.indexOf(catLabel), 1, 'Miami Cuban Link Chain');
  }

  // Diamond cut?
  if (/diamond\s*cut/i.test(name)) {
    parts.splice(2, 0, 'Diamond Cut');
  }

  return parts.join(' ');
}

function seoMetaDescription(title, karat, thickness, isHollow, category, minPrice, maxPrice, lengths) {
  const construction = isHollow ? 'hollow' : 'solid';
  const catLabel = CATEGORY_TITLES[category]?.toLowerCase() || 'chain';
  const priceStr = minPrice === maxPrice
    ? `$${minPrice.toLocaleString()}`
    : `from $${minPrice.toLocaleString()}`;
  const lengthStr = lengths.length > 0
    ? `Available in ${lengths.map((l) => l + '"').join(', ')}.`
    : '';

  return `Shop ${title} — ${construction} ${karat}K gold ${catLabel}${thickness ? `, ${thickness} width` : ''}. ${priceStr}. ${lengthStr} Free insured shipping. Transparent gold pricing.`.trim();
}

function buildDescription(raw, karat, thickness, isHollow, category, variants) {
  const catLabel = CATEGORY_TITLES[category] || 'Chain';
  const construction = isHollow ? 'Hollow' : 'Solid';

  // Grab any original description/shortDescription
  const origDesc = raw.description || raw.shortDescription || '';

  // Build specs table
  const specs = [
    ['Metal', `${karat}K Gold`],
    ['Construction', construction],
    ['Chain Style', catLabel],
  ];
  if (thickness) specs.push(['Thickness', thickness]);

  // Variant table
  let variantTable = '';
  if (variants.length > 1) {
    const rows = variants
      .map((v) => `<tr><td>${v.length}</td><td>${v.weight}g</td><td>$${v.price.toLocaleString()}</td></tr>`)
      .join('\n');
    variantTable = `
<h3>Pricing by Length</h3>
<table>
<thead><tr><th>Length</th><th>Weight</th><th>Price</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>`;
  }

  // Filter out internal/confusing attributes
  const skipAttrs = ['pa_pricing-category', 'Metal', 'Thickness'];
  const rawAttrs = (raw.attributes?.nodes || [])
    .filter((a) => !skipAttrs.includes(a.name) && !skipAttrs.includes(a.label))
    .map((a) => `<li><strong>${a.label || a.name}:</strong> ${a.options?.join(', ') || '—'}</li>`)
    .join('\n');

  // Wire discount pricing
  const wireNote = variants.length > 0
    ? `<p><strong>Wire transfer discount:</strong> Save 4% when you pay by wire transfer.</p>`
    : '';

  return `
<div class="product-description">
${origDesc ? `<p>${origDesc}</p>` : ''}

<h3>Specifications</h3>
<table>
<tbody>
${specs.map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${v}</td></tr>`).join('\n')}
</tbody>
</table>

${variantTable}

${wireNote}

${rawAttrs ? `<h3>Details</h3>\n<ul>\n${rawAttrs}\n<li><strong>SKU:</strong> ${raw.sku || '—'}</li>\n<li><strong>Base Weight:</strong> ${raw.weight || '—'}g</li>\n</ul>` : ''}

<h3>Shipping & Guarantee</h3>
<ul>
<li>Free insured priority shipping</li>
<li>Every piece weighed and tested</li>
<li>Transparent pricing — see exactly what you're paying for</li>
</ul>
</div>
`.trim();
}

// ── Transform raw product ──

function transformProduct(raw) {
  const cats = raw.productCategories?.nodes || [];
  const category = parseCategory(cats);
  if (!category) return null;

  const attrs = raw.attributes?.nodes || [];
  const karat = parseKarat(raw.name, attrs);
  const thickness = parseThickness(raw.name, attrs);
  const isHollow = parseIsHollow(raw.name);
  const baseWeight = parseFloat(raw.weight) || 0;
  const availableLengths = parseLengths(attrs);

  // Build variants
  const rawVars = raw.variations?.nodes || [];
  const variants = [];

  if (rawVars.length > 0) {
    for (const v of rawVars) {
      const w = parseFloat(v.weight) || baseWeight;
      if (w <= 0) continue;
      const lengthAttr = v.attributes?.nodes?.find((a) => a.name === 'pa_length');
      const lengthMatch = lengthAttr?.value?.match(/(\d+)/);
      const length = lengthMatch ? parseInt(lengthMatch[1]) : null;
      if (!length) continue;

      const price = calcPrice(w, karat);
      variants.push({
        length: `${length}"`,
        lengthNum: length,
        weight: w,
        price,
        sku: v.sku || '',
      });
    }
  }

  // Fallback: single variant
  if (variants.length === 0 && baseWeight > 0) {
    const price = calcPrice(baseWeight, karat);
    // Try to get a length from the name
    const lengthMatch = raw.name.match(/(\d+)\s*["'']\s*/);
    const length = lengthMatch ? `${lengthMatch[1]}"` : 'One Size';
    variants.push({
      length,
      lengthNum: lengthMatch ? parseInt(lengthMatch[1]) : 0,
      weight: baseWeight,
      price,
      sku: raw.sku || '',
    });
  }

  if (variants.length === 0) return null;

  // Sort by length
  variants.sort((a, b) => a.lengthNum - b.lengthNum);

  // Deduplicate by length (keep first)
  const seen = new Set();
  const dedupedVariants = variants.filter((v) => {
    if (seen.has(v.length)) return false;
    seen.add(v.length);
    return true;
  });

  // Images
  const images = [];
  if (raw.image?.sourceUrl) images.push({src: raw.image.sourceUrl, alt: raw.image.altText || ''});
  for (const img of raw.galleryImages?.nodes || []) {
    if (img.sourceUrl && !images.find((i) => i.src === img.sourceUrl)) {
      images.push({src: img.sourceUrl, alt: img.altText || ''});
    }
  }

  const prices = dedupedVariants.map((v) => v.price);
  const title = seoTitle(raw.name, karat, thickness, category, isHollow);
  const lengths = dedupedVariants.map((v) => v.lengthNum).filter(Boolean);
  const metaDesc = seoMetaDescription(title, karat, thickness, isHollow, category,
    Math.min(...prices), Math.max(...prices), lengths);
  const description = buildDescription(raw, karat, thickness, isHollow, category, dedupedVariants);

  return {
    title,
    originalName: raw.name,
    slug: raw.slug,
    category,
    karat,
    thickness,
    isHollow,
    variants: dedupedVariants,
    images,
    description,
    metaDescription: metaDesc,
    tags: [
      `${karat}K`,
      CATEGORY_TITLES[category],
      isHollow ? 'Hollow' : 'Solid',
      thickness || null,
      /diamond\s*cut/i.test(raw.name) ? 'Diamond Cut' : null,
      /miami/i.test(raw.name) ? 'Miami' : null,
      /italian/i.test(raw.name) ? 'Italian' : null,
    ].filter(Boolean),
    // Raw data for reference
    rawSku: raw.sku || '',
    rawWeight: baseWeight,
    rawName: raw.name,
  };
}

// ── Shopify metafield creation ──

async function ensureMetafieldDefinitions() {
  // We'll use product metafields in the 'chain' namespace
  const definitions = [
    {name: 'Karat', key: 'karat', type: 'number_integer', description: 'Gold karat (10, 14, 18)'},
    {name: 'Thickness', key: 'thickness', type: 'single_line_text_field', description: 'Chain thickness in mm'},
    {name: 'Construction', key: 'construction', type: 'single_line_text_field', description: 'Solid or Hollow'},
    {name: 'Base Weight', key: 'base_weight', type: 'number_decimal', description: 'Base weight in grams'},
    {name: 'Original SKU', key: 'original_sku', type: 'single_line_text_field', description: 'Vendor SKU'},
    {name: 'Original Name', key: 'original_name', type: 'single_line_text_field', description: 'Original product name from vendor'},
  ];

  console.log('Setting up metafield definitions...');
  for (const def of definitions) {
    try {
      await shopify('metafield_definitions.json', 'POST', {
        metafield_definition: {
          name: def.name,
          namespace: 'chain',
          key: def.key,
          type: def.type,
          description: def.description,
          owner_type: 'PRODUCT',
        },
      });
      console.log(`  Created: chain.${def.key}`);
    } catch (e) {
      // May already exist
      console.log(`  Exists: chain.${def.key}`);
    }
    await sleep(300);
  }
}

// ── Create product in Shopify ──

async function createProduct(product, collectionIds) {
  const shopifyVariants = product.variants.map((v) => ({
    option1: v.length,
    price: v.price.toFixed(2),
    sku: v.sku,
    weight: v.weight,
    weight_unit: 'g',
    inventory_management: null,
    requires_shipping: true,
  }));

  const shopifyImages = product.images.map((img, i) => ({
    src: img.src,
    alt: img.alt || product.title,
    position: i + 1,
  }));

  const body = {
    product: {
      title: product.title,
      handle: product.slug,
      body_html: product.description,
      vendor: 'STYX Gold',
      product_type: CATEGORY_TITLES[product.category],
      tags: product.tags.join(', '),
      published: true,
      options: [{name: 'Length', values: product.variants.map((v) => v.length)}],
      variants: shopifyVariants,
      images: shopifyImages.length > 0 ? shopifyImages : undefined,
      metafields_global_title_tag: product.title + ' | STYX Gold',
      metafields_global_description_tag: product.metaDescription,
      metafields: [
        {namespace: 'chain', key: 'karat', value: String(product.karat), type: 'number_integer'},
        {namespace: 'chain', key: 'thickness', value: product.thickness || 'N/A', type: 'single_line_text_field'},
        {namespace: 'chain', key: 'construction', value: product.isHollow ? 'Hollow' : 'Solid', type: 'single_line_text_field'},
        {namespace: 'chain', key: 'base_weight', value: String(product.rawWeight), type: 'number_decimal'},
        {namespace: 'chain', key: 'original_sku', value: product.rawSku || 'N/A', type: 'single_line_text_field'},
        {namespace: 'chain', key: 'original_name', value: product.rawName, type: 'single_line_text_field'},
      ],
    },
  };

  const data = await shopify('products.json', 'POST', body);
  const sp = data.product;

  // Add to collections
  const catId = collectionIds[product.category];
  if (catId) {
    await shopify('collects.json', 'POST', {collect: {product_id: sp.id, collection_id: catId}});
    await sleep(200);
  }
  const karatId = collectionIds[`${product.karat}k`];
  if (karatId) {
    await shopify('collects.json', 'POST', {collect: {product_id: sp.id, collection_id: karatId}});
    await sleep(200);
  }

  return sp;
}

// ── Main ──

async function main() {
  console.log('=== STYX Clean Import ===\n');

  // 1. Fetch from ShinyJewellers
  console.log('Fetching from ShinyJewellers...');
  const raw = await fetchShinyProducts();
  console.log(`Fetched ${raw.length} raw products`);

  // 2. Transform
  const products = raw.map(transformProduct).filter(Boolean);
  console.log(`Transformed ${products.length} valid products\n`);

  // Show breakdown
  const byCat = {};
  const byKarat = {};
  for (const p of products) {
    byCat[p.category] = (byCat[p.category] || 0) + 1;
    byKarat[`${p.karat}K`] = (byKarat[`${p.karat}K`] || 0) + 1;
  }
  console.log('By category:', byCat);
  console.log('By karat:', byKarat);

  // Sample SEO titles
  console.log('\nSample SEO titles:');
  for (const p of products.slice(0, 6)) {
    console.log(`  "${p.rawName}" -> "${p.title}"`);
    console.log(`    Meta: ${p.metaDescription.slice(0, 120)}...`);
    console.log(`    Variants: ${p.variants.map((v) => v.length + '=$' + v.price.toFixed(0)).join(', ')}`);
  }

  // 3. Metafield definitions
  await ensureMetafieldDefinitions();

  // 4. Create collections
  console.log('\n--- Creating collections ---');
  const collectionIds = {};

  for (const [slug, title] of Object.entries(CATEGORY_TITLES)) {
    const seoDesc = `Shop ${title}s — solid and hollow gold chains in 10K and 14K. Every piece priced transparently by weight. Free insured shipping.`;
    const data = await shopify('custom_collections.json', 'POST', {
      custom_collection: {
        title: `${title}s`,
        handle: slug,
        published: true,
        sort_order: 'price-asc',
        body_html: `<p>${seoDesc}</p>`,
        metafields_global_title_tag: `${title}s — 10K & 14K Gold | STYX Gold`,
        metafields_global_description_tag: seoDesc,
      },
    });
    collectionIds[slug] = data.custom_collection.id;
    console.log(`  ${title}s -> /collections/${slug}`);
    await sleep(300);
  }

  for (const k of [10, 14]) {
    const seoDesc = `Shop ${k}K gold chains — Cuban links, curb chains, box chains, and rope chains. Transparent pricing by weight. Free insured shipping.`;
    const data = await shopify('custom_collections.json', 'POST', {
      custom_collection: {
        title: `${k}K Gold Chains`,
        handle: `${k}k-gold`,
        published: true,
        sort_order: 'price-asc',
        body_html: `<p>${seoDesc}</p>`,
        metafields_global_title_tag: `${k}K Gold Chains | STYX Gold`,
        metafields_global_description_tag: seoDesc,
      },
    });
    collectionIds[`${k}k`] = data.custom_collection.id;
    console.log(`  ${k}K Gold -> /collections/${k}k-gold`);
    await sleep(300);
  }

  // 5. Create products
  console.log(`\n--- Creating ${products.length} products ---`);
  let created = 0;
  let errors = 0;

  for (const product of products) {
    try {
      await createProduct(product, collectionIds);
      created++;
      const minP = Math.min(...product.variants.map((v) => v.price));
      const varStr = product.variants.length > 1
        ? `${product.variants.length} lengths`
        : product.variants[0].length;
      console.log(`[${created}/${products.length}] ${product.title} — ${varStr}, from $${minP.toFixed(0)}`);
      await sleep(500);
    } catch (err) {
      errors++;
      console.error(`ERROR "${product.title}": ${err.message.slice(0, 200)}`);
      await sleep(1000);
    }
  }

  console.log(`\n=== Done! Created ${created} products, ${errors} errors ===`);
  console.log(`Collections: ${Object.keys(collectionIds).length}`);
}

main().catch(console.error);
