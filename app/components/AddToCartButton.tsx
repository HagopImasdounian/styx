import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import type {FetcherWithComponents} from 'react-router';

import {Button} from '~/components/Button';
import {trackAddToCart} from '~/components/GTMDataLayer';

export function AddToCartButton({
  children,
  lines,
  className = '',
  variant = 'primary',
  width = 'full',
  disabled,
  analytics,
  ...props
}: {
  children: React.ReactNode;
  lines: Array<OptimisticCartLineInput>;
  className?: string;
  variant?: 'primary' | 'secondary' | 'inline';
  width?: 'auto' | 'full';
  disabled?: boolean;
  analytics?: {
    id: string;
    title: string;
    price: string;
    quantity: number;
    variantTitle?: string;
  };
  [key: string]: any;
}) {
  return (
    <CartForm
      route="/cart"
      inputs={{
        lines,
      }}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher: FetcherWithComponents<any>) => {
        return (
          <>
            <Button
              as="button"
              type="submit"
              width={width}
              variant={variant}
              className={className}
              disabled={disabled ?? fetcher.state !== 'idle'}
              onClick={() => {
                if (analytics) {
                  trackAddToCart(analytics);
                }
              }}
              {...props}
            >
              {children}
            </Button>
          </>
        );
      }}
    </CartForm>
  );
}
