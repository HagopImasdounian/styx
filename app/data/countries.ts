import type {Localizations} from '~/lib/type';

/**
 * Styx sells in CAD by default (store currency, Canadian business). There are
 * no locale path prefixes: the shopper's country comes from the currency
 * switcher cookie, else the visitor's geo (Oxygen header), else Canada. See
 * getLocaleFromRequest in ~/lib/utils.ts. Shopify Markets then prices the
 * storefront and checkout in that country's currency.
 */
export const countries: Localizations = {
  default: {
    label: 'Canada (CAD $)',
    language: 'EN',
    country: 'CA',
    currency: 'CAD',
  },
};

/** Cookie the currency switcher writes; holds an ISO country code. */
export const COUNTRY_COOKIE = 'styx_country';
