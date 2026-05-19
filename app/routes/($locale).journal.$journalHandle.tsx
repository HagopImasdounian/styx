import {
    type MetaArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import {data, useLoaderData, useParams, useRouteLoaderData} from 'react-router';
import {getSeoMeta, Image} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';

import type {RootLoader} from '~/root';
import {Link} from '~/components/Link';
import {seoPayload} from '~/lib/seo.server';
import {KARAT_PURITY} from '~/lib/gold';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel, CTAButton, StyxProductCard} from '~/components/styx';
import {PLACEHOLDER_ARTICLES} from '~/data/journal-articles';

const BLOG_HANDLE = 'journal';

/* ─── All journal entries for the "Other chapters" index ─── */
const JOURNAL_ENTRIES = [
  {handle: 'history-of-gold-chains', title: 'A Brief History of Gold Chains', subtitle: 'From Mesopotamia to Miami', readTime: '10 min', vol: 'The Almanac'},
  {handle: 'sizing-guide', title: 'On Proportion & Stature', subtitle: 'The Definitive Sizing Guide', readTime: '8 min', vol: 'The Almanac'},
  {handle: 'history-of-the-cuban-link', title: 'The Cuban Link', subtitle: 'Miami, 1974', readTime: '6 min', vol: 'Vol I'},
  {handle: 'history-of-the-franco-chain', title: 'The Franco', subtitle: "Milan's Strongest Weave", readTime: '4 min', vol: 'Vol I'},
  {handle: 'history-of-the-curb-chain', title: 'The Curb Link', subtitle: 'Ancient Sumer, 2600 BC', readTime: '5 min', vol: 'Vol I'},
  {handle: 'history-of-the-figaro-chain', title: 'The Figaro', subtitle: 'Vicenza, 1885', readTime: '5 min', vol: 'Vol I'},
  {handle: 'history-of-the-mariner-chain', title: 'The Mariner', subtitle: 'Anchored in History', readTime: '4 min', vol: 'Vol I'},
  {handle: 'history-of-the-rope-chain', title: 'The Rope Chain', subtitle: 'A Twist Through Time', readTime: '4 min', vol: 'Vol II'},
  {handle: 'history-of-the-wheat-chain', title: 'The Wheat (Spiga)', subtitle: 'Vicenza, The Renaissance', readTime: '5 min', vol: 'Vol II'},
  {handle: 'history-of-the-herringbone-chain', title: 'The Herringbone', subtitle: 'Flat Luxury', readTime: '4 min', vol: 'Vol IV'},
  {handle: 'history-of-the-snake-chain', title: 'The Snake Chain', subtitle: 'Victorian Era', readTime: '4 min', vol: 'Vol IV'},
  {handle: 'history-of-the-box-chain', title: 'The Box Chain', subtitle: 'Venice, 6th Century', readTime: '4 min', vol: 'Vol IV'},
  {handle: 'history-of-the-paperclip-chain', title: 'The Paperclip', subtitle: 'Oslo, 1940', readTime: '4 min', vol: 'Vol IV'},
  {handle: 'history-of-the-tennis-chain', title: 'The Tennis Chain', subtitle: 'Forest Hills, 1978', readTime: '5 min', vol: 'Vol V'},
];

