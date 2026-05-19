import {useState} from 'react';
import {data, type LoaderFunctionArgs} from 'react-router';
import {data, useLoaderData} from 'react-router';
import {getSeoMeta} from '@shopify/hydrogen';

import {Link} from '~/components/Link';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel, Obol} from '~/components/styx';
import {routeHeaders} from '~/data/cache';

export const headers = routeHeaders;

/* ─── Hero image lookup: handle → hero image path ─── */
const HERO_IMAGES: Record<string, string> = {
  'history-of-gold-chains': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-gold-chains-history-hero.jpg?v=1779151607',
  'history-of-the-cuban-link': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-cuban-link-hero.png?v=1779151550',
  'history-of-the-franco-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-franco-chain-hero.png?v=1779151600',
  'history-of-the-curb-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-curb-chain-hero.png?v=1779151561',
  'history-of-the-figaro-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-figaro-chain-hero.png?v=1779151576',
  'history-of-the-mariner-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-mariner-chain-hero.jpg?v=1779151650',
  'history-of-the-rope-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-rope-chain-hero.png?v=1779151692',
  'history-of-the-wheat-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-wheat-chain-hero.png?v=1779151794',
  'history-of-the-criss-cross-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-criss-cross-chain-hero.jpg?v=1779151534',
  'history-of-the-forsantina-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-forsantina-chain-hero.jpg?v=1779151586',
  'history-of-the-tinsel-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-tinsel-chain-hero.jpg?v=1779151756',
  'history-of-the-cable-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-cable-chain-hero.jpg?v=1779151524',
  'history-of-the-rolo-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-rolo-chain-hero.jpg?v=1779151682',
  'history-of-the-ball-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-ball-chain-hero.png?v=1779151495',
  'history-of-the-singapore-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-singapore-chain-hero.jpg?v=1779151724',
  'history-of-the-byzantine-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-byzantine-chain-hero.jpg?v=1779151514',
  'history-of-the-herringbone-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-herringbone-chain-hero.png?v=1779151622',
  'history-of-the-snake-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-snake-chain-hero.png?v=1779151735',
  'history-of-the-box-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-box-chain-hero.jpg?v=1779151502',
  'history-of-the-paperclip-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-paperclip-chain-hero.png?v=1779151660',
  'history-of-the-s-link-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-s-link-chain-hero.jpg?v=1779151703',
  'history-of-the-tennis-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-tennis-chain-hero.jpg?v=1779151745',
  'history-of-the-valentino-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-valentino-chain-hero.jpg?v=1779151780',
  'history-of-the-tulip-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-tulip-chain-hero.jpg?v=1779151769',
  'history-of-the-heart-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-heart-chain-hero.jpg?v=1779151611',
  'history-of-the-peanut-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-peanut-chain-hero.jpg?v=1779151671',
  'history-of-the-scroll-chain': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-journal-scroll-chain-hero.png?v=1779151714',
  'sizing-guide': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-size-guide.jpg?v=1779151801',
};

