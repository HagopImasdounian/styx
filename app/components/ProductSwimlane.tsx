import type {HomepageFeaturedProductsQuery} from 'storefrontapi.generated';
import {Section} from '~/components/Text';
import {ProductCard} from '~/components/ProductCard';

type ProductSwimlaneProps = HomepageFeaturedProductsQuery & {
  title?: string;
  count?: number;
};

export function ProductSwimlane({
  title = 'Featured Products',
  products = {nodes: []},
  count = 12,
  ...props
}: ProductSwimlaneProps) {
  return (
    <Section heading={title} padding="y" {...props}>
      <div className="swimlane hiddenScroll md:pb-8 md:scroll-px-8 lg:scroll-px-12 md:px-8 lg:px-12">
        {products.nodes.map((product) => (
          <ProductCard
            product={product}
            key={product.id}
            className="snap-start w-80"
          />
        ))}
      </div>
    </Section>
  );
}
