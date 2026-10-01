#!/usr/bin/env python3
"""
THE canonical repricer — deterministic, idempotent, vendor-SKU-keyed.
    variant -> vendor.sku metafield -> live ShinyJewellers fetch
            -> per-length weight -> karat/hollow USD rate -> tiered markup -> charm
Pricing (Hagop, 2026-06-05 — USD rates direct from vendor, no CAD step):
    Retail USD = tiered_markup(weight(g) x RATE_USD[category]), charm-rounded.
Weight source, in order of preference:
    1. vendor variation matching the variant's length (live API)   [vendor-exact]
    2. Shopify variant weight (verified 2026-06-04 audit)          [shopify-stored]
    -  mismatches between the two beyond TOLERANCE are flagged, vendor wins,
       EXCEPT where the vendor's per-length data is flat / non-monotonic /
       mapped to the wrong length — then the verified stored weight wins.
Never guesses: variants with no resolvable weight, no karat, or price 0
(vendor-discontinued, zeroed deliberately) are reported, not repriced.
Each --apply also:
    - tags every touched product `repriced-YYYY-MM` (audit trail)
    - writes reprice-manifest-YYYY-MM-DD.json (rates, counts, exceptions)
Usage:
    python3 scripts/reprice.py             # dry run: full CSV diff + summary
    python3 scripts/reprice.py --apply     # write prices + tags to Shopify
    python3 scripts/reprice.py --track-spot [--apply]   # scale rates by live gold spot
Lives in tools/reprice/ (committed, run daily by .github/workflows/daily-reprice.yml);
scripts/reprice.py is a shim so the other local scripts keep importing it.
Supersedes: apply-prices.py + the pricing parts of audit-catalog.py/full-sync.py
(their CAD rate tables are legacy — this file is the single source of truth).

History: rebuilt 2026-10-01 from the original's recovered fragments after the
file was overwritten; behaviour verified idempotent against the live store.
"""
import csv
import json
import os
import re
import sys
import time
import urllib.request
from datetime import date

# ── Pricing config — the ONLY place rates live ─────────────────────────────
RATES_DATE = '2026-06-05'
RATE_USD = {            # vendor cost, USD per gram (Hagop, 2026-06-05)
    '10k':    105.96,
    '14k':    147.16,
    '18k':    187.66,
    'hollow': 112.00,   # hollow chains (10k), priced per gram of their own rate
}
# Tiered markup (Hagop, 2026-06-26): taper the margin on high gold-value chains
# instead of a flat 1.6x. Applied as MARGINAL brackets on gold value (weight x
# rate), tax-bracket style, so retail stays strictly monotonic — a heavier chain
# can never end up cheaper than a lighter one at a tier boundary.
MARKUP_TIERS = [           # (upper bound of gold value USD, markup on that slice)
    (1000,          1.60),
    (3000,          1.55),
    (6000,          1.50),
    (float('inf'),  1.45),
]
MARKUP = 1.60              # entry-tier reference (legacy field); full table in manifest
TOLERANCE_G = 0.5          # vendor vs stored weight mismatch worth flagging


def charm(usd: float) -> int:
    """$6,073 -> $6,069; $195 -> $199; tiny prices round to the dollar."""
    if usd < 20:
        return max(round(usd), 1)
    return int(round(usd / 10) * 10 - 1)


def retail_from_goldvalue(gv: float) -> float:
    """Marginal tiered markup on gold value -> retail (pre charm-round)."""
    total, lo = 0.0, 0.0
    for hi, mk in MARKUP_TIERS:
        if gv <= lo:
            break
        total += (min(gv, hi) - lo) * mk
        lo = hi
    return total


def price_for(weight_g: float, category: str) -> int:
    return charm(retail_from_goldvalue(weight_g * RATE_USD[category]))


# ── env / clients ───────────────────────────────────────────────────────────
DRY = '--apply' not in sys.argv
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WC_API = 'https://shinyjewellers.com/api'
RUN_TAG = f"repriced-{date.today():%Y-%m}"

