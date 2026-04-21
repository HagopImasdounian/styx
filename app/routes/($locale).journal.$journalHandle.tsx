import {
  json,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {getSeoMeta, Image} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';

import {Link} from '~/components/Link';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel} from '~/components/styx';

const BLOG_HANDLE = 'journal';

export const headers = routeHeaders;

/* ─────────────────────────── Placeholder content ─────────────────────────── */

const PLACEHOLDER_ARTICLES: Record<string, {
  title: string;
  category: string;
  vol: string;
  readTime: string;
  content: string;
}> = {
  'history-of-the-cuban-link': {
    title: 'On the Cuban Link — Miami, 1974',
    category: 'The Weaves',
    vol: 'I',
    readTime: '6 min',
    content: `
      <p>The Miami Cuban link chain didn't come from Cuba — not directly, anyway. It was born in the jewelry workshops of Miami's downtown district in the early 1970s, created by Cuban-American jewelers who adapted traditional curb chain techniques into something bolder, flatter, and more interlocking than anything that came before.</p>

      <h3>The Mechanics</h3>
      <p>What makes a Cuban link different from a standard curb chain? It comes down to the interlock. Each link is cut from round wire, flattened, and then twisted so it lies perfectly flat against the next. The result is a chain that looks like it's been woven rather than assembled — smooth to the touch but with visible definition between every link.</p>

      <p>The links are typically oval-shaped with a slight curve, and they connect in a way that distributes weight evenly across the chain. That's why a heavy Cuban doesn't feel like a weight around your neck — it drapes, it moves, it settles.</p>

      <h3>Miami in the '70s</h3>
      <p>By the mid-1970s, the Cuban link had become the chain of choice in Miami's growing hip-hop and Latin music scenes. It was big, it was gold, and it was unmistakable. Jewelers on NE 1st Avenue were making them by hand — each chain could take days to assemble, link by link.</p>

      <p>The chain crossed over into mainstream fashion in the 1980s and never left. Rappers wore them. Athletes wore them. Eventually everyone wore them — or wanted to. The Cuban link became shorthand for "real gold chain."</p>

      <h3>How It's Made Today</h3>
      <p>Modern Cuban links are still made using the same fundamental technique: wire is drawn, links are formed, they're assembled and soldered one by one. The best ones are hand-finished — machine-made versions exist, but they lack the weight distribution and the buttery drape of a handcrafted chain.</p>

      <p>At Styx, every Cuban link starts as raw gold wire and ends as a chain that's been inspected, weighed, and hallmarked. No shortcuts. No hollow links. Just solid gold, linked the way it's been done for fifty years.</p>
    `,
  },
  'history-of-the-figaro-chain': {
    title: 'On the Figaro — Vicenza, 1885',
    category: 'The Weaves',
    vol: 'I',
    readTime: '5 min',
    content: `
      <p>The Figaro chain takes its name from the character in Beaumarchais' play <em>The Barber of Seville</em> — a man of many talents, always adapting, never boring. The chain follows the same principle: it alternates between short and long links in a repeating pattern, usually three small round links followed by one elongated oval.</p>

      <h3>Italian Origins</h3>
      <p>The Figaro was born in the goldsmithing capital of Italy — Vicenza, in the Veneto region. Italian jewelers had been perfecting flat-link chains since the Renaissance, and by the late 19th century, the Figaro pattern had emerged as one of the most popular designs coming out of the region.</p>

      <p>Vicenza remains one of the world's great jewelry cities. The annual VicenzaOro fair draws goldsmiths from around the globe, and the Figaro is still one of the patterns most associated with Italian craftsmanship.</p>

      <h3>The Pattern</h3>
      <p>The classic Figaro pattern is 3:1 — three small links, one long link, repeat. But variations exist: 2:1, 4:1, even 5:1 patterns have been produced over the years. The ratio affects the visual rhythm of the chain and how it catches light.</p>

      <p>Because the links alternate in size, the Figaro has a distinctive visual texture that sets it apart from uniform chains like the curb or rope. It's structured but not symmetrical — orderly but interesting.</p>

      <h3>Wearing It</h3>
      <p>The Figaro is one of the most versatile chain styles. It works at every width, from delicate 2mm necklaces to bold 7mm+ bracelets. The alternating pattern means it lies flat against the skin and doesn't twist or tangle as easily as some other styles. It's a chain you can put on in the morning and forget about — it just works.</p>
    `,
  },
  'history-of-the-rope-chain': {
    title: 'On the Rope Chain — A Twist Through Time',
    category: 'The Weaves',
    vol: 'I',
    readTime: '4 min',
    content: `
      <p>The rope chain is exactly what it sounds like — gold links twisted together to resemble a length of rope. But what sounds simple is actually one of the more complex chain constructions. Each "strand" is made up of small links that are intertwined in a spiral pattern, creating a chain that captures and scatters light like no other.</p>

      <h3>The Engineering</h3>
      <p>A rope chain is essentially two or more strands of metal links twisted together and then soldered at regular intervals to hold the spiral shape. The tighter the twist, the more the chain sparkles — light bounces off each tiny facet created by the individual links.</p>

      <p>This construction also makes the rope chain one of the most durable styles. The interlocking spiral distributes stress across multiple points, so it's harder to break than chains that rely on single-point connections between links.</p>

      <h3>A Chain for All Occasions</h3>
      <p>The rope chain has been a staple in jewelry for centuries. It's been found in archaeological sites dating back to ancient Egypt and Mesopotamia, though those early versions were simpler than the precision-twisted chains we make today.</p>

      <p>What makes the rope endure is its versatility. Thin rope chains are elegant enough for formal wear. Thick rope chains make a statement. It works with pendants or on its own. There's a reason it's been in continuous production for thousands of years.</p>
    `,
  },
  'history-of-the-franco-chain': {
    title: 'On the Franco — Milan\'s Strongest Weave',
    category: 'The Weaves',
    vol: 'I',
    readTime: '4 min',
    content: `
      <p>The Franco chain is the workhorse of Italian chain design. Four rows of V-shaped links interlock at angles, creating a square cross-section that's remarkably strong for its weight. It's the chain you choose when you want something that can take a beating and still look sharp.</p>

      <h3>Construction</h3>
      <p>Unlike flat chains like the curb or herringbone, the Franco has depth. Its links connect in a three-dimensional weave that creates a slightly squared profile. This gives it a distinct feel on the skin — substantial but not heavy, textured but smooth.</p>

      <p>The V-shaped links are arranged so that each one cups into the next, creating a continuous surface with no gaps or weak points. This interlocking structure is what gives the Franco its legendary strength — it flexes in all directions without stressing any single link.</p>

      <h3>The Modern Franco</h3>
      <p>Today the Franco is particularly popular in the hip-hop and streetwear communities, where its clean lines and strength make it ideal for heavy pendant wear. A solid Franco can support a substantial pendant without stretching or deforming over time.</p>

      <p>It's also one of the few chain styles that looks as good at 2mm as it does at 5mm+. The geometric precision of the weave scales beautifully — it just gets more impressive as it gets thicker.</p>
    `,
  },
  'history-of-the-byzantine-chain': {
    title: 'On the Byzantine — Constantinople, 500 AD',
    category: 'The Weaves',
    vol: 'I',
    readTime: '5 min',
    content: `
      <p>The Byzantine chain is one of the oldest continuously produced chain patterns in the world. Its interlocking, woven appearance dates back to the Eastern Roman Empire — Byzantium — where goldsmiths developed it as both jewelry and currency.</p>

      <h3>Ancient Engineering</h3>
      <p>The Byzantine weave uses a series of connected oval links that fold back on themselves, creating a dense, textured surface. When you look at a Byzantine chain, it appears almost organic — like vines wrapping around each other. The pattern is complex enough that it took skilled artisans to produce, which made it a status symbol in the ancient world.</p>

      <p>In Constantinople, gold chains served a dual purpose. They were worn as adornment, but they were also a portable form of wealth. A gold chain could be cut and traded by weight — the links themselves were the currency.</p>

      <h3>Timeless Appeal</h3>
      <p>What's remarkable about the Byzantine is how modern it looks. Despite being over 1,500 years old as a design, it doesn't feel dated. The interlocking pattern creates a visual rhythm that catches light beautifully, and the overall form is clean and contemporary.</p>

      <p>It's surprisingly light for how substantial it looks. The woven structure creates visual density without excess weight, making it comfortable for all-day wear even in thicker widths.</p>
    `,
  },
  'history-of-the-herringbone-chain': {
    title: 'On the Herringbone — Flat Luxury',
    category: 'The Weaves',
    vol: 'II',
    readTime: '4 min',
    content: `
      <p>The herringbone chain is named for its resemblance to the skeleton of a herring fish — rows of flat, slanted links that lie in opposing directions, creating a V-shaped pattern that looks almost like liquid gold when it catches the light.</p>

      <h3>How It's Built</h3>
      <p>Unlike most chains, which have visible gaps between links, the herringbone is constructed so that each link lies flush against its neighbor. The result is a flat, smooth surface that bends and flexes like a ribbon. It's one of the few chains that can genuinely be described as silky.</p>

      <p>This construction is also what makes the herringbone delicate. Because the links lie flat and parallel, the chain can kink if it's bent sharply or twisted. A kinked herringbone is very difficult to repair — the flat structure doesn't forgive abuse the way a curb or rope chain might.</p>

      <h3>Wearing It Right</h3>
      <p>The herringbone is a chain that rewards careful wear. It should lie flat against the skin, untwisted. It's not a chain for pendants — the flat surface doesn't accommodate hanging weight well. But worn on its own, a herringbone is one of the most striking chains you can put on. The way it catches and reflects light is unlike anything else in the chain world.</p>

      <p>Wider herringbones (5mm+) create a bold, almost architectural look. Narrower ones are subtle and elegant. Either way, it's a chain that gets noticed.</p>
    `,
  },
  'history-of-the-mariner-chain': {
    title: 'On the Mariner — Anchored in History',
    category: 'The Weaves',
    vol: 'II',
    readTime: '4 min',
    content: `
      <p>The Mariner chain — also called the anchor chain — gets its name from the chains used to anchor ships. Each oval link has a bar running through its center, mimicking the design of nautical chains that needed to be strong enough to hold vessels in place.</p>

      <h3>Nautical Roots</h3>
      <p>Sailors and maritime communities were among the first to wear chains as jewelry. A gold chain was portable wealth that could survive a shipwreck, and the mariner pattern was a natural choice for men who spent their lives at sea. The bar through each link wasn't just decorative — in actual ship chains, it prevented the links from collapsing under pressure.</p>

      <h3>The Design</h3>
      <p>The center bar gives the Mariner a distinctive look that's immediately recognizable. It also adds structural integrity — the bar acts as a brace, making each link stronger than a simple oval. This means Mariner chains can be made with thinner wire while still maintaining strength.</p>

      <p>The flat, oval links lie nicely against the skin, and the bar detail adds visual interest without making the chain look busy. It's one of those designs that's both simple and sophisticated — easy to understand at a glance but refined enough for any occasion.</p>
    `,
  },
  'history-of-gold-chains': {
    title: 'A Brief History of Gold Chains',
    category: 'The Almanac',
    vol: 'IV',
    readTime: '8 min',
    content: `
      <p>Humans have been wearing gold chains for at least 5,000 years. The earliest known examples come from ancient Mesopotamia — modern-day Iraq — where gold was hammered into thin sheets, cut into strips, and twisted into simple link chains around 2500 BCE.</p>

      <h3>Ancient Civilizations</h3>
      <p>The Egyptians elevated chain-making to an art form. Pharaohs were buried with elaborate gold chains, and the collar-style necklaces depicted in tomb paintings show sophisticated link patterns that wouldn't look out of place in a modern jewelry store.</p>

      <p>The Greeks and Romans continued the tradition, developing new weave patterns and techniques. The Byzantine weave — still popular today — dates from this period. Roman soldiers sometimes received gold chains as military decorations, establishing an early connection between gold chains and status.</p>

      <h3>The Italian Renaissance</h3>
      <p>Italy became the center of gold chain production during the Renaissance, a position it still holds today. Cities like Florence, Vicenza, and Arezzo developed specialized guilds of goldsmiths who perfected techniques for drawing wire, forming links, and soldering them into chains.</p>

      <p>Many of the chain patterns we know today — the Figaro, the herringbone, the San Marco — were developed by Italian craftsmen during this period and the centuries that followed.</p>

      <h3>Modern Chains</h3>
      <p>The 20th century brought machine-made chains, which dramatically reduced costs and made gold chains accessible to everyone. But the best chains are still finished by hand — machines can form links, but human hands give a chain its final polish, its perfect drape, its weight distribution.</p>

      <p>Today, gold chains are worn everywhere in the world, in every culture, by every kind of person. The Cuban link dominates street style. The herringbone whispers quiet luxury. The rope chain catches light in a boardroom. Five thousand years in, and we're still finding new reasons to put gold around our necks.</p>
    `,
  },
};

