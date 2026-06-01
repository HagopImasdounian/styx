import clsx from 'clsx';
import {useRef} from 'react';
import {
  flattenConnection,
  CartForm,
  Image,
  Money,
  useOptimisticData,
  OptimisticInput,
  type CartReturn,
} from '@shopify/hydrogen';
import type {
  Cart as CartType,
  CartCost,
  CartLine,
  CartLineUpdateInput,
} from '@shopify/hydrogen/storefront-api-types';

import {Link} from '~/components/Link';
import {IconRemove} from '~/components/Icon';

const STYX = {
  bone: '#EFEAE0',
  paper: '#F5F2EA',
  ink: '#1A1815',
  gold: '#B8924A',
  silt: '#6B6459',
  silt2: '#8A8279',
  graphite: '#4A443B',
  line: '#D4D1CA',
};

const FONT = {
  cinzel: "'Cinzel', serif",
  cormorant: "'Cormorant Garamond', Georgia, serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
  inter: "'Inter', sans-serif",
};

type Layouts = 'page' | 'drawer';

export function Cart({
  layout,
  onClose,
  cart,
}: {
  layout: Layouts;
  onClose?: () => void;
  cart: CartReturn | null;
}) {
  const linesCount = Boolean(cart?.lines?.edges?.length || 0);

  return (
    <>
      <CartEmpty hidden={linesCount} onClose={onClose} layout={layout} />
      <CartDetails cart={cart} layout={layout} onClose={onClose} />
    </>
  );
}

export function CartDetails({
  layout,
  cart,
  onClose,
}: {
  layout: Layouts;
  cart: CartType | null;
  onClose?: () => void;
}) {
  const cartHasItems = !!cart && cart.totalQuantity > 0;

  if (!cartHasItems) return null;

  if (layout === 'drawer') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        {/* Spot price strip */}
        <div
          style={{
            padding: '12px 24px',
            background: STYX.ink,
            color: STYX.bone,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#4CAF50',
                boxShadow: '0 0 6px #4CAF50',
              }}
            />
            <span
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 9,
                letterSpacing: '0.25em',
                color: STYX.gold,
                textTransform: 'uppercase',
              }}
            >
              Spot · Live
            </span>
          </div>
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              color: STYX.bone,
              letterSpacing: '0.05em',
            }}
          >
            {cart.totalQuantity} {cart.totalQuantity === 1 ? 'piece' : 'pieces'}
          </span>
        </div>

        {/* Cart items */}
        <div style={{flex: 1, overflowY: 'auto'}}>
          <CartLines lines={cart?.lines} layout={layout} />
        </div>

        {/* Footer: totals + checkout */}
        <CartSummary cost={cart.cost} layout={layout}>
          <CartCheckoutActions checkoutUrl={cart.checkoutUrl} />
        </CartSummary>
      </div>
    );
  }

  // Page layout fallback
  return (
    <div className="w-full pb-12 grid md:grid-cols-2 md:items-start gap-8 md:gap-8 lg:gap-12">
      <CartLines lines={cart?.lines} layout={layout} />
      {cartHasItems && (
        <CartSummary cost={cart.cost} layout={layout}>
          <CartDiscounts discountCodes={cart.discountCodes} />
          <CartCheckoutActions checkoutUrl={cart.checkoutUrl} />
        </CartSummary>
      )}
    </div>
  );
}

