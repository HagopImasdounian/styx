// Fetch ALL chains from Shiny Jewellers WooCommerce Store API and export to CSV
// Weight comes from WP REST API meta (if available) or we'll note it's not in public API
const STORE_API = 'https://www.shinyjewellers.com/wp-json/wc/store/v1'
const CHAIN_CATEGORY_ID = 4040 // "Chains" category
const SILVER_CHAIN_CATEGORY_ID = 4041 // "Chains" under Silver
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', Accept: 'application/json' }

function decodeHTML(str) {
  if (!str) return ''
  return str
    .replace(/&#8211;/g, '–')
    .replace(/&#8243;/g, '″')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#036;/g, '$')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/<[^>]*>/g, '')
    .trim()
}

async function fetchPage(categoryId, page) {
  const url = `${STORE_API}/products?category=${categoryId}&per_page=100&page=${page}`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1')
  const total = parseInt(res.headers.get('x-wp-total') || '0')
  const data = await res.json()
  return { products: data, totalPages, total }
}

async function fetchVariation(varId) {
  const url = `${STORE_API}/products/${varId}`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) return null
  return await res.json()
}

async function fetchAllChains() {
  const allProducts = new Map()

  for (const catId of [CHAIN_CATEGORY_ID, SILVER_CHAIN_CATEGORY_ID]) {
    let page = 1
    let totalPages = 1

    while (page <= totalPages) {
      const result = await fetchPage(catId, page)
      totalPages = result.totalPages
      console.error(`  Category ${catId}: page ${page}/${totalPages} — ${result.products.length} products`)

      for (const p of result.products) {
        allProducts.set(p.id, p)
      }
      page++
    }
  }

  return Array.from(allProducts.values())
}

function escapeCSV(val) {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function getAttrValue(product, attrName) {
  const attr = product.attributes?.find(a => a.name.toLowerCase() === attrName.toLowerCase())
  if (!attr) return ''
  return attr.terms?.map(t => decodeHTML(t.name)).join(', ') || ''
}

async function main() {
  console.error('Fetching all chain products...')
  const products = await fetchAllChains()
  console.error(`\nTotal unique chain products: ${products.length}`)

  // Now fetch variation details for variable products
  console.error('\nFetching variation details...')
  const variationDetails = new Map()
  let varCount = 0

  for (const product of products) {
    if (product.variations?.length > 0) {
      for (const v of product.variations) {
        const detail = await fetchVariation(v.id)
        if (detail) {
          variationDetails.set(v.id, detail)
          varCount++
        }
        // Rate limit: small delay
        if (varCount % 10 === 0) {
          console.error(`  Fetched ${varCount} variations...`)
          await new Promise(r => setTimeout(r, 200))
        }
      }
    }
  }
  console.error(`  Total variations fetched: ${varCount}`)

  // CSV headers
  const headers = [
    'Product Name',
    'Product Type',
    'Parent SKU',
    'Variation SKU',
    'Variation Details',
    'Metal',
    'Length',
    'Thickness',
    'Style',
    'Categories',
    'Tags',
    'Description',
    'Main Image URL',
    'Gallery Image URLs',
    'Slug',
    'WooCommerce ID',
    'In Stock',
  ]

  const rows = [headers]

  for (const product of products) {
    const name = decodeHTML(product.name)
    const sku = decodeHTML(product.sku || '')
    const categories = (product.categories || []).map(c => decodeHTML(c.name)).join('; ')
    const tags = (product.tags || []).map(t => decodeHTML(t.name)).join('; ')
    const desc = decodeHTML(product.description || product.short_description || '')
    const mainImage = product.images?.[0]?.src || ''
    const gallery = (product.images || []).slice(1).map(i => i.src).join('; ')
    const metal = getAttrValue(product, 'Metal')
    const length = getAttrValue(product, 'Length')
    const thickness = getAttrValue(product, 'Thickness')
    const style = getAttrValue(product, 'Style') || getAttrValue(product, 'Colour') || getAttrValue(product, 'Colour Choices')

    if (product.variations?.length > 0) {
      for (const v of product.variations) {
        const vDetail = variationDetails.get(v.id)
        const vSku = vDetail ? decodeHTML(vDetail.sku || '') : ''
        const vDesc = v.attributes?.map(a => `${a.name}: ${decodeHTML(a.value)}`).join(', ') || ''
        const vImage = vDetail?.images?.[0]?.src || mainImage

        rows.push([
          name,
          'variation',
          sku,
          vSku,
          vDesc,
          v.attributes?.find(a => a.name === 'Metal')?.value || metal,
          v.attributes?.find(a => a.name === 'Length')?.value || length,
          thickness,
          v.attributes?.find(a => a.name === 'Style')?.value || v.attributes?.find(a => a.name === 'Colour')?.value || style,
          categories,
          tags,
          desc,
          vImage,
          gallery,
          product.slug,
          v.id,
          vDetail?.is_in_stock ?? product.is_in_stock ? 'Yes' : 'No',
        ])
      }
    } else {
      rows.push([
        name,
        'simple',
        sku,
        '',
        '',
        metal,
        length,
        thickness,
        style,
        categories,
        tags,
        desc,
        mainImage,
        gallery,
        product.slug,
        product.id,
        product.is_in_stock ? 'Yes' : 'No',
      ])
    }
  }

  // Output CSV to stdout
  for (const row of rows) {
    console.log(row.map(escapeCSV).join(','))
  }

  console.error(`\nDone! ${rows.length - 1} rows exported to CSV.`)
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
