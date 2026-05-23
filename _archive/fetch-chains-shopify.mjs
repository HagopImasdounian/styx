// Fetch ALL chains from Shiny Jewellers and export in Shopify Product CSV Import format
const STORE_API = 'https://www.shinyjewellers.com/wp-json/wc/store/v1'
const CHAIN_CATEGORY_ID = 4040
const SILVER_CHAIN_CATEGORY_ID = 4041
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', Accept: 'application/json' }

function decodeHTML(str) {
  if (!str) return ''
  return str
    .replace(/&#8211;/g, '–').replace(/&#8243;/g, '″').replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
    .replace(/&#036;/g, '$').replace(/&#038;/g, '&').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function slugToTitle(slug) {
  if (!slug) return ''
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

async function fetchPage(categoryId, page) {
  const url = `${STORE_API}/products?category=${categoryId}&per_page=100&page=${page}`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1')
  return { products: await res.json(), totalPages }
}

async function fetchVariation(varId) {
  const res = await fetch(`${STORE_API}/products/${varId}`, { headers: HEADERS })
  if (!res.ok) return null
  return await res.json()
}

async function fetchAllChains() {
  const allProducts = new Map()
  for (const catId of [CHAIN_CATEGORY_ID, SILVER_CHAIN_CATEGORY_ID]) {
    let page = 1, totalPages = 1
    while (page <= totalPages) {
      const result = await fetchPage(catId, page)
      totalPages = result.totalPages
      console.error(`  Cat ${catId}: page ${page}/${totalPages} — ${result.products.length} products`)
      for (const p of result.products) allProducts.set(p.id, p)
      page++
    }
  }
  return Array.from(allProducts.values())
}

function getAttr(product, name) {
  const attr = product.attributes?.find(a => a.name.toLowerCase() === name.toLowerCase())
  if (!attr) return ''
  return attr.terms?.map(t => decodeHTML(t.name)).join(', ') || ''
}

function parseGrams(weightStr) {
  if (!weightStr) return ''
  const match = weightStr.match(/([\d.]+)\s*g/i)
  return match ? parseFloat(match[1]) : ''
}

function escapeCSV(val) {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

async function main() {
  console.error('Fetching all chain products...')
  const products = await fetchAllChains()
  console.error(`\nTotal unique products: ${products.length}`)

  // Fetch variation details for images/SKUs
  console.error('\nFetching variation details...')
  const variationDetails = new Map()
  let varCount = 0
  for (const product of products) {
    if (product.variations?.length > 0) {
      for (const v of product.variations) {
        const detail = await fetchVariation(v.id)
        if (detail) variationDetails.set(v.id, detail)
        varCount++
        if (varCount % 20 === 0) {
          console.error(`  ${varCount} variations...`)
          await new Promise(r => setTimeout(r, 100))
        }
      }
    }
  }
  console.error(`  Total variations: ${varCount}`)

  // Shopify CSV headers (standard import columns)
  const headers = [
    'Handle',
    'Title',
    'Body (HTML)',
    'Vendor',
    'Product Category',
    'Type',
    'Tags',
    'Published',
    'Option1 Name',
    'Option1 Value',
    'Option2 Name',
    'Option2 Value',
    'Option3 Name',
    'Option3 Value',
    'Variant SKU',
    'Variant Grams',
    'Variant Inventory Tracker',
    'Variant Inventory Qty',
    'Variant Inventory Policy',
    'Variant Fulfillment Service',
    'Variant Price',
    'Variant Compare At Price',
    'Variant Requires Shipping',
    'Variant Taxable',
    'Image Src',
    'Image Position',
    'Image Alt Text',
    'Variant Image',
    'Variant Weight',
    'Variant Weight Unit',
    'Status',
  ]

  const rows = [headers]

  for (const product of products) {
    const handle = product.slug
    const title = decodeHTML(product.name)
    const body = product.description || ''
    const tags = (product.tags || []).map(t => decodeHTML(t.name))

    // Add extra attributes as tags so they're searchable in Shopify
    const weightStr = getAttr(product, 'Weight')
    const weightGrams = parseGrams(weightStr)
    const thickness = getAttr(product, 'Thickness')
    const width = getAttr(product, 'Width')
    const chainType = getAttr(product, 'Chain')
    const claspType = getAttr(product, 'Clasp Type')
    const madeIn = getAttr(product, 'Made In')
    const finish = getAttr(product, 'Finish')
    const stone = getAttr(product, 'Stone')
    const pearlSize = getAttr(product, 'Pearl Size')

    // Build enriched tags
    const allTags = [...tags]
    if (thickness) allTags.push(`Thickness: ${thickness}`)
    if (width) allTags.push(`Width: ${width}`)
    if (chainType) allTags.push(`Chain: ${chainType}`)
    if (claspType) allTags.push(`Clasp: ${claspType}`)
    if (madeIn) allTags.push(`Made In: ${madeIn}`)
    if (finish) allTags.push(`Finish: ${finish}`)
    if (stone) allTags.push(`Stone: ${stone}`)
    if (pearlSize) allTags.push(`Pearl Size: ${pearlSize}`)
    if (weightStr) allTags.push(`Weight: ${weightStr}`)

    const tagsStr = allTags.join(', ')
    const mainImage = product.images?.[0]?.src || ''
    const galleryImages = (product.images || []).slice(1)

    if (product.variations?.length > 0) {
      const varAttrs = product.attributes?.filter(a => a.has_variations) || []
      const option1Attr = varAttrs[0]
      const option2Attr = varAttrs[1]
      const option3Attr = varAttrs[2]

      for (let vi = 0; vi < product.variations.length; vi++) {
        const v = product.variations[vi]
        const vDetail = variationDetails.get(v.id)
        const vSku = vDetail ? decodeHTML(vDetail.sku || '') : ''
        const isFirstRow = vi === 0

        // Get variation-specific image (fall back to main product image)
        const vImage = vDetail?.images?.[0]?.src || mainImage

        const getVarAttrVal = (attrName) => {
          if (!attrName) return ''
          const va = v.attributes?.find(a => a.name === attrName)
          if (!va || !va.value) return ''
          return slugToTitle(va.value)
        }

        const row = [
          handle,
          isFirstRow ? title : '',
          isFirstRow ? body : '',
          isFirstRow ? 'Shiny Jewellers' : '',
          isFirstRow ? 'Jewelry > Necklaces' : '',
          isFirstRow ? 'Chain' : '',
          isFirstRow ? tagsStr : '',
          isFirstRow ? 'TRUE' : '',
          option1Attr ? option1Attr.name : '',
          option1Attr ? getVarAttrVal(option1Attr.name) : '',
          option2Attr ? option2Attr.name : '',
          option2Attr ? getVarAttrVal(option2Attr.name) : '',
          option3Attr ? option3Attr.name : '',
          option3Attr ? getVarAttrVal(option3Attr.name) : '',
          vSku,
          weightGrams, // Variant Grams
          'shopify',
          '',
          'deny',
          'manual',
          0,
          '',
          'TRUE',
          'TRUE',
          isFirstRow ? mainImage : '',
          isFirstRow ? 1 : '',
          isFirstRow ? title : '',
          vImage,
          weightGrams,
          'g',
          'draft',
        ]
        rows.push(row)

        // Add gallery images as separate rows on first variation
        if (isFirstRow) {
          for (let gi = 0; gi < galleryImages.length; gi++) {
            const imgRow = new Array(headers.length).fill('')
            imgRow[0] = handle
            imgRow[24] = galleryImages[gi].src
            imgRow[25] = gi + 2
            imgRow[26] = `${title} - ${gi + 2}`
            rows.push(imgRow)
          }

          // Also add any unique variation images as gallery images
          const addedImages = new Set([mainImage])
          galleryImages.forEach(i => addedImages.add(i.src))
          let extraPos = galleryImages.length + 2
          for (const vv of product.variations) {
            const vvDetail = variationDetails.get(vv.id)
            const vvImg = vvDetail?.images?.[0]?.src
            if (vvImg && !addedImages.has(vvImg)) {
              addedImages.add(vvImg)
              const imgRow = new Array(headers.length).fill('')
              imgRow[0] = handle
              imgRow[24] = vvImg
              imgRow[25] = extraPos++
              imgRow[26] = `${title} - ${extraPos - 1}`
              rows.push(imgRow)
            }
          }
        }
      }
    } else {
      // Simple product
      const sku = decodeHTML(product.sku || '')
      const metal = getAttr(product, 'Metal')
      const length = getAttr(product, 'Length')
      const colour = getAttr(product, 'Colour') || getAttr(product, 'Style')

      const row = [
        handle,
        title,
        body,
        'Shiny Jewellers',
        'Jewelry > Necklaces',
        'Chain',
        tagsStr,
        'TRUE',
        length ? 'Length' : (metal ? 'Metal' : ''),
        length || (metal || ''),
        length && metal ? 'Metal' : (colour ? 'Colour' : ''),
        length && metal ? metal : (colour || ''),
        (length && metal && colour) ? 'Colour' : '',
        (length && metal && colour) ? colour : '',
        sku,
        weightGrams,
        'shopify',
        '',
        'deny',
        'manual',
        0,
        '',
        'TRUE',
        'TRUE',
        mainImage,
        1,
        title,
        mainImage,
        weightGrams,
        'g',
        'draft',
      ]
      rows.push(row)

      for (let gi = 0; gi < galleryImages.length; gi++) {
        const imgRow = new Array(headers.length).fill('')
        imgRow[0] = handle
        imgRow[24] = galleryImages[gi].src
        imgRow[25] = gi + 2
        imgRow[26] = `${title} - ${gi + 2}`
        rows.push(imgRow)
      }
    }
  }

  for (const row of rows) {
    console.log(row.map(escapeCSV).join(','))
  }

  console.error(`\nDone! ${rows.length - 1} rows for Shopify import.`)

  // Stats
  const withWeight = products.filter(p => getAttr(p, 'Weight')).length
  console.error(`Products with weight: ${withWeight}/${products.length}`)
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
