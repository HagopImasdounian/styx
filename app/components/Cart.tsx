import clsx from 'clsx';
import {useRef} from 'react';
import {useRouteLoaderData} from 'react-router';
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
import {trackBeginCheckout} from '~/components/GTMDataLayer';
import type {RootLoader} from '~/root';

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
  // Gold spot price for the drawer strip — from the root loader's goldData.
  const rootData = useRouteLoaderData<RootLoader>('root');
  const goldData = (rootData as any)?.goldData as
    | {spotPerOz?: number; isFallback?: boolean}
    | undefined;
  const spotPerOz = goldData?.spotPerOz;
  const spotIsFallback = Boolean(goldData?.isFallback);

  const cartHasItems = !!cart && cart.totalQuantity > 0;

  if (!cartHasItems) return null;

  if (layout === 'drawer') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        {/* Spot price strip — live gold spot from the root loader. When the
            price is a fallback (API unreachable), drop the pulse + "Live". */}
        {spotPerOz ? (
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
                  background: spotIsFallback
                    ? 'rgba(239,234,224,0.35)'
                    : '#4CAF50',
                  boxShadow: spotIsFallback ? 'none' : '0 0 6px #4CAF50',
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
                {spotIsFallback ? 'Spot' : 'Spot · Live'}
              </span>
            </div>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                color: STYX.bone,
                letterSpacing: '0.05em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              $
              {spotPerOz.toLocaleString('en-US', {maximumFractionDigits: 0})}
              /oz
            </span>
          </div>
        ) : null}

        {/* Cart items */}
        <div style={{flex: 1, overflowY: 'auto'}}>
          <CartLines lines={cart?.lines} layout={layout} />
        </div>

        {/* Footer: totals + checkout */}
        <CartSummary cost={cart.cost} layout={layout}>
          <CartCheckoutActions cart={cart} />
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
          <CartCheckoutActions cart={cart} />
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

/**
 * Map a Shopify cart to the GA4 payload shape used by
 * trackBeginCheckout / trackCartView in GTMDataLayer.tsx.
 */
export function cartToAnalyticsPayload(cart: CartType) {
  const lines = cart.lines ? flattenConnection(cart.lines) : [];
  return {
    totalAmount: cart.cost?.subtotalAmount?.amount || '0',
    currency: cart.cost?.subtotalAmount?.currencyCode || 'USD',
    lines: (lines as CartLine[]).map((line) => ({
      id: line.merchandise?.id || line.id,
      title: line.merchandise?.product?.title || '',
      price:
        line.cost?.amountPerQuantity?.amount ||
        line.cost?.totalAmount?.amount ||
        '0',
      quantity: line.quantity || 1,
      variantTitle: line.merchandise?.title,
    })),
  };
}

function CartCheckoutActions({cart}: {cart: CartType}) {
  const checkoutUrl = cart.checkoutUrl;
  if (!checkoutUrl) return null;

  return (
    <a
      href={checkoutUrl}
      target="_self"
      onClick={() => trackBeginCheckout(cartToAnalyticsPayload(cart))}
      style={{
        display: 'block',
        width: '100%',
        padding: '16px 18px',
        background: STYX.ink,
        color: STYX.bone,
        border: 'none',
        cursor: 'pointer',
        textAlign: 'center',
        textDecoration: 'none',
      }}
    >
      <span
        style={{
          display: 'block',
          fontFamily: FONT.cinzel,
          fontSize: 12,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
        }}
      >
        Secure Checkout
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
      </span>
      <span
        style={{
          display: 'block',
          marginTop: 4,
          fontFamily: FONT.cinzel,
          fontSize: 9,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: STYX.gold,
          opacity: 0.9,
        }}
      >
        Pay the Toll
      </span>
    </a>
  );
}

/** English ordinal: 2 → "2nd", 3 → "3rd", 4 → "4th" … */
function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  const suffix = ({1: 'st', 2: 'nd', 3: 'rd'} as Record<number, string>)[n % 10];
  return `${n}${suffix || 'th'}`;
}

