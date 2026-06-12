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

/** Single source of truth for the GTM container id. */
export const GTM_ID = 'GTM-P56TCMJ';

function push(event: string, data?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({event, ...data});
}

/**
 * Inject the GTM container script after React hydration.
 *
 * GTM used to be bootstrapped from an inline <script> in the SSR <head>,
 * but GTM mutates the DOM (injects scripts) before React hydrates, which
 * caused hydration mismatches. Loading it from an effect runs strictly
 * post-hydration, so the server and client trees match.
 *
 * Google Consent Mode v2 defaults are pushed BEFORE the container loads
 * so tags inside GTM see the consent state on their first evaluation.
 */
let gtmInjected = false;

function loadGTM() {
  if (typeof window === 'undefined' || gtmInjected) return;
  gtmInjected = true;

  window.dataLayer = window.dataLayer || [];

  // gtag shim — must push the `arguments` object itself (not an array)
  // for GTM/gtag.js to recognize consent commands.
  function gtag(..._args: any[]) {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments as any);
  }
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  });

  // Defer the container script (144 KB + whatever tags it loads) until after
  // the window `load` event — on throttled mobile it otherwise competes with
  // the LCP image for bandwidth. Events pushed in the meantime queue in the
  // dataLayer array and GTM replays them when it boots.
  const inject = () => {
    window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    document.head.appendChild(script);
  };
  const scheduleInject = () =>
    'requestIdleCallback' in window
      ? (window as any).requestIdleCallback(inject, {timeout: 2000})
      : setTimeout(inject, 200);

  if (document.readyState === 'complete') {
    scheduleInject();
  } else {
    window.addEventListener('load', scheduleInject, {once: true});
  }
}

/**
 * PageView tracker — fires on every route change.
 * Also responsible for injecting GTM itself post-hydration (this component
 * is rendered app-wide from root.tsx).
 */
export function GTMPageView() {
  const location = useLocation();

  // Declared first so consent defaults + gtm.start enter the dataLayer
  // before the initial page_view push below.
  useEffect(() => {
    loadGTM();
  }, []);

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
 * Push a select_item event when a product variant is selected.
 */
export function trackVariantSelect(item: {
  id: string;
  title: string;
  price: string;
  variantTitle?: string;
  optionName?: string;
  optionValue?: string;
  currency?: string;
}) {
  push('select_item', {
    ecommerce: {
      currency: item.currency || 'USD',
      items: [
        {
          item_id: item.id,
          item_name: item.title,
          item_variant: item.variantTitle,
          price: parseFloat(item.price),
          quantity: 1,
        },
      ],
    },
    option_name: item.optionName,
    option_value: item.optionValue,
  });
}

/**
 * Push a generate_lead / form_submit event for form fills.
 */
export function trackFormSubmit(form: {
  formId: string;
  formName: string;
  email?: string;
  name?: string;
}) {
  push('generate_lead', {
    form_id: form.formId,
    form_name: form.formName,
    contact_email: form.email,
    contact_name: form.name,
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