/* ─── Volume data ─── */
const JOURNAL_VOLUMES = [
  {
    id: 'vol-0',
    volLabel: 'The Almanac',
    title: 'The Almanac',
    description: 'Foundational knowledge on the world of precious metals.',
    cat: 'The Almanac',
    articles: [
      {handle: 'history-of-gold-chains', title: 'A Brief History of Gold Chains', subtitle: 'From Mesopotamia to Miami', preview: 'How a 4,500-year-old technology became the world\'s most enduring symbol of wealth.', readTime: '10 min', image: HERO_IMAGES['history-of-gold-chains']},
      {handle: 'understanding-gold-karats', title: 'Understanding Gold Karats', subtitle: '10K, 14K, 18K, 22K & 24K', preview: 'Most jewelers want you confused about karats. The truth is simple math — here\'s what it means for the chain around your neck.', readTime: '8 min', image: HERO_IMAGES['understanding-gold-karats']},
    ],
  },
  {
    id: 'vol-1',
    volLabel: 'Vol I',
    title: 'Vol I: The Powerhouses',
    description: 'The heavy hitters. Bold, interlocking links built for dominance.',
    cat: 'The Catalog',
    articles: [
      {handle: 'history-of-the-cuban-link', title: 'The Cuban Link', subtitle: 'Miami, 1974', preview: 'The chain that defined hip-hop, born from a Cuban jeweler\'s hands on a Calle Ocho workbench.', readTime: '6 min', image: HERO_IMAGES['history-of-the-cuban-link']},
      {handle: 'history-of-the-franco-chain', title: 'The Franco', subtitle: "Milan's Strongest Weave", preview: 'An Italian engineering marvel — interlocking V-shaped links that flex without ever kinking.', readTime: '4 min', image: HERO_IMAGES['history-of-the-franco-chain']},
      {handle: 'history-of-the-curb-chain', title: 'The Curb Link', subtitle: 'Ancient Sumer, 2600 BC', preview: 'The oldest link geometry in existence, unchanged for 4,600 years because nothing improves it.', readTime: '5 min', image: HERO_IMAGES['history-of-the-curb-chain']},
      {handle: 'history-of-the-figaro-chain', title: 'The Figaro', subtitle: 'Vicenza, 1885', preview: 'Three short links, one long — the rhythmic Italian pattern that broke every design rule.', readTime: '5 min', image: HERO_IMAGES['history-of-the-figaro-chain']},
      {handle: 'history-of-the-mariner-chain', title: 'The Mariner', subtitle: 'Anchored in History', preview: 'Oval links with a center bar, modeled after the anchor chains that held ships in port.', readTime: '4 min', image: HERO_IMAGES['history-of-the-mariner-chain']},
    ],
  },
  {
    id: 'vol-2',
    volLabel: 'Vol II',
    title: 'Vol II: The Artisans',
    description: 'Technical masterpieces. Helical spirals and nature-inspired weaves.',
    cat: 'The Catalog',
    articles: [
      {handle: 'history-of-the-rope-chain', title: 'The Rope Chain', subtitle: 'A Twist Through Time', preview: 'Two helical strands wound tight — the chain that catches light from every angle.', readTime: '4 min', image: HERO_IMAGES['history-of-the-rope-chain']},
      {handle: 'history-of-the-wheat-chain', title: 'The Wheat (Spiga)', subtitle: 'Vicenza, The Renaissance', preview: 'Interlocking teardrop links woven into a pattern that mirrors the wheat sheaf it\'s named for.', readTime: '5 min', image: HERO_IMAGES['history-of-the-wheat-chain']},
      {handle: 'history-of-the-criss-cross-chain', title: 'The Criss-Cross', subtitle: 'Milan, The Modern Era', preview: 'Twisted links that cross at alternating angles, creating a textured spiral with serious visual weight.', readTime: '4 min', image: HERO_IMAGES['history-of-the-criss-cross-chain']},
      {handle: 'history-of-the-forsantina-chain', title: 'The Forsantina', subtitle: 'Venice, Mid-20th Century', preview: 'A Venetian specialty — elongated links with figure-eight connectors that drape like liquid.', readTime: '3 min', image: HERO_IMAGES['history-of-the-forsantina-chain']},
    ],
  },
  {
    id: 'vol-3',
    volLabel: 'Vol III',
    title: 'Vol III: The Foundations',
    description: 'The DNA of the jewelry world. Essential links that never go out of style.',
    cat: 'The Catalog',
    articles: [
      {handle: 'history-of-the-cable-chain', title: 'The Cable Chain', subtitle: 'Sumer, c. 2600 BC', preview: 'The simplest geometry in jewelry — uniform oval links, alternating orientation, infinite elegance.', readTime: '4 min', image: HERO_IMAGES['history-of-the-cable-chain']},
      {handle: 'history-of-the-rolo-chain', title: 'The Rolo Chain', subtitle: 'Victorian London, c. 1850', preview: 'Symmetrical round links with a flat interior face, built for weight you can feel.', readTime: '4 min', image: HERO_IMAGES['history-of-the-rolo-chain']},
      {handle: 'history-of-the-ball-chain', title: 'The Ball Chain', subtitle: 'United States, c. 1940', preview: 'Uniform spheres connected by short bars — military dog tags made it iconic.', readTime: '3 min', image: HERO_IMAGES['history-of-the-ball-chain']},
      {handle: 'history-of-the-singapore-chain', title: 'The Singapore', subtitle: 'Italy, c. 1975', preview: 'Braided curb links twisted into a diamond-cut helix that sparkles with every movement.', readTime: '4 min', image: HERO_IMAGES['history-of-the-singapore-chain']},
      {handle: 'history-of-the-byzantine-chain', title: 'The Byzantine', subtitle: 'Constantinople, 500 AD', preview: 'An intricate weave of interlocking rings from the Eastern Roman Empire — chainmail elevated to jewelry.', readTime: '5 min', image: HERO_IMAGES['history-of-the-byzantine-chain']},
    ],
  },
  {
    id: 'vol-4',
    volLabel: 'Vol IV',
    title: 'Vol IV: The Architects',
    description: 'Liquid gold. Flat, architectural profiles that catch the light like a mirror.',
    cat: 'The Catalog',
    articles: [
      {handle: 'history-of-the-herringbone-chain', title: 'The Herringbone', subtitle: 'Flat Luxury', preview: 'Slanted flat links pressed together into a fluid, mirror-finish ribbon of gold.', readTime: '4 min', image: HERO_IMAGES['history-of-the-herringbone-chain']},
      {handle: 'history-of-the-snake-chain', title: 'The Snake Chain', subtitle: 'Victorian Era', preview: 'Interlocking wavy plates forming a smooth, round tube — sleek as the creature it\'s named for.', readTime: '4 min', image: HERO_IMAGES['history-of-the-snake-chain']},
      {handle: 'history-of-the-box-chain', title: 'The Box Chain', subtitle: 'Venice, 6th Century', preview: 'Square links connected at right angles — the most structurally rigid chain ever designed.', readTime: '4 min', image: HERO_IMAGES['history-of-the-box-chain']},
      {handle: 'history-of-the-paperclip-chain', title: 'The Paperclip', subtitle: 'Oslo, 1940', preview: 'Elongated oval links inspired by a wartime symbol of resistance turned modern minimalism.', readTime: '4 min', image: HERO_IMAGES['history-of-the-paperclip-chain']},
      {handle: 'history-of-the-s-link-chain', title: 'The S-Link', subtitle: 'Mesopotamia, c. 2000 BC', preview: 'Alternating S-shaped curves that create a flowing, organic rhythm unlike any other chain.', readTime: '4 min', image: HERO_IMAGES['history-of-the-s-link-chain']},
    ],
  },
  {
    id: 'vol-5',
    volLabel: 'Vol V',
    title: 'Vol V: The Ornamentals',
    description: 'Artistic expression. Specialized links and decorative masterpieces.',
    cat: 'The Catalog',
    articles: [
      {handle: 'history-of-the-tennis-chain', title: 'The Tennis Chain', subtitle: 'Forest Hills, 1978', preview: 'A single row of individually set stones — named after the bracelet Chris Evert lost mid-match.', readTime: '5 min', image: HERO_IMAGES['history-of-the-tennis-chain']},
      {handle: 'history-of-the-valentino-chain', title: 'The Valentino', subtitle: 'Vicenza, High Fashion', preview: 'Flat, polished links with geometric precision — Italian high fashion distilled into a chain.', readTime: '4 min', image: HERO_IMAGES['history-of-the-valentino-chain']},
      {handle: 'history-of-the-tulip-chain', title: 'The Tulip Chain', subtitle: 'Ottoman Empire', preview: 'Petal-shaped links nested together, born from the Ottoman obsession with the flower.', readTime: '4 min', image: HERO_IMAGES['history-of-the-tulip-chain']},
      {handle: 'history-of-the-heart-chain', title: 'The Heart Chain', subtitle: 'France, 13th Century', preview: 'Interlocking heart-shaped links from medieval France — sentiment forged into solid gold.', readTime: '4 min', image: HERO_IMAGES['history-of-the-heart-chain']},
      {handle: 'history-of-the-peanut-chain', title: 'The Peanut Chain', subtitle: 'East Asia, Prosperity Symbol', preview: 'Textured oval capsules linked end to end — an East Asian symbol of prosperity and abundance.', readTime: '4 min', image: HERO_IMAGES['history-of-the-peanut-chain']},
      {handle: 'history-of-the-scroll-chain', title: 'The Scroll Chain', subtitle: 'Classical Greece', preview: 'Spiraling wire forms that echo ancient Greek scroll motifs — decorative metalwork at its finest.', readTime: '4 min', image: HERO_IMAGES['history-of-the-scroll-chain']},
    ],
  },
];