function CartDiscounts({
  discountCodes,
}: {
  discountCodes: CartType['discountCodes'];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <>
      <dl className={codes && codes.length !== 0 ? 'grid' : 'hidden'}>
        <div className="flex items-center justify-between font-medium">
          <span>Discount(s)</span>
          <div className="flex items-center justify-between">
            <UpdateDiscountForm>
              <button>
                <IconRemove
                  aria-hidden="true"
                  style={{height: 18, marginRight: 4}}
                />
              </button>
            </UpdateDiscountForm>
            <span>{codes?.join(', ')}</span>
          </div>
        </div>
      </dl>
      <UpdateDiscountForm discountCodes={codes}>
        <div className="flex items-center gap-4 justify-between text-copy">
          <input
            className="border rounded p-2 flex-1"
            type="text"
            name="discountCode"
            placeholder="Discount code"
          />
          <button className="font-medium whitespace-nowrap">
            Apply
          </button>
        </div>
      </UpdateDiscountForm>
    </>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartLines({
  layout = 'drawer',
  lines: cartLines,
}: {
  layout: Layouts;
  lines: CartType['lines'] | undefined;
}) {
  const currentLines = cartLines ? flattenConnection(cartLines) : [];

  if (layout === 'drawer') {
    return (
      <div>
        {currentLines.map((line) => (
          <StyxCartLineItem key={line.id} line={line as CartLine} />
        ))}
      </div>
    );
  }

  return (
    <section aria-labelledby="cart-contents" className="px-6 pb-6 overflow-auto md:px-12">
      <ul className="grid gap-6 md:gap-10">
        {currentLines.map((line) => (
          <StyxCartLineItem key={line.id} line={line as CartLine} />
        ))}
      </ul>
    </section>
  );
}

function StyxCartLineItem({line}: {line: CartLine}) {
  const optimisticData = useOptimisticData<{action?: string; quantity?: number}>(line?.id);

  if (!line?.id) return null;
  const {id, quantity, merchandise} = line;
  if (typeof quantity === 'undefined' || !merchandise?.product) return null;

  const optimisticQuantity = optimisticData?.quantity || quantity;
  const prevQuantity = Math.max(0, optimisticQuantity - 1);
  const nextQuantity = optimisticQuantity + 1;

  return (
    <div
      style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${STYX.line}`,
        display: optimisticData?.action === 'remove' ? 'none' : 'flex',
        gap: 14,
      }}
    >
      {/* Thumbnail */}
      <div style={{width: 80, height: 80, flexShrink: 0, background: STYX.paper}}>
        {merchandise.image && (
          <Image
            width={160}
            height={160}
            data={merchandise.image}
            alt={merchandise.title}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        )}
      </div>

      {/* Details */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0}}>
        <div style={{display: 'flex', justifyContent: 'space-between', gap: 8}}>
          <div style={{minWidth: 0}}>
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 13,
                letterSpacing: '0.06em',
                color: STYX.ink,
                textTransform: 'uppercase',
                marginBottom: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {merchandise?.product?.handle ? (
                <Link
                  to={`/products/${merchandise.product.handle}`}
                  style={{color: 'inherit', textDecoration: 'none'}}
                >
                  {merchandise?.product?.title || ''}
                </Link>
              ) : (
                merchandise?.product?.title || ''
              )}
            </div>
            <div
              style={{
                fontFamily: FONT.cormorant,
                fontSize: 13,
                fontStyle: 'italic',
                color: STYX.silt,
              }}
            >
              {(merchandise?.selectedOptions || [])
                .map((o) => `${o.value}`)
                .join(' · ')}
            </div>
          </div>

          {/* Remove button */}
          <CartForm
            route="/cart"
            action={CartForm.ACTIONS.LinesRemove}
            inputs={{lineIds: [id]}}
          >
            <button
              type="submit"
              aria-label="Remove item"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                // Roomier hit area (was ~20px); negative margin keeps it tucked
                // in the corner so the layout doesn't shift.
                padding: 10,
                margin: '-6px -6px 0 0',
                color: STYX.silt,
                alignSelf: 'flex-start',
                flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.2">
                <line x1="2" y1="2" x2="10" y2="10" />
                <line x1="10" y1="2" x2="2" y2="10" />
              </svg>
            </button>
            <OptimisticInput id={id} data={{action: 'remove'}} />
          </CartForm>
        </div>

        <div style={{flex: 1}} />

        {/* Qty + Price */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${STYX.line}`,
            }}
          >
            <UpdateCartButton lines={[{id, quantity: prevQuantity}]}>
              <button
                name="decrease-quantity"
                aria-label="Decrease quantity"
                value={prevQuantity}
                disabled={optimisticQuantity <= 1}
                style={{
                  width: 40,
                  height: 40,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: FONT.cinzel,
                  fontSize: 16,
                  color: STYX.ink,
                  padding: 0,
                }}
              >
                −
                <OptimisticInput id={id} data={{quantity: prevQuantity}} />
              </button>
            </UpdateCartButton>
            <span
              style={{
                padding: '6px 14px',
                fontFamily: FONT.cinzel,
                fontSize: 12,
                color: STYX.ink,
                minWidth: 24,
                textAlign: 'center',
                borderLeft: `1px solid ${STYX.line}`,
                borderRight: `1px solid ${STYX.line}`,
              }}
            >
              {optimisticQuantity}
            </span>
            <UpdateCartButton lines={[{id, quantity: nextQuantity}]}>
              <button
                name="increase-quantity"
                aria-label="Increase quantity"
                value={nextQuantity}
                style={{
                  width: 40,
                  height: 40,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: FONT.cinzel,
                  fontSize: 16,
                  color: STYX.ink,
                  padding: 0,
                }}
              >
                +
                <OptimisticInput id={id} data={{quantity: nextQuantity}} />
              </button>
            </UpdateCartButton>
          </div>

          <div
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 16,
              color: STYX.ink,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {line.cost?.totalAmount && <Money data={line.cost.totalAmount} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl: string}) {
  if (!checkoutUrl) return null;

  return (
    <a
      href={checkoutUrl}
      target="_self"
      style={{
        display: 'block',
        width: '100%',
        padding: '18px',
        background: STYX.ink,
        color: STYX.bone,
        border: 'none',
        cursor: 'pointer',
        fontFamily: FONT.cinzel,
        fontSize: 12,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        textAlign: 'center',
        textDecoration: 'none',
      }}
    >
      Pay the Toll
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: STYX.gold,
          marginLeft: 14,
          verticalAlign: 'middle',
        }}
      />
    </a>
  );
}

