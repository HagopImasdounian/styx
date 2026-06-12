import {redirect, type LoaderFunctionArgs} from 'react-router';
import {validateLocale} from '~/lib/utils';

export async function loader({params}: LoaderFunctionArgs) {
  validateLocale(params);
  return redirect(params?.locale ? `${params.locale}/products` : '/products');
}
