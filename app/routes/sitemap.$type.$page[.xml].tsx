import type {LoaderFunctionArgs} from 'react-router';

import {getSitemap} from 'app/lib/sitemap';

export async function loader({
  request,
  params,
  context: {storefront},
}: LoaderFunctionArgs) {
  const response = await getSitemap({
    storefront,
    request,
    params,
    // Single active market (en-US, no path prefix) — no hreflang alternates.
    locales: [],
    getLink: ({type, baseUrl, handle}) => {
      // Make sure the generated sitemap urls are reflective of the routes
      const typeUrl = type === 'articles' ? 'journal' : type;
      return `${baseUrl}/${typeUrl}/${handle}`;
    },
  });

  response.headers.set('Oxygen-Cache-Control', `max-age=${60 * 60 * 24}`);
  response.headers.set('Vary', 'Accept-Encoding, Accept-Language');

  return response;
}
