import {redirect, type AppLoadContext} from 'react-router';
import type {CustomerAccount} from '@shopify/hydrogen';

/**
 * Customer accounts are optional: `server.ts` only creates
 * `context.customerAccount` when the PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID
 * and SHOP_ID env vars are configured. When it's missing, account routes
 * should send visitors home instead of 500ing.
 *
 * Every account route loader/action must call this (React Router runs child
 * loaders in parallel with parents, so a guard in the parent route is not
 * enough).
 *
 * @throws a redirect to the localized home page when customer accounts are
 * not configured.
 */
export function requireCustomerAccount(
  context: AppLoadContext,
  params?: {locale?: string},
): CustomerAccount {
  const {customerAccount} = context;

  if (!customerAccount) {
    throw redirect(params?.locale ? `/${params.locale}` : '/');
  }

  return customerAccount;
}

/**
 * Logs the customer out. Lives here (not in the logout route) because route
 * files may not re-export helpers that touch `.server` modules — the React
 * Router compiler refuses to split them.
 */
export async function doLogout(context: AppLoadContext) {
  // Redirects home when customer accounts aren't configured.
  const customerAccount = requireCustomerAccount(context);

  return customerAccount.logout();
}