# Credentials: environment first (GitHub Action), then the repo-root .env (local).
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
DOMAIN = os.environ.get('PUBLIC_STORE_DOMAIN')
TOKEN = os.environ.get('SHOPIFY_ADMIN_TOKEN')
_env = os.path.join(REPO_ROOT, '.env')
if not TOKEN and os.path.exists(_env):
    with open(_env) as f:
        for line in f:
            line = line.strip()
            if line.startswith('PUBLIC_STORE_DOMAIN='):
                DOMAIN = DOMAIN or line.split('=', 1)[1].strip().strip('"').strip("'")
            elif line.startswith('SHOPIFY_ADMIN_TOKEN='):
                TOKEN = line.split('=', 1)[1].strip().strip('"').strip("'")
DOMAIN = DOMAIN or 'styxgold.myshopify.com'
if not TOKEN:
    sys.exit("ERROR: Missing SHOPIFY_ADMIN_TOKEN (env var or .env)")
# Run artefacts (CSV + manifest) go to scripts/ locally (gitignored) or REPRICE_OUT.
OUT_DIR = os.environ.get('REPRICE_OUT') or (
    os.path.join(REPO_ROOT, 'scripts') if os.path.isdir(os.path.join(REPO_ROOT, 'scripts')) else SCRIPT_DIR)

# ── Optional: track the live gold spot ──────────────────────────────────────
# `--track-spot` scales every RATE_USD entry by (spot today / BASE_SPOT_USD).
# BASE_SPOT_USD is the spot the 2026-06-05 vendor rates were quoted against
# (Shiny's formula frozen at ~187 CAD/g pure gold ≈ US$4,200/oz).
# TODO(Hagop): confirm BASE_SPOT_USD before enabling the daily action.
TRACK_SPOT = '--track-spot' in sys.argv
BASE_SPOT_USD = float(os.environ.get('REPRICE_BASE_SPOT_USD', '4200'))
SPOT_DEADBAND = 0.01       # ignore moves under 1% so prices don't churn daily
SPOT_USD = None
if TRACK_SPOT:
    try:
        _req = urllib.request.Request('https://api.gold-api.com/price/XAU',
                                      headers={'User-Agent': 'styx-reprice'})
        with urllib.request.urlopen(_req, timeout=10) as _r:
            SPOT_USD = float(json.loads(_r.read())['price'])
    except Exception as e:  # no spot → keep frozen rates, say so loudly
        print(f"WARNING: spot fetch failed ({e}); using frozen rates")
    if SPOT_USD:
        _factor = SPOT_USD / BASE_SPOT_USD
        if abs(_factor - 1) < SPOT_DEADBAND:
            print(f"Spot ${SPOT_USD:,.0f}/oz within {SPOT_DEADBAND:.0%} of base "
                  f"${BASE_SPOT_USD:,.0f}; rates unchanged")
        else:
            RATE_USD = {k: round(v * _factor, 2) for k, v in RATE_USD.items()}
            print(f"Spot ${SPOT_USD:,.0f}/oz vs base ${BASE_SPOT_USD:,.0f} → rates ×{_factor:.4f}: "
                  + " | ".join(f"{k} ${v}" for k, v in RATE_USD.items()))


