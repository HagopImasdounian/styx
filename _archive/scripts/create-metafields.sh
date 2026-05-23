#!/bin/bash
#
# Creates all Styx Gold metafield definitions via the Shopify Admin REST API.
#
# USAGE:
#   1. Get an Admin API access token:
#      - Go to https://styx-onnsz4sk.myshopify.com/admin/settings/apps/development
#      - Click "Create an app" (or use existing)
#      - Configure Admin API scopes: read_products, write_products, read_metaobject_definitions, write_metaobject_definitions
#      - Install the app and copy the Admin API access token
#
#   2. Run:
#      SHOPIFY_ADMIN_TOKEN=$SHOPIFY_ADMIN_TOKENxxxxx bash scripts/create-metafields.sh
#

STORE="styx-onnsz4sk.myshopify.com"
TOKEN="${SHOPIFY_ADMIN_TOKEN:-}"
API_VERSION="2024-10"

if [ -z "$TOKEN" ]; then
  echo "Error: Set SHOPIFY_ADMIN_TOKEN first."
  echo ""
  echo "  SHOPIFY_ADMIN_TOKEN=$SHOPIFY_ADMIN_TOKENxxxxx bash scripts/create-metafields.sh"
  echo ""
  echo "Get a token at: https://$STORE/admin/settings/apps/development"
  exit 1
fi

URL="https://$STORE/admin/api/$API_VERSION/graphql.json"

run_mutation() {
  local name="$1"
  local query="$2"
  echo -n "  Creating: $name ... "
  RESULT=$(curl -s -X POST "$URL" \
    -H "Content-Type: application/json" \
    -H "X-Shopify-Access-Token: $TOKEN" \
    -d "{\"query\": $(echo "$query" | jq -Rs .)}")

  ERRORS=$(echo "$RESULT" | jq -r '.data.metafieldDefinitionCreate.userErrors[]?.message // empty' 2>/dev/null)
  if [ -n "$ERRORS" ]; then
    echo "WARN: $ERRORS"
  else
    echo "OK"
  fi
}

echo "=== Product Metafields ==="

run_mutation "weight_grams" '
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Weight (grams)"
    namespace: "custom"
    key: "weight_grams"
    type: "number_decimal"
    ownerType: PRODUCT
    description: "Weight of the piece in grams. Drives transparency pricing."
    pin: true
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}'

run_mutation "karat" '
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Karat"
    namespace: "custom"
    key: "karat"
    type: "number_integer"
    ownerType: PRODUCT
    description: "Gold purity: 10, 14, 18, or 22. Defaults to 18."
    pin: true
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}'

run_mutation "labor_cost" '
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Labor Cost"
    namespace: "custom"
    key: "labor_cost"
    type: "number_decimal"
    ownerType: PRODUCT
    description: "Hand-casting + finishing cost in USD. Defaults to 280."
    pin: true
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}'

run_mutation "margin_percent" '
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Margin Percent"
    namespace: "custom"
    key: "margin_percent"
    type: "number_integer"
    ownerType: PRODUCT
    description: "House margin as whole number (55 = 55%). Defaults to 55."
    pin: true
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}'

run_mutation "chain_origin" '
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Chain Origin"
    namespace: "custom"
    key: "chain_origin"
    type: "single_line_text_field"
    ownerType: PRODUCT
    description: "Origin city/region (e.g. Miami, Italy · Vicenza)."
    pin: true
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}'

run_mutation "year_invented" '
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Year Invented"
    namespace: "custom"
    key: "year_invented"
    type: "single_line_text_field"
    ownerType: PRODUCT
    description: "Year the chain was invented (e.g. 1974, ~500 AD)."
    pin: true
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}'

run_mutation "roman_numeral" '
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Roman Numeral"
    namespace: "custom"
    key: "roman_numeral"
    type: "single_line_text_field"
    ownerType: PRODUCT
    description: "Roman numeral year (e.g. MCMLXXIV). Shown on product badge."
    pin: true
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}'

run_mutation "chain_blurb" '
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Chain Blurb"
    namespace: "custom"
    key: "chain_blurb"
    type: "multi_line_text_field"
    ownerType: PRODUCT
    description: "Short 1-2 sentence description of the chain type."
    pin: true
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}'

run_mutation "story_heading (product)" '
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Story Heading"
    namespace: "custom"
    key: "story_heading"
    type: "single_line_text_field"
    ownerType: PRODUCT
    description: "Editorial heading for the product story section."
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}'

run_mutation "story_body (product)" '
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Story Body"
    namespace: "custom"
    key: "story_body"
    type: "multi_line_text_field"
    ownerType: PRODUCT
    description: "Long-form editorial text about the piece."
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}'

echo ""
echo "=== Collection Metafields ==="

run_mutation "story_heading (collection)" '
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Story Heading"
    namespace: "custom"
    key: "story_heading"
    type: "single_line_text_field"
    ownerType: COLLECTION
    description: "Large heading for the collection story block."
    pin: true
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}'

run_mutation "story_body (collection)" '
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Story Body"
    namespace: "custom"
    key: "story_body"
    type: "multi_line_text_field"
    ownerType: COLLECTION
    description: "Editorial body text about the collection."
    pin: true
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}'

run_mutation "era_label" '
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Era Label"
    namespace: "custom"
    key: "era_label"
    type: "single_line_text_field"
    ownerType: COLLECTION
    description: "Period label (e.g. Miami · 1970s)."
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}'

run_mutation "chapter_kicker" '
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Chapter Kicker"
    namespace: "custom"
    key: "chapter_kicker"
    type: "single_line_text_field"
    ownerType: COLLECTION
    description: "Section label (e.g. Chapter · MCMLXXIV)."
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}'

echo ""
echo "=== Done ==="
echo "Now go to any product in Shopify Admin and you'll see the new fields."