/* ─── Flatten into a single feed for filtering ─── */
type JournalEntry = {
  handle: string;
  title: string;
  subtitle: string;
  preview?: string;
  readTime: string;
  image?: string;
  vol: string;
  cat: string;
  volDescription: string;
};

function buildFlatIndex(): JournalEntry[] {
  const entries: JournalEntry[] = [];
  for (const vol of JOURNAL_VOLUMES) {
    for (const article of vol.articles) {
      entries.push({
        ...article,
        vol: vol.volLabel,
        cat: vol.cat,
        volDescription: vol.description,
      });
    }
  }
  return entries;
}

const ALL_ENTRIES = buildFlatIndex();
const CATEGORIES = ['All', ...Array.from(new Set(JOURNAL_VOLUMES.map((v) => v.cat)))];
const TOTAL_COUNT = ALL_ENTRIES.length;

export async function loader({context}: LoaderFunctionArgs) {
  return data({
    seo: {
      title: 'The Journal | Styx',
      description:
        "Explore the history, engineering, and cultural significance of the world's most iconic gold chains.",
    },
  });
}

export const meta = ({data}: {data: any}) => {
  return getSeoMeta(data.seo);
};

export default function JournalIndex() {
  const [filter, setFilter] = useState('All');
  const visible =
    filter === 'All'
      ? ALL_ENTRIES
      : ALL_ENTRIES.filter((e) => e.cat === filter);
  const [featured, ...rest] = visible;

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}} className="styx-journal-archive">
      <GoldTicker />
      <StyxNav />

      {/* ─── Masthead ─────────────────────────────────────── */}
      <section
        style={{
          background: STYX.bone,
          padding: '80px 56px 56px',
          borderBottom: `1px solid ${STYX.line}`,
          position: 'relative',
        }}
        className="styx-ja-masthead"
      >
        <div style={{maxWidth: 1280, margin: '0 auto'}}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 56,
            }}
            className="styx-ja-topbar"
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <Link
                to="/"
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 11,
                  letterSpacing: '0.3em',
                  color: STYX.graphite,
                  textTransform: 'uppercase' as const,
                  textDecoration: 'none',
                }}
              >
                &larr; Home
              </Link>
              <div style={{width: 1, height: 12, background: STYX.line}} />
              <StyxLabel>Volume MMXXVI</StyxLabel>
              <div style={{width: 1, height: 12, background: STYX.line}} />
              <StyxLabel>{TOTAL_COUNT} entries</StyxLabel>
            </div>
            <Obol size={36} color={STYX.gold} speed={14} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: 80,
              alignItems: 'end',
            }}
            className="styx-ja-title-grid"
          >
            <div>
              <StyxLabel>The Styx Journal &middot; Archive</StyxLabel>
              <h1
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 'clamp(48px, 6vw, 92px)',
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                  lineHeight: 0.92,
                  margin: '20px 0 0',
                  color: STYX.ink,
                  textTransform: 'uppercase',
                }}
              >
                Read the
                <br />
                <span
                  style={{
                    fontFamily: FONT.cormorant,
                    fontStyle: 'italic',
                    fontWeight: 400,
                    textTransform: 'none' as const,
                    letterSpacing: 0,
                  }}
                >
                  record.
                </span>
              </h1>
            </div>
            <div
              style={{
                fontFamily: FONT.cormorant,
                fontSize: 20,
                fontStyle: 'italic',
                color: STYX.graphite,
                lineHeight: 1.55,
                paddingBottom: 6,
              }}
            >
              A running index of the chapters, essays, and dispatches behind
              every Styx piece — on craft, on transparency, on why the weight
              in your hand is worth what we say it is.
            </div>
          </div>
        </div>
      </section>

      {/* ─── Filter pills ─────────────────────────────────── */}
      <section
        style={{
          padding: '32px 56px',
          borderBottom: `1px solid ${STYX.line}`,
          position: 'sticky',
          top: 0,
          background: STYX.bone,
          zIndex: 3,
        }}
        className="styx-ja-filters"
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          className="styx-ja-filters-inner"
        >
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            {CATEGORIES.map((c) => {
              const active = c === filter;
              return (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 11,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    padding: '10px 18px',
                    background: active ? STYX.ink : 'transparent',
                    color: active ? STYX.bone : STYX.graphite,
                    border: `1px solid ${active ? STYX.ink : STYX.line}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              color: STYX.silt,
              letterSpacing: '0.08em',
            }}
            className="styx-ja-counter"
          >
            SHOWING &middot;{' '}
            {String(visible.length).padStart(2, '0')} /{' '}
            {String(TOTAL_COUNT).padStart(2, '0')}
          </div>
        </div>
      </section>

      {/* ─── Featured entry ───────────────────────────────── */}
      {featured && (
        <section style={{padding: '80px 56px 64px'}} className="styx-ja-featured">
          <div style={{maxWidth: 1280, margin: '0 auto'}}>
            <Link
              to={`/journal/${featured.handle}`}
              style={{textDecoration: 'none', color: 'inherit'}}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 1fr',
                  gap: 64,
                  alignItems: 'center',
                }}
                className="styx-ja-featured-grid"
              >
                {/* Image slot */}
                <div style={{position: 'relative', aspectRatio: '4/3'}}>
                  {featured.image ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        background: STYX.parchment,
                      }}
                    >
                      <img
                        src={featured.image}
                        alt={featured.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: STYX.parchment,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Obol size={56} color={STYX.gold} speed={8} />
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      top: 20,
                      left: 20,
                      padding: '8px 14px',
                      background: STYX.ink,
                      color: STYX.gold,
                      fontFamily: FONT.cinzel,
                      fontSize: 10,
                      letterSpacing: '0.25em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Featured
                  </div>
                </div>

                {/* Text slot */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 14,
                      alignItems: 'center',
                      marginBottom: 20,
                    }}
                  >
                    <StyxLabel>{featured.cat}</StyxLabel>
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        background: STYX.silt,
                        borderRadius: '50%',
                      }}
                    />
                    <StyxLabel>{featured.vol}</StyxLabel>
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        background: STYX.silt,
                        borderRadius: '50%',
                      }}
                    />
                    <StyxLabel>{featured.readTime}</StyxLabel>
                  </div>
                  <h2
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 44,
                      fontWeight: 400,
                      letterSpacing: '0.01em',
                      lineHeight: 1.05,
                      margin: '0 0 20px',
                      color: STYX.ink,
                      textTransform: 'uppercase',
                    }}
                  >
                    {featured.title}
                  </h2>
                  <div
                    style={{
                      fontFamily: FONT.cormorant,
                      fontSize: 20,
                      fontStyle: 'italic',
                      color: STYX.graphite,
                      lineHeight: 1.55,
                      marginBottom: 28,
                      maxWidth: 560,
                    }}
                  >
                    {featured.preview || featured.subtitle}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 11,
                      letterSpacing: '0.25em',
                      color: STYX.gold,
                      textTransform: 'uppercase',
                    }}
                  >
                    Read the chapter &rarr;
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ─── Grid — remaining entries ─────────────────────── */}
      <section style={{padding: '32px 56px 96px'}} className="styx-ja-grid-section">
        <div style={{maxWidth: 1280, margin: '0 auto'}}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 56,
            }}
            className="styx-ja-grid"
          >
            {rest.map((entry, i) => (
              <JournalCard key={entry.handle} entry={entry} n={i + 2} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Editor's letter ──────────────────────────────── */}
      <section
        style={{
          padding: '96px 56px 120px',
          borderTop: `1px solid ${STYX.line}`,
        }}
      >
        <div
          style={{maxWidth: 960, margin: '0 auto', textAlign: 'center'}}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 32,
            }}
          >
            <Obol size={56} color={STYX.gold} speed={18} />
          </div>
          <StyxLabel>Letter from the Editor</StyxLabel>
          <div
            style={{
              fontFamily: FONT.cormorant,
              fontSize: 26,
              fontStyle: 'italic',
              fontWeight: 400,
              lineHeight: 1.45,
              color: STYX.ink,
              marginTop: 20,
              marginBottom: 36,
            }}
          >
            We keep this journal the way we keep the ledger: plainly, in
            daylight, and with every number you&rsquo;d want to see. If you
            ever wonder why a chain costs what it costs, or where a weave
            came from, the answer is probably somewhere on this page.
          </div>
          <StyxLabel>&mdash; A. Demetrios, Founder</StyxLabel>
        </div>
      </section>

      {/* ─── Responsive styles ────────────────────────────── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 48em) {
          .styx-ja-masthead { padding: 48px 20px 40px !important; }
          .styx-ja-topbar { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; margin-bottom: 32px !important; }
          .styx-ja-title-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .styx-ja-filters { padding: 20px !important; }
          .styx-ja-filters-inner { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
          .styx-ja-counter { display: none !important; }
          .styx-ja-featured { padding: 48px 20px !important; }
          .styx-ja-featured-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .styx-ja-grid-section { padding: 32px 20px 60px !important; }
          .styx-ja-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 32em) {
          .styx-ja-grid { grid-template-columns: 1fr !important; }
        }
        .styx-ja-card { transition: transform 0.3s cubic-bezier(.2,.8,.2,1); }
        .styx-ja-card:hover { transform: translateY(-4px); }
      `,
        }}
      />

      <StyxFooter />
    </div>
  );
}

