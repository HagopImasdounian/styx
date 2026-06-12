import type {LoaderFunctionArgs} from 'react-router';

import {requireCustomerAccount} from '~/lib/customer.server';

export async function loader({params, request, context}: LoaderFunctionArgs) {
  // Redirects home when customer accounts aren't configured.
  const customerAccount = requireCustomerAccount(context, params);

  return customerAccount.login();
}
