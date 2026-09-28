import {Link} from 'react-router';
import {STYX, FONT} from './constants';
import {PlaceholderImage} from './PlaceholderImage';
import {HomeHead, resizedCdnUrl} from './HomePrimitives';

/** One category tile, prepared server-side in the homepage loader. */
export type ChainTile = {
  handle: string;
  title: string;
  /** Collection lifestyle image, if set in Shopify. */
  image?: {url: string; altText?: string | null} | null;
  /** custom.cutout_image transparent PNG, used when there is no lifestyle image. */
  cutoutUrl?: string | null;
  /** Lowest positive, in-stock variant price in the collection. */
  fromPrice?: number | null;
  currencyCode?: string | null;
};

function formatFrom(n: number, currency = 'USD') {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
}

/** "The chains": category tiles driven by the live collections list. */
export function HomeChains({tiles}: {tiles: ChainTile[]}) {
  if (!tiles.length) return null;

  return (
    <section
      className="styx-home-chains"
      style={{background: STYX.parchment, padding: '110px 56px'}}
    >
      <div style={{maxWidth: 1440, margin: '0 auto'}}>
        <HomeHead
          label="The chains"
          greek="ΑΛΥΣΙΣ"
          title={<>Choose your link.</>}
          link={{to: '/collections/chains', label: 'All chains'}}
        />

        <div
          className="styx-home-chains-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: STYX.line,
            border: `1px solid ${STYX.line}`,
          }}
        >
          {tiles.map((t) => (
            <Link
              key={t.handle}
              to={`/collections/${t.handle}`}
              prefetch="intent"
              data-reveal=""
              className="styx-home-chain-tile"
              style={{
                display: 'block',
                background: STYX.parchment,
                padding: 24,
                textDecoration: 'none',
                transition: 'background 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = STYX.bone;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = STYX.parchment;
              }}
            >
              <div
                style={{
                  aspectRatio: '3/2',
                  overflow: 'hidden',
                  marginBottom: 18,
                  background: STYX.paper,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {t.image?.url ? (
                  <img
                    src={resizedCdnUrl(t.image.url, 800)}
                    alt={t.image.altText ?? t.title}
                    loading="lazy"
                    decoding="async"
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                ) : t.cutoutUrl ? (
                  <img
                    src={t.cutoutUrl}
                    alt={t.title}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '70%',
                      height: '70%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <PlaceholderImage
                    aspect="3/2"
                    tone="warm"
                    label={`${t.title} flat lay`}
                  />
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 12,
                }}
              >
                <h3
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 18,
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: STYX.ink,
                    margin: 0,
                  }}
                >
                  {t.title}
                </h3>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 12,
                    letterSpacing: '0.04em',
                    color: STYX.silt,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.fromPrice
                    ? `from ${formatFrom(t.fromPrice, t.currencyCode ?? 'USD')}`
                    : 'Shop'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
