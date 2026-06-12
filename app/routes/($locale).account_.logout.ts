import {
  redirect,
  type ActionFunction,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from 'react-router';

import {doLogout} from '~/lib/customer.server';

export const action: ActionFunction = async ({
  context,
  params,
}: ActionFunctionArgs) => {
  if (!context.customerAccount) {
    throw redirect(params?.locale ? `/${params.locale}` : '/');
  }

  return doLogout(context);
};

export async function loader({params}: LoaderFunctionArgs) {
  const locale = params.locale;
  return redirect(locale ? `/${locale}` : '/');
}