export async function loader({request, params, context}: LoaderFunctionArgs) {
  const {language, country} = context.storefront.i18n;

  invariant(params.journalHandle, 'Missing journal handle');

  // Try to fetch from Shopify first
  const {blog} = await context.storefront.query(ARTICLE_QUERY, {
    variables: {
      blogHandle: BLOG_HANDLE,
      articleHandle: params.journalHandle,
      language,
    },
  });

  if (blog?.articleByHandle) {
    const article = blog.articleByHandle;
    const formattedDate = new Intl.DateTimeFormat(`${language}-${country}`, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(article?.publishedAt!));

    const seo = seoPayload.article({article, url: request.url});

    return json({article, formattedDate, seo, isPlaceholder: false});
  }

  // Fall back to placeholder content
  const placeholder = PLACEHOLDER_ARTICLES[params.journalHandle];
  if (!placeholder) {
    throw new Response(null, {status: 404});
  }

  return json({
    article: {
      title: placeholder.title,
      contentHtml: placeholder.content,
      image: null,
      author: {name: 'Styx'},
    },
    formattedDate: placeholder.readTime,
    seo: {
      title: placeholder.title,
      description: placeholder.content.substring(0, 160).replace(/<[^>]*>/g, ''),
    },
    isPlaceholder: true,
    category: placeholder.category,
    vol: placeholder.vol,
  });
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Article() {
  const data = useLoaderData<typeof loader>();
  const {article, formattedDate, isPlaceholder} = data;
  const category = (data as any).category;
  const vol = (data as any).vol;

  const {title, image, contentHtml, author} = article as any;

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      {/* Article Header */}
      <div
        style={{
          borderBottom: `1px solid ${STYX.line}`,
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            padding: '80px 56px 48px',
          }}
        >
          {/* Breadcrumb */}
          <nav
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: STYX.silt,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 32,
            }}
          >
            <Link to="/" style={{color: STYX.silt, textDecoration: 'none'}}>
              Home
            </Link>
            <span style={{opacity: 0.4}}>/</span>
            <Link to="/journal" style={{color: STYX.silt, textDecoration: 'none'}}>
              Journal
            </Link>
            {isPlaceholder && (category as any) && (
              <>
                <span style={{opacity: 0.4}}>/</span>
                <span style={{color: STYX.gold}}>{category as string} &middot; {vol as string}</span>
              </>
            )}
          </nav>

          <h1
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 44,
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              lineHeight: 1.1,
              color: STYX.ink,
              margin: 0,
            }}
          >
            {title}
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 20,
              fontFamily: FONT.cormorant,
              fontSize: 16,
              fontStyle: 'italic',
              color: STYX.silt,
            }}
          >
            {author?.name && <span>By {author.name}</span>}
            {author?.name && formattedDate && <span style={{opacity: 0.4}}>&middot;</span>}
            {formattedDate && <span>{formattedDate}</span>}
          </div>
        </div>
      </div>

      {/* Hero Image */}
      {image && (
        <div style={{maxWidth: 1000, margin: '0 auto', padding: '40px 56px 0'}}>
          <Image
            data={image}
            sizes="90vw"
            loading="eager"
            style={{width: '100%', height: 'auto', display: 'block'}}
          />
        </div>
      )}

      {/* Article Body */}
      <div
        style={{
          maxWidth: 700,
          margin: '0 auto',
          padding: '56px 56px 120px',
        }}
      >
        <div
          dangerouslySetInnerHTML={{__html: contentHtml}}
          style={{
            fontFamily: FONT.cormorant,
            fontSize: 20,
            lineHeight: 1.8,
            color: STYX.graphite,
          }}
          className="journal-article"
        />

        {/* Back to Journal */}
        <div
          style={{
            marginTop: 64,
            paddingTop: 32,
            borderTop: `1px solid ${STYX.line}`,
          }}
        >
          <Link
            to="/journal"
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: STYX.gold,
              textDecoration: 'none',
            }}
          >
            ← Back to the Journal
          </Link>
        </div>
      </div>

      {/* Inline styles for article HTML */}
      <style dangerouslySetInnerHTML={{__html: `
        .journal-article h3 {
          font-family: ${FONT.cinzel};
          font-size: 18px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${STYX.ink};
          margin: 48px 0 16px;
        }
        .journal-article p {
          margin: 0 0 24px;
        }
        .journal-article em {
          font-style: italic;
        }
      `}} />

      <StyxFooter />
    </div>
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
