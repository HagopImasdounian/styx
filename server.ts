// @ts-ignore
// Virtual entry point for the app
import * as remixBuild from 'virtual:remix/server-build';
import {createRequestHandler} from '@remix-run/node';
import {
  cartGetIdDefault,
  cartSetIdDefault,
  createCartHandler,
  createStorefrontClient,
  storefrontRedirect,
  createCustomerAccountClient,
  getStorefrontHeaders,
} from '@shopify/hydrogen';

import {AppSession} from '~/lib/session.server';
import {getLocaleFromRequest} from '~/lib/utils';

/**
 * Node.js-compatible request handler for Vercel deployment.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const env: Env = {
        SESSION_SECRET: process.env.SESSION_SECRET!,
        PUBLIC_STOREFRONT_API_TOKEN:
          process.env.PUBLIC_STOREFRONT_API_TOKEN!,
        PRIVATE_STOREFRONT_API_TOKEN:
          process.env.PRIVATE_STOREFRONT_API_TOKEN ?? '',
        PUBLIC_STORE_DOMAIN: process.env.PUBLIC_STORE_DOMAIN!,
        PUBLIC_STOREFRONT_ID: process.env.PUBLIC_STOREFRONT_ID ?? '',
        PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID:
          process.env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID ?? '',
        PUBLIC_CUSTOMER_ACCOUNT_API_URL:
          process.env.PUBLIC_CUSTOMER_ACCOUNT_API_URL ?? '',
        PUBLIC_CHECKOUT_DOMAIN:
          process.env.PUBLIC_CHECKOUT_DOMAIN ?? '',
        SHOP_ID: process.env.SHOP_ID ?? '',
      };

      if (!env.SESSION_SECRET) {
        throw new Error('SESSION_SECRET environment variable is not set');
      }

      const waitUntil = (promise: Promise<unknown>) => {
        // On Vercel serverless, background work isn't guaranteed.
        // We catch errors to prevent unhandled rejections.
        promise.catch(() => {});
      };

      const session = await AppSession.init(request, [env.SESSION_SECRET]);

      /**
       * Create Hydrogen's Storefront client.
       */
      const {storefront} = createStorefrontClient({
        waitUntil,
        i18n: getLocaleFromRequest(request),
        publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
        privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
        storeDomain: env.PUBLIC_STORE_DOMAIN,
        storefrontId: env.PUBLIC_STOREFRONT_ID,
        storefrontHeaders: getStorefrontHeaders(request),
      });

      /**
       * Create a client for Customer Account API.
       */
      const customerAccount = createCustomerAccountClient({
        waitUntil,
        request,
        session,
        customerAccountId: env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID,
        shopId: env.SHOP_ID,
      });

      const cart = createCartHandler({
        storefront,
        customerAccount,
        getCartId: cartGetIdDefault(request.headers),
        setCartId: cartSetIdDefault(),
      });

      /**
       * Create a Remix request handler and pass
       * Hydrogen's Storefront client to the loader context.
       */
      const handleRequest = createRequestHandler(remixBuild, process.env.NODE_ENV);

      const response = await handleRequest(request, {
        session,
        waitUntil,
        storefront,
        customerAccount,
        cart,
        env,
      });

      if (session.isPending) {
        response.headers.set('Set-Cookie', await session.commit());
      }

      if (response.status === 404) {
        return storefrontRedirect({request, response, storefront});
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
