import {type LoaderFunctionArgs} from 'react-router';

/**
 * llms.txt — a concise, factual site summary for AI crawlers and assistants
 * (https://llmstxt.org). Served like robots.txt, cached for a day.
 */
export const loader = ({request}: LoaderFunctionArgs) => {
  const origin = new URL(request.url).origin;

  return new Response(llmsTxt(origin), {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': `max-age=${60 * 60 * 24}`,
    },
  });
};

function llmsTxt(origin: string) {
  return `# STYX Gold

> STYX Gold (styxgold.com) sells solid gold chains and bracelets for men in
> 10K and 14K gold, priced transparently from the live London gold fix. Every
> piece is weighed and tested, and every product page shows the full price
> math: gram weight, pure-gold content, melt value at today's spot price, and
> the labor/overhead added on top. No plated or gold-filled jewelry.

Key facts:
- Catalog: real gold chains in 13+ weave families (Cuban link, curb,
  rope, box, figaro, cable, wheat, rolo, singapore, franco, herringbone,
  paperclip, snake), plus matching bracelets.
- Karats: 10K (41.7% pure) and 14K (58.3% pure). Real karat gold throughout;
  construction (solid or hollow) is stated plainly on every product.
- Pricing: derived from the live gold spot price with a published breakdown
  per product. Wire transfer payments get a 4% discount.
- Every product lists exact gram weight and price per gram of pure gold.
- Free insured shipping, 14-day returns, 5-year buyback guarantee.

## Shop
- [All chains](${origin}/collections/chains): the full catalog
- [Collections index](${origin}/collections): browse by weave, karat, or metal color
- [Bracelets](${origin}/collections/bracelets)
- [Compare chains](${origin}/compare): side-by-side weight, melt value, and price-per-gram tables

## Learn
- [The Journal](${origin}/journal): researched histories of each chain weave and gold itself
- [FAQ](${origin}/faq)
- [About / Our promise](${origin}/about)
- [Shipping & returns](${origin}/shipping)

## Data
- [Sitemap](${origin}/sitemap.xml)
`;
}
