# ShinyJewellers Full Inventory — Confirmed from API + Website Scrape
> Generated 2026-05-19. Source: shinyjewellers.com/api (WPGraphQL)

## Known Data Issues
- **Weights are per-product, NOT per-length** — a 20" and 24" of the same chain show the same weight. Need real per-length weights from Shiny.
- **Some thickness attributes are wrong** in the API (e.g., 4.3mm and 5.3mm curbs both say "3mm"). Product names are more accurate.
- **SKU format is inconsistent** — some use `2157A - 20"`, others `2160-22"`, others `14K 8.6mm / 22"`. We should normalize to `{baseSKU} - {length}"`.

---

## CUBAN LINK CHAINS

### Solid — 10K

| # | Product | SKU Base | Thickness | Lengths (Necklace) | Bracelet? | Weight | Colors |
|---|---------|----------|-----------|---------------------|-----------|--------|--------|
| 1 | 10K 5.3mm Miami Cuban | 2157A | 5.3mm | 20", 22", 24", 26" | No | 47-57g (varies) | Yellow |
| 2 | 10K 6.4mm Miami Cuban | 2157B | 6.4mm | 20", 22" | No | 57g | Yellow |
| 3 | 10K 7.6mm Miami Cuban | 2157C | 7.6mm | 20" only | No | 74g | Yellow |
| 4 | 10K 8.6mm Miami Cuban | 2158 / 2158W | 8.6mm | 22", 24" | **8.5" (separate)** | 96g | Yellow, White |
| 5 | 10K 10.7mm Miami Cuban | 2159 / 2159W | 10.7mm | 22", 24", 26" | **8.5" (separate)** | 143g | Yellow, White |
| 6 | 10K 13mm Miami Cuban | 2160 / 2160W | 13mm | 22", 24" | **8.5" (separate)** | 245g | Yellow, White |

### Solid — 14K

| # | Product | SKU Base | Thickness | Lengths (Necklace) | Bracelet? | Weight | Colors |
|---|---------|----------|-----------|---------------------|-----------|--------|--------|
| 7 | 14K 5.3mm Miami Cuban | 2157A - 14K | 5.3mm | 20", 22", 24" | **8.5" (separate)** | 204g (SUSPECT) | Yellow |
| 8 | 14K 6.4mm Miami Cuban | 2157B -14K | 6.4mm | 20", 22" | **8.5" (separate)** | 63g | Yellow |
| 9 | 14K 8.3mm Miami Cuban | 2158 -14K | 8.3mm | 20", 22", 24" | **8.5" (separate)** | 102g | Yellow |
| 10 | 14K 10.7mm Miami Cuban | 2159 -14K | 10.7mm | ? (listed as bracelet) | **Yes** | 157g | Yellow |

### Hollow — 10K

| # | Product | SKU Base | Thickness | Lengths (Necklace) | Bracelet? | Weight | Colors |
|---|---------|----------|-----------|---------------------|-----------|--------|--------|
| 11 | 10K Hollow 6.4mm Cuban | 2845 | 6.4mm | 20" only | No | 18.7g | Yellow |
| 12 | 10K Hollow 7.3mm Cuban | 2846 | 7.3mm | 22" | **8.5" (separate)** | 18.7g (placeholder) | Yellow |
| 13 | 10K Hollow 8.6mm Cuban | 2847 | 8.6mm | 20" | **8.5" (separate)** | 18.7g (placeholder) | Yellow |

**Cuban Bracelets to separate:** #4, #5, #6, #7, #8, #9, #10, #12, #13 all have 8.5" bracelet variants that should be split into separate bracelet products.

---

## BOX CHAINS

### Solid — 10K

| # | Product | SKU Base | Thickness | Lengths | Weight | Colors |
|---|---------|----------|-----------|---------|--------|--------|
| 1 | 10K Box | 2021 / 2022 | 0.6mm | 14", 16", 18", 18"+2", 20", 22" | 0.9g | Yellow, White |
| 2 | 10K Box | 2021A / 2023 / 2013 | 0.7mm | 16", 18", 18"+2", 20" | 0.9g | Yellow, White, Rose |
| 3 | 10K Box | 2021B / 2024 | 1.0mm | 18", 20", 22", 24" | 3g | Yellow, White |
| 4 | 10K Box | 2021B-1 / 2024A | 1.0mm | 20", 22", 24" | 3g | Yellow, White |
| 5 | 10K Box | 2021C / 2025 | 1.3mm | 20", 22", 24" | 5.2g | Yellow, White |

