import {STYX, FONT} from './constants';
import {StyxLabel} from './StyxLabel';
import {StyxProductCard} from './StyxProductCard';

/**
 * Shared "row of product cards" section — one block, reused everywhere a PDP
 * shows a grid of related products (You Might Also Like, Recently Viewed, …).
 * Renders the same <StyxProductCard> in the same 4-up grid so every such
 * section lines up identically. Returns null when there's nothing to show.
 */
export function ProductGridSection({
  label,
  heading,
  products,
  maxItems = 4,
}: {
  label: string;
  heading: string;
  products: any[];
  maxItems?: number;
}) {
  const items = (products ?? []).filter(Boolean).slice(0, maxItems);
  if (items.length === 0) return null;

  return (
    <section
      className="styx-product-related"
      style={{maxWidth: 1440, margin: '0 auto', padding: '80px 56px'}}
    >
      <StyxLabel>{label}</StyxLabel>
      <h2
        style={{
          fontFamily: FONT.cinzel,
          fontSize: 36,
          fontWeight: 400,
          color: STYX.ink,
          margin: '8px 0 40px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {heading}
      </h2>
      <div
        className="styx-product-related-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
        }}
      >
        {items.map((product, i) => (
          <StyxProductCard key={product.id} product={product} index={i} belowFold />
        ))}
      </div>
    </section>
  );
}
