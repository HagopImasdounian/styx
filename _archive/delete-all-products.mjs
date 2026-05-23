/**
 * Delete ALL products from Shopify store via Admin API.
 * Uses GraphQL bulk mutation for speed.
 */

import 'dotenv/config';

const STORE = process.env.PUBLIC_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = '2024-10';
const ENDPOINT = `https://${STORE}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getAllProductIds() {
  const ids = [];
  let cursor = null;

  while (true) {
    const afterClause = cursor ? `, after: "${cursor}"` : '';
    const { data, errors } = await gql(`{
      products(first: 250${afterClause}) {
        edges {
          node { id }
          cursor
        }
        pageInfo { hasNextPage }
      }
    }`);

    if (errors) {
      console.error('GraphQL errors:', errors);
      break;
    }

    const edges = data.products.edges;
    for (const edge of edges) {
      ids.push(edge.node.id);
      cursor = edge.cursor;
    }

    console.log(`  Fetched ${ids.length} product IDs...`);

    if (!data.products.pageInfo.hasNextPage) break;
  }

  return ids;
}

async function deleteProduct(id) {
  const { data, errors } = await gql(`
    mutation deleteProduct($id: ID!) {
      productDelete(input: { id: $id }) {
        deletedProductId
        userErrors { field message }
      }
    }
  `, { id });

  if (errors) {
    console.error(`  Error deleting ${id}:`, errors);
    return false;
  }

  const userErrors = data?.productDelete?.userErrors;
  if (userErrors?.length) {
    console.error(`  User errors deleting ${id}:`, userErrors);
    return false;
  }

  return true;
}

async function main() {
  console.log(`Store: ${STORE}`);
  console.log('Fetching all product IDs...\n');

  const ids = await getAllProductIds();
  console.log(`\nFound ${ids.length} products to delete.\n`);

  if (ids.length === 0) {
    console.log('No products to delete!');
    return;
  }

  let deleted = 0;
  let failed = 0;

  // Delete in batches of 10 (respect rate limits)
  for (let i = 0; i < ids.length; i += 10) {
    const batch = ids.slice(i, i + 10);
    const results = await Promise.all(batch.map(id => deleteProduct(id)));

    for (const ok of results) {
      if (ok) deleted++;
      else failed++;
    }

    console.log(`  Progress: ${deleted + failed}/${ids.length} (${deleted} deleted, ${failed} failed)`);

    // Small delay to respect rate limits
    if (i + 10 < ids.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`\nDone! Deleted ${deleted} products. Failed: ${failed}.`);
}

main().catch(console.error);
