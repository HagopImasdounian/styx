import {useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';
import {formatMoney} from './gold';

/**
 * Currency of the gold figures on the page (spot, melt, per-gram). It matches
 * the currency Shopify prices the shopper in, except when the spot fetch fell
 * back to USD, in which case the gold figures say so honestly.
 */
export function useGoldCurrency(): string {
  const rootData = useRouteLoaderData<RootLoader>('root');
  return (rootData as any)?.goldData?.currency || 'CAD';
}

/** Formatter for gold-derived money, bound to the shopper's currency. */
export function useMoney(): (n: number) => string {
  const currency = useGoldCurrency();
  return (n: number) => formatMoney(n, currency);
}