function CartSummary({
  cost,
  layout,
  children = null,
}: {
  children?: React.ReactNode;
  cost: CartCost;
  layout: Layouts;
}) {
  if (layout === 'drawer') {
    return (
      <div
        style={{
          padding: '20px 24px 24px',
          borderTop: `1px solid ${STYX.line}`,
          background: STYX.bone,
        }}
      >
        {/* Receipt lines */}
        <div style={{marginBottom: 14, fontFamily: FONT.mono, fontSize: 12}}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: STYX.silt,
              padding: '3px 0',
            }}
          >
            <span>Shipping</span>
            <span style={{color: '#4CAF50'}}>complimentary</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingTop: 12,
              marginTop: 8,
              borderTop: `1px dashed ${STYX.line}`,
            }}
          >
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 13,
                letterSpacing: '0.15em',
                color: STYX.ink,
                textTransform: 'uppercase',
              }}
            >
              The Toll
            </div>
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 24,
                fontWeight: 600,
                color: STYX.ink,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {cost?.subtotalAmount?.amount ? (
                <Money data={cost?.subtotalAmount} />
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>

        {children}

        <div
          style={{
            marginTop: 12,
            textAlign: 'center',
            fontFamily: FONT.cormorant,
            fontSize: 13,
            fontStyle: 'italic',
            color: STYX.silt,
          }}
        >
          Free insured priority shipping on every order.
        </div>
      </div>
    );
  }

  // Page layout
  return (
    <section className="sticky top-nav grid gap-6 p-4 md:px-6 md:translate-y-4 bg-primary/5 rounded w-full">
      <dl className="grid">
        <div className="flex items-center justify-between font-medium">
          <span>Subtotal</span>
          <span>
            {cost?.subtotalAmount?.amount ? (
              <Money data={cost?.subtotalAmount} />
            ) : (
              '-'
            )}
          </span>
        </div>
      </dl>
      {children}
    </section>
  );
}

function UpdateCartButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

export function CartEmpty({
  hidden = false,
  layout = 'drawer',
  onClose,
}: {
  hidden: boolean;
  layout?: Layouts;
  onClose?: () => void;
}) {
  if (hidden) return null;

  if (layout === 'drawer') {
    return (
      <div
        style={{
          padding: '80px 28px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 18,
            letterSpacing: '0.06em',
            color: STYX.ink,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Empty Vault
        </div>
        <div
          style={{
            fontFamily: FONT.cormorant,
            fontSize: 15,
            fontStyle: 'italic',
            color: STYX.silt,
            lineHeight: 1.5,
            marginBottom: 32,
          }}
        >
          The river takes nothing.
          <br />
          Add a piece to begin.
        </div>
        <Link
          to="/collections/chains"
          onClick={onClose}
          style={{
            display: 'inline-block',
            padding: '16px 32px',
            background: STYX.ink,
            color: STYX.bone,
            fontFamily: FONT.cinzel,
            fontSize: 11,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          Shop Chains
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-7 justify-center items-center md:py-8 md:px-12 px-4 py-6">
      <p className="text-secondary">
        Looks like you haven&rsquo;t added anything yet.
      </p>
      <Link to="/collections/chains" onClick={onClose}>
        Shop Chains
      </Link>
    </div>
  );
}
