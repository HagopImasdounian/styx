import {redirect, type LoaderFunctionArgs} from 'react-router';

/**
 * Legacy "Vault" landing page (ShinyJewellers-API backed, only 4 categories).
 * The full chains experience now lives on the Chains collection page:
 * compact hero, all 13 weave tiles, full filter toolbar, every product.
 */
export async function loader({params}: LoaderFunctionArgs) {
  const prefix = params.locale ? `/${params.locale}` : '';
  return redirect(`${prefix}/collections/chains`, 301);
}
