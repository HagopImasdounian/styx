import type {LoaderFunctionArgs} from 'react-router';

import {requireCustomerAccount} from '~/lib/customer.server';

export async function loader({context, params}: LoaderFunctionArgs) {
  // Redirects home when customer accounts aren't configured.
  const customerAccount = requireCustomerAccount(context, params);

  return customerAccount.authorize();
}
