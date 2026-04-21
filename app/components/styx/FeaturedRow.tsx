import {STYX, FONT} from './constants';
import {StyxLabel} from './StyxLabel';
import {StyxProductCard} from './StyxProductCard';

type ProductNode = {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  variants: {
    nodes: Array<{
      id: string;
      image?: {
        url: string;
        altText?: string | null;
        width?: number | null;
        height?: number | null;
      } | null;
      price: {
        amount: string;
        currencyCode: string;
      };
      compareAtPrice?: {
        amount: string;
        currencyCode: string;
      } | null;
    }>;
  };
};

export function FeaturedRow({products}: {products: ProductNode[]}) {
  return (
    <section
      style={{
        background: STYX.bone,
        padding: '96px 56px',
      }}
    >
      <StyxLabel>Featured · IV</StyxLabel>
      <h2
        style={{
          fontFamily: FONT.cinzel,
          fontSize: 40,
          fontWeight: 400,
          color: STYX.ink,
          margin: '0 0 48px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        Four pieces worth carrying.
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
        }}
      >
        {products.slice(0, 4).map((product) => (
          <StyxProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