/* ─── Chain → collection mapping (handles match Shopify collection handles) ─── */
const COLLECTION_MAP: Record<string, {name: string; handle: string}> = {
  'history-of-the-cuban-link': {name: 'Cuban Link', handle: 'cuban'},
  'history-of-the-figaro-chain': {name: 'Figaro', handle: 'figaro'},
  'history-of-the-franco-chain': {name: 'Franco', handle: 'franco'},
  'history-of-the-curb-chain': {name: 'Curb', handle: 'curb'},
  'history-of-the-mariner-chain': {name: 'Mariner', handle: 'mariner'},
  'history-of-the-rope-chain': {name: 'Rope', handle: 'rope'},
  'history-of-the-wheat-chain': {name: 'Wheat', handle: 'wheat'},
  'history-of-the-box-chain': {name: 'Box', handle: 'box'},
  'history-of-the-cable-chain': {name: 'Cable', handle: 'cable'},
  'history-of-the-rolo-chain': {name: 'Rolo', handle: 'rolo'},
  'history-of-the-singapore-chain': {name: 'Singapore', handle: 'singapore'},
  'history-of-the-herringbone-chain': {name: 'Herringbone', handle: 'herringbone'},
  'history-of-the-snake-chain': {name: 'Snake', handle: 'snake'},
  'history-of-the-paperclip-chain': {name: 'Paperclip', handle: 'paperclip'},
  'history-of-the-tennis-chain': {name: 'Tennis', handle: 'tennis'},
  'history-of-the-byzantine-chain': {name: 'Byzantine', handle: 'byzantine'},
  'history-of-the-ball-chain': {name: 'Ball', handle: 'ball'},
  'history-of-the-heart-chain': {name: 'Heart', handle: 'heart'},
  'history-of-the-valentino-chain': {name: 'Valentino', handle: 'valentino'},
  'history-of-the-tulip-chain': {name: 'Tulip', handle: 'tulip'},
  'history-of-the-peanut-chain': {name: 'Peanut', handle: 'peanut'},
  'history-of-the-scroll-chain': {name: 'Scroll', handle: 'scroll'},
  'history-of-the-s-link-chain': {name: 'S-Link', handle: 's-link'},
  'history-of-the-criss-cross-chain': {name: 'Criss-Cross', handle: 'criss-cross'},
  'history-of-the-forsantina-chain': {name: 'Forsantina', handle: 'forsantina'},
};

