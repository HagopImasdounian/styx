/// <reference types="vite/client" />
/// <reference types="@remix-run/node" />

import type {
  WithCache,
  HydrogenCart,
  HydrogenSessionData,
} from '@shopify/hydrogen';
import type {Storefront, CustomerAccount} from '~/lib/type';
import type {AppSession} from '~/lib/session.server';

declare global {
  /**
   * A global `process` object is available at runtime on Vercel / Node.js.
   */
  const process: {env: Record<string, string | undefined> & {NODE_ENV: 'production' | 'development'}};

  /**
   * Declare expected environment variables.
   */
  interface Env {
    SESSION_SECRET: string;
    PUBLIC_STOREFRONT_API_TOKEN: string;
    PRIVATE_STOREFRONT_API_TOKEN: string;
    PUBLIC_STORE_DOMAIN: string;
    PUBLIC_STOREFRONT_ID: string;
    PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: string;
    PUBLIC_CUSTOMER_ACCOUNT_API_URL: string;
    PUBLIC_CHECKOUT_DOMAIN: string;
    SHOP_ID: string;
  }
}

declare module '@remix-run/node' {
  /**
   * Declare local additions to the Remix loader context.
   */
  export interface AppLoadContext {
    waitUntil: (promise: Promise<unknown>) => void;
    session: AppSession;
    storefront: Storefront;
    customerAccount: CustomerAccount;
    cart: HydrogenCart;
    env: Env;
  }

  /**
   * Declare local additions to the Remix session data.
   */
  interface SessionData extends HydrogenSessionData {}
}

// Needed to make this file a module.
export {};
