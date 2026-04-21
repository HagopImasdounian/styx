import type {LoaderFunctionArgs} from '@remix-run/node';

export async function loader({params, request, context}: LoaderFunctionArgs) {
  return context.customerAccount.login();
}
