import {Form, useLocation, useRouteLoaderData} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import type {RootLoader} from '~/root';
import {DEFAULT_LOCALE} from '~/lib/utils';
import {FONT} from './constants';

type AvailableCountry = {isoCode: string; name: string; currency: string};

// Pinned to the top of the list: where Styx sells most.
const PINNED = ['CA', 'US'];

// What CartForm would serialise; the country rides along as `styxCountry`.
const CART_FORM_INPUT = JSON.stringify({
  action: CartForm.ACTIONS.BuyerIdentityUpdate,
  inputs: {},
});

/**
 * Country / currency picker for the top strip.
 *
 * Choosing a country posts to the cart route, which updates the cart's
 * buyerIdentity.countryCode (so checkout charges in that currency) and stores
 * the choice in the styx_country cookie. getLocaleFromRequest reads that
 * cookie on every request, so the whole storefront prices in that currency.
 *
 * Countries come from Shopify Markets (root `availableCountries`); it renders
 * only when Shopify serves more than one currency.
 */
export function CurrencyToggle() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const available = (rootData as any)?.availableCurrencies as string[] | undefined;
  const countries = ((rootData as any)?.availableCountries ||
    []) as AvailableCountry[];
  const selectedLocale = rootData?.selectedLocale ?? DEFAULT_LOCALE;
  const {pathname, search} = useLocation();

  if (!available || available.length < 2 || countries.length < 2) return null;

  const current = selectedLocale.country;
  const pinned = PINNED.map((c) => countries.find((x) => x.isoCode === c)).filter(
    Boolean,
  ) as AvailableCountry[];
  const rest = countries
    .filter((c) => !PINNED.includes(c.isoCode))
    .sort((a, b) => a.name.localeCompare(b.name));
  const label = (c: AvailableCountry) => `${c.currency} · ${c.name}`;

  return (
    <Form method="post" action="/cart" style={{margin: 0, flex: '0 0 auto'}}>
      <input type="hidden" name="cartFormInput" value={CART_FORM_INPUT} />
      <input type="hidden" name="redirectTo" value={`${pathname}${search}` || '/'} />
      <select
        name="styxCountry"
        aria-label="Country and currency"
        defaultValue={current}
        key={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: '0.1em',
          padding: '4px 8px',
          maxWidth: 170,
          border: '1px solid rgba(235,235,232,0.2)',
          borderRadius: 20,
          background: 'transparent',
          color: 'rgba(235,235,232,0.85)',
          cursor: 'pointer',
        }}
      >
        {pinned.map((c) => (
          <option key={c.isoCode} value={c.isoCode} style={{color: '#111'}}>
            {label(c)}
          </option>
        ))}
        {rest.length > 0 && (
          <optgroup label="Other countries" style={{color: '#111'}}>
            {rest.map((c) => (
              <option key={c.isoCode} value={c.isoCode}>
                {label(c)}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <noscript>
        <button type="submit">Update</button>
      </noscript>
    </Form>
  );
}