> **Note:** #3 and #4 are near-duplicates (both 1.0mm, 3g). #3 includes 18" while #4 doesn't. May be different batches — confirm with Shiny.

### Solid — 14K

| # | Product | SKU Base | Thickness | Lengths | Weight | Colors |
|---|---------|----------|-----------|---------|--------|--------|
| 6 | 14K Box | 510 / 511 | 0.6mm | 16", 18", 20" | 0.9g | Yellow, White |

### Hollow — 10K

| # | Product | SKU Base | Thickness | Lengths (Necklace) | Bracelet? | Weight | Colors |
|---|---------|----------|-----------|---------------------|-----------|--------|--------|
| 7 | 10K Hollow Rounded Box | 2831 / 2832 | 2.35mm | 18", 20", 22", 24", 28", 30" | **8.5" (separate)** | 6.5g | Yellow, White |

### Adjustable — 10K

| # | Product | SKU Base | Thickness | Lengths | Weight | Colors |
|---|---------|----------|-----------|---------|--------|--------|
| 8 | 10K Adjustable Box | 2005 / 2006 / 2007 | 0.7mm | 20" (adjustable) | 2.5g | Yellow, White, Rose |

### Adjustable — 14K

| # | Product | SKU Base | Thickness | Lengths | Weight | Colors |
|---|---------|----------|-----------|---------|--------|--------|
| 9 | 14K Adjustable Box | 2005-14K / 2006-14K | 0.7mm | 20" (adjustable) | 2.9g | Yellow, White |

### ORO Series — 10K Box

| # | SKU | Weight | Lengths | Colors |
|---|-----|--------|---------|--------|
| 10 | ORO 8 | 2g | 20" (adjustable w/ loop at 18") | Yellow, White |
| 11 | ORO 9 (Y9/W9) | 3g | 20"+2" | Yellow, White |
| 12 | ORO 10 (Y10/W10) | 4.8g | 20"+2" | Yellow, White |
| 13 | ORO 14 | 6.5g | 20"+2" | Yellow, White |

> **ORO 14 karat question:** Slug says "oro14" but API says 10K. Needs confirmation from Shiny.

---

## CURB CHAINS

### Solid Standard Curb — 10K

| # | Product | SKU Base | Thickness | Lengths | Weight | Colors |
|---|---------|----------|-----------|---------|--------|--------|
| 1 | 10K 0.75mm Curb | 2025A-Y / 2025A | 0.85mm | 18" | 1g | Yellow, White |
| 2 | 10K 0.85mm Curb | 2026Y / 2026 | 0.85mm | 16", 18", 20", 22", 24" | 1g | Yellow, White |
| 3 | 10K 1.4mm Curb | 2027Y / 2027 | 1.4mm | 16", 18", 20", 22", 24" | 2.7g | Yellow, White |
| 4 | 10K 1.5mm Curb | 2121A / 2121B | 1.5mm | 16", 18", 20", 22" | 1.3g | Yellow, White |
| 5 | 10K 1.9mm Curb | 2121C / 2121D | 1.9mm | 20", 22", 24" | 2.3g | Yellow, White |
| 6 | 10K 2.5mm Curb | 2121E | 2.5mm | 20", 22", 24" | 3g | Yellow |
| 7 | 10K 3mm Curb | 2121F | 3mm | 20", 22", 24" | 16.8g | Yellow |
| 8 | 10K 4.3mm Curb | 2121H | 4.3mm | 20" | 16.8g | Yellow |
| 9 | 10K 5.3mm Curb | 2121I | 5.3mm | 20" | 16.8g | Yellow |
| 10 | 10K Curb (white) | 2123 | ? | 16", 22", 24" | 4.2g | White |

