import {redirect, type LoaderFunctionArgs} from 'react-router';

/**
 * Legacy /chains/<category> pages (ShinyJewellers-API backed).
 * Redirect each category to its Shopify collection page.
 */
const CATEGORY_TO_COLLECTION: Record<string, string> = {
  cuban: 'cuban',
  box: 'box',
  curb: 'curb',
  rope: 'rope',
  bracelet: 'bracelets',
};

export async function loader({params}: LoaderFunctionArgs) {
  const prefix = params.locale ? `/${params.locale}` : '';
  const handle = CATEGORY_TO_COLLECTION[params.category ?? ''] ?? 'chains';
  return redirect(`${prefix}/collections/${handle}`, 301);
}
