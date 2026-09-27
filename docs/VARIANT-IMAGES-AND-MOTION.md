# Variant images and quick entrances

## Why every finish appeared

The PDP previously fetched the product media gallery and treated any photo with no color in its alt text as color-neutral. It then mounted every such photo below the main image. Lazy loading only deferred downloads; it did not filter by variant.

A read-only Storefront API sample of the first 30 products found 15 multi-color products. In all 15, the first selectable variants for different colors pointed to the same main image, and the sampled gallery photos had blank alt text. Examples:

- `10k-gold-1-9mm-curb-chain`: White and Yellow Gold both point at `_0_keep.jpg`; eight unlabelled product photos.
- `14k-gold-0-7mm-wheat-chain`: Rose, White, and Yellow Gold all point at `_0_keep.jpg`; two unlabelled photos.
- `10k-gold-8-6mm-cuban-link-chain-bracelet`: White and Yellow Gold share `_0_keep.jpg`; two unlabelled photos.

Product cards also mounted a hidden hover image from a different variant. That image could load before hover and could show a different finish from the card label.

## Storefront changes

- A multi-color product now shows its selected variant's assigned main image and photos explicitly marked for that finish. Unknown photos are not mounted under every color.
- Other variant-owned images must match the selected options. Explicit color metadata takes precedence over a stale assignment.
- Unlabelled alternate views remain available for single-finish products. Shared packaging/detail photos can be explicitly marked `[shared]` in Shopify media alt text.
- Duplicate image suppression remains in place. Changing the lead image resets its zoom/lightbox state.
- The media query reads up to 100 metadata records, then filters before rendering, so a later finish is not cut off by the old seven-record query. Image bytes are requested only for mounted gallery images, not every metadata record. The rest of the page can still request recommendation/collection imagery independently.
- Product cards mount one selected image; the unrelated variant hover image was removed.

**Catalog limitation:** the storefront still uses Shopify's assigned main image. Where multiple colors share the same assignment, changing color will keep that image until Shopify is corrected. No color was guessed from filename order and no live catalog data was changed. Repair requires identifying the correct source image for each finish, assigning it to the corresponding variants, and labeling alternate views with their finish. Existing historical import tools in `scripts/` include color-image mapping logic, but they also perform unrelated mutations and were not run.

## Motion

- Product cards, category tiles, collection cards, Customize options/process steps, About text blocks, and PDP headings/details reveal individually.
- One shared IntersectionObserver handles the page; a child-list MutationObserver registers deferred/replaced cards. Both are cleaned up on route changes. Sticky buy boxes are not animated as containers.
- Standard entrance: 360ms with 0–75ms stagger. Desktop menu links: 300ms with 0–75ms stagger. Mobile root menu: 300ms with a short stagger. Hero image: 550ms; PDP image: 420ms.
- Initial visible content uses CSS entrances. Content is readable without JavaScript and with reduced motion. Switching to reduced motion immediately exposes all pending items.

## Validation

- Production build, TypeScript, and 41 tests pass, including nine gallery regression cases. Targeted lint has no errors; existing warnings remain.
- Local HTML for the two-color 2mm Curb (`10k-gold-1-9mm-curb-chain`) contains one gallery image for either color, instead of rendering all the unlabelled views.
- Browser checks confirm each mega-menu link uses a 300ms entrance with staggered delays; all four homepage featured cards use 360ms reveals and contain only one image each.
- About and Customize headings use 360ms entrances; desktop screenshots were inspected. Mobile PDP has no horizontal overflow at 390px. The network log contains only `_0_keep.jpg` for the tested Curb product, rather than its unassigned alternate photos. Reduced motion disables headings, lead-image, and mobile-menu entrances and clears pending reveals.
- Direct Yellow Gold load and client-side activation of the White Gold option both retain one gallery image and the correct selected option. The image stays the same because the source assignments are shared.
- During iterative edits, React Router reported two dev-only HMR module-update errors; the production build passed.
