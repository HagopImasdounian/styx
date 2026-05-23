#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Create all automated collections for Styx Gold mega-menu
# Chain types, metals, karats, thickness, weave groups
# ═══════════════════════════════════════════════════════════════

STORE="styx-onnsz4sk.myshopify.com"
TOKEN="${SHOPIFY_ADMIN_TOKEN:-$SHOPIFY_ADMIN_TOKEN}"
API="https://$STORE/admin/api/2024-10/graphql.json"

gql() {
  curl -s -X POST "$API" \
    -H "Content-Type: application/json" \
    -H "X-Shopify-Access-Token: $TOKEN" \
    -d "{\"query\": $(echo "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}"
}

create_collection() {
  local handle="$1"
  local title="$2"
  local desc="$3"
  local tag="$4"
  local rule_col="${5:-TAG}"  # TAG or PRODUCT_TYPE

  echo -n "  $title ($handle) ... "

  RESULT=$(gql "
mutation {
  collectionCreate(input: {
    title: \"$title\"
    handle: \"$handle\"
    descriptionHtml: \"$desc\"
    ruleSet: {
      appliedDisjunctively: false
      rules: {
        column: $rule_col
        relation: EQUALS
        condition: \"$tag\"
      }
    }
  }) {
    collection { id handle }
    userErrors { field message }
  }
}")

  ERR=$(echo "$RESULT" | python3 -c "
import json,sys
d=json.load(sys.stdin)
errs=d.get('data',{}).get('collectionCreate',{}).get('userErrors',[])
msgs=[e['message'] for e in errs if e.get('message')]
print(' '.join(msgs))" 2>/dev/null)

  if [ -n "$ERR" ] && [ "$ERR" != " " ] && [ "$ERR" != "" ]; then
    echo "WARN: $ERR"
  else
    echo "OK"
  fi
}

echo ""
echo "══════════════════════════════════════════"
echo " Creating All Styx Gold Collections"
echo "══════════════════════════════════════════"

# ─── MASTER COLLECTION ─────────────────────────────────────────

echo ""
echo "── Master Collection ──"
create_collection "chains" "Chains" \
  "Every chain we cast is named for the year it was invented. The earliest dates to ~500 AD." \
  "chain"

# ─── CHAIN TYPE COLLECTIONS ────────────────────────────────────

echo ""
echo "── Chain Type Collections ──"

create_collection "cuban-link" "Cuban Link" \
  "The heavyweight. Interlocking flat links forged in Miami, 1974." \
  "cuban-link-chain"

create_collection "curb-chain" "Curb Chain" \
  "Twisted flat links that lie perfectly against the chest." \
  "curb-chain"

create_collection "figaro-chain" "Figaro Chain" \
  "An Italian classic — alternating short and long links." \
  "figaro-chain"

create_collection "franco-chain" "Franco Chain" \
  "V-shaped links woven into a square profile. Invented in Italy, perfected in New York." \
  "franco-chain"

create_collection "mariner-chain" "Mariner Chain" \
  "Oval links with a bar through the center, inspired by anchor chains." \
  "mariner-chain"

create_collection "gucci-link" "Gucci Link" \
  "Interlocking G-shaped links. Bold, geometric, unmistakable." \
  "gucci-link"

create_collection "panther-link" "Panther Link" \
  "Wide, flat, articulated links that drape like armor." \
  "panther-link"

create_collection "rope-chain" "Rope Chain" \
  "Two strands of metal twisted together into a spiral that catches light from every angle." \
  "rope-chain"

create_collection "wheat-chain" "Wheat Chain" \
  "Four strands of oval links braided into a teardrop cross-section." \
  "wheat-chain"

create_collection "byzantine-chain" "Byzantine Chain" \
  "An ancient weave of interlocking rings dating to the Eastern Roman Empire." \
  "byzantine-chain"

create_collection "foxtail-chain" "Foxtail Chain" \
  "Pairs of flat links woven at 45-degree angles." \
  "foxtail-chain"

create_collection "bismark-chain" "Bismark Chain" \
  "Interlocking links in a herringbone-like pattern. Russian origin." \
  "bismark-chain"

create_collection "san-marco-chain" "San Marco Chain" \
  "Wide hollow links with a satin finish. Named for the piazza." \
  "san-marco-chain"

create_collection "criss-cross-chain" "Criss-Cross Chain" \
  "Thin links crossing over each other in an X pattern." \
  "criss-cross-chain"

create_collection "forsantina-chain" "Forsantina Chain" \
  "Flat, hammered oval links connected at right angles." \
  "forsantina-chain"

create_collection "tinsel-chain" "Tinsel Chain" \
  "Ultra-fine strands grouped into a glittering ribbon." \
  "tinsel-chain"

create_collection "rolo-chain" "Rolo Chain" \
  "Symmetrical round links. Simple, strong, and endlessly versatile." \
  "rolo-chain"

create_collection "cable-chain" "Cable Chain" \
  "The most fundamental chain — uniform oval links connected one to the next." \
  "cable-chain"

create_collection "ball-chain" "Ball Chain" \
  "Spherical beads connected by short rods. Industrial origin, luxurious in gold." \
  "ball-chain"

create_collection "popcorn-chain" "Popcorn Chain" \
  "Hollow textured links with serious volume." \
  "popcorn-chain"

create_collection "singapore-chain" "Singapore Chain" \
  "Twisted curb links that form a flat, braided ribbon." \
  "singapore-chain"

create_collection "satellite-chain" "Satellite Chain" \
  "A thin cable chain dotted with small beads at regular intervals." \
  "satellite-chain"

create_collection "rosary-chain" "Rosary Chain" \
  "Beads separated by chain segments. Originally devotional." \
  "rosary-chain"

create_collection "herringbone-chain" "Herringbone Chain" \
  "Flat V-shaped links layered into a liquid-smooth ribbon." \
  "herringbone-chain"

create_collection "snake-chain" "Snake Chain" \
  "Tightly fitted rings forming a smooth, flexible tube. No visible links." \
  "snake-chain"

create_collection "omega-chain" "Omega Chain" \
  "A rigid collar of interlocking plates. The most architectural chain." \
  "omega-chain"

create_collection "box-chain" "Box Chain" \
  "Square links connected at right angles. Clean, geometric, modern." \
  "box-chain"

create_collection "mesh-chain" "Mesh Chain" \
  "Woven sheets of fine wire forming a flexible metal fabric." \
  "mesh-chain"

create_collection "mirror-chain" "Mirror Chain" \
  "Flat, diamond-cut links that act as tiny mirrors." \
  "mirror-chain"

create_collection "cobra-chain" "Cobra Chain" \
  "A close-fitting flat chain with a serpentine flex." \
  "cobra-chain"

create_collection "bar-chain" "Bar Chain" \
  "Thin bars connected by small links. Minimalist, architectural." \
  "bar-chain"

create_collection "ladder-chain" "Ladder Chain" \
  "Two parallel strands connected by cross-bars." \
  "ladder-chain"

create_collection "paperclip-chain" "Paperclip Chain" \
  "Elongated oval links. The modern classic." \
  "paperclip-chain"

create_collection "heart-chain" "Heart Chain" \
  "Heart-shaped links connected in series." \
  "heart-chain"

create_collection "tulip-chain" "Tulip Chain" \
  "Petal-shaped links cupping into each other. Dutch origin." \
  "tulip-chain"

create_collection "peanut-chain" "Peanut Chain" \
  "Figure-eight links pinched in the middle." \
  "peanut-chain"

create_collection "valentino-chain" "Valentino Chain" \
  "Flat, diamond-shaped links with pyramid-cut facets." \
  "valentino-chain"

create_collection "scroll-chain" "Scroll Chain" \
  "S-curved links creating a flowing, script-like pattern." \
  "scroll-chain"

create_collection "s-link-chain" "S-Link Chain" \
  "S-shaped links connected end to end. Organic, flowing." \
  "s-link-chain"

create_collection "tennis-chain" "Tennis Chain" \
  "A continuous line of individually set stones. The red carpet standard." \
  "tennis-chain"

# ─── METAL COLOR COLLECTIONS ──────────────────────────────────

echo ""
echo "── Metal Color Collections ──"

create_collection "yellow-gold" "Yellow Gold" \
  "The original alloy. Pure warmth." \
  "yellow-gold"

create_collection "rose-gold" "Rose Gold" \
  "Copper-warmed. A softer, warmer tone." \
  "rose-gold"

create_collection "white-gold" "White Gold" \
  "Palladium-alloyed. Cool, modern." \
  "white-gold"

# ─── KARAT COLLECTIONS ────────────────────────────────────────

echo ""
echo "── Karat Collections ──"

create_collection "14k-gold" "14k Gold" \
  "58.5% pure gold. The hardest, most durable alloy. Built for daily wear." \
  "14k"

create_collection "18k-gold" "18k Gold" \
  "75% pure gold. The Styx standard. The best balance of purity and strength." \
  "18k"

create_collection "22k-gold" "22k Gold" \
  "91.7% pure gold. Ceremonial weight. Soft, luminous, serious." \
  "22k"

# ─── THICKNESS COLLECTIONS ────────────────────────────────────

echo ""
echo "── Thickness Collections ──"

create_collection "thickness-1mm" "1mm Chains" \
  "The whisper. Barely there, always felt." \
  "thickness-1mm"

create_collection "thickness-1-5mm" "1.5mm Chains" \
  "Delicate but present." \
  "thickness-1.5mm"

create_collection "thickness-2mm" "2mm Chains" \
  "The everyday. Enough substance to notice." \
  "thickness-2mm"

create_collection "thickness-2-5mm" "2.5mm Chains" \
  "Between subtle and statement." \
  "thickness-2.5mm"

create_collection "thickness-3mm" "3mm Chains" \
  "The sweet spot. Visible, wearable, versatile." \
  "thickness-3mm"

create_collection "thickness-4mm" "4mm Chains" \
  "Statement begins here." \
  "thickness-4mm"

create_collection "thickness-5mm" "5mm Chains" \
  "Bold. Noticed from across the room." \
  "thickness-5mm"

create_collection "thickness-6mm" "6mm Chains" \
  "Heavy. For those who want to feel the gold." \
  "thickness-6mm"

create_collection "thickness-7mm" "7mm Chains" \
  "Substantial. Serious weight." \
  "thickness-7mm"

create_collection "thickness-8mm" "8mm Chains" \
  "The heavyweights." \
  "thickness-8mm"

create_collection "thickness-10mm" "10mm Chains" \
  "Foundry weight. Cast in a single pour." \
  "thickness-10mm"

create_collection "thickness-12mm" "12mm Chains" \
  "The biggest we cast. Ceremonial." \
  "thickness-12mm"

# ─── WEAVE GROUP COLLECTIONS ──────────────────────────────────

echo ""
echo "── Weave Group Collections ──"

create_collection "classic-curb" "Classic Curb Weaves" \
  "Cuban, Curb, Figaro, Franco, Mariner — the foundations." \
  "classic-curb"

create_collection "woven-braided" "Woven &amp; Braided" \
  "Rope, Wheat, Byzantine, Foxtail — chains that are textiles." \
  "woven-braided"

create_collection "round-rolling" "Round &amp; Rolling" \
  "Rolo, Cable, Ball, Singapore — chains that roll between the fingers." \
  "round-rolling"

create_collection "flat-architectural" "Flat &amp; Architectural" \
  "Herringbone, Snake, Omega, Box — chains that lie flat and catch light." \
  "flat-architectural"

create_collection "figural-decorative" "Figural &amp; Decorative" \
  "Heart, Valentino, Tennis — chains that tell a story in their shape." \
  "figural-decorative"

echo ""
echo "══════════════════════════════════════════"
echo " DONE"
echo "══════════════════════════════════════════"
echo ""
echo "Collections created. Visit your store to verify:"
echo "  http://localhost:3002/collections/chains"
echo "  http://localhost:3002/collections/cuban-link"
echo "  http://localhost:3002/collections/yellow-gold"
echo "  http://localhost:3002/collections/thickness-5mm"
echo ""
