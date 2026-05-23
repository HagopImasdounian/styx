#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Styx Gold — Full Store Setup
# Creates metafield definitions, collections, updates products
# with jewelry data, and fills in test metafield values.
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

gql_check() {
  local label="$1"
  local query="$2"
  echo -n "  $label ... "
  local result
  result=$(gql "$query")
  local err
  err=$(echo "$result" | python3 -c "
import json,sys
d=json.load(sys.stdin)
errs=[]
for k,v in (d.get('data') or {}).items():
  if isinstance(v,dict):
    for e in v.get('userErrors',v.get('errors',[])):
      errs.append(e.get('message',''))
print('|'.join(e for e in errs if e))" 2>/dev/null)
  if [ -n "$err" ]; then
    echo "WARN: $err"
  else
    echo "OK"
  fi
  echo "$result"
}

# ─── 1. CREATE PRODUCT METAFIELD DEFINITIONS ──────────────────

echo ""
echo "══════════════════════════════════════════"
echo " 1. Creating Product Metafield Definitions"
echo "══════════════════════════════════════════"

for def in \
  'weight_grams|Weight (grams)|number_decimal|Weight in grams. Drives transparency pricing.' \
  'karat|Karat|number_integer|Gold purity: 10, 14, 18, or 22.' \
  'labor_cost|Labor Cost|number_decimal|Hand-casting + finishing cost in USD.' \
  'margin_percent|Margin Percent|number_integer|House margin (55 = 55%).' \
  'chain_origin|Chain Origin|single_line_text_field|Origin city/region.' \
  'year_invented|Year Invented|single_line_text_field|Year chain was invented.' \
  'roman_numeral|Roman Numeral|single_line_text_field|Roman numeral year for badge.' \
  'chain_blurb|Chain Blurb|multi_line_text_field|Short 1-2 sentence history.' \
  'story_heading|Story Heading|single_line_text_field|Editorial heading.' \
  'story_body|Story Body|multi_line_text_field|Long-form editorial text.' \
  'pull_quote|Pull Quote|multi_line_text_field|Artisan quote for narrative.' \
  'pull_quote_attr|Pull Quote Attribution|single_line_text_field|Who said the quote.' \
  'spec_weave|Spec: Weave|single_line_text_field|Chain weave type.' \
  'spec_profile|Spec: Profile|single_line_text_field|Chain profile.' \
  'spec_clasp|Spec: Clasp|single_line_text_field|Clasp type.' \
  'spec_cast|Spec: Our Cast|single_line_text_field|How we cast it.'
do
  IFS='|' read -r key name type desc <<< "$def"
  gql_check "$name" "
mutation {
  metafieldDefinitionCreate(definition: {
    name: \"$name\"
    namespace: \"custom\"
    key: \"$key\"
    type: \"$type\"
    ownerType: PRODUCT
    description: \"$desc\"
    pin: true
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}" > /dev/null
done

# ─── 2. CREATE COLLECTION METAFIELD DEFINITIONS ──────────────

echo ""
echo "══════════════════════════════════════════"
echo " 2. Creating Collection Metafield Definitions"
echo "══════════════════════════════════════════"

for def in \
  'story_heading|Story Heading|single_line_text_field|Large heading for collection story.' \
  'story_body|Story Body|multi_line_text_field|Editorial body text.' \
  'era_label|Era Label|single_line_text_field|Period label (e.g. Miami · 1970s).' \
  'chapter_kicker|Chapter Kicker|single_line_text_field|Section label.'
do
  IFS='|' read -r key name type desc <<< "$def"
  gql_check "$name" "
mutation {
  metafieldDefinitionCreate(definition: {
    name: \"$name\"
    namespace: \"custom\"
    key: \"$key\"
    type: \"$type\"
    ownerType: COLLECTION
    description: \"$desc\"
    pin: true
  }) {
    createdDefinition { id }
    userErrors { field message }
  }
}" > /dev/null
done

# ─── 3. CREATE COLLECTIONS ───────────────────────────────────

echo ""
echo "══════════════════════════════════════════"
echo " 3. Creating Collections"
echo "══════════════════════════════════════════"

# We'll create Chains, Rings, Pendants
for coll in \
  'chains|Chains|Every chain we cast is named for the year it was invented or popularized. The earliest dates to ~500 AD.' \
  'rings|Rings|Signet and band. Each ring is lost-wax cast from solid gold at a single foundry in New York.' \
  'pendants|Pendants|Relic and coin. Pendants cast from the same molds used in our founding year.'
do
  IFS='|' read -r handle title desc <<< "$coll"
  echo -n "  Collection: $title ... "
  RESULT=$(gql "
mutation {
  collectionCreate(input: {
    title: \"$title\"
    handle: \"$handle\"
    descriptionHtml: \"$desc\"
    ruleSet: {
      appliedDisjunctively: false
      rules: {
        column: TAG
        relation: EQUALS
        condition: \"$handle\"
      }
    }
  }) {
    collection { id handle }
    userErrors { field message }
  }
}")
  COLL_ID=$(echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('data',{}).get('collectionCreate',{}).get('collection',{}).get('id',''))" 2>/dev/null)
  ERR=$(echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); errs=d.get('data',{}).get('collectionCreate',{}).get('userErrors',[]); print(' '.join(e['message'] for e in errs))" 2>/dev/null)
  if [ -n "$ERR" ] && [ "$ERR" != " " ]; then
    echo "WARN: $ERR"
  else
    echo "OK ($COLL_ID)"
  fi
done

# ─── 4. UPDATE PRODUCTS — Rename to jewelry, add metafields ──

echo ""
echo "══════════════════════════════════════════"
echo " 4. Updating Products with Jewelry Data"
echo "══════════════════════════════════════════"

# Map existing product IDs to chain data
# We'll use 9 snowboard products and turn them into chains

update_product() {
  local pid="$1" title="$2" handle="$3" vendor="$4" price="$5" tags="$6"
  local weight="$7" karat="$8" origin="$9" year="${10}" roman="${11}"
  local blurb="${12}" labor="${13}" margin="${14}" weave="${15}" profile="${16}"
  local clasp="${17}" cast="${18}" quote="${19}" quoteattr="${20}" story="${21}"
  local desc="${22}"

  echo -n "  $title ... "

  RESULT=$(gql "
mutation {
  productUpdate(input: {
    id: \"gid://shopify/Product/$pid\"
    title: \"$title\"
    handle: \"$handle\"
    vendor: \"Styx Gold\"
    descriptionHtml: \"$desc\"
    tags: [\"$tags\"]
    metafields: [
      { namespace: \"custom\", key: \"weight_grams\", value: \"$weight\", type: \"number_decimal\" }
      { namespace: \"custom\", key: \"karat\", value: \"$karat\", type: \"number_integer\" }
      { namespace: \"custom\", key: \"labor_cost\", value: \"$labor\", type: \"number_decimal\" }
      { namespace: \"custom\", key: \"margin_percent\", value: \"$margin\", type: \"number_integer\" }
      { namespace: \"custom\", key: \"chain_origin\", value: \"$origin\", type: \"single_line_text_field\" }
      { namespace: \"custom\", key: \"year_invented\", value: \"$year\", type: \"single_line_text_field\" }
      { namespace: \"custom\", key: \"roman_numeral\", value: \"$roman\", type: \"single_line_text_field\" }
      { namespace: \"custom\", key: \"chain_blurb\", value: \"$blurb\", type: \"multi_line_text_field\" }
      { namespace: \"custom\", key: \"spec_weave\", value: \"$weave\", type: \"single_line_text_field\" }
      { namespace: \"custom\", key: \"spec_profile\", value: \"$profile\", type: \"single_line_text_field\" }
      { namespace: \"custom\", key: \"spec_clasp\", value: \"$clasp\", type: \"single_line_text_field\" }
      { namespace: \"custom\", key: \"spec_cast\", value: \"$cast\", type: \"single_line_text_field\" }
      { namespace: \"custom\", key: \"pull_quote\", value: \"$quote\", type: \"multi_line_text_field\" }
      { namespace: \"custom\", key: \"pull_quote_attr\", value: \"$quoteattr\", type: \"single_line_text_field\" }
      { namespace: \"custom\", key: \"story_body\", value: \"$story\", type: \"multi_line_text_field\" }
    ]
  }) {
    product { id title }
    userErrors { field message }
  }
}")
  ERR=$(echo "$RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); errs=d.get('data',{}).get('productUpdate',{}).get('userErrors',[]); print(' '.join(e['message'] for e in errs))" 2>/dev/null)
  if [ -n "$ERR" ] && [ "$ERR" != " " ]; then
    echo "WARN: $ERR"
  else
    echo "OK"
  fi
}

# Cuban Link — was "The Complete Snowboard"
update_product 7850593878102 \
  "Cuban Link Chain" "cuban-link-chain" "Styx Gold" "5136" "chains" \
  "52" "18" "Miami · popularized" "1974" "MCMLXXIV" \
  "The wide, flat, tightly packed link that defined a city in the seventies." \
  "280" "55" \
  "Interlocking curb link" "Flat / diamond-cut top" "Box-and-tab, signed" "Lost-wax, Arezzo" \
  "A Cuban is the only chain that, when someone asks what it is, you can hand it to them and the weight tells the story." \
  "Enzo M., Styx foundry, Arezzo" \
  "The Cuban link chain rose out of Miami in the early seventies, where Cuban and Dominican goldsmiths developed a heavier, flatter, more tightly-interlocked take on the older curb weave. It became the chain of the decade because it looked expensive when it was expensive, and still looked expensive when it was not." \
  "Solid 18k gold. Hand-cast in New York. The Cuban link — the chain that defined Miami in the seventies, and hip-hop in the nineties."

# Figaro — was "The Minimal Snowboard"
update_product 7850593812566 \
  "Figaro Chain" "figaro-chain" "Styx Gold" "2890" "chains" \
  "28" "18" "Italy · Vicenza" "1885" "MDCCCLXXXV" \
  "Three small links, one elongated. Named for the barber of Seville." \
  "260" "55" \
  "Three-to-one curb" "Diamond-cut, flat" "Lobster, signed" "Lost-wax, Arezzo" \
  "The Figaro is the chain for someone who wants people to notice the chain without the chain doing the noticing for them." \
  "Enzo M., Styx foundry, Arezzo" \
  "The Figaro takes its name from the opera — Il Barbiere di Siviglia — and its geometry from a nineteenth-century jeweler in Vicenza who wanted a more rhythmic alternative to the curb chain. Three small round links, one elongated link, repeat." \
  "Solid 18k gold. The Figaro — three small links, one long, named for a character in a Rossini opera."

# Rope — was "The Compare at Price Snowboard"
update_product 7850593779798 \
  "Rope Chain" "rope-chain" "Styx Gold" "3240" "chains" \
  "34" "18" "France · Paris" "1832" "MDCCCXXXII" \
  "Twin strands twisted and soldered — the original marine chain." \
  "300" "55" \
  "Twisted twin strand" "Round, textural" "Lobster, signed" "Lost-wax, Arezzo" \
  "The Rope is the most difficult chain in our catalog to produce by hand, and the most forgiving to wear." \
  "Enzo M., Styx foundry, Arezzo" \
  "The rope chain is the oldest pattern we cast. French jewelers in the 1830s developed it as a sailor's chain — twisted twin strands, soldered into place — and it has been continuously made ever since." \
  "Solid 18k gold. The Rope — twin twisted strands, the original marine chain from 1832 Paris."

# Byzantine — was "The Hidden Snowboard"
update_product 7850593910870 \
  "Byzantine Chain" "byzantine-chain" "Styx Gold" "4680" "chains" \
  "46" "18" "Constantinople" "~500 AD" "D" \
  "Four-in-one weave of intersecting rings. Found in Thracian tombs." \
  "320" "55" \
  "Four-in-one, closed rings" "Square, woven" "Lobster, signed" "Hand-assembled, Arezzo" \
  "The Byzantine is the chain that rewards a second look. Most chains reveal themselves instantly. This one makes you lean in." \
  "Enzo M., Styx foundry, Arezzo" \
  "The Byzantine pattern is older than most of Europe. Examples have been recovered from Thracian tombs, Viking hoards, and the workshops of Constantinople. A Byzantine chain is not a chain so much as a textile." \
  "Solid 18k gold. The Byzantine — the oldest chain pattern still cast the way it was invented, circa 500 AD."

# Franco — was "The Inventory Not Tracked Snowboard"
update_product 7850593681494 \
  "Franco Chain" "franco-chain" "Styx Gold" "3720" "chains" \
  "38" "18" "Italy · Vicenza" "1980" "MCMLXXX" \
  "V-cut links, herringbone depth, close military discipline." \
  "280" "55" \
  "V-cut interlock" "Herringbone depth" "Box-and-tab, signed" "Lost-wax, Arezzo" \
  "The Franco is a chain for someone who wants weight but not flash." \
  "Enzo M., Styx foundry, Arezzo" \
  "The Franco chain is the youngest pattern we cast — invented in the eighties by Italian goldsmiths looking for something more disciplined than a Cuban. V-cut links, close-packed, military rhythm." \
  "Solid 18k gold. The Franco — V-cut geometry, invented 1980, the youngest chain in the archive."

# Mariner — was "The Out of Stock Snowboard"
update_product 7850593943638 \
  "Mariner Chain" "mariner-chain" "Styx Gold" "3060" "chains" \
  "30" "18" "Maritime · open sea" "1930" "MCMXXX" \
  "Anchor-bar links echoing the chains that held ships to shore." \
  "260" "55" \
  "Anchor-bar oval" "Flat, open center" "Lobster, signed" "Lost-wax, Arezzo" \
  "The Mariner reads at distance. You know what it is from across the room." \
  "Enzo M., Styx foundry, Arezzo" \
  "The Mariner chain echoes the anchor chains that held ships to shore: an oval link with a horizontal bar across the middle. Adapted into jewelry in the thirties, it has never gone out of fashion in port cities." \
  "Solid 18k gold. The Mariner — anchor-bar links from the open sea, adapted to jewelry circa 1930."

# Box — was "The Videographer Snowboard"
update_product 7850594009174 \
  "Box Chain" "box-chain" "Styx Gold" "2340" "chains" \
  "22" "18" "Germany · Pforzheim" "1900" "MCM" \
  "Square-cornered links. Geometric, quiet, architectural." \
  "240" "55" \
  "Square interlock" "Square-cornered" "Spring ring, signed" "Lost-wax, Arezzo" \
  "The Box is the most quietly luxurious pattern in the catalog." \
  "Enzo M., Styx foundry, Arezzo" \
  "The Box chain — sometimes called the Venetian — is a geometric anomaly. Each link is a perfect small square, interlocked ninety degrees from the next. It reads as architecture, not jewelry." \
  "Solid 18k gold. The Box — square-cornered links from Pforzheim, circa 1900. The quiet option."

# Herringbone — was "The Multi-location Snowboard"
update_product 7850594074710 \
  "Herringbone Chain" "herringbone-chain" "Styx Gold" "2680" "chains" \
  "26" "18" "Italy · Arezzo" "1955" "MCMLV" \
  "Flat, woven, liquid in the light — an honest stripe of gold." \
  "260" "55" \
  "Flat woven" "Flat, mirror-finish" "Lobster, signed" "Lost-wax, Arezzo" \
  "The Herringbone is the most beautiful chain when it catches the light at the right angle. Handle gently." \
  "Enzo M., Styx foundry, Arezzo" \
  "Italian jewelers in Arezzo perfected the herringbone in the fifties — tight, precise, zero gap. It is the most fragile chain in our catalog; kink it badly and it will not unkink. It is also the most beautiful." \
  "Solid 18k gold. The Herringbone — flat, woven, liquid in the light. From Arezzo, 1955."

# Wheat — was "The Multi-managed Snowboard"
update_product 7850594107478 \
  "Wheat Chain" "wheat-chain" "Styx Gold" "2520" "chains" \
  "24" "18" "England · London" "1790" "MDCCXC" \
  "Braided chain of tiny teardrops — named for the Georgian harvest." \
  "240" "55" \
  "Four-strand braid" "Round, braided" "Lobster, signed" "Lost-wax, Arezzo" \
  "The Wheat is a pocket-watch classic. Named for the harvest, worn by gentlemen." \
  "Enzo M., Styx foundry, Arezzo" \
  "The wheat chain — spiga, in Italian — is a braided pattern of four tiny teardrop links, twisted into a rope that resembles a stalk of harvested wheat. A favorite of Georgian London, frequently paired with pocket watches." \
  "Solid 18k gold. The Wheat — four-strand braid named for the Georgian harvest, London 1790."

# ─── 5. SET COLLECTION METAFIELDS ────────────────────────────

echo ""
echo "══════════════════════════════════════════"
echo " 5. Setting Collection Metafields"
echo "══════════════════════════════════════════"

# Get the chains collection ID
CHAINS_ID=$(gql '{ collections(first:10, query:"handle:chains") { edges { node { id handle } } } }' | python3 -c "
import json,sys
d=json.load(sys.stdin)
for e in d.get('data',{}).get('collections',{}).get('edges',[]):
  if e['node']['handle']=='chains':
    print(e['node']['id'])
    break" 2>/dev/null)

if [ -n "$CHAINS_ID" ]; then
  echo -n "  Chains collection metafields ... "
  gql "
mutation {
  collectionUpdate(input: {
    id: \"$CHAINS_ID\"
    metafields: [
      { namespace: \"custom\", key: \"story_heading\", value: \"On the\", type: \"single_line_text_field\" }
      { namespace: \"custom\", key: \"story_body\", value: \"Every chain we cast is named for the year it was either invented or popularized. The earliest dates to approximately 500 AD. The newest, 1980. Nothing here was designed last season. Each pattern survived centuries because the geometry works — not because a marketing team decided it should.\", type: \"multi_line_text_field\" }
      { namespace: \"custom\", key: \"era_label\", value: \"500 AD — 1980\", type: \"single_line_text_field\" }
      { namespace: \"custom\", key: \"chapter_kicker\", value: \"The Styx Archive · Vol. I\", type: \"single_line_text_field\" }
    ]
  }) {
    collection { id }
    userErrors { field message }
  }
}" > /dev/null && echo "OK" || echo "FAIL"
fi

echo ""
echo "══════════════════════════════════════════"
echo " DONE"
echo "══════════════════════════════════════════"
echo ""
echo "Products updated: 9 chains with full metafield data"
echo "Collections created: Chains, Rings, Pendants"
echo "Metafield definitions: 16 product + 4 collection"
echo ""
echo "Visit http://localhost:3002/collections/chains to see it live."
