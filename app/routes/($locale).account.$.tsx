import {redirect, type LoaderFunctionArgs} from 'react-router';

import {requireCustomerAccount} from '~/lib/customer.server';

// fallback wild card for all unauthenticated routes in account section
export async function loader({context, params}: LoaderFunctionArgs) {
  // Redirects home when customer accounts aren't configured.
  const customerAccount = requireCustomerAccount(context, params);

  await customerAccount.handleAuthStatus();

  const locale = params.locale;
  return redirect(locale ? `/${locale}/account` : '/account');
}
