import {useEffect, useState} from 'react';
import {Money, type OptimisticCartLineInput} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

import {AddToCartButton} from '~/components/AddToCartButton';
import {FONT} from './constants';
import {WishlistButton} from './WishlistButton';

/**
 * Mobile-only (<= 768px, see app.css) sticky bottom bar for the PDP.
 *
 * Slides up whenever the main Add to Cart button is out of the viewport,
 * and carries the same CartForm add action, selected variant and analytics
 * as the main button. SSR renders it hidden; an IntersectionObserver on the
 * main button's wrapper drives visibility after hydration.
 *
 * Stacking: z 45, above page content and below the cart drawer / mobile menu
 * (both 50/51 in StyxNav).
 *
 * TODO: hide while the cart drawer is open. The drawer's open state lives in
 * StyxNav's local useDrawer() and is not exposed through context yet; today
 * the drawer backdrop (z 50) covers this bar, so it is dimmed, not hidden.
 */
export function StickyBuyBar({
  targetRef,
  title,
  handle,
  price,
  compareAtPrice,
  lines,
  analytics,
  fallback,
}: {
  /** The main Add to Cart wrapper to watch. */
  targetRef: React.RefObject<HTMLElement | null>;
  title: string;
  handle: string;
  price?: MoneyV2 | null;
  compareAtPrice?: MoneyV2 | null;
  lines: Array<OptimisticCartLineInput>;
  analytics: {
    id: string;
    title: string;
    price: string;
    quantity: number;
    variantTitle?: string;
  };
  /** When the variant can't be added (sold out / unpriced), the main button
   *  becomes a request; the bar mirrors that with this label + handler. */
  fallback?: {label: string; onClick: () => void} | null;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = targetRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      {threshold: 0},
    );
    io.observe(el);
    return () => io.disconnect();
  }, [targetRef]);

  const buttonStyle: React.CSSProperties = {
    flexShrink: 0,
    padding: '0 18px',
    height: 40,
    borderRadius: 3,
    background: '#1e2021',
    color: '#f4f4f2',
    fontFamily: FONT.inter,
    fontSize: 13,
    letterSpacing: '0.025em',
    textTransform: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    lineHeight: 1,
  };

  return (
    <div
      className="styx-sticky-buy"
      data-visible={visible ? 'true' : 'false'}
      aria-hidden={visible ? undefined : true}
      {...(!visible ? ({inert: ''} as any) : {})}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 45,
        height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 16,
        paddingRight: 16,
        boxSizing: 'border-box',
        alignItems: 'center',
        gap: 10,
        background: 'var(--styx-surface)',
        borderTop: '1px solid var(--styx-border)',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        visibility: visible ? 'visible' : 'hidden',
        transition:
          'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s',
      }}
    >
      {/* Title + price */}
      <div style={{flex: 1, minWidth: 0}}>
        <div
          style={{
            fontFamily: FONT.inter,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.005em',
            color: '#1a1b1c',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        {price && parseFloat(price.amount) > 0 && (
          <div
            style={{
              fontFamily: FONT.cormorant,
              fontSize: 17,
              fontWeight: 500,
              color: '#1a1b1c',
              fontVariantNumeric: 'lining-nums tabular-nums',
              lineHeight: 1.2,
              display: 'flex',
              gap: 8,
            }}
          >
            <Money data={price} as="span" />
            {compareAtPrice &&
              parseFloat(compareAtPrice.amount) > parseFloat(price.amount) && (
                <Money
                  data={compareAtPrice}
                  as="span"
                  style={{opacity: 0.5, textDecoration: 'line-through'}}
                />
              )}
          </div>
        )}
      </div>

      {/* Wishlist heart, same control as the product card */}
      <WishlistButton handle={handle} compact />

      {/* Add to Cart, same CartForm action + analytics as the main button */}
      {fallback ? (
        <button type="button" onClick={fallback.onClick} style={buttonStyle}>
          {fallback.label}
        </button>
      ) : (
        <AddToCartButton
          lines={lines}
          analytics={analytics}
          variant="primary"
          width="auto"
          data-test="add-to-cart-sticky"
          className="styx-add-to-cart styx-sticky-atc"
          style={buttonStyle}
        >
          Add to Cart
        </AddToCartButton>
      )}
    </div>
  );
}
