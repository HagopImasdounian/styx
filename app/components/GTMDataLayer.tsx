import {useEffect} from 'react';
import {useLocation} from 'react-router';

/**
 * GTM Data Layer integration.
 *
 * Pushes standard GA4 e-commerce events to window.dataLayer
 * so server-side GTM can forward to Meta/Google/GA4.
 *
 * Events pushed:
 * - page_view (on every route change)
 * - view_item (product page)
 * - view_item_list (collection page)
 * - add_to_cart (cart action)
 * - remove_from_cart (cart action)
 * - view_cart (cart page)
 * - begin_checkout (checkout redirect)
 * - search (search page)
 */

declare global {
  interface Window {
    dataLayer: Array<Record<string, any>>;
  }
}

function push(event: string, data?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({event, ...data});
}

/**
 * PageView tracker — fires on every route change.
 */
export function GTMPageView() {
  const location = useLocation();

  useEffect(() => {
    push('page_view', {
      page_path: location.pathname + location.search,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);

  return null;
}

/**
 * Push a view_item event for product pages.
 */
export function trackProductView(product: {
  id: string;
  title: string;
  vendor?: string;
  price: string;
  variantId?: string;
  variantTitle?: string;
  currency?: string;
}) {
  push('view_item', {
    ecommerce: {
      currency: product.currency || 'USD',
      value: parseFloat(product.price),
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          item_brand: product.vendor || 'STYX Gold',
          item_variant: product.variantTitle,
          price: parseFloat(product.price),
          quantity: 1,
        },
      ],
    },
  });
}

/**
 * Push a view_item_list event for collection pages.
 */
export function trackCollectionView(collection: {
  id: string;
  title: string;
  products: Array<{id: string; title: string; price: string}>;
}) {
  push('view_item_list', {
    ecommerce: {
      item_list_id: collection.id,
      item_list_name: collection.title,
      items: collection.products.slice(0, 20).map((p, i) => ({
        item_id: p.id,
        item_name: p.title,
        price: parseFloat(p.price),
        index: i,
        item_list_name: collection.title,
      })),
    },
  });
}

/**
 * Push an add_to_cart event.
 */
export function trackAddToCart(item: {
  id: string;
  title: string;
  price: string;
  quantity: number;
  variantTitle?: string;
  currency?: string;
}) {
  push('add_to_cart', {
    ecommerce: {
      currency: item.currency || 'USD',
      value: parseFloat(item.price) * item.quantity,
      items: [
        {
          item_id: item.id,
          item_name: item.title,
          item_variant: item.variantTitle,
          price: parseFloat(item.price),
          quantity: item.quantity,
        },
      ],
    },
  });
}

/**
 * Push a remove_from_cart event.
 */
export function trackRemoveFromCart(item: {
  id: string;
  title: string;
  price: string;
  quantity: number;
  variantTitle?: string;
  currency?: string;
}) {
  push('remove_from_cart', {
    ecommerce: {
      currency: item.currency || 'USD',
      value: parseFloat(item.price) * item.quantity,
      items: [
        {
          item_id: item.id,
          item_name: item.title,
          item_variant: item.variantTitle,
          price: parseFloat(item.price),
          quantity: item.quantity,
        },
      ],
    },
  });
}

/**
 * Push a view_cart event.
 */
export function trackCartView(cart: {
  totalAmount: string;
  currency?: string;
  lines: Array<{
    id: string;
    title: string;
    price: string;
    quantity: number;
    variantTitle?: string;
  }>;
}) {
  push('view_cart', {
    ecommerce: {
      currency: cart.currency || 'USD',
      value: parseFloat(cart.totalAmount),
      items: cart.lines.map((line) => ({
        item_id: line.id,
        item_name: line.title,
        item_variant: line.variantTitle,
        price: parseFloat(line.price),
        quantity: line.quantity,
      })),
    },
  });
}

/**
 * Push a begin_checkout event.
 */
export function trackBeginCheckout(cart: {
  totalAmount: string;
  currency?: string;
  lines: Array<{
    id: string;
    title: string;
    price: string;
    quantity: number;
    variantTitle?: string;
  }>;
}) {
  push('begin_checkout', {
    ecommerce: {
      currency: cart.currency || 'USD',
      value: parseFloat(cart.totalAmount),
      items: cart.lines.map((line) => ({
        item_id: line.id,
        item_name: line.title,
        item_variant: line.variantTitle,
        price: parseFloat(line.price),
        quantity: line.quantity,
      })),
    },
  });
}

/**
 * Push a search event.
 */
export function trackSearch(searchTerm: string) {
  push('search', {
    search_term: searchTerm,
  });
}
