import type {Localizations} from '~/lib/type';

/**
 * Active Shopify markets only. The default ('en-us', no path prefix) is the
 * sole active market — US, USD. When additional markets are activated in
 * Shopify, add them back keyed by path prefix WITH a leading slash
 * (e.g. '/en-ca'), matching getLocaleFromRequest in ~/lib/utils.ts.
 */
export const countries: Localizations = {
  default: {
    label: 'United States (USD $)',
    language: 'EN',
    country: 'US',
    currency: 'USD',
  },
};
