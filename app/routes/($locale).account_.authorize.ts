import type {LoaderFunctionArgs} from '@remix-run/node';

export async function loader({context, params}: LoaderFunctionArgs) {
  return context.customerAccount.authorize();
}
