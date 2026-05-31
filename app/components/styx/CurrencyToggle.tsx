import {useLocation, useRouteLoaderData} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import type {RootLoader} from '~/root';
import {DEFAULT_LOCALE} from '~/lib/utils';
import {STYX, FONT} from './constants';

/**
 * USD / CAD currency switch for the top strip.
 *
 * Switching sets the cart's buyerIdentity.countryCode AND redirects to the
 * locale-prefixed path (''/ for US, '/en-ca' for Canada), so the @inContext
 * price context and the checkout currency stay in lock-step.
 *
 * It renders ONLY when Shopify can actually present both currencies (i.e. CAD
 * has been enabled in Shopify Markets via Shopify Payments). Until then
 * `availableCurrencies` is ['USD'] and this returns null — zero impact on the
 * current USD-only store. It self-activates the moment CAD goes live.
 */
const OPTIONS = [
  {code: 'USD', country: 'US', prefix: ''},
  {code: 'CAD', country: 'CA', prefix: '/en-ca'},
] as const;

export function CurrencyToggle() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const available = (rootData as any)?.availableCurrencies as string[] | undefined;
  const selectedLocale = rootData?.selectedLocale ?? DEFAULT_LOCALE;
  const {pathname, search} = useLocation();

  const showable = OPTIONS.filter((o) => available?.includes(o.code));
  // Best practice: only surface the switcher when there's a real choice.
  if (showable.length < 2) return null;

  const current = selectedLocale.currency || 'USD';
  const pathWithoutLocale =
    `${pathname.replace(selectedLocale.pathPrefix, '')}${search}` || '/';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flex: '0 0 auto',
        border: '1px solid rgba(239,234,224,0.2)',
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      {showable.map((o, i) => {
        const active = current === o.code;
        const redirectTo = `${o.prefix}${pathWithoutLocale}`;
        return (
          <CartForm
            key={o.code}
            route="/cart"
            action={CartForm.ACTIONS.BuyerIdentityUpdate}
            inputs={{buyerIdentity: {countryCode: o.country as any}}}
          >
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <button
              type="submit"
              aria-label={`Show prices in ${o.code}`}
              aria-pressed={active}
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: '0.1em',
                padding: '4px 12px',
                cursor: active ? 'default' : 'pointer',
                border: 'none',
                borderLeft: i > 0 ? '1px solid rgba(239,234,224,0.2)' : 'none',
                background: active ? STYX.gold : 'transparent',
                color: active ? STYX.ink : 'rgba(239,234,224,0.6)',
                fontWeight: active ? 600 : 400,
                transition: 'all 0.2s ease',
              }}
            >
              {o.code}
            </button>
          </CartForm>
        );
      })}
    </div>
  );
}
