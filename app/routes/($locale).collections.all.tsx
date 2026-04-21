import {redirect, type LoaderFunctionArgs} from '@remix-run/node';

export async function loader({params}: LoaderFunctionArgs) {
  return redirect(params?.locale ? `${params.locale}/products` : '/products');
}
