# Mobile audit — Product page (PDP) @ 390×844

Run 2026-06-09 against `http://localhost:3000/products/10k-gold-2-4mm-hollow-curb-chain-bracelet`,
**after** the four mobile fixes shipped in commit `305fd1f`. Measured with
`~/.claude/skills/mobile-optimization/scripts/mobile-audit.js`. Set aside for a later pass.

## Passing (verified)
- **Horizontal overflow: none** at 320 / 360 / 390px (`scrollWidth === innerWidth`). The earlier
  ~21px overflow (grid `minmax(auto,1fr)` → `minmax(0,1fr)`) is fixed; the suspected 320px nav
  overflow does NOT reproduce.
- **CLS risk: 0** media without dimensions.
- **iOS zoom inputs: 0** (no input under 16px).
- **Sticky chrome: ~14%** — only `styx-nav` (115px) sticks; no bottom bar (sticky ATC was removed).
  Not oppressive.

## High — tap targets under 44px (Apple HIG) / 24px (WCAG 2.2)
- **Header icon buttons** (Search, Wishlist, Print-list, Open-cart): **34×34px**. Bump to ≥44px
  (add padding, not just visual size). `StyxNav.tsx`.
- **Variant option buttons** (Length, Color pills): **36×34px**. Several of them. Raise to ≥44px tall.
  Product route option selectors.
- **Hamburger** (`button.styx-nav-hamburger`): **42×42px** — just under; bump to 44.
- **Breadcrumb** "← Curb Chains": inline link **119×17px** (height < 24px WCAG floor). Add vertical padding.
- **"H&Co" footer credit**: inline link **32×13px** (< 24px). Minor (footer colophon) but flagged.

## Medium — typography
- **55 text runs under 12px.** Worst offenders at **9px**: "Credit Card", "Wire Transfer",
  "Favorite". Several **10–11px**: gold ticker ("LIVE", "Gold Spot", price), "Why we show this",
  launch-offer bar, "Length"/"Color" labels, breadcrumb. Brand uses small mono microcopy
  intentionally, but 9px is hard to read on a phone — consider a 10–11px floor for the smallest.

## Low / optional
- **Product Details spec grid** stays 2-column (`167px 167px`) on mobile — acceptable, each cell is a
  short label+value pair ("Chain Style / Curb") that fits. Could go 1-column for consistency with the
  "…in the open" block, but not broken.
- Gallery + "related/explore" rails are intentional horizontal scrollers (their content extends past
  the viewport but is clipped inside their own `overflow-x` — not page overflow).

## Maintenance (unrelated, from the deploy)
- The Oxygen deploy workflow uses Node 20 GitHub Actions (`actions/checkout@v4`, `setup-node@v4`,
  `cache@v4`) which GitHub deprecates June 2026 — bump when convenient.
