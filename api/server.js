import {createRequestHandler, createCookieSessionStorage} from '@remix-run/node';
import {
  cartGetIdDefault,
  cartSetIdDefault,
  createCartHandler,
  createStorefrontClient,
  storefrontRedirect,
  createCustomerAccountClient,
} from '@shopify/hydrogen';

function getStorefrontHeaders(request) {
  return {
    requestGroupId: request.headers.get('request-id') || '',
    buyerIp: request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || '',
    cookie: request.headers.get('cookie') || '',
    purpose: request.headers.get('purpose') || request.headers.get('x-purpose') || '',
  };
}

const build = await import('../build/server/index.js');

function getEnv() {
  return {
    SESSION_SECRET: process.env.SESSION_SECRET,
    PUBLIC_STOREFRONT_API_TOKEN: process.env.PUBLIC_STOREFRONT_API_TOKEN,
    PRIVATE_STOREFRONT_API_TOKEN: process.env.PRIVATE_STOREFRONT_API_TOKEN || '',
    PUBLIC_STORE_DOMAIN: process.env.PUBLIC_STORE_DOMAIN,
    PUBLIC_STOREFRONT_ID: process.env.PUBLIC_STOREFRONT_ID || '',
    PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: process.env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID || '',
    PUBLIC_CUSTOMER_ACCOUNT_API_URL: process.env.PUBLIC_CUSTOMER_ACCOUNT_API_URL || '',
    PUBLIC_CHECKOUT_DOMAIN: process.env.PUBLIC_CHECKOUT_DOMAIN || '',
    SHOP_ID: process.env.SHOP_ID || '',
  };
}

const handler = createRequestHandler(build, process.env.NODE_ENV);

export default async function (req) {
  const env = getEnv();
  const sessionStorage = createCookieSessionStorage({
    cookie: {
      name: 'session',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secrets: [env.SESSION_SECRET],
    },
  });

  const session = await sessionStorage
    .getSession(req.headers.get('Cookie'))
    .catch(() => sessionStorage.getSession());

  let isPending = false;
  const sessionProxy = {
    get isPending() { return isPending; },
    set isPending(v) { isPending = v; },
    get has() { return session.has.bind(session); },
    get get() { return session.get.bind(session); },
    get flash() { return session.flash.bind(session); },
    get unset() { isPending = true; return session.unset.bind(session); },
    get set() { isPending = true; return session.set.bind(session); },
    destroy: () => sessionStorage.destroySession(session),
    commit: () => { isPending = false; return sessionStorage.commitSession(session); },
  };

  const waitUntil = (p) => { p.catch(() => {}); };

  const {storefront} = createStorefrontClient({
    waitUntil,
    i18n: {language: 'EN', country: 'US'},
    publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
    privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
    storeDomain: env.PUBLIC_STORE_DOMAIN,
    storefrontId: env.PUBLIC_STOREFRONT_ID,
    storefrontHeaders: getStorefrontHeaders(req),
  });

  const customerAccount = createCustomerAccountClient({
    waitUntil,
    request: req,
    session: sessionProxy,
    customerAccountId: env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID,
    shopId: env.SHOP_ID,
  });

  const cart = createCartHandler({
    storefront,
    customerAccount,
    getCartId: cartGetIdDefault(req.headers),
    setCartId: cartSetIdDefault(),
  });

  const context = {
    session: sessionProxy,
    waitUntil,
    storefront,
    customerAccount,
    cart,
    env,
  };

  const response = await handler(req, context);

  if (isPending) {
    response.headers.set('Set-Cookie', await sessionProxy.commit());
  }

  if (response.status === 404) {
    return storefrontRedirect({request: req, response, storefront});
  }

  return response;
}