export async function loader({request, params, context}: LoaderFunctionArgs) {
  const {language, country} = context.storefront.i18n;

  invariant(params.journalHandle, 'Missing journal handle');

  // Fetch article + related collection products in parallel
  const collectionMapping = COLLECTION_MAP[params.journalHandle];
  const collectionHandle = collectionMapping?.handle;

  const [articleResult, collectionResult] = await Promise.all([
    context.storefront.query(ARTICLE_QUERY, {
      variables: {
        blogHandle: BLOG_HANDLE,
        articleHandle: params.journalHandle,
        language,
      },
    }),
    collectionHandle
      ? context.storefront.query(SHOP_COLLECTION_QUERY, {
          variables: {
            handle: collectionHandle,
            country: context.storefront.i18n.country,
            language,
          },
        }).catch(() => null)
      : Promise.resolve(null),
  ]);

  const {blog} = articleResult;
  const shopProducts = collectionResult?.collection?.products?.nodes ?? [];

  if (blog?.articleByHandle) {
    const article = blog.articleByHandle;
    const formattedDate = new Intl.DateTimeFormat(`${language}-${country}`, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(article?.publishedAt!));

    const seo = seoPayload.article({article, url: request.url});

    return data({article, formattedDate, seo, isPlaceholder: false, shopProducts});
  }

  const placeholder = PLACEHOLDER_ARTICLES[params.journalHandle];
  if (!placeholder) {
    throw new Response(null, {status: 404});
  }

  return data({
    article: {
      title: placeholder.title,
      contentHtml: placeholder.content,
      image: placeholder.image ? {url: placeholder.image.url, altText: placeholder.image.altText} : null,
      author: {name: 'The Ferryman'},
    },
    formattedDate: placeholder.readTime,
    seo: {
      title: placeholder.title,
      description: placeholder.content.substring(0, 160).replace(/<[^>]*>/g, ''),
    },
    isPlaceholder: true,
    category: placeholder.category,
    vol: placeholder.vol,
    shopProducts,
  });
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Article() {
  const data = useLoaderData<typeof loader>();
  const {journalHandle} = useParams();
  const {article, formattedDate, isPlaceholder} = data;
  const shopProducts = (data as any).shopProducts ?? [];
  const category = (data as any).category;

  const {title, image, contentHtml, author} = article as any;
  const target = journalHandle ? COLLECTION_MAP[journalHandle] : null;

  // Gold data from root loader
  const rootData = useRouteLoaderData<RootLoader>('root');
  const goldData = (rootData as any)?.goldData;
  const spotPerOz = goldData?.spotPerOz ?? 4700;
  const TROY_OZ_GRAMS = 31.1035;

  // Find current entry + other chapters
  const currentEntry = JOURNAL_ENTRIES.find((e) => e.handle === journalHandle);
  const otherChapters = JOURNAL_ENTRIES.filter((e) => e.handle !== journalHandle).slice(0, 6);

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}} className="styx-journal-page">
      <GoldTicker />
      <StyxNav />

      {/* ─── Editorial Masthead ─────────────────────────────── */}
      <section
        style={{
          background: STYX.bone,
          padding: '40px 56px 36px',
          borderBottom: `1px solid ${STYX.line}`,
          position: 'relative',
        }}
        className="styx-journal-hero"
      >
        <div style={{maxWidth: 1280, margin: '0 auto'}}>
          {/* Top bar: back + volume label */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
            className="styx-journal-topbar"
          >
            <Link
              to="/journal"
              style={{
                background: 'transparent',
                border: 'none',
                fontFamily: FONT.cinzel,
                fontSize: 11,
                letterSpacing: '0.25em',
                color: STYX.silt,
                textTransform: 'uppercase' as const,
                textDecoration: 'none',
              }}
            >
              &larr; Back to the Journal
            </Link>
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 11,
                letterSpacing: '0.25em',
                color: STYX.silt,
                textTransform: 'uppercase',
              }}
            >
              The Styx Journal{currentEntry ? ` · ${currentEntry.vol}` : ''}
            </div>
          </div>

          {/* Massive title */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 40,
              alignItems: 'end',
            }}
            className="styx-journal-title-grid"
          >
            <div>
              <StyxLabel>
                {isPlaceholder && category
                  ? `${category} · ${currentEntry?.readTime || formattedDate} read`
                  : `${formattedDate}`}
              </StyxLabel>
              <h1
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 'clamp(28px, 4.5vw, 52px)',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                  color: STYX.ink,
                  textTransform: 'uppercase',
                  margin: '16px 0 0',
                }}
              >
                {title}
              </h1>
              {currentEntry?.subtitle && (
                <div
                  style={{
                    fontFamily: FONT.cormorant,
                    fontSize: 'clamp(20px, 2.5vw, 32px)',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    lineHeight: 1,
                    color: STYX.ink,
                    letterSpacing: '-0.01em',
                    marginTop: 8,
                    opacity: 0.7,
                  }}
                >
                  {currentEntry.subtitle}
                </div>
              )}
            </div>

            {/* Author + meta column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 8,
                paddingBottom: 12,
              }}
              className="styx-journal-meta-col"
            >
              <div
                style={{
                  fontFamily: FONT.cormorant,
                  fontSize: 16,
                  fontStyle: 'italic',
                  color: STYX.silt,
                }}
              >
                By The Ferryman
              </div>
              {!isPlaceholder && formattedDate && (
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    color: STYX.silt2,
                  }}
                >
                  {formattedDate}
                </div>
              )}
            </div>
          </div>

          {/* Sub-header: intro line + divider */}
          {image && (
            <div
              style={{
                marginTop: 56,
                borderTop: `1px solid ${STYX.line}`,
                paddingTop: 40,
              }}
            />
          )}
        </div>
      </section>

      {/* ─── Hero Image ─────────────────────────────────────── */}
      {image && (
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 56px',
          }}
          className="styx-journal-hero-img"
        >
          {isPlaceholder ? (
            <div
              style={{
                aspectRatio: '21/9',
                overflow: 'hidden',
                border: `1px solid ${STYX.line}`,
              }}
            >
              <img
                src={image.url}
                alt={image.altText || title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          ) : (
            <Image
              data={image}
              sizes="90vw"
              loading="eager"
              style={{width: '100%', height: 'auto', display: 'block'}}
            />
          )}
        </div>
      )}

      {/* ─── Article Body ───────────────────────────────────── */}
      <section
        style={{
          background: STYX.paper,
          padding: '96px 56px',
        }}
        className="styx-journal-body"
      >
        <div
          style={{
            maxWidth: 760,
            margin: '0 auto',
          }}
        >
          <div
            dangerouslySetInnerHTML={{__html: processArticleHtml(contentHtml, spotPerOz)}}
            style={{
              fontFamily: FONT.cormorant,
              fontSize: 20,
              lineHeight: 1.8,
              color: STYX.graphite,
            }}
            className="journal-article"
          />
        </div>
      </section>

      {/* ─── Shop the Collection ───────────── */}
      {target && shopProducts.length > 0 && (
        <section
          style={{
            background: STYX.bone,
            padding: '72px 56px 80px',
            borderTop: `1px solid ${STYX.line}`,
          }}
          className="styx-journal-shop"
        >
          <div style={{maxWidth: 1280, margin: '0 auto'}}>
            {/* Header */}
            <div
              className="styx-journal-shop-header"
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingBottom: 16,
                borderBottom: `1px solid ${STYX.ink}`,
                marginBottom: 32,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: STYX.gold,
                    marginBottom: 8,
                  }}
                >
                  From the Vault
                </div>
                <h3
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 24,
                    fontWeight: 400,
                    color: STYX.ink,
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Shop the {target.name}
                </h3>
              </div>
              <Link
                to={`/collections/${target.handle}`}
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  color: STYX.gold,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  borderBottom: `1px solid ${STYX.gold}`,
                  paddingBottom: 2,
                }}
              >
                View all {target.name} &rarr;
              </Link>
            </div>

            <div
              className="styx-journal-shop-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 24,
              }}
            >
              {shopProducts.slice(0, 8).map((product: any, i: number) => (
                <StyxProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Other Chapters — index ─────────────────────────── */}
      <section
        style={{
          padding: '96px 56px',
          background: STYX.bone,
          borderTop: `1px solid ${STYX.line}`,
        }}
        className="styx-journal-chapters"
      >
        <div style={{maxWidth: 1080, margin: '0 auto'}}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 40,
            }}
            className="styx-journal-chapters-header"
          >
            <div>
              <StyxLabel>The Styx Journal</StyxLabel>
              <h2
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 40,
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  margin: '14px 0 0',
                  color: STYX.ink,
                  textTransform: 'uppercase',
                }}
              >
                Other{' '}
                <span
                  style={{
                    fontFamily: FONT.cormorant,
                    fontStyle: 'italic',
                    fontWeight: 400,
                    textTransform: 'none' as const,
                    letterSpacing: 0,
                  }}
                >
                  chapters.
                </span>
              </h2>
            </div>
            <Link
              to="/journal"
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 11,
                letterSpacing: '0.25em',
                color: STYX.silt,
                textTransform: 'uppercase' as const,
                textDecoration: 'none',
              }}
            >
              Browse all &rarr;
            </Link>
          </div>

          <div>
            {otherChapters.map((chapter, i) => (
              <Link
                key={chapter.handle}
                to={`/journal/${chapter.handle}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 160px 80px',
                  gap: 24,
                  padding: '24px 0',
                  cursor: 'pointer',
                  borderTop:
                    i === 0
                      ? `1px solid ${STYX.ink}`
                      : `1px solid ${STYX.line}`,
                  borderBottom:
                    i === otherChapters.length - 1
                      ? `1px solid ${STYX.ink}`
                      : 'none',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
                className="styx-journal-chapter-row"
              >
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 13,
                    color: STYX.gold,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 18,
                      letterSpacing: '0.04em',
                      color: STYX.ink,
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    {chapter.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT.cormorant,
                      fontSize: 15,
                      fontStyle: 'italic',
                      color: STYX.silt,
                    }}
                  >
                    {chapter.subtitle}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    color: STYX.silt2,
                    letterSpacing: '0.05em',
                  }}
                >
                  {chapter.vol} &middot; {chapter.readTime}
                </div>
                <div
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 11,
                    letterSpacing: '0.2em',
                    color: STYX.gold,
                    textAlign: 'right' as const,
                  }}
                >
                  READ &rarr;
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* ─── Article content styles ─────────────────────────── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ── Typography ── */
        .journal-article h2 {
          font-family: ${FONT.cinzel};
          font-size: 24px;
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${STYX.ink};
          margin: 64px 0 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid ${STYX.line};
        }
        .journal-article h3 {
          font-family: ${FONT.cinzel};
          font-size: 18px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${STYX.gold};
          margin: 48px 0 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid ${STYX.line};
        }
        .journal-article h4 {
          font-family: ${FONT.cinzel};
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${STYX.silt};
          margin: 32px 0 12px;
        }
        .journal-article p {
          margin: 0 0 28px;
        }
        .journal-article p:first-of-type::first-letter {
          font-family: ${FONT.cinzel};
          font-size: 3.2em;
          float: left;
          line-height: 0.85;
          margin: 2px 6px 0 0;
          color: ${STYX.gold};
        }
        .journal-article em {
          font-style: italic;
        }
        .journal-article strong {
          font-weight: 600;
          color: ${STYX.ink};
        }
        .journal-article a {
          color: ${STYX.gold};
          text-decoration: none;
          border-bottom: 1px solid ${STYX.goldLight};
          transition: border-color 0.2s;
        }
        .journal-article a:hover {
          border-color: ${STYX.gold};
        }
        .journal-article hr {
          border: none;
          height: 1px;
          background: ${STYX.line};
          margin: 56px 0;
        }
        .journal-article blockquote {
          font-family: ${FONT.cormorant};
          font-size: 28px;
          font-style: italic;
          line-height: 1.35;
          color: ${STYX.ink};
          margin: 56px 0;
          padding: 40px;
          background: ${STYX.parchment};
          border-left: 3px solid ${STYX.gold};
          position: relative;
        }
        .journal-article blockquote::before {
          content: '\\201C';
          font-family: ${FONT.cinzel};
          font-size: 72px;
          color: ${STYX.goldLight};
          position: absolute;
          top: 8px;
          left: 16px;
          line-height: 1;
          opacity: 0.4;
        }
        .journal-article blockquote p {
          margin: 0;
        }
        .journal-article blockquote p::first-letter {
          font-size: inherit;
          float: none;
          margin: 0;
          color: inherit;
        }

        /* ── Tables — ledger style ── */
        .journal-article table {
          width: 100%;
          border-collapse: collapse;
          margin: 48px 0;
          font-family: ${FONT.cinzel};
          font-size: 14px;
        }
        .journal-article thead {
          border-bottom: 2px solid ${STYX.ink};
        }
        .journal-article th {
          text-align: left;
          padding: 14px 16px;
          color: ${STYX.silt};
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-size: 10px;
          font-weight: 500;
        }
        .journal-article td {
          padding: 14px 16px;
          border-bottom: 1px solid ${STYX.line};
          color: ${STYX.ink};
          font-family: 'Inter', sans-serif;
          font-size: 14px;
        }
        .journal-article tr:last-child td {
          border-bottom: 2px solid ${STYX.ink};
        }

        /* ── Lists ── */
        .journal-article ul,
        .journal-article ol {
          margin: 0 0 28px 0;
          padding-left: 24px;
        }
        .journal-article li {
          margin-bottom: 14px;
          color: ${STYX.graphite};
          line-height: 1.7;
        }
        .journal-article ul li {
          list-style-type: none;
          position: relative;
          padding-left: 20px;
        }
        .journal-article ul li::before {
          content: '·';
          position: absolute;
          left: 0;
          color: ${STYX.gold};
          font-weight: 700;
          font-size: 24px;
          line-height: 1.2;
        }
        .journal-article ol li {
          list-style-type: decimal;
        }
        .journal-article ol li::marker {
          color: ${STYX.gold};
          font-family: ${FONT.cinzel};
          font-size: 14px;
        }

        /* ── Images inside article ── */
        .journal-article img {
          max-width: 100%;
          height: auto;
          margin: 40px 0;
          display: block;
        }

        /* ── GEO takeaway boxes (from article HTML) ── */
        .journal-article .geo-takeaways {
          background: ${STYX.bone} !important;
          border-color: ${STYX.line} !important;
          padding: 32px !important;
        }

        /* ── Chapter row hover ── */
        .styx-journal-chapter-row:hover {
          background: ${STYX.paper};
        }

        /* ═══════ Responsive: Tablet ≤ 768px ═══════ */
        @media (max-width: 48em) {
          .styx-journal-hero {
            padding: 48px 20px 32px !important;
          }
          .styx-journal-topbar {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
            margin-bottom: 32px !important;
          }
          .styx-journal-title-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .styx-journal-meta-col {
            align-items: flex-start !important;
            flex-direction: row !important;
            gap: 16px !important;
          }
          .styx-journal-hero-img {
            padding: 0 20px !important;
          }
          .styx-journal-body {
            padding: 60px 20px !important;
          }
          .styx-journal-shop {
            padding: 60px 20px !important;
          }
          .styx-journal-chapters {
            padding: 60px 20px !important;
          }
          .styx-journal-chapters-header {
            flex-direction: column !important;
            gap: 16px !important;
          }
          .styx-journal-chapter-row {
            grid-template-columns: 40px 1fr 60px !important;
          }
          .styx-journal-chapter-row > *:nth-child(3) {
            display: none !important;
          }
        }

        /* ═══════ Responsive: Small mobile ≤ 512px ═══════ */
        @media (max-width: 32em) {
          .styx-journal-chapter-row {
            grid-template-columns: 1fr 60px !important;
            gap: 12px !important;
          }
          .styx-journal-chapter-row > *:nth-child(1) {
            display: none !important;
          }
          .journal-article h2 {
            font-size: 20px !important;
          }
          .journal-article blockquote {
            font-size: 22px !important;
            padding: 28px !important;
          }
        }
      `,
        }}
      />

      <StyxFooter />
    </div>
  );
}

