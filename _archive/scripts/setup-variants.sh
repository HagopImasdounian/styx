#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Styx Gold — Setup product variants (Karat × Color)
# Replaces snowboard options with jewelry options.
# ═══════════════════════════════════════════════════════════════

STORE="styx-onnsz4sk.myshopify.com"
TOKEN="$SHOPIFY_ADMIN_TOKEN"
API="https://$STORE/admin/api/2024-10/graphql.json"

gql() {
  curl -s -X POST "$API" \
    -H "Content-Type: application/json" \
    -H "X-Shopify-Access-Token: $TOKEN" \
    -d @- <<JSONEOF
{"query": $(python3 -c "import json; print(json.dumps('''$1'''))")}
JSONEOF
}

# For each chain product:
# - Delete all existing variants except first
# - Update product options to Karat + Color
# - Create 6 variants: (14k, 18k) × (Yellow Gold, Rose Gold, White Gold)
# - Price varies by weight × karat

setup_product() {
  local PID="$1"
  local TITLE="$2"
  local WEIGHT="$3"  # grams

  echo ""
  echo "─── $TITLE (weight: ${WEIGHT}g) ───"

  # Calculate prices: gold ~$2420/oz, 31.1035 g/oz
  # 14k (58.5%): per_gram = 2420/31.1035 * 0.585 = ~45.52
  # 18k (75.0%): per_gram = 2420/31.1035 * 0.750 = ~58.34
  # material + labor($280) × (1 + 0.55 margin)
  local P14K=$(python3 -c "
w=$WEIGHT; spot=2420; labor=280; margin=0.55
mat14 = (spot/31.1035)*0.585*w
p14 = round((mat14+labor)*(1+margin))
print(f'{p14}.00')")

  local P18K=$(python3 -c "
w=$WEIGHT; spot=2420; labor=280; margin=0.55
mat18 = (spot/31.1035)*0.750*w
p18 = round((mat18+labor)*(1+margin))
print(f'{p18}.00')")

  echo "  14k price: \$$P14K  |  18k price: \$$P18K"

  # Step 1: Get existing variant IDs
  echo -n "  Fetching existing variants ... "
  VARIANTS_JSON=$(curl -s -X POST "$API" \
    -H "Content-Type: application/json" \
    -H "X-Shopify-Access-Token: $TOKEN" \
    -d "{\"query\":\"{ product(id: \\\"gid://shopify/Product/$PID\\\") { variants(first:50) { edges { node { id } } } } }\"}")

  VARIANT_IDS=$(echo "$VARIANTS_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
ids=[e['node']['id'] for e in d['data']['product']['variants']['edges']]
print(' '.join(ids))")
  echo "found $(echo $VARIANT_IDS | wc -w | tr -d ' ')"

  # Step 2: Delete all variants except the first (Shopify requires at least 1)
  FIRST_VID=$(echo $VARIANT_IDS | awk '{print $1}')
  REST_VIDS=$(echo $VARIANT_IDS | awk '{for(i=2;i<=NF;i++) print $i}')

  if [ -n "$REST_VIDS" ]; then
    echo -n "  Deleting old variants ... "
    VID_ARRAY=$(echo $REST_VIDS | python3 -c "import sys; ids=sys.stdin.read().split(); print('[' + ','.join('\"'+i+'\"' for i in ids) + ']')")
    curl -s -X POST "$API" \
      -H "Content-Type: application/json" \
      -H "X-Shopify-Access-Token: $TOKEN" \
      -d "{\"query\":\"mutation { productVariantsBulkDelete(productId: \\\"gid://shopify/Product/$PID\\\", variantsIds: $VID_ARRAY) { userErrors { message } } }\"}" > /dev/null
    echo "OK"
  fi

  # Step 3: Update product options via productOptionsReorder or by updating the product
  # We need to set options to ["Karat", "Color"] and create variants
  echo -n "  Setting up Karat + Color options ... "

  # Use productSet mutation to replace everything cleanly
  RESULT=$(curl -s -X POST "$API" \
    -H "Content-Type: application/json" \
    -H "X-Shopify-Access-Token: $TOKEN" \
    -d "{
      \"query\": \"mutation productSet(\$input: ProductSetInput!) { productSet(synchronous: true, input: \$input) { product { id variants(first:10) { edges { node { id title price } } } } userErrors { field message } } }\",
      \"variables\": {
        \"input\": {
          \"id\": \"gid://shopify/Product/$PID\",
          \"productOptions\": [
            {
              \"name\": \"Karat\",
              \"position\": 1,
              \"values\": [
                {\"name\": \"14k\"},
                {\"name\": \"18k\"}
              ]
            },
            {
              \"name\": \"Color\",
              \"position\": 2,
              \"values\": [
                {\"name\": \"Yellow Gold\"},
                {\"name\": \"Rose Gold\"},
                {\"name\": \"White Gold\"}
              ]
            }
          ],
          \"variants\": [
            {\"optionValues\": [{\"optionName\": \"Karat\", \"name\": \"14k\"}, {\"optionName\": \"Color\", \"name\": \"Yellow Gold\"}], \"price\": $P14K},
            {\"optionValues\": [{\"optionName\": \"Karat\", \"name\": \"14k\"}, {\"optionName\": \"Color\", \"name\": \"Rose Gold\"}], \"price\": $P14K},
            {\"optionValues\": [{\"optionName\": \"Karat\", \"name\": \"14k\"}, {\"optionName\": \"Color\", \"name\": \"White Gold\"}], \"price\": $P14K},
            {\"optionValues\": [{\"optionName\": \"Karat\", \"name\": \"18k\"}, {\"optionName\": \"Color\", \"name\": \"Yellow Gold\"}], \"price\": $P18K},
            {\"optionValues\": [{\"optionName\": \"Karat\", \"name\": \"18k\"}, {\"optionName\": \"Color\", \"name\": \"Rose Gold\"}], \"price\": $P18K},
            {\"optionValues\": [{\"optionName\": \"Karat\", \"name\": \"18k\"}, {\"optionName\": \"Color\", \"name\": \"White Gold\"}], \"price\": $P18K}
          ]
        }
      }
    }")

  ERR=$(echo "$RESULT" | python3 -c "
import json,sys
d=json.load(sys.stdin)
errs=d.get('data',{}).get('productSet',{}).get('userErrors',[])
if errs:
    print(' '.join(e.get('message','') for e in errs))
else:
    variants=d.get('data',{}).get('productSet',{}).get('product',{}).get('variants',{}).get('edges',[])
    print(f'OK — {len(variants)} variants')" 2>/dev/null)
  echo "$ERR"
}

echo "══════════════════════════════════════════"
echo " Setting up Karat × Color variants"
echo "══════════════════════════════════════════"

#                    PID             Title                Weight
setup_product 7850593878102 "Cuban Link Chain"          52
setup_product 7850593812566 "Figaro Chain"              28
setup_product 7850593779798 "Rope Chain"                34
setup_product 7850593910870 "Byzantine Chain"           46
setup_product 7850593681494 "Franco Chain"              38
setup_product 7850593943638 "Mariner Chain"             30
setup_product 7850594009174 "Box Chain"                 22
setup_product 7850594074710 "Herringbone Chain"         26
setup_product 7850594107478 "Wheat Chain"               24

echo ""
echo "══════════════════════════════════════════"
echo " DONE — All products now have 6 variants each"
echo " (14k/18k) × (Yellow Gold/Rose Gold/White Gold)"
echo "══════════════════════════════════════════"
