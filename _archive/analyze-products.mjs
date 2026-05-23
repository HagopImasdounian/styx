const SHOPIFY_DOMAIN = 'styx-onnsz4sk.myshopify.com';
const SHOPIFY_TOKEN = 'process.env.SHOPIFY_ADMIN_TOKEN';

async function main() {
  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/products.json?limit=250&fields=id,title,product_type,tags,variants`,
    {headers: {'X-Shopify-Access-Token': SHOPIFY_TOKEN}},
  );
  const {products} = await res.json();

  console.log(`Total products in Shopify: ${products.length}\n`);

  // Tags breakdown
  const tagCounts = {};
  for (const p of products) {
    for (const tag of p.tags.split(', ').map((t) => t.trim()).filter(Boolean)) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  console.log('Tags breakdown:');
  Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tag, count]) => console.log(`  ${tag}: ${count}`));

  // Price range
  const prices = products.flatMap((p) =>
    p.variants.map((v) => parseFloat(v.price)),
  );
  prices.sort((a, b) => a - b);
  console.log(`\nPrice range: $${prices[0].toFixed(2)} – $${prices.at(-1).toFixed(2)}`);
  console.log(`Median: $${prices[Math.floor(prices.length / 2)].toFixed(2)}`);

  // Weight analysis
  const items = [];
  for (const p of products) {
    for (const v of p.variants) {
      const w = parseFloat(v.weight) || 0;
      if (w > 0) items.push({title: p.title, weight: w, price: parseFloat(v.price)});
    }
  }
  items.sort((a, b) => a.weight - b.weight);
  console.log(`\nWeight range: ${items[0].weight}g – ${items.at(-1).weight}g`);

  // Hollow vs Solid
  const hollow = products.filter((p) => p.tags.includes('Hollow')).length;
  const solid = products.filter((p) => p.tags.includes('Solid')).length;
  console.log(`\nHollow: ${hollow}, Solid: ${solid}`);

  // Product types
  const types = {};
  for (const p of products) {
    types[p.product_type] = (types[p.product_type] || 0) + 1;
  }
  console.log('\nProduct types:', types);

  // Under $1000 vs over
  const under1k = prices.filter((p) => p < 1000).length;
  const under5k = prices.filter((p) => p >= 1000 && p < 5000).length;
  const over5k = prices.filter((p) => p >= 5000).length;
  console.log(`\nPrice tiers: Under $1K: ${under1k}, $1K-$5K: ${under5k}, Over $5K: ${over5k}`);
}

main().catch(console.error);