/**
 * Launch offer: 1g of 24K gold free per $2,000 spent.
 * Slim progress module above the receipt footer. Pure computation from the
 * cart cost (SSR-safe); hidden when the cart is empty because CartDetails
 * already returns null without items.
 */
function GoldOfferProgress({cost}: {cost: CartCost}) {
  const amountStr = cost?.subtotalAmount?.amount;
  if (!amountStr) return null;
  const subtotal = parseFloat(amountStr);
  if (!Number.isFinite(subtotal) || subtotal <= 0) return null;

  const TIER = 2000;
  const gramsEarned = Math.floor(subtotal / TIER);
  const withinBand = subtotal - gramsEarned * TIER;
  const progress = Math.min(withinBand / TIER, 1);
  const remaining = Math.ceil(TIER - withinBand);

  const currency = cost.subtotalAmount.currencyCode || 'USD';
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return `$${n.toFixed(0)}`;
    }
  };

  // Past the first gram and barely into the next band — lead with what's
  // earned; only nudge toward the next gram once meaningfully close (>50%).
  const showNextGramNudge = gramsEarned > 0 && progress > 0.5;

  return (
    <div style={{marginBottom: 16}}>
      <div
        style={{
          fontFamily: FONT.cinzel,
          fontSize: 9,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: STYX.gold,
          marginBottom: 6,
        }}
      >
        Launch Offer · 24K Gold
      </div>
      <div
        style={{
          fontFamily: FONT.cormorant,
          fontSize: 14,
          fontStyle: 'italic',
          color: STYX.graphite,
          lineHeight: 1.45,
          marginBottom: 8,
        }}
      >
        {gramsEarned === 0 ? (
          <>
            Add {fmt(remaining)} to receive 1g of 24K gold — on the house.
          </>
        ) : (
          <>
            You&rsquo;ve earned {gramsEarned}g of 24K gold.
            {showNextGramNudge && (
              <> {fmt(remaining)} to your {ordinal(gramsEarned + 1)} gram.</>
            )}
          </>
        )}
      </div>
      {/* Thin 2px bar — gold fill on a faint ink track */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={TIER}
        aria-valuenow={Math.round(withinBand)}
        aria-label="Progress toward your next gram of 24K gold"
        style={{
          height: 2,
          width: '100%',
          background: 'rgba(26,24,21,0.1)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(progress * 100, 1).toFixed(1)}%`,
            background: STYX.gold,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
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
        {/* Gold-offer progress — sits above the receipt lines */}
        <GoldOfferProgress cost={cost} />

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
            <div>
              <div
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 13,
                  letterSpacing: '0.15em',
                  color: STYX.ink,
                  textTransform: 'uppercase',
                }}
              >
                Total
              </div>
              <div
                style={{
                  fontFamily: FONT.cormorant,
                  fontSize: 12,
                  fontStyle: 'italic',
                  color: STYX.silt2,
                  marginTop: 1,
                }}
              >
                the Toll
              </div>
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

        {/* Payment reassurance */}
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            color: STYX.silt2,
          }}
        >
          <svg
            width="10"
            height="12"
            viewBox="0 0 12 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            aria-hidden="true"
            style={{flexShrink: 0}}
          >
            <rect x="1.5" y="6" width="9" height="7" rx="1" />
            <path d="M3.5 6V4.5a2.5 2.5 0 0 1 5 0V6" />
          </svg>
          <span
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 8.5,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Secure checkout · Visa · Mastercard · Amex · Shop Pay
          </span>
        </div>
        <div
          style={{
            marginTop: 8,
            textAlign: 'center',
            fontFamily: FONT.cormorant,
            fontSize: 13,
            fontStyle: 'italic',
            color: STYX.silt,
            lineHeight: 1.45,
          }}
        >
          Paying by wire transfer? Save 4% off the card price — wire pricing
          is shown on every product page.
        </div>

        <div
          style={{
            marginTop: 6,
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
          <span>
            Total{' '}
            <span
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: '0.85em',
                color: STYX.silt2,
              }}
            >
              · the Toll
            </span>
          </span>
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