/**
 * Process article HTML: replace gold-weight-visual widget markers
 * with live-computed values from the gold spot price API.
 */
function processArticleHtml(html: string, spotPerOz: number): string {
  const TROY_OZ_GRAMS = 31.1035;

  return html.replace(
    /<div data-styx-widget="gold-weight-visual"([^>]*)><\/div>/g,
    (_match, attrs) => {
      const getAttr = (name: string) => {
        const m = attrs.match(new RegExp(`data-${name}="([^"]*)"`));
        return m ? m[1] : null;
      };
      const width = getAttr('width') || '5';
      const length = getAttr('length') || '22';
      const karat = parseInt(getAttr('karat') || '14', 10);
      const weight = parseFloat(getAttr('weight') || '34');

      const purity = (KARAT_PURITY as any)[karat] ?? 0.585;
      const goldPerGram = (spotPerOz / TROY_OZ_GRAMS) * purity;
      const rawMaterialValue = goldPerGram * weight;
      const troyOzValue = spotPerOz * purity;

      const fmt = (n: number) =>
        n >= 1000
          ? `$${Math.round(n).toLocaleString('en-US')}`
          : `$${Math.round(n)}`;

      return `
        <div style="background: #1A1815; color: #EFEAE0; padding: 48px; margin: 48px 0; position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(ellipse 70% 50% at 50% 50%, rgba(184,146,74,0.08), transparent 70%); pointer-events: none;"></div>
          <div style="position: relative;">
            <div style="font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 0.3em; color: #B8924A; text-transform: uppercase; margin-bottom: 24px;">The Weight, Visualized &middot; Live from the London Fix</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; text-align: center;">
              <div>
                <div style="font-family: 'Cinzel', serif; font-size: 36px; color: #B8924A; font-weight: 500;">31.1g</div>
                <div style="font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 0.2em; color: rgba(239,234,224,0.5); text-transform: uppercase; margin-top: 8px;">One Troy Ounce</div>
                <div style="font-family: 'Cormorant Garamond', serif; font-size: 14px; font-style: italic; color: rgba(239,234,224,0.7); margin-top: 4px;">Six quarters in your palm</div>
              </div>
              <div>
                <div style="font-family: 'Cinzel', serif; font-size: 36px; color: #EFEAE0; font-weight: 500;">~${weight}g</div>
                <div style="font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 0.2em; color: rgba(239,234,224,0.5); text-transform: uppercase; margin-top: 8px;">${length}&Prime; Cuban &middot; ${width}mm &middot; ${karat}k</div>
                <div style="font-family: 'Cormorant Garamond', serif; font-size: 14px; font-style: italic; color: rgba(239,234,224,0.7); margin-top: 4px;">More than a full troy ounce</div>
              </div>
              <div>
                <div style="font-family: 'Cinzel', serif; font-size: 36px; color: #B8924A; font-weight: 500;">${fmt(rawMaterialValue)}</div>
                <div style="font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 0.2em; color: rgba(239,234,224,0.5); text-transform: uppercase; margin-top: 8px;">Raw Material Value</div>
                <div style="font-family: 'Cormorant Garamond', serif; font-size: 14px; font-style: italic; color: rgba(239,234,224,0.7); margin-top: 4px;">At today&rsquo;s ${fmt(spotPerOz)}/oz spot</div>
              </div>
            </div>
          </div>
        </div>
      `;
    },
  );
}

const ARTICLE_QUERY = `#graphql
  query ArticleDetails(
    $language: LanguageCode
    $blogHandle: String!
    $articleHandle: String!
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        title
        contentHtml
        publishedAt
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
    }
  }
`;

const SHOP_COLLECTION_QUERY = `#graphql
  query ShopCollection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 8, sortKey: PRICE) {
        nodes {
          id
          title
          handle
          vendor
          variants(first: 10) {
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
              compareAtPrice {
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
        }
      }
    }
  }
`;
