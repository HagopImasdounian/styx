import {data, type LoaderFunctionArgs} from 'react-router';

import {CACHE_SHORT, routeHeaders} from '~/data/cache';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';

export const headers = routeHeaders;

/**
 * GET /api/products-by-handle?handles=a,b,c
 *
 * Returns full ProductCard data for a set of handles, in the SAME order they
 * were requested. Used by the client-only Recently Viewed strip, which only
 * has lightweight localStorage entries and needs real product data to render
 * the shared <StyxProductCard>. Resource route (no default export) → the GET
 * returns the loader's JSON directly.
 */

const HANDLE_RE = /^[a-z0-9-]+$/;
const MAX_HANDLES = 12;

export async function loader({
  request,
  context: {storefront},
}: LoaderFunctionArgs) {
  const raw = new URL(request.url).searchParams.get('handles') ?? '';
  const handles = raw
    .split(',')
    .map((h) => h.trim())
    .filter((h) => HANDLE_RE.test(h))
    .slice(0, MAX_HANDLES);

  if (handles.length === 0) {
    return data({products: []}, {headers: {'Cache-Control': 'no-store'}});
  }

  try {
    // The Storefront API search has no `handle:` field, so fetch each piece by
    // its direct `product(handle:)` lookup, aliased into one request. Handles
    // are validated to [a-z0-9-] above, so interpolation here is safe.
    const result = (await storefront.query(buildQuery(handles), {
      variables: {
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
      cache: storefront.CacheShort(),
    })) as Record<string, unknown>;

    // Aliases p0..pN map back to the requested order; drop any misses.
    const ordered = handles
      .map((_, i) => result?.[`p${i}`])
      .filter(Boolean);

    return data({products: ordered}, {headers: {'Cache-Control': CACHE_SHORT}});
  } catch {
    // The strip is an enhancement — never surface a Storefront hiccup.
    return data({products: []}, {headers: {'Cache-Control': 'no-store'}});
  }
}

function buildQuery(handles: string[]): string {
  const fields = handles
    .map((h, i) => `    p${i}: product(handle: "${h}") { ...ProductCard }`)
    .join('\n');
  return `#graphql
  query productsByHandle($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
${fields}
  }
  ${PRODUCT_CARD_FRAGMENT}
`;
}
