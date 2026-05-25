import {type LoaderFunctionArgs, type MetaArgs} from 'react-router';
import {useLoaderData, useRouteLoaderData} from 'react-router';
import {getSeoMeta, Image} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import {
  STYX,
  FONT,
  GoldTicker,
  StyxNav,
  StyxFooter,
} from '~/components/styx';
import {CompareButton} from '~/components/styx/CompareButton';
import {KARAT_PURITY} from '~/lib/gold';
import {getComparisonBySlug, getRelatedComparisons} from '~/data/comparisons';
import type {RootLoader} from '~/root';

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {slug} = params;
  if (!slug) throw new Response('Not Found', {status: 404});

  const comparison = getComparisonBySlug(slug);
  if (!comparison) throw new Response('Not Found', {status: 404});

  // Fetch products
  const results = await Promise.all(
    comparison.products.map((handle) =>
      context.storefront.query(COMPARE_PRODUCT_QUERY, {
        variables: {
          handle,
          country: context.storefront.i18n.country,
          language: context.storefront.i18n.language,
        },
      }),
    ),
  );

  const products = results.map((r) => r.product).filter(Boolean);
  const related = getRelatedComparisons(comparison.relatedSlugs);

  return {
    comparison,
    products,
    related,
    seo: {
      title: comparison.metaTitle,
      description: comparison.metaDescription,
      url: request.url,
    },
  };
}

export const meta = ({data}: MetaArgs<typeof loader>) => {
  if (!data?.seo) return [];
  return getSeoMeta({
    title: data.seo.title,
    description: data.seo.description,
    url: data.seo.url,
  });
};

