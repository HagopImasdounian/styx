import type {LoaderFunctionArgs} from 'react-router';

import {
  PLACEHOLDER_ARTICLES,
  HIDDEN_ARTICLE_HANDLES,
} from '~/data/journal-articles';
import {CURATED_COMPARISONS} from '~/data/comparisons';

/**
 * Sitemap for local (non-Shopify) content: the homepage, static pages,
 * journal articles authored in app/data/journal-articles.ts, and curated
 * compare pages from app/data/comparisons.ts. Referenced from the sitemap
 * index in [sitemap.xml].tsx.
 */
const STATIC_PATHS = [
  '/',
  '/journal',
  '/about',
  '/contact',
  '/faq',
  '/customize',
  '/shipping',
];

export async function loader({request}: LoaderFunctionArgs) {
  const baseUrl = new URL(request.url).origin;

  const journalPaths = Object.keys(PLACEHOLDER_ARTICLES)
    .filter((handle) => !HIDDEN_ARTICLE_HANDLES.has(handle))
    .map((handle) => `/journal/${handle}`);

  const comparePaths = CURATED_COMPARISONS.map(
    (comparison) => `/compare/${comparison.slug}`,
  );

  const urls = [...STATIC_PATHS, ...journalPaths, ...comparePaths]
    .map((path) => `  <url><loc>${baseUrl}${path === '/' ? '/' : path}</loc></url>`)
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
      'Oxygen-Cache-Control': `max-age=${60 * 60 * 24}`,
      Vary: 'Accept-Encoding, Accept-Language',
    },
  });
}