/* ─── Single card in the archive grid ─── */
function JournalCard({entry, n}: {entry: JournalEntry; n: number}) {
  return (
    <Link
      to={`/journal/${entry.handle}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
      className="styx-ja-card"
    >
      {/* Image / placeholder */}
      <div style={{position: 'relative', aspectRatio: '4/3'}}>
        {entry.image ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              background: STYX.parchment,
            }}
          >
            <img
              src={entry.image}
              alt={entry.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: STYX.parchment,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Obol size={40} color={STYX.gold} speed={10} />
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.15em',
            color: STYX.silt,
            padding: '4px 8px',
            background: 'rgba(239,234,224,0.85)',
          }}
        >
          &#8470; {String(n).padStart(2, '0')}
        </div>
      </div>

      {/* Text */}
      <div>
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <StyxLabel>{entry.cat}</StyxLabel>
          <div
            style={{
              width: 3,
              height: 3,
              background: STYX.silt,
              borderRadius: '50%',
            }}
          />
          <StyxLabel>{entry.vol}</StyxLabel>
        </div>
        <h3
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: '0.02em',
            lineHeight: 1.2,
            margin: '0 0 12px',
            color: STYX.ink,
            textTransform: 'uppercase',
          }}
        >
          {entry.title}
        </h3>
        <div
          style={{
            fontFamily: FONT.cormorant,
            fontSize: 16,
            fontStyle: 'italic',
            color: STYX.graphite,
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          {entry.preview || entry.subtitle}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 14,
            borderTop: `1px solid ${STYX.line}`,
          }}
        >
          <div
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 11,
              letterSpacing: '0.25em',
              color: STYX.gold,
              textTransform: 'uppercase',
            }}
          >
            Read &rarr;
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              color: STYX.silt,
              letterSpacing: '0.08em',
            }}
          >
            {entry.readTime}
          </div>
        </div>
      </div>
    </Link>
  );
}
