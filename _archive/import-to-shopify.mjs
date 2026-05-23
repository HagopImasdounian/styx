/**
 * Import chain products from ShinyJewellers into Shopify.
 *
 * Pricing: weight (g) × vendor rate per gram × 1.65
 * 10K = $117.30/g, 14K = $163.04/g, 18K = $207.00/g
 *
 * Usage: node import-to-shopify.mjs
 */

const SHOPIFY_DOMAIN = 'styx-onnsz4sk.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || 'process.env.SHOPIFY_ADMIN_TOKEN';
const SHINY_API = 'https://shinyjewellers.com/api';

const VENDOR_RATE = {10: 117.30, 14: 163.04, 18: 207.00};
const MARKUP = 1.65;

const CATEGORIES = ['cuban', 'box', 'curb', 'rope'];
const CATEGORY_TITLES = {
  cuban: 'Cuban Link',
  box: 'Box Chain',
  curb: 'Curb Chain',
  rope: 'Rope Chain',
};

// --- Shopify Admin REST helpers ---

async function shopifyRest(endpoint, method = 'GET', body = null) {
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
  // Handle rate limits
  const remaining = res.headers.get('X-Shopify-Shop-Api-Call-Limit');
  if (remaining) {
    const [used, max] = remaining.split('/').map(Number);
    if (used > max - 4) {
      console.log('  (rate limit pause)');
      await sleep(1000);
    }
  }
  if (res.status === 204) return null;
  return res.json();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- ShinyJewellers fetch ---

const PRODUCTS_QUERY = `
  query ChainProducts($after: String) {
    products(first: 50, after: $after, where: {categoryIn: ["cuban", "box", "curb", "rope"]}) {
      nodes {
        ... on SimpleProduct {
          id databaseId name slug sku
          shortDescription(format: RAW)
          image { sourceUrl }
          galleryImages { nodes { sourceUrl } }
          productCategories { nodes { name slug } }
          attributes { nodes { name options } }
          weight
        }
        ... on VariableProduct {
          id databaseId name slug sku
          shortDescription(format: RAW)
          image { sourceUrl }
          galleryImages { nodes { sourceUrl } }
          productCategories { nodes { name slug } }
          attributes { nodes { name options } }
          weight
          variations(first: 50) {
            nodes {
              id databaseId name sku weight
              attributes { nodes { name value } }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

async function fetchShinyProducts() {
  const allNodes = [];
  let after = null;
  let hasNext = true;

  while (hasNext) {
    const res = await fetch(SHINY_API, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({query: PRODUCTS_QUERY, variables: {after}}),
    });
    const json = await res.json();
    const products = json?.data?.products;
    if (!products) break;
    allNodes.push(...products.nodes);
    hasNext = products.pageInfo.hasNextPage;
    after = products.pageInfo.endCursor;
  }

  return allNodes;
}

// --- Parse & transform ---

function parseKarat(name) {
  if (/18\s*k/i.test(name) || /18\s*karat/i.test(name)) return 18;
  if (/14\s*k/i.test(name) || /14\s*karat/i.test(name)) return 14;
  return 10;
}

function parseCategory(cats) {
  for (const c of cats) {
    if (CATEGORIES.includes(c.slug)) return c.slug;
  }
  return null;
}

function parseThickness(name, attrs) {
  const thicknessAttr = attrs.find(
    (a) => a.name === 'Thickness' || a.name === 'pa_thickness',
  );
  if (thicknessAttr?.options?.[0]) return thicknessAttr.options[0];

  // Try extracting from name: "5.3mm" or "5.3 mm"
  const m = name.match(/(\d+\.?\d*)\s*mm/i);
  return m ? `${m[1]}mm` : '';
}

function parseLengthFromVariant(attrs) {
  const lengthAttr = attrs.find((a) => a.name === 'pa_length');
  if (lengthAttr?.value) {
    // "20-inch" -> "20"
    const m = lengthAttr.value.match(/(\d+)/);
    return m ? m[1] : lengthAttr.value;
  }
  return '';
}

function calcPrice(weightGrams, karat) {
  const rate = VENDOR_RATE[karat] || VENDOR_RATE[10];
  return Math.round(weightGrams * rate * MARKUP * 100) / 100;
}

function transformProduct(raw) {
  const cats = raw.productCategories?.nodes || [];
  const category = parseCategory(cats);
  if (!category) return null;

  const karat = parseKarat(raw.name);
  const attrs = raw.attributes?.nodes || [];
  const thickness = parseThickness(raw.name, attrs);
  const isHollow = /hollow/i.test(raw.name);
  const baseWeight = parseFloat(raw.weight) || 0;

  // Build variants (each length = a variant)
  const rawVariations = raw.variations?.nodes || [];
  const variants = [];

  if (rawVariations.length > 0) {
    for (const v of rawVariations) {
      const w = parseFloat(v.weight) || baseWeight;
      if (w <= 0) continue;
      const length = parseLengthFromVariant(v.attributes?.nodes || []);
      if (!length) continue;
      const price = calcPrice(w, karat);
      variants.push({
        length: `${length}"`,
        weight: w,
        price,
        sku: v.sku || '',
      });
    }
  }

  // If no length variants, create a single variant
  if (variants.length === 0 && baseWeight > 0) {
    const price = calcPrice(baseWeight, karat);
    variants.push({
      length: 'One Size',
      weight: baseWeight,
      price,
      sku: raw.sku || '',
    });
  }

  if (variants.length === 0) return null;

  // Sort variants by length ascending
  variants.sort((a, b) => {
    const aNum = parseInt(a.length) || 0;
    const bNum = parseInt(b.length) || 0;
    return aNum - bNum;
  });

  // Clean up product title
  let title = raw.name.trim();

  // Build images array
  const images = [];
  if (raw.image?.sourceUrl) images.push(raw.image.sourceUrl);
  for (const img of raw.galleryImages?.nodes || []) {
    if (img.sourceUrl && !images.includes(img.sourceUrl)) {
      images.push(img.sourceUrl);
    }
  }

  return {
    title,
    slug: raw.slug,
    category,
    karat,
    thickness,
    isHollow,
    variants,
    images,
    description: raw.shortDescription || '',
    tags: [
      `${karat}K`,
      CATEGORY_TITLES[category],
      isHollow ? 'Hollow' : 'Solid',
      thickness ? thickness : null,
    ].filter(Boolean),
  };
}

