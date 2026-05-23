# Errors & Issues to Fix

## 1. /collections page — duplicate menus + placeholder categories
- **URL:** http://localhost:3002/collections
- **Issue:** Page shows two menus (duplicate navigation). Categories are placeholders instead of pulling real collection data from Shopify with their accompanying images.
- **Expected:** Single menu, real collections from Shopify with actual collection images.

## 2. Product card hover — show second product image
- **URL:** Collection/category pages (e.g. http://localhost:3002/collections/*)
- **Issue:** On mouse hover over a product card, nothing changes.
- **Expected:** On hover, swap to the second product image (if available).

## 3. About page — doesn't reflect product range
- **URL:** http://localhost:3002/about
- **Issue:** About page content doesn't mention that we sell both solid and hollow chains.
- **Expected:** About page should accurately reflect the product range (solid and hollow chains).

## 4. About page — incorrect gold pricing info
- **URL:** http://localhost:3002/about
- **Issue:** About page mentions the London Gold Fix, which we don't use.
- **Expected:** Should state that we price gold multiple times throughout the day (not based on London Gold Fix).

## 5. Chain sizing guide image on product pages
- **Image file:** `/Users/hagop/Downloads/hf_20260422_041001_2044b6f9-f7ae-44c6-bd08-913cad15ec84.png`
- **Issue:** No sizing reference on chain product pages. Customers can't visualize chain lengths (18", 20", 22", 24", 26").
- **Expected:** Add the sizing image as the last image in the product gallery for all chain products, so customers can see how each length looks on a person. Also consider adding it to a size guide section/page.

## 6. Product page — display product details clearly + remove hardcoded badges
- **URL:** http://localhost:3002/products/*
- **Issue:** Product details (size, length, karat of gold, etc.) are not clearly displayed. Page shows hardcoded numbered badges ("01 Ships 3–5 days", "02 Solid Gold", "03 Lifetime Warranty") that are inaccurate — not all products are solid gold.
- **Expected:** Clearly display actual product specs (size, length, karat, etc.) pulled from product data. Remove the hardcoded 01/02/03 badge section entirely.

## 7. Remove all fake/placeholder categories and products
- **Issue:** The site has hardcoded placeholder categories and placeholder products throughout (homepage, collections, etc.) instead of pulling real data from Shopify.
- **Expected:** Remove all fake/placeholder content. Every collection and product displayed should come from actual Shopify data.

## 8. Product page — add "Free shipping, insured, priority" message
- **URL:** http://localhost:3002/products/*
- **Expected:** Display a message on the product page (near price or add-to-cart area) stating "Free shipping, insured, priority" to communicate the shipping value prop.

## 9. Product page — wire vs. credit card pricing + price transparency breakdown
- **URL:** http://localhost:3002/products/*
- **Issue:** Only one price shown. No wire discount. No transparency into what the price consists of.
- **Expected:**
  - Show two prices: **Online price** (credit card, includes ~3% transaction fee) and **Wire price** (3% discount off online price).
  - Move the live gold price display further down on the page.
  - Show a **price breakdown** based on the product's karat:
    1. Amount of pure 24K gold in the piece (by weight/grams)
    2. Current market value of that gold (grams × today's gold price)
    3. Our markup (product price minus gold value)
    4. Note that the markup includes labor, marketing, overhead, etc.
  - Example: If price is $1,000 and it's 14K gold → calculate the pure gold content (14/24 of total weight), show its dollar value at today's spot, and the remainder is markup.
  - Do NOT break out individual labor costs — just one markup number with an explanation.

## 10. Product page — dynamic product details based on selected variant
- **URL:** http://localhost:3002/products/*
- **Issue:** Product details at the bottom of the page are static / not variant-aware.
- **Expected:** Bottom product details section should display:
  - Weight
  - Karat
  - Color
  - These should update dynamically when the customer selects a different variant.

## 11. Size guide — remove from top menu, keep on product page only
- **Issue:** Size guide is currently a link in the top navigation menu.
- **Expected:** Remove the size guide from the top menu. It should only appear on individual product pages (see #5).

## 12. Custom 404 page — "Broken Link" concept
- **Issue:** No custom 404 page.
- **Expected:** Create a custom 404 page with a generated image: a Cuban link chain stretching left to right, broken in the middle with a link falling as if pulled apart. Text says "Broken Link". On-brand, clever play on words for a chain store. (Use image gen MCP/skill to generate the image.)

## 13. Remove login link from top-right navigation
- **Issue:** There's a login/account link in the top-right header area.
- **Expected:** Remove it entirely — no customer accounts needed right now.