def gql(query, variables=None):
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    req = urllib.request.Request(
        f"https://{DOMAIN}/admin/api/2024-10/graphql.json",
        json.dumps(payload).encode(),
        {"X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                resp = json.loads(r.read())
            if "errors" in resp:
                print(f"  GQL ERROR: {resp['errors']}")
            cost = resp.get("extensions", {}).get("cost", {}).get("throttleStatus", {})
            if cost.get("currentlyAvailable", 1000) < 100:
                time.sleep(2)
            return resp
        except Exception:
            if attempt < 2:
                time.sleep(2)
            else:
                raise


def parse_length(s):
    """'18"', '18 inches', '8.5"', '20 + 2 ext' -> inches as float, else None."""
    s = str(s or '').strip().lower()
    s = re.sub(r'with.*', '', s).strip()
    s = re.sub(r'inch(es)?$', '', s).strip().replace('"', '').replace('”', '').replace("'", '')
    m = re.match(r'([\d.]+)\s*\+\s*\d+', s) or re.match(r'([\d.]+)', s)
    try:
        return float(m.group(1)) if m else None
    except Exception:
        return None


# ── Shopify ─────────────────────────────────────────────────────────────────
def fetch_shopify():
    products, cursor = [], None
    while True:
        after = f', after: "{cursor}"' if cursor else ''
        q = f'''{{
          products(first: 40{after}) {{
            edges {{ cursor node {{
              id title tags status
              karat: metafield(namespace: "chain", key: "karat") {{ value }}
              construction: metafield(namespace: "chain", key: "construction") {{ value }}
              variants(first: 100) {{ edges {{ node {{
                id sku price
                selectedOptions {{ name value }}
                vendorSku: metafield(namespace: "vendor", key: "sku") {{ value }}
                inventoryItem {{ measurement {{ weight {{ value unit }} }} }}
              }} }} }}
            }} }}
            pageInfo {{ hasNextPage }}
          }}
        }}'''
        data = gql(q)
        edges = data['data']['products']['edges']
        for e in edges:
            n = e['node']
            n['variants'] = [v['node'] for v in n['variants']['edges']]
            products.append(n)
            cursor = e['cursor']
        if not data['data']['products']['pageInfo']['hasNextPage']:
            break
    return products


def stored_weight_g(v):
    w = ((v.get('inventoryItem') or {}).get('measurement') or {}).get('weight') or {}
    val, unit = w.get('value'), (w.get('unit') or 'GRAMS').upper()
    if val in (None, 0, 0.0):
        return None
    val = float(val)
    return round(val * (28.3495 if unit == 'OUNCES' else 453.592 if unit == 'POUNDS'
                        else 1000 if unit == 'KILOGRAMS' else 1), 3)


# ── Vendor (ShinyJewellers WPGraphQL, keyless) ──────────────────────────────
WC_QUERY = '''query($after: String) {
  products(first: 100, after: $after, where: {category: "chains"}) {
    nodes {
      ... on SimpleProduct { name slug sku weight }
      ... on VariableProduct {
        name slug sku weight
        variations(first: 80) {
          nodes { name sku weight attributes { nodes { name value } } }
        }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}'''


def fetch_vendor():
    nodes, after = [], None
    while True:
        req = urllib.request.Request(WC_API, json.dumps(
            {"query": WC_QUERY, "variables": {"after": after}}).encode(),
            {"Content-Type": "application/json",
             "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                           "(KHTML, like Gecko) Chrome/130.0 Safari/537.36",
             "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read())
        prods = (data.get('data') or {}).get('products')
        if not prods:
            break
        nodes += prods['nodes']
        if not prods['pageInfo']['hasNextPage']:
            break
        after = prods['pageInfo']['endCursor']
    return [n for n in nodes if n]


def variation_length(v):
    """Length in inches from a variation's attributes, falling back to its SKU text."""
    for a in (v.get('attributes') or {}).get('nodes', []) or []:
        if 'length' in (a.get('name') or '').lower():
            L = parse_length(a.get('value') or '')
            if L:
                return L
    return parse_length(v.get('sku') or '')   # e.g. '2157A - 26"'


def _grams(w):
    try:
        g = float(str(w).replace(',', '.'))
        return g if g > 0 else None
    except Exception:
        return None


def index_vendor(nodes):
    """{parent_sku: {'weight': g, 'by_length': {...}, 'flat': bool, 'mono': bool}}, plus variation SKUs.
    flat  = every variation reports the parent's weight (vendor never weighed per length)
    mono  = per-length weights increase with length (otherwise the data is garbled,
            e.g. 20"=57g but 22"=47g, and stored weights are trusted instead)."""
    parents, variation_sku = {}, {}
    for n in nodes:
        psku = (n.get('sku') or '').strip()
        if not psku:
            continue
        by_len = {}
        for v in ((n.get('variations') or {}).get('nodes') or []):
            vsku = (v.get('sku') or '').strip()
            g, L = _grams(v.get('weight')), variation_length(v)
            if vsku:
                variation_sku[vsku] = {'parent': psku, 'weight': g, 'length': L}
            if g and L and L not in by_len:
                by_len[L] = g
        pw = _grams(n.get('weight'))
        weights = list(by_len.values())
        flat = len(weights) > 1 and len({round(w, 2) for w in weights}) == 1
        lens = sorted(by_len)
        mono = all(by_len[a] < by_len[b] for a, b in zip(lens, lens[1:])) if len(lens) > 1 else True
        parents[psku] = {'weight': pw, 'by_length': by_len, 'flat': flat, 'mono': mono}
    return parents, variation_sku


def category_of(product):
    cons = (product.get('construction') or {}).get('value') or ''
    title = product.get('title') or ''
    if 'hollow' in cons.lower() or 'hollow' in title.lower():
        return 'hollow'
    karat = (product.get('karat') or {}).get('value') or ''
    m = re.search(r'(\d+)', str(karat)) or re.search(r'(\d+)\s*[kK]\b', title)
    if m and f"{m.group(1)}k" in RATE_USD:
        return f"{m.group(1)}k"
    return None


def resolve_weight(vsku, L, stored, parents, variation_sku):
    """-> (weight_g, source, flag). Vendor exact length wins unless its data is
    flat / non-monotonic / points at another length; then the stored weight wins."""
    flag = ''
    var = variation_sku.get(vsku)
    parent = parents.get(var['parent']) if var else parents.get(vsku)
    if var and var['length'] and L and abs(var['length'] - L) > 0.01:
        # vendor.sku maps to a variation of a different length → never trust it
        if stored:
            return stored, 'stored (sku-length-mismatch)', f'vendor.sku {vsku} is the {var["length"]:g}" variation'
        return None, '', f'vendor.sku {vsku} is the {var["length"]:g}" variation and no stored weight'
    if parent and parent['flat'] and stored:
        return stored, 'stored (vendor-flat)', 'vendor lists one weight for every length'
    if parent and not parent['mono'] and stored:
        return stored, 'stored (vendor-nonmono)', 'vendor per-length weights non-monotonic — verify with vendor'
    vendor_w, src = None, ''
    if var and var['weight'] and (not L or not var['length'] or abs(var['length'] - L) <= 0.01):
        vendor_w, src = var['weight'], 'vendor-exact'
    elif parent and L and L in parent['by_length']:
        vendor_w, src = parent['by_length'][L], 'vendor-length'
    if vendor_w:
        if stored and abs(vendor_w - stored) > TOLERANCE_G:
            flag = f'weight drift: vendor {vendor_w:g}g vs stored {stored:g}g'
        return vendor_w, src, flag
    if stored:
        return stored, 'shopify-stored', ''
    return None, '', 'no weight (vendor has none, nothing stored)'


# ── main ────────────────────────────────────────────────────────────────────
def main():
    print(f"{'DRY RUN' if DRY else 'APPLY'} — {DOMAIN}")
    print(f"Rates ({RATES_DATE}, USD/g): " +
          " | ".join(f"{k} ${v}" for k, v in RATE_USD.items()))
    print("Markup tiers: " + ", ".join(f"≤${hi:,.0f} ×{mk}" if hi != float('inf') else f">×{mk}"
                                       for hi, mk in MARKUP_TIERS))
    products = fetch_shopify()
    print(f"Shopify: {len(products)} products")
    try:
        parents, variation_sku = index_vendor(fetch_vendor())
        print(f"Vendor: {len(parents)} parents, {len(variation_sku)} variations")
    except Exception as e:
        parents, variation_sku = {}, {}
        print(f"WARNING: vendor fetch failed ({e}); pricing from stored weights only")

    rows, plan, exceptions, by_src = [], {}, [], {}
    for p in products:
        cat = category_of(p)
        for v in p['variants']:
            opts = {o['name'].lower(): o['value'] for o in v.get('selectedOptions') or []}
            L = parse_length(opts.get('length'))
            vsku = ((v.get('vendorSku') or {}).get('value') or '').strip()
            cur = float(v.get('price') or 0)
            if cur == 0:
                exceptions.append({'product': p['title'], 'variant_sku': v.get('sku') or '', 'vendor_sku': vsku,
                                   'length': L, 'reason': 'price 0 (vendor-discontinued, left zeroed)'})
                continue
            if not cat:
                exceptions.append({'product': p['title'], 'variant_sku': v.get('sku') or '', 'vendor_sku': vsku,
                                   'length': L, 'reason': 'no karat / construction → no rate'})
                continue
            stored = stored_weight_g(v)
            w, src, flag = resolve_weight(vsku, L, stored, parents, variation_sku)
            if not w:
                exceptions.append({'product': p['title'], 'variant_sku': v.get('sku') or '', 'vendor_sku': vsku,
                                   'length': L, 'reason': flag or 'no weight'})
                continue
            new = price_for(w, cat)
            by_src[src] = by_src.get(src, 0) + 1
            rows.append({'product': p['title'], 'variant_sku': v.get('sku') or '', 'vendor_sku': vsku,
                         'category': cat, 'length': L, 'weight_g': w, 'weight_source': src,
                         'old_price': cur, 'new_price': new, 'delta': round(new - cur, 2), 'flag': flag})
            if new != cur:
                plan.setdefault(p['id'], []).append({'id': v['id'], 'price': f"{new:.2f}"})

    rows.sort(key=lambda r: (r['product'], r['length'] or 0, r['variant_sku']))
    out_csv = os.path.join(OUT_DIR, f"reprice-run-{date.today()}.csv")
    with open(out_csv, 'w', newline='') as f:
        wtr = csv.DictWriter(f, fieldnames=['product', 'variant_sku', 'vendor_sku', 'category', 'length',
                                            'weight_g', 'weight_source', 'old_price', 'new_price', 'delta', 'flag'])
        wtr.writeheader()
        wtr.writerows(rows)

    changed = [r for r in rows if r['delta']]
    drift = [r for r in rows if r['flag']]
    print(f"\nPriced {len(rows)} variants; {len(changed)} change on {len(plan)} products; "
          f"{len(exceptions)} exceptions; {len(drift)} weight flags")
    print("Weight sources: " + ", ".join(f"{k} {n}" for k, n in sorted(by_src.items(), key=lambda x: -x[1])))
    if changed:
        up = sum(1 for r in changed if r['delta'] > 0)
        print(f"  {up} up, {len(changed) - up} down; biggest moves:")
        for r in sorted(changed, key=lambda r: -abs(r['delta']))[:8]:
            print(f"    {r['product']} {r['variant_sku']}: ${r['old_price']:,.0f} → ${r['new_price']:,} ({r['delta']:+,.0f})")
    for e in exceptions[:12]:
        print(f"  skip: {e['product']} {e['variant_sku']}: {e['reason']}")
    if len(exceptions) > 12:
        print(f"  … {len(exceptions) - 12} more exceptions in the manifest")
    print(f"CSV: {out_csv}")

    if DRY:
        print("\nDRY RUN — nothing written. Re-run with --apply to push prices + tags.")
        return

    PRICE_MUT = '''mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        userErrors { field message } } }'''
    TAG_MUT = '''mutation($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) { userErrors { field message } } }'''
    errors = 0
    for i, (pid, variants) in enumerate(plan.items(), 1):
        r = gql(PRICE_MUT, {'productId': pid, 'variants': variants})
        ue = ((r.get('data') or {}).get('productVariantsBulkUpdate') or {}).get('userErrors') or []
        if ue:
            errors += 1
            print(f"  ERROR {pid}: {ue}")
            continue
        r = gql(TAG_MUT, {'id': pid, 'tags': [RUN_TAG]})
        ue = ((r.get('data') or {}).get('tagsAdd') or {}).get('userErrors') or []
        if ue:
            print(f"  tag error {pid}: {ue}")
        if i % 10 == 0:
            print(f"  {i}/{len(plan)} products updated")
            time.sleep(0.5)

    manifest = {
        'date': str(date.today()), 'tag': RUN_TAG,
        'rates_usd_per_g': RATE_USD, 'rates_date': RATES_DATE,
        'spot_usd_oz': SPOT_USD, 'base_spot_usd_oz': BASE_SPOT_USD if TRACK_SPOT else None,
        'markup_tiers': [[None if hi == float('inf') else hi, mk] for hi, mk in MARKUP_TIERS],
        'variants_priced': len(rows), 'variants_changed': len(changed),
        'products_touched': len(plan), 'errors': errors, 'weight_sources': by_src,
        'weight_drift_flags': len(drift), 'exceptions': exceptions,
    }
    mpath = os.path.join(OUT_DIR, f"reprice-manifest-{date.today()}.json")
    with open(mpath, 'w') as f:
        json.dump(manifest, f, indent=2)
    print(f"\nDONE — products tagged '{RUN_TAG}', manifest: {mpath}")


if __name__ == '__main__':
    main()
