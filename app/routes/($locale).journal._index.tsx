import {
  json,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@remix-run/node';
import {useLoaderData} from '@remix-run/react';
import {flattenConnection, getSeoMeta, Image} from '@shopify/hydrogen';

import {Link} from '~/components/Link';
import {getImageLoadingPriority, PAGINATION_SIZE} from '~/lib/const';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel} from '~/components/styx';
import type {ArticleFragment} from 'storefrontapi.generated';

const BLOG_HANDLE = 'Journal';

export const headers = routeHeaders;

export const loader = async ({
  request,
  context: {storefront},
}: LoaderFunctionArgs) => {
  const {language, country} = storefront.i18n;
  const {blog} = await storefront.query(BLOGS_QUERY, {
    variables: {
      blogHandle: BLOG_HANDLE,
      pageBy: PAGINATION_SIZE,
      language,
    },
  });

  if (!blog?.articles) {
    throw new Response('Not found', {status: 404});
  }

  const articles = flattenConnection(blog.articles).map((article) => {
    const {publishedAt} = article!;
    return {
      ...article,
      publishedAt: new Intl.DateTimeFormat(`${language}-${country}`, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(publishedAt!)),
    };
  });

  const seo = seoPayload.blog({blog, url: request.url});

  return json({articles, seo});
};

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

/* ─────────────────────────── Placeholder articles for when blog is empty ─────────────────────────── */

const PLACEHOLDER_ARTICLES = [
  {
    id: 'ph-cuban',
    title: 'On the Cuban Link — Miami, 1974',
    handle: 'history-of-the-cuban-link',
    excerpt: 'How a chain born in Miami\u2019s jewelry district became the most recognized link pattern in the world.',
    category: 'The Weaves',
    vol: 'I',
  },
  {
    id: 'ph-figaro',
    title: 'On the Figaro — Vicenza, 1885',
    handle: 'history-of-the-figaro-chain',
    excerpt: 'Named after the opera, crafted in Italy. The alternating pattern that refuses to go out of style.',
    category: 'The Weaves',
    vol: 'I',
  },
  {
    id: 'ph-rope',
    title: 'On the Rope Chain — A Twist Through Time',
    handle: 'history-of-the-rope-chain',
    excerpt: 'Intertwined strands that catch light from every angle. The engineering behind the sparkle.',
    category: 'The Weaves',
    vol: 'I',
  },
  {
    id: 'ph-franco',
    title: 'On the Franco — Milan\'s Strongest Weave',
    handle: 'history-of-the-franco-chain',
    excerpt: 'Four interlocking rows of V-shaped links. Built to flex without breaking.',
    category: 'The Weaves',
    vol: 'I',
  },
  {
    id: 'ph-byzantine',
    title: 'On the Byzantine — Constantinople, 500 AD',
    handle: 'history-of-the-byzantine-chain',
    excerpt: 'A 1,500-year-old pattern from the Eastern Roman Empire. Complex, hypnotic, and surprisingly light.',
    category: 'The Weaves',
    vol: 'I',
  },
  {
    id: 'ph-herringbone',
    title: 'On the Herringbone — Flat Luxury',
    handle: 'history-of-the-herringbone-chain',
    excerpt: 'Slanted links laid flat to form a liquid-smooth ribbon of gold. The chain that moves like fabric.',
    category: 'The Weaves',
    vol: 'II',
  },
  {
    id: 'ph-mariner',
    title: 'On the Mariner — Anchored in History',
    handle: 'history-of-the-mariner-chain',
    excerpt: 'Originally designed after the chains used on ships. Each link has a bar through the center.',
    category: 'The Weaves',
    vol: 'II',
  },
  {
    id: 'ph-overview',
    title: 'A Brief History of Gold Chains',
    handle: 'history-of-gold-chains',
    excerpt: 'From ancient Mesopotamia to modern Miami. How humanity has worn gold around its neck for 5,000 years.',
    category: 'The Almanac',
    vol: 'IV',
  },
];