export default function CuratedComparePage() {
  const {comparison, products, related} = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData<RootLoader>('root');
  const spotPerOz = (rootData as any)?.goldData?.spotPerOz ?? 4700;
  const spotPerGram = spotPerOz / 31.1035;

  // Build specs
  const specs = products.map((p: any) => {
    const karat = p.karat?.value
      ? parseInt(p.karat.value, 10)
      : /18\s*k/i.test(p.title) ? 18
      : /14\s*k/i.test(p.title) ? 14
      : 10;

    const thickness = p.chain_thickness?.value || (p.title.match(/(\d+(?:\.\d+)?)\s*mm/i)?.[0] ?? null);
    const construction = p.chain_construction?.value || (/hollow/i.test(p.title) ? 'Hollow' : 'Solid');
    const chainStyle = p.chain_style?.value || null;
    const origin = p.chain_origin?.value || null;

    const prices = p.variants.nodes.map((v: any) => parseFloat(v.price.amount));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const lengths = Array.from(
      new Set(
        p.variants.nodes
          .map((v: any) => v.selectedOptions?.find((o: any) => o.name.toLowerCase() === 'length')?.value)
          .filter(Boolean),
      ),
    ) as string[];

    const colors = Array.from(
      new Set(
        p.variants.nodes
          .map((v: any) => v.selectedOptions?.find((o: any) => o.name.toLowerCase() === 'color')?.value)
          .filter(Boolean),
      ),
    ) as string[];

    const weightVariant = p.variants.nodes.find((v: any) => v.weight && v.weight > 0);
    const weight = weightVariant?.weight ?? null;
    const variantLengthStr = weightVariant?.selectedOptions?.find((o: any) => o.name.toLowerCase() === 'length')?.value;
    const lengthInches = variantLengthStr ? parseFloat(variantLengthStr.replace(/[^0-9.]/g, '')) : null;

    const purity = KARAT_PURITY[karat] ?? 10 / 24;
    const pureGold = weight ? weight * purity : null;
    const goldPerInch = pureGold && lengthInches ? pureGold / lengthInches : null;
    const weightPerInch = weight && lengthInches ? weight / lengthInches : null;
    const meltValue = pureGold ? pureGold * spotPerGram : null;
    const premiumOverMelt = meltValue ? minPrice - meltValue : null;
    const pricePerInch = lengthInches ? minPrice / lengthInches : null;
    const pricePerPureGram = pureGold && pureGold > 0 ? minPrice / pureGold : null;
    const valueScore = meltValue && minPrice > 0 ? (meltValue / minPrice) * 100 : null;
    const image = p.variants.nodes[0]?.image || p.featuredImage;

    return {
      handle: p.handle,
      title: p.title,
      image,
      karat,
      thickness,
      construction,
      chainStyle,
      origin,
      specWeave: p.spec_weave?.value || null,
      specProfile: p.spec_profile?.value || null,
      specClasp: p.spec_clasp?.value || null,
      specCast: p.spec_cast?.value || null,
      minPrice,
      maxPrice,
      lengths,
      colors,
      weight,
      lengthInches,
      weightPerInch,
      pureGold,
      goldPerInch,
      meltValue,
      premiumOverMelt,
      pricePerInch,
      pricePerPureGram,
      valueScore,
    };
  });

  const ROWS: Array<{label: string; render: (s: any) => string; alwaysShow?: boolean}> = [
    {label: 'Price', render: (s) => s.minPrice === s.maxPrice ? `$${s.minPrice.toFixed(2)}` : `$${s.minPrice.toFixed(2)} – $${s.maxPrice.toFixed(2)}`, alwaysShow: true},
    {label: 'Karat', render: (s) => `${s.karat}K`, alwaysShow: true},
    {label: 'Total Weight', render: (s) => s.weight ? `${s.weight}g` : '—', alwaysShow: true},
    {label: 'Pure Gold', render: (s) => s.pureGold ? `${s.pureGold.toFixed(2)}g` : '—', alwaysShow: true},
    {label: 'Melt Value', render: (s) => s.meltValue ? `$${s.meltValue.toFixed(2)}` : '—', alwaysShow: true},
    {label: 'Value %', render: (s) => s.valueScore ? `${s.valueScore.toFixed(0)}%` : '—', alwaysShow: true},
    // Per-inch
    {label: 'Weight/Inch', render: (s) => s.weightPerInch ? `${s.weightPerInch.toFixed(3)}g` : '—', alwaysShow: true},
    {label: 'Gold/Inch', render: (s) => s.goldPerInch ? `${s.goldPerInch.toFixed(3)}g` : '—', alwaysShow: true},
    {label: 'Price/Inch', render: (s) => s.pricePerInch ? `$${s.pricePerInch.toFixed(2)}` : '—', alwaysShow: true},
    // Cost analysis
    {label: 'Premium Over Melt', render: (s) => s.premiumOverMelt != null ? `$${s.premiumOverMelt.toFixed(2)}` : '—', alwaysShow: true},
    {label: '$/g Pure Gold', render: (s) => s.pricePerPureGram ? `$${s.pricePerPureGram.toFixed(2)}` : '—', alwaysShow: true},
    // Specs
    {label: 'Thickness', render: (s) => s.thickness || '—'},
    {label: 'Style', render: (s) => s.chainStyle || '—'},
    {label: 'Construction', render: (s) => s.construction},
    {label: 'Clasp', render: (s) => s.specClasp || '—'},
    {label: 'Weave', render: (s) => s.specWeave || '—'},
    {label: 'Profile', render: (s) => s.specProfile || '—'},
    {label: 'Origin', render: (s) => s.origin || '—'},
    {label: 'Lengths', render: (s) => s.lengths.length > 0 ? s.lengths.join(', ') : '—'},
    {label: 'Colors', render: (s) => s.colors.length > 0 ? s.colors.join(', ') : '—'},
  ];

  const activeRows = ROWS.filter((row) =>
    row.alwaysShow || specs.some((s: any) => row.render(s) !== '—'),
  );

  const valueScores = specs.map((s: any) => s.valueScore ?? 0);
  const bestValueIdx = valueScores.indexOf(Math.max(...valueScores));

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      <div style={{maxWidth: 1000, margin: '0 auto', padding: '48px 24px 120px'}}>
        {/* Breadcrumb */}
        <nav style={{fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.silt, marginBottom: 32, display: 'flex', gap: 8, alignItems: 'center'}}>
          <Link to="/" style={{color: STYX.silt, textDecoration: 'none'}}>Home</Link>
          <span style={{opacity: 0.4}}>/</span>
          <Link to="/compare" style={{color: STYX.silt, textDecoration: 'none'}}>Compare</Link>
          <span style={{opacity: 0.4}}>/</span>
          <span style={{color: STYX.ink}}>{comparison.title}</span>
        </nav>

        {/* H1 + Intro */}
        <header style={{marginBottom: 48}}>
          <h1 style={{fontFamily: FONT.cinzel, fontSize: 32, fontWeight: 500, letterSpacing: '0.04em', color: STYX.ink, marginBottom: 20, lineHeight: 1.2}}>
            {comparison.h1}
          </h1>
          <p style={{fontFamily: FONT.cormorant, fontSize: 18, lineHeight: 1.8, color: STYX.graphite, maxWidth: 720}}>
            {comparison.intro}
          </p>
        </header>

        {/* Comparison Table */}
        <div style={{overflowX: 'auto', marginBottom: 56}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                <th style={{width: 130}} />
                {specs.map((s: any, idx: number) => (
                  <th key={s.handle} style={{padding: '0 16px 24px', verticalAlign: 'bottom', textAlign: 'center'}}>
                    {s.image && (
                      <Link to={`/products/${s.handle}`} style={{textDecoration: 'none'}}>
                        <div style={{width: '100%', maxWidth: 200, aspectRatio: '4/5', margin: '0 auto 16px', background: '#fff', overflow: 'hidden'}}>
                          <Image data={s.image} aspectRatio="4/5" sizes="200px" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        </div>
                      </Link>
                    )}
                    <Link to={`/products/${s.handle}`} style={{textDecoration: 'none', fontFamily: FONT.cinzel, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: STYX.ink, display: 'block', marginBottom: 8}}>
                      {s.title}
                    </Link>

                    {idx === bestValueIdx && specs.length > 1 && (
                      <div style={{display: 'inline-block', padding: '4px 10px', background: 'rgba(184,146,74,0.12)', border: `1px solid ${STYX.gold}`, fontFamily: FONT.mono, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: STYX.goldDeep, marginBottom: 8}}>
                        Best Value
                      </div>
                    )}

                    <div style={{marginTop: 4}}>
                      <CompareButton handle={s.handle} compact />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeRows.map((row, i) => (
                <tr key={row.label} style={{background: i % 2 === 0 ? 'transparent' : 'rgba(26,24,21,0.02)'}}>
                  <td style={{padding: '13px 16px', fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.silt, whiteSpace: 'nowrap', borderBottom: `1px solid ${STYX.lineSoft}`}}>
                    {row.label}
                  </td>
                  {specs.map((s: any, idx: number) => {
                    const val = row.render(s);
                    const allVals = specs.map((sp: any) => row.render(sp));
                    const allSame = allVals.every((v: string) => v === allVals[0]);
                    const isBest = row.label === 'Value Score' && idx === bestValueIdx && specs.length > 1;
                    return (
                      <td key={s.handle} style={{padding: '13px 16px', textAlign: 'center', fontFamily: FONT.inter, fontSize: 13, color: isBest ? STYX.goldDeep : val === '—' ? STYX.silt : STYX.ink, fontWeight: isBest ? 600 : !allSame && val !== '—' ? 500 : 400, borderBottom: `1px solid ${STYX.lineSoft}`}}>
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Value explanation */}
        <div style={{padding: '20px 24px', border: `1px solid ${STYX.lineSoft}`, background: STYX.paper, marginBottom: 56}}>
          <div style={{fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.silt, marginBottom: 8}}>
            How we calculate value
          </div>
          <div style={{fontFamily: FONT.inter, fontSize: 12, color: STYX.silt, lineHeight: 1.9}}>
            <strong>Pure Gold</strong> = total weight x karat purity ({specs[0] && `${specs[0].karat}K = ${((KARAT_PURITY[specs[0].karat] ?? 0.417) * 100).toFixed(1)}% pure`}) &nbsp;|&nbsp;
            <strong>Melt Value</strong> = pure gold x live spot price (${spotPerGram.toFixed(2)}/g today) &nbsp;|&nbsp;
            <strong>Value %</strong> = melt value / price (higher = more gold for your money)<br/>
            <strong>Gold/Inch</strong> = pure gold per inch of chain &nbsp;|&nbsp;
            <strong>Weight/Inch</strong> = total weight per inch &nbsp;|&nbsp;
            <strong>Premium</strong> = what you pay above raw gold value (craftsmanship + margin)
          </div>
        </div>

        {/* FAQs with Schema */}
        {comparison.faqs.length > 0 && (
          <section style={{marginBottom: 56}}>
            <h2 style={{fontFamily: FONT.cinzel, fontSize: 20, fontWeight: 500, letterSpacing: '0.06em', color: STYX.ink, marginBottom: 24}}>
              Frequently Asked Questions
            </h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: 0}}>
              {comparison.faqs.map((faq, i) => (
                <div key={i} style={{borderBottom: `1px solid ${STYX.lineSoft}`, padding: '20px 0'}}>
                  <h3 style={{fontFamily: FONT.inter, fontSize: 14, fontWeight: 600, color: STYX.ink, marginBottom: 10}}>
                    {faq.question}
                  </h3>
                  <p style={{fontFamily: FONT.cormorant, fontSize: 16, lineHeight: 1.7, color: STYX.graphite, margin: 0}}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Comparisons */}
        {related.length > 0 && (
          <section style={{marginBottom: 56}}>
            <h2 style={{fontFamily: FONT.cinzel, fontSize: 18, fontWeight: 500, letterSpacing: '0.06em', color: STYX.ink, marginBottom: 20}}>
              Related Comparisons
            </h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16}}>
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/compare/${r.slug}`}
                  style={{
                    padding: '18px 20px',
                    border: `1px solid ${STYX.line}`,
                    background: STYX.paper,
                    textDecoration: 'none',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{fontFamily: FONT.cinzel, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: STYX.ink, marginBottom: 6}}>
                    {r.title}
                  </div>
                  <div style={{fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: STYX.silt}}>
                    {r.products.length} chains compared
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div style={{textAlign: 'center', padding: '40px 0', borderTop: `1px solid ${STYX.lineSoft}`}}>
          <p style={{fontFamily: FONT.cormorant, fontSize: 18, color: STYX.silt, marginBottom: 20}}>
            Want to compare different chains or add your own specs?
          </p>
          <Link
            to="/compare"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              background: STYX.ink,
              color: STYX.bone,
              fontFamily: FONT.cinzel,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Build Your Own Comparison
          </Link>
        </div>
      </div>

      {/* FAQ Schema (JSON-LD) */}
      {comparison.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: comparison.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      )}

      <StyxFooter />
    </div>
  );
}

/* ─────────────────── GraphQL ─────────────────── */

const COMPARE_PRODUCT_QUERY = `#graphql
  query CompareSlugProduct(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      featuredImage {
        url
        altText
        width
        height
      }
      variants(first: 100) {
        nodes {
          id
          availableForSale
          image {
            url
            altText
            width
            height
          }
          price {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
          weight
          weightUnit
        }
      }
      karat: metafield(namespace: "chain", key: "karat") {
        value
      }
      chain_thickness: metafield(namespace: "chain", key: "thickness") {
        value
      }
      chain_construction: metafield(namespace: "chain", key: "construction") {
        value
      }
      chain_style: metafield(namespace: "chain", key: "chain_style") {
        value
      }
      chain_origin: metafield(namespace: "custom", key: "chain_origin") {
        value
      }
      spec_weave: metafield(namespace: "custom", key: "spec_weave") {
        value
      }
      spec_profile: metafield(namespace: "custom", key: "spec_profile") {
        value
      }
      spec_clasp: metafield(namespace: "custom", key: "spec_clasp") {
        value
      }
      spec_cast: metafield(namespace: "custom", key: "spec_cast") {
        value
      }
    }
  }
` as const;
