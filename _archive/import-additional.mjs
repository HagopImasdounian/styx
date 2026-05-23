/**
 * Import additional chain categories from ShinyJewellers into Shopify.
 * Adds: Cable, Figaro, Wheat, Rolo, Singapore
 * Does NOT touch existing products (Cuban, Curb, Box, Rope already imported).
 */

const SHOPIFY_DOMAIN = 'styx-onnsz4sk.myshopify.com';
const SHOPIFY_TOKEN = 'process.env.SHOPIFY_ADMIN_TOKEN';
const SHINY_API = 'https://shinyjewellers.com/api';

const VENDOR_RATE = {10: 117.30, 14: 163.04, 18: 207.00};
const MARKUP = 1.65;

const NEW_CATEGORIES = {
  cable: 'Cable Chain',
  figaro: 'Figaro Chain',
  wheat: 'Wheat Chain',
  rolo: 'Rolo Chain',
  singapore: 'Singapore Chain',
};

const ALL_CATEGORIES = {
  cuban: 'Cuban Link',
  box: 'Box Chain',
  curb: 'Curb Chain',
  rope: 'Rope Chain',
  ...NEW_CATEGORIES,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shopify(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json'},
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-01/${endpoint}`, opts);
  const limit = res.headers.get('X-Shopify-Shop-Api-Call-Limit');
  if (limit) { const u = parseInt(limit.split('/')[0]); if (u > 36) await sleep(1000); }
  if (res.status === 204) return null;
  if (!res.ok) { const t = await res.text(); throw new Error(`${res.status}: ${t.slice(0, 300)}`); }
  return res.json();
}

const PRODUCTS_QUERY = `
  query ChainProducts($after: String) {
    products(first: 50, after: $after, where: {categoryIn: ["cable", "figaro", "wheat", "rolo", "singapore"]}) {
      nodes {
        ... on SimpleProduct {
          id databaseId name slug sku
          description(format: RAW) shortDescription(format: RAW)
          image { sourceUrl }
          galleryImages { nodes { sourceUrl } }
          productCategories { nodes { name slug } }
          attributes { nodes { name options label } }
          weight
        }
        ... on VariableProduct {
          id databaseId name slug sku
          description(format: RAW) shortDescription(format: RAW)
          image { sourceUrl }
          galleryImages { nodes { sourceUrl } }
          productCategories { nodes { name slug } }
          attributes { nodes { name options label } }
          weight
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

function parseKarat(name, attrs) {
  if (/18\s*k/i.test(name) || /18\s*karat/i.test(name)) return 18;
  if (/14\s*k/i.test(name) || /14\s*karat/i.test(name)) return 14;
  if (/10\s*k/i.test(name) || /10\s*karat/i.test(name)) return 10;
  const pricingAttr = attrs.find((a) => a.name === 'pa_pricing-category');
  if (pricingAttr?.options?.[0]) {
    if (/18k/i.test(pricingAttr.options[0])) return 18;
    if (/14k/i.test(pricingAttr.options[0])) return 14;
    if (/10k/i.test(pricingAttr.options[0])) return 10;
  }
  const metalAttr = attrs.find((a) => a.name === 'Metal');
  if (metalAttr?.options?.[0]) {
    const m = metalAttr.options[0].match(/(\d+)K/i);
    if (m) return parseInt(m[1]);
  }
  return 10;
}

function parseCategory(cats) {
  for (const c of cats) {
    if (c.slug in ALL_CATEGORIES) return c.slug;
  }
  return null;
}

function parseThickness(name, attrs) {
  const m = name.match(/([\d.]+)\s*mm/i);
  if (m) return `${m[1]}mm`;
  const ta = attrs.find((a) => a.name === 'Thickness');
  if (ta?.options?.[0]) return ta.options[0];
  return '';
}

function calcPrice(weightGrams, karat) {
  const rate = VENDOR_RATE[karat] || VENDOR_RATE[10];
  return Math.round(weightGrams * rate * MARKUP * 100) / 100;
}

function seoTitle(name, karat, thickness, category, isHollow) {
  const catLabel = ALL_CATEGORIES[category] || 'Chain';
  const parts = [`${karat}K Gold`];
  if (thickness) parts.push(thickness);
  if (isHollow) parts.push('Hollow');
  parts.push(catLabel);
  if (/diamond\s*cut/i.test(name)) parts.splice(2, 0, 'Diamond Cut');
  return parts.join(' ');
}

function seoMetaDescription(title, karat, thickness, isHollow, category, minPrice, maxPrice, lengths) {
  const construction = isHollow ? 'hollow' : 'solid';
  const catLabel = ALL_CATEGORIES[category]?.toLowerCase() || 'chain';
  const priceStr = minPrice === maxPrice ? `$${minPrice.toLocaleString()}` : `from $${minPrice.toLocaleString()}`;
  const lengthStr = lengths.length > 0 ? `Available in ${lengths.map((l) => l + '"').join(', ')}.` : '';
  return `Shop ${title} — ${construction} ${karat}K gold ${catLabel}${thickness ? `, ${thickness} width` : ''}. ${priceStr}. ${lengthStr} Free insured shipping. Transparent gold pricing.`.trim();
}

function buildDescription(raw, karat, thickness, isHollow, category, variants) {
  const catLabel = ALL_CATEGORIES[category] || 'Chain';
  const construction = isHollow ? 'Hollow' : 'Solid';
  const origDesc = raw.description || raw.shortDescription || '';
  const specs = [['Metal', `${karat}K Gold`], ['Construction', construction], ['Chain Style', catLabel]];
  if (thickness) specs.push(['Thickness', thickness]);

  let variantTable = '';
  if (variants.length > 1) {
    const rows = variants.map((v) => `<tr><td>${v.length}</td><td>${v.weight}g</td><td>$${v.price.toLocaleString()}</td></tr>`).join('\n');
    variantTable = `<h3>Pricing by Length</h3><table><thead><tr><th>Length</th><th>Weight</th><th>Price</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  const skipAttrs = ['pa_pricing-category', 'Metal', 'Thickness'];
  const rawAttrs = (raw.attributes?.nodes || [])
    .filter((a) => !skipAttrs.includes(a.name) && !skipAttrs.includes(a.label))
    .map((a) => `<li><strong>${a.label || a.name}:</strong> ${a.options?.join(', ') || '—'}</li>`).join('\n');

  return `<div class="product-description">
${origDesc ? `<p>${origDesc}</p>` : ''}
<h3>Specifications</h3>
<table><tbody>${specs.map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${v}</td></tr>`).join('\n')}</tbody></table>
${variantTable}
<p><strong>Wire transfer discount:</strong> Save 4% when you pay by wire transfer.</p>
${rawAttrs ? `<h3>Details</h3><ul>${rawAttrs}<li><strong>SKU:</strong> ${raw.sku || '—'}</li><li><strong>Base Weight:</strong> ${raw.weight || '—'}g</li></ul>` : ''}
<h3>Shipping & Guarantee</h3>
<ul><li>Free insured priority shipping</li><li>Every piece weighed and tested</li><li>Transparent pricing — see exactly what you're paying for</li></ul>
</div>`;
}

function transformProduct(raw) {
  const cats = raw.productCategories?.nodes || [];
  const category = parseCategory(cats);
  if (!category || !(category in NEW_CATEGORIES)) return null;

  const attrs = raw.attributes?.nodes || [];
  const karat = parseKarat(raw.name, attrs);
  const thickness = parseThickness(raw.name, attrs);
  const isHollow = /hollow/i.test(raw.name);
  const baseWeight = parseFloat(raw.weight) || 0;

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
      variants.push({ length: `${length}"`, lengthNum: length, weight: w, price: calcPrice(w, karat), sku: v.sku || '' });
    }
  }

  if (variants.length === 0 && baseWeight > 0) {
    const price = calcPrice(baseWeight, karat);
    const lengthMatch = raw.name.match(/(\d+)\s*["'']\s*/);
    variants.push({ length: lengthMatch ? `${lengthMatch[1]}"` : 'One Size', lengthNum: lengthMatch ? parseInt(lengthMatch[1]) : 0, weight: baseWeight, price, sku: raw.sku || '' });
  }

  if (variants.length === 0) return null;
  variants.sort((a, b) => a.lengthNum - b.lengthNum);
  const seen = new Set();
  const deduped = variants.filter((v) => { if (seen.has(v.length)) return false; seen.add(v.length); return true; });

  const images = [];
  if (raw.image?.sourceUrl) images.push({src: raw.image.sourceUrl, alt: ''});
  for (const img of raw.galleryImages?.nodes || []) {
    if (img.sourceUrl && !images.find((i) => i.src === img.sourceUrl)) images.push({src: img.sourceUrl, alt: ''});
  }

  const prices = deduped.map((v) => v.price);
  const title = seoTitle(raw.name, karat, thickness, category, isHollow);
  const lengths = deduped.map((v) => v.lengthNum).filter(Boolean);
  const metaDesc = seoMetaDescription(title, karat, thickness, isHollow, category, Math.min(...prices), Math.max(...prices), lengths);

  return {
    title, slug: raw.slug, category, karat, thickness, isHollow,
    variants: deduped, images,
    description: buildDescription(raw, karat, thickness, isHollow, category, deduped),
    metaDescription: metaDesc,
    tags: [`${karat}K`, ALL_CATEGORIES[category], isHollow ? 'Hollow' : 'Solid', thickness || null, /diamond\s*cut/i.test(raw.name) ? 'Diamond Cut' : null, /italian/i.test(raw.name) ? 'Italian' : null].filter(Boolean),
    rawSku: raw.sku || '', rawWeight: baseWeight, rawName: raw.name,
  };
}

async function main() {
  console.log('=== Import Additional Chains ===\n');

  // Fetch
  console.log('Fetching from ShinyJewellers (cable, figaro, wheat, rolo, singapore)...');
  const raw = await fetchShinyProducts();
  console.log(`Fetched ${raw.length} raw products`);

  const products = raw.map(transformProduct).filter(Boolean);
  console.log(`Transformed ${products.length} valid products\n`);

  const byCat = {};
  for (const p of products) byCat[p.category] = (byCat[p.category] || 0) + 1;
  console.log('By category:', byCat);

  // Get existing karat collection IDs
  const {custom_collections} = await shopify('custom_collections.json?limit=250');
  const existingCollections = {};
  for (const c of custom_collections) existingCollections[c.handle] = c.id;
  console.log('Existing collections:', Object.keys(existingCollections));

  // Create new category collections
  const collectionIds = {...existingCollections};
  for (const [slug, title] of Object.entries(NEW_CATEGORIES)) {
    if (collectionIds[slug]) { console.log(`  ${title} already exists`); continue; }
    const seoDesc = `Shop ${title}s — solid and hollow gold chains in 10K and 14K. Every piece priced transparently by weight. Free insured shipping.`;
    const data = await shopify('custom_collections.json', 'POST', {
      custom_collection: {
        title: `${title}s`, handle: slug, published: true, sort_order: 'price-asc',
        body_html: `<p>${seoDesc}</p>`,
        metafields_global_title_tag: `${title}s — 10K & 14K Gold | STYX Gold`,
        metafields_global_description_tag: seoDesc,
      },
    });
    collectionIds[slug] = data.custom_collection.id;
    console.log(`  Created: ${title}s -> /collections/${slug}`);
    await sleep(300);
  }

  // Get location for inventory
  const {locations} = await shopify('locations.json');
  const loc = locations.find(l => l.name === 'Shiny') || locations[0];

  // Create products
  console.log(`\n--- Creating ${products.length} products ---`);
  let created = 0, errors = 0;

  for (const product of products) {
    try {
      const shopifyVariants = product.variants.map((v) => ({
        option1: v.length, price: v.price.toFixed(2), sku: v.sku,
        weight: v.weight, weight_unit: 'g', inventory_management: 'shopify', requires_shipping: true,
      }));
      const shopifyImages = product.images.map((img, i) => ({ src: img.src, alt: img.alt || product.title, position: i + 1 }));

      const data = await shopify('products.json', 'POST', {
        product: {
          title: product.title, handle: product.slug, body_html: product.description,
          vendor: 'STYX Gold', product_type: ALL_CATEGORIES[product.category],
          tags: product.tags.join(', '), published: true,
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
      });
      const sp = data.product;

      // Add to collections
      const catId = collectionIds[product.category];
      if (catId) { await shopify('collects.json', 'POST', {collect: {product_id: sp.id, collection_id: catId}}); await sleep(200); }
      const karatId = collectionIds[`${product.karat}k-gold`];
      if (karatId) { await shopify('collects.json', 'POST', {collect: {product_id: sp.id, collection_id: karatId}}); await sleep(200); }

      // Set inventory qty 1 at Shiny
      for (const v of sp.variants) {
        await shopify('inventory_levels/set.json', 'POST', { location_id: loc.id, inventory_item_id: v.inventory_item_id, available: 1 });
        await sleep(200);
      }

      created++;
      const minP = Math.min(...product.variants.map((v) => v.price));
      console.log(`[${created}/${products.length}] ${product.title} — ${product.variants.length} variants, from $${minP.toFixed(0)}`);
      await sleep(400);
    } catch (err) {
      errors++;
      console.error(`ERROR "${product.title}": ${err.message.slice(0, 200)}`);
      await sleep(1000);
    }
  }

  console.log(`\n=== Done! Created ${created} products, ${errors} errors ===`);
}

main().catch(console.error);
