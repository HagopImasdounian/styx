import {type SeoConfig, getSeoMeta} from '@shopify/hydrogen';

/**
 * Client-safe SEO meta helpers. `meta` exports run in the browser bundle, so
 * this module must NOT live in (or import from) seo.server.ts.
 */

export const DEFAULT_OG_IMAGE_PATH = '/images/hero.jpg';

/**
 * Wraps Hydrogen's getSeoMeta to guarantee a complete Twitter Card and a plain
 * og:image on every page. getSeoMeta emits twitter:title / twitter:description
 * but never twitter:card or twitter:image, and for object media it only emits
 * og:image:url (not a bare og:image). This backfills those tags site-wide from
 * the resolved og:image so social previews render everywhere.
 */
export function getStyxSeoMeta(
  ...seoInputs: Array<SeoConfig | undefined | null>
): ReturnType<typeof getSeoMeta> {
  const tags = getSeoMeta(...(seoInputs.filter(Boolean) as SeoConfig[]));

  const get = (matcher: (t: any) => boolean) =>
    (tags as any[]).find(matcher);

  // Resolve the OG image URL Hydrogen produced (object media → og:image:url,
  // string media → og:image).
  let ogImageUrl: string | undefined =
    get((t) => t.property === 'og:image:url')?.content ??
    get((t) => t.property === 'og:image' || t.name === 'og:image')?.content;

  // Fall back to the site-wide hero image (derived from the page's canonical
  // origin) so pages without their own image still get a rich social card.
  if (!ogImageUrl) {
    const canonicalUrl: string | undefined =
      get((t) => t.property === 'og:url')?.content ??
      get((t) => t.rel === 'canonical')?.href;
    if (canonicalUrl) {
      try {
        ogImageUrl = new URL(
          DEFAULT_OG_IMAGE_PATH,
          new URL(canonicalUrl).origin,
        ).toString();
      } catch {
        /* leave undefined */
      }
    }
  }

  const hasTag = (pred: (t: any) => boolean) => Boolean(get(pred));

  // twitter:card — large image when we have an image, otherwise summary.
  if (!hasTag((t) => t.name === 'twitter:card')) {
    (tags as any[]).push({
      name: 'twitter:card',
      content: ogImageUrl ? 'summary_large_image' : 'summary',
    });
  }

  if (ogImageUrl) {
    // Bare og:image for crawlers that don't read og:image:url.
    if (!hasTag((t) => t.property === 'og:image' || t.name === 'og:image')) {
      (tags as any[]).push({property: 'og:image', content: ogImageUrl});
    }
    if (!hasTag((t) => t.name === 'twitter:image')) {
      (tags as any[]).push({name: 'twitter:image', content: ogImageUrl});
    }
  }

  return tags as ReturnType<typeof getSeoMeta>;
}
