#!/bin/bash
# ──────────────────────────────────────────────────────────────
# Create automated Shopify collections for all chain types,
# metal colors, karats, and thickness categories.
#
# Prerequisites:
#   1. Install Shopify CLI: npm install -g @shopify/cli
#   2. Authenticate: shopify auth login --store your-store.myshopify.com
#   3. Or use the Shopify Admin GraphQL API directly
#
# This script prints the GraphQL mutations you need to run.
# You can paste them into Shopify Admin > Settings > API > GraphiQL
# or use the Admin API.
#
# Alternative: Create these manually in Shopify Admin > Products > Collections
# using "Automated" collection type with tag conditions.
# ──────────────────────────────────────────────────────────────

echo "=== COLLECTIONS TO CREATE IN SHOPIFY ADMIN ==="
echo ""
echo "Go to: Shopify Admin > Products > Collections > Create collection"
echo "For each, choose 'Automated' and set the condition as shown."
echo ""
echo "──────────────────────────────────────────────"
echo "CHAIN TYPE COLLECTIONS (match by tag)"
echo "──────────────────────────────────────────────"

# Chain types — collection handle : tag to match : display title
declare -a CHAINS=(
  "cuban-link:cuban-link-chain:Cuban Link"
  "curb-chain:curb-chain:Curb Chain"
  "figaro-chain:figaro-chain:Figaro Chain"
  "franco-chain:franco-chain:Franco Chain"
  "mariner-chain:mariner-chain:Mariner Chain"
  "gucci-link:gucci-link:Gucci Link"
  "panther-link:panther-link:Panther Link"
  "rope-chain:rope-chain:Rope Chain"
  "wheat-chain:wheat-chain:Wheat Chain"
  "byzantine-chain:byzantine-chain:Byzantine Chain"
  "foxtail-chain:foxtail-chain:Foxtail Chain"
  "bismark-chain:bismark-chain:Bismark Chain"
  "san-marco-chain:san-marco-chain:San Marco Chain"
  "criss-cross-chain:criss-cross-chain:Criss-Cross Chain"
  "forsantina-chain:forsantina-chain:Forsantina Chain"
  "tinsel-chain:tinsel-chain:Tinsel Chain"
  "rolo-chain:rolo-chain:Rolo Chain"
  "cable-chain:cable-chain:Cable Chain"
  "ball-chain:ball-chain:Ball Chain"
  "popcorn-chain:popcorn-chain:Popcorn Chain"
  "singapore-chain:singapore-chain:Singapore Chain"
  "satellite-chain:satellite-chain:Satellite Chain"
  "rosary-chain:rosary-chain:Rosary Chain"
  "herringbone-chain:herringbone-chain:Herringbone Chain"
  "snake-chain:snake-chain:Snake Chain"
  "omega-chain:omega-chain:Omega Chain"
  "box-chain:box-chain:Box Chain"
  "mesh-chain:mesh-chain:Mesh Chain"
  "mirror-chain:mirror-chain:Mirror Chain"
  "cobra-chain:cobra-chain:Cobra Chain"
  "bar-chain:bar-chain:Bar Chain"
  "ladder-chain:ladder-chain:Ladder Chain"
  "paperclip-chain:paperclip-chain:Paperclip Chain"
  "heart-chain:heart-chain:Heart Chain"
  "tulip-chain:tulip-chain:Tulip Chain"
  "peanut-chain:peanut-chain:Peanut Chain"
  "valentino-chain:valentino-chain:Valentino Chain"
  "scroll-chain:scroll-chain:Scroll Chain"
  "s-link-chain:s-link-chain:S-Link Chain"
  "tennis-chain:tennis-chain:Tennis Chain"
)

for entry in "${CHAINS[@]}"; do
  IFS=':' read -r handle tag title <<< "$entry"
  echo "  Collection: $title"
  echo "  Handle: $handle"
  echo "  Condition: Product tag is equal to '$tag'"
  echo ""
done

echo "──────────────────────────────────────────────"
echo "METAL COLOR COLLECTIONS"
echo "──────────────────────────────────────────────"

for color in "yellow-gold:Yellow Gold" "rose-gold:Rose Gold" "white-gold:White Gold"; do
  IFS=':' read -r handle title <<< "$color"
  echo "  Collection: $title"
  echo "  Handle: $handle"
  echo "  Condition: Product tag is equal to '$handle'"
  echo ""
done

echo "──────────────────────────────────────────────"
echo "KARAT COLLECTIONS"
echo "──────────────────────────────────────────────"

for karat in "14k-gold:14k:14k Gold" "18k-gold:18k:18k Gold" "22k-gold:22k:22k Gold"; do
  IFS=':' read -r handle tag title <<< "$karat"
  echo "  Collection: $title"
  echo "  Handle: $handle"
  echo "  Condition: Product tag is equal to '$tag'"
  echo ""
done

echo "──────────────────────────────────────────────"
echo "THICKNESS COLLECTIONS"
echo "──────────────────────────────────────────────"

for thickness in "1mm" "1.5mm" "2mm" "2.5mm" "3mm" "3.5mm" "4mm" "5mm" "6mm" "7mm" "8mm" "10mm" "12mm"; do
  safe=$(echo "$thickness" | sed 's/\./-/g')
  echo "  Collection: ${thickness} Chains"
  echo "  Handle: thickness-${safe}"
  echo "  Condition: Product tag is equal to 'thickness-${thickness}'"
  echo ""
done

echo "──────────────────────────────────────────────"
echo "MASTER COLLECTION"
echo "──────────────────────────────────────────────"
echo "  Collection: All Chains"
echo "  Handle: chains"
echo "  Condition: Product type is equal to 'Chain'"
echo ""

echo "──────────────────────────────────────────────"
echo "WEAVE GROUP COLLECTIONS"
echo "──────────────────────────────────────────────"

for group in "classic-curb:Classic Curb Weaves" "woven-braided:Woven & Braided" "round-rolling:Round & Rolling" "flat-architectural:Flat & Architectural" "figural-decorative:Figural & Decorative"; do
  IFS=':' read -r handle title <<< "$group"
  echo "  Collection: $title"
  echo "  Handle: $handle"
  echo "  Condition: Product tag is equal to '$handle'"
  echo ""
done

echo "=== DONE ==="
echo "Total: ~60 collections to create"
echo ""
echo "TIP: Start with the master 'chains' collection + the 5 most popular"
echo "chain types (cuban-link, figaro-chain, rope-chain, franco-chain, box-chain)"
echo "and the 3 metal color collections. Add the rest as needed."