> **Bracelet to separate:** 4.3mm Curb (#8) has a 7.5" bracelet variant (SKU 2121H - 7.5")

### Solid Gentle Concave Curb — 10K

| # | Product | SKU Base | Thickness | Lengths | Weight | Colors |
|---|---------|----------|-----------|---------|--------|--------|
| 11 | Concave 3.3mm | 2135A | 3.3mm | 20", 22", 24" | 11g | Yellow |
| 12 | Concave 4.3mm | 2136 / 2143 | 4.3mm | 20", 22", 24" | 11g | Yellow, White |
| 13 | Concave 5mm | 2137 | 5mm | 20", 22", 24" | 12.5g | Yellow |
| 14 | Concave 5.9mm | 2138 | 5.9mm | 20", 22", 24" | 17.5g | Yellow |
| 15 | Concave 6.6mm | 2139 | 6.6mm | 20", 22", 24" | 22.6g | Yellow |
| 16 | Concave 7.5mm | 2140 | 7.5mm | 20", 22", 24" | 26.7g | Yellow |
| 17 | Concave 8.4mm | 2140A | 8.4mm | 20", 22", 24" | 26.7g | Yellow |
| 18 | Concave 10mm | 2141-BR | 10mm | **Bracelet only** | 32.7g | Yellow |

> **Bracelet to separate:** #18 is bracelet-only.

### Solid Gentle Beveled Curb — 10K

| # | Product | SKU Base | Thickness | Lengths | Weight | Colors |
|---|---------|----------|-----------|---------|--------|--------|
| 19 | Beveled (4.9g) | 2124 / 2130 | ? | 20", 22", 24" | 4.9g | Yellow, White |
| 20 | Beveled (8.1g) | 2125 / 2131 | ? | 20", 22", 24" | 8.1g | Yellow, White |
| 21 | Beveled (10.8g) | 2125A | ? | 20", 24" | 10.8g | Yellow |
| 22 | Beveled (13.5g) | 2127 / 2133 | ? | 20", 22", 24" | 13.5g | Yellow, White |
| 23 | Beveled (13.6g) | 2126 / 2132 | ? | 20", 22", 24" | 13.6g | Yellow, White |
| 24 | Beveled 6.5mm (28.7g) | 2135 | 6.5mm | 20", 22" | 28.7g | White |

> **Note:** #21 has a "25 inch" variant that's likely a typo for 22".

### Solid Gentle Marine — 10K

| # | Product | SKU Base | Thickness | Lengths (Necklace) | Bracelet? | Weight | Colors |
|---|---------|----------|-----------|---------------------|-----------|--------|--------|
| 25 | Marine (3.6g) | 2101 / 2106 | ? | 16", 18", 20", 22", 24" | No | 3.6g | Yellow, White |
| 26 | Marine (8.9g) | 2102 / 2107 | ? | 18", 20", 22", 24" | No | 8.9g | Yellow, White |
| 27 | Marine (16.7g) | 2103 | ? | 20", 22", 24" | No | 16.7g | Yellow |
| 28 | Marine (16.7g) w/ bracelet | 2103A | ? | 20", 22", 24" | **7", 8.5" (separate)** | 16.7g | Yellow |
| 29 | Marine (26.9g) | 2104 | ? | 20", 22", 24" | No | 26.9g | Yellow |

> **Bracelets to separate:** #28 has 7" and 8.5" bracelet variants.

### Hollow Curb — 10K

| # | Product | SKU Base | Thickness | Lengths | Bracelet? | Weight | Colors |
|---|---------|----------|-----------|---------|-----------|--------|--------|
| 30 | Hollow 1.6mm Curb | 2801 / 2802 | 1.6mm | 16", 18", 20" | **7" (separate)** | 1.4g | Yellow, White |
| 31 | Hollow 2.4mm Curb | 2803 / 2804 | 2.4mm | 16"+2" | **BR (separate)** | 2g | Yellow, White |
| 32 | Hollow 2.3mm Marine | 2817 / 2818 | 2.3mm | 18", 20" | No | 3g | Yellow, White |

### Solid Curb — 14K

| # | Product | SKU Base | Thickness | Lengths | Weight | Colors |
|---|---------|----------|-----------|---------|--------|--------|
| 33 | 14K 0.8mm Curb | 512 / 513 | 0.8mm | 16", 18", 20" | 0.9g | Yellow, White |
| 34 | 14K 1.4mm Curb | 514 / 515 | 1.4mm | 16", 18", 20" | 0.9g | Yellow, White |

### ORO Series — 10K Curb

| # | SKU | Style | Weight | Lengths | Colors |
|---|-----|-------|--------|---------|--------|
| 35 | ORO 5 | Curb | 3.45g | 20" (adj) | Yellow, White |
| 36 | ORO 15 | Bevelled Curb | 2.9g | 20" | Yellow, White |
| 37 | ORO 16 | Bevelled Curb | 4.9g | 20" | Yellow, White |
| 38 | ORO 17 | Bevelled Curb | 8.1g | 20" | Yellow, White |
| 39 | ORO 18 | Concave Curb | 11g | 20" | Yellow, White |
| 40 | ORO 19 | Marine | 4.4g | 20" | Yellow, White |
| 41 | ORO 20 | Marine | 8.9g | 20" | Yellow, White |

---

## ROPE CHAINS

### Solid — 10K

| # | Product | SKU Base | Thickness | Lengths | Weight | Colors |
|---|---------|----------|-----------|---------|--------|--------|
| 1 | 10K 3mm Diamond Cut Solid Rope | 2153 / 2153W / 2153R | 3mm | 22", 24", 26" | 23.1g | Yellow, White, Rose |
| 2 | 10K 4mm Diamond Cut Solid Rope | 2154 / 2154A / 2154C | 4mm | 24", 26" | 43.92g | Yellow, White, Rose |
| 3 | 10K 5mm Diamond Cut Solid Rope | 2155 | 5mm | 22", 24", 26", 28" | 54.48g | Yellow |
| 4 | 10K 6mm Diamond Cut Solid Rope | 2156 / 2156A / 2156B | 6mm | 22", 24", 26" | 77g | Yellow, White, Rose |
| 5 | 10K 7mm Diamond Cut Solid Rope | 2157 | 7mm | 22", 24", 26" | 151.2g | Yellow |

### Hollow — 10K

| # | Product | SKU Base | Thickness | Lengths | Weight | Colors |
|---|---------|----------|-----------|---------|--------|--------|
| 6 | 10K Hollow Rope 2.5mm | 120 | 2.5mm | 16", 18", 20", 22", 24" | 3.2g | Yellow |
| 7 | 10K Hollow Rope 3mm | 121 | 3mm | 18", 20", 22", 24" | 5.6g | Yellow |

### ORO Series — 10K Rope

| # | SKU | Weight | Lengths | Colors |
|---|-----|--------|---------|--------|
| 8 | ORO 12A (Y12A/W12A) | 1.9g | 20" | Yellow, White |

### Solid — 14K
> **None.** No 14K rope chains in inventory.

---

## BRACELETS TO SEPARATE (all currently mixed in with necklaces)

| Source Product | SKU | Thickness | Length | Karat | Category |
|---------------|-----|-----------|--------|-------|----------|
| 8.6mm Cuban | 2158 BR / 2158W BR | 8.6mm | 8.5" | 10K | Cuban |
| 10.7mm Cuban | 2159BR / 2159W BR | 10.7mm | 8.5" | 10K | Cuban |
| 13mm Cuban | 2160-BR / 2160W-BR | 13mm | 8.5" | 10K | Cuban |
| 14K 5.3mm Cuban | 2157A-14K BR | 5.3mm | 8.5" | 14K | Cuban |
| 14K 6.4mm Cuban | 2157B-14K BR | 6.4mm | 8.5" | 14K | Cuban |
| 14K 8.3mm Cuban | 2158-14K BR | 8.3mm | 8.5" | 14K | Cuban |
| 14K 10.7mm Cuban | 2159-14K BR | 10.7mm | 8.5" | 14K | Cuban |
| Hollow 7.3mm Cuban | 2846 BR | 7.3mm | 8.5" | 10K | Cuban |
| Hollow 8.6mm Cuban | 2847 BR | 8.6mm | 8.5" | 10K | Cuban |
| Hollow Rounded Box | 2831 BR | 2.35mm | 8.5" | 10K | Box |
| 4.3mm Curb | 2121H - 7.5" | 4.3mm | 7.5" | 10K | Curb |
| Concave 10mm Curb | 2141-BR | 10mm | BR | 10K | Curb |
| Marine (16.7g) | 2103A - 7"/8.5" | ? | 7", 8.5" | 10K | Curb/Marine |
| Hollow 1.6mm Curb | 2801/2802 BR | 1.6mm | 7" | 10K | Curb |
| Hollow 2.4mm Curb | 2803/2804 BR | 2.4mm | BR | 10K | Curb |

---

## TOTALS

| Category | Necklace Products | Bracelet Variants | 10K | 14K | Solid | Hollow |
|----------|-------------------|-------------------|-----|-----|-------|--------|
| Cuban | 13 | 9 | 9 | 4 | 10 | 3 |
| Box | 13 | 1 | 11 | 2 | 12 | 1 |
| Curb | 41 | 5 | 39 | 2 | 38 | 3 |
| Rope | 8 | 0 | 8 | 0 | 5 | 2 (+1 ORO) |
| **Total** | **75** | **15** | **67** | **8** | **65** | **9** |
