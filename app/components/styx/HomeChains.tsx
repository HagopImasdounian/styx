import {Link} from 'react-router';
import {PlaceholderImage} from './PlaceholderImage';
import {resizedCdnUrl} from './HomePrimitives';

/** Collection data and prices come from the live storefront. */
export type ChainTile = {
  handle: string;
  title: string;
  image?: {url: string; altText?: string | null} | null;
  cutoutUrl?: string | null;
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

export function HomeChains({tiles}: {tiles: ChainTile[]}) {
  if (!tiles.length) return null;
  return (
    <section
      className="styx-collection-edit"
      id="the-chains"
      aria-labelledby="chains-title"
    >
      <div className="styx-section-heading">
        <div>
          <p className="styx-eyebrow">Solid 10K gold &middot; weighed to 0.01 g</p>
          <h2 id="chains-title">
            Find your <em>signature.</em>
          </h2>
        </div>
        <Link
          to="/collections/chains"
          prefetch="intent"
          className="styx-text-link"
        >
          Explore all chains <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className="styx-collection-edit-grid">
        {tiles.map((tile, index) => (
          <Link
            key={tile.handle}
            to={`/collections/${tile.handle}`}
            prefetch="intent"
            className="styx-collection-card"
          >
            <div className="styx-collection-card-image">
              <span className="styx-collection-card-number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              {tile.image?.url || tile.cutoutUrl ? (
                <img
                  src={resizedCdnUrl(tile.image?.url || tile.cutoutUrl!, 640)}
                  srcSet={[320, 480, 640, 800]
                    .map(
                      (w) =>
                        `${resizedCdnUrl(
                          tile.image?.url || tile.cutoutUrl!,
                          w,
                        )} ${w}w`,
                    )
                    .join(', ')}
                  sizes="(max-width: 600px) 50vw, 33vw"
                  alt={tile.image?.altText || tile.title}
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={800}
                  className={tile.image?.url ? '' : 'styx-collection-cutout'}
                />
              ) : (
                <PlaceholderImage aspect="1/1" tone="warm" label={tile.title} />
              )}
              <span className="styx-collection-card-arrow" aria-hidden="true">
                ↗
              </span>
            </div>
            <div className="styx-collection-card-info">
              <h3>{tile.title}</h3>
              <span>
                {tile.fromPrice
                  ? `From ${formatFrom(
                      tile.fromPrice,
                      tile.currencyCode ?? 'USD',
                    )}`
                  : 'Explore'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