// --- Create in Shopify ---

async function createCollections() {
  console.log('\n--- Creating collections ---');
  const collectionIds = {};

  for (const [slug, title] of Object.entries(CATEGORY_TITLES)) {
    console.log(`Creating collection: ${title}`);
    const data = await shopifyRest('custom_collections.json', 'POST', {
      custom_collection: {
        title,
        handle: slug,
        published: true,
        sort_order: 'best-selling',
      },
    });
    collectionIds[slug] = data.custom_collection.id;
    console.log(`  -> ID: ${collectionIds[slug]}`);
    await sleep(300);
  }

  // Also create karat collections
  for (const k of [10, 14, 18]) {
    console.log(`Creating collection: ${k}K Gold`);
    const data = await shopifyRest('custom_collections.json', 'POST', {
      custom_collection: {
        title: `${k}K Gold`,
        handle: `${k}k-gold`,
        published: true,
      },
    });
    collectionIds[`${k}k`] = data.custom_collection.id;
    console.log(`  -> ID: ${collectionIds[`${k}k`]}`);
    await sleep(300);
  }

  return collectionIds;
}

async function createProduct(product, collectionIds) {
  // Build Shopify variants
  const shopifyVariants = product.variants.map((v) => ({
    option1: v.length,
    price: v.price.toFixed(2),
    sku: v.sku,
    weight: v.weight,
    weight_unit: 'g',
    inventory_management: null, // no inventory tracking
    requires_shipping: true,
  }));

  // Build images
  const shopifyImages = product.images.map((src, i) => ({
    src,
    position: i + 1,
  }));

  const body = {
    product: {
      title: product.title,
      handle: product.slug,
      body_html: product.description || '',
      vendor: 'STYX Gold',
      product_type: CATEGORY_TITLES[product.category],
      tags: product.tags.join(', '),
      published: true,
      options: [{name: 'Length', values: product.variants.map((v) => v.length)}],
      variants: shopifyVariants,
      images: shopifyImages.length > 0 ? shopifyImages : undefined,
    },
  };

  const data = await shopifyRest('products.json', 'POST', body);
  const shopifyProduct = data.product;

  // Add to category collection
  const catCollectionId = collectionIds[product.category];
  if (catCollectionId) {
    await shopifyRest('collects.json', 'POST', {
      collect: {
        product_id: shopifyProduct.id,
        collection_id: catCollectionId,
      },
    });
  }

  // Add to karat collection
  const karatCollectionId = collectionIds[`${product.karat}k`];
  if (karatCollectionId) {
    await shopifyRest('collects.json', 'POST', {
      collect: {
        product_id: shopifyProduct.id,
        collection_id: karatCollectionId,
      },
    });
  }

  return shopifyProduct;
}

// --- Main ---

async function main() {
  console.log('=== STYX Chain Import ===\n');

  // 1. Fetch from ShinyJewellers
  console.log('Fetching products from ShinyJewellers...');
  const rawProducts = await fetchShinyProducts();
  console.log(`Fetched ${rawProducts.length} raw products`);

  // 2. Transform
  const products = rawProducts.map(transformProduct).filter(Boolean);
  console.log(`Transformed ${products.length} valid products`);

  // Summary
  const byCat = {};
  for (const p of products) {
    byCat[p.category] = (byCat[p.category] || 0) + 1;
  }
  console.log('By category:', byCat);

  const byKarat = {};
  for (const p of products) {
    byKarat[`${p.karat}K`] = (byKarat[`${p.karat}K`] || 0) + 1;
  }
  console.log('By karat:', byKarat);

  // Show price samples
  console.log('\nPrice samples:');
  for (const p of products.slice(0, 5)) {
    const minPrice = Math.min(...p.variants.map((v) => v.price));
    const maxPrice = Math.max(...p.variants.map((v) => v.price));
    console.log(
      `  ${p.title} (${p.karat}K, ${p.variants.length} variants) — $${minPrice.toFixed(2)} – $${maxPrice.toFixed(2)}`,
    );
  }

  // 3. Create collections in Shopify
  const collectionIds = await createCollections();

  // 4. Create products
  console.log(`\n--- Creating ${products.length} products in Shopify ---`);
  let created = 0;
  let errors = 0;

  for (const product of products) {
    try {
      const result = await createProduct(product, collectionIds);
      created++;
      const minP = Math.min(...product.variants.map((v) => v.price));
      console.log(
        `[${created}/${products.length}] ${product.title} — ${product.variants.length} variants, from $${minP.toFixed(2)}`,
      );
      // Respect rate limits
      await sleep(500);
    } catch (err) {
      errors++;
      console.error(`ERROR creating "${product.title}": ${err.message}`);
      await sleep(1000);
    }
  }

  console.log(`\n=== Done! Created ${created} products, ${errors} errors ===`);
}

main().catch(console.error);