export default function Journals() {
  const {articles} = useLoaderData<typeof loader>();

  // Use real articles if available, otherwise show placeholders
  const hasRealArticles = articles && articles.length > 0;
  const displayArticles = hasRealArticles ? articles : null;

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      {/* Hero */}
      <div
        style={{
          borderBottom: `1px solid ${STYX.line}`,
          background: STYX.bone,
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '80px 56px 60px',
          }}
        >
          <StyxLabel>The Journal &middot; Vol. I</StyxLabel>
          <h1
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 72,
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              color: STYX.ink,
              lineHeight: 0.95,
              margin: '12px 0 0',
            }}
          >
            The Weaves
          </h1>
          <p
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontSize: 22,
              color: STYX.silt,
              lineHeight: 1.6,
              marginTop: 20,
              maxWidth: 600,
            }}
          >
            Every chain has a story — where it was born, who wore it first, and
            why it's still here. These are those stories.
          </p>
        </div>
      </div>

      {/* Articles Grid */}
      <div style={{maxWidth: 1440, margin: '0 auto', padding: '64px 56px 120px'}}>
        {displayArticles ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 48,
            }}
          >
            {displayArticles.map((article: any, i: number) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={i}
              />
            ))}
          </div>
        ) : (
          /* Placeholder articles */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2,
              background: STYX.line,
            }}
          >
            {PLACEHOLDER_ARTICLES.map((article, i) => (
              <Link
                key={article.id}
                to={`/journal/${article.handle}`}
                style={{
                  background: STYX.bone,
                  padding: '40px 36px',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'background 0.2s',
                }}
              >
                <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
                  <span
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 10,
                      letterSpacing: '0.25em',
                      textTransform: 'uppercase',
                      color: STYX.gold,
                    }}
                  >
                    {article.category} &middot; {article.vol}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 10,
                      color: STYX.silt2,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h2
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 22,
                    fontWeight: 400,
                    color: STYX.ink,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  {article.title}
                </h2>
                <p
                  style={{
                    fontFamily: FONT.cormorant,
                    fontSize: 16,
                    fontStyle: 'italic',
                    color: STYX.graphite,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {article.excerpt}
                </p>
                <span
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    color: STYX.gold,
                    textTransform: 'uppercase',
                    marginTop: 'auto',
                    paddingTop: 12,
                  }}
                >
                  Read →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <StyxFooter />
    </div>
  );
}

function ArticleCard({
  article,
  index,
}: {
  article: any;
  index: number;
}) {
  return (
    <Link
      to={`/journal/${article.handle}`}
      style={{textDecoration: 'none'}}
    >
      {article.image && (
        <div style={{overflow: 'hidden', marginBottom: 20}}>
          <Image
            alt={article.image.altText || article.title}
            data={article.image}
            sizes="(min-width: 768px) 33vw, 100vw"
            loading={index < 3 ? 'eager' : 'lazy'}
            style={{width: '100%', height: 'auto', display: 'block'}}
          />
        </div>
      )}
      <div
        style={{
          fontFamily: FONT.cinzel,
          fontSize: 10,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: STYX.gold,
          marginBottom: 8,
        }}
      >
        {article.publishedAt}
      </div>
      <h2
        style={{
          fontFamily: FONT.cinzel,
          fontSize: 20,
          fontWeight: 400,
          color: STYX.ink,
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          lineHeight: 1.2,
          margin: 0,
        }}
      >
        {article.title}
      </h2>
    </Link>
  );
}

const BLOGS_QUERY = `#graphql
query Blog(
  $language: LanguageCode
  $blogHandle: String!
  $pageBy: Int!
  $cursor: String
) @inContext(language: $language) {
  blog(handle: $blogHandle) {
    title
    seo {
      title
      description
    }
    articles(first: $pageBy, after: $cursor) {
      edges {
        node {
          ...Article
        }
      }
    }
  }
}

fragment Article on Article {
  author: authorV2 {
    name
  }
  contentHtml
  handle
  id
  image {
    id
    altText
    url
    width
    height
  }
  publishedAt
  title
}
`;
