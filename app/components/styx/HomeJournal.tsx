import {Link} from 'react-router';
import {STYX, FONT} from './constants';
import {PlaceholderImage} from './PlaceholderImage';
import {HomeHead, resizedCdnUrl} from './HomePrimitives';

/** A journal teaser card, prepared server-side from journal-articles.ts. */
export type JournalTeaser = {
  handle: string;
  kicker: string;
  title: string;
  blurb: string;
  image?: {url: string; altText?: string | null} | null;
};

/** "The journal" teaser: three real entries. */
export function HomeJournal({teasers}: {teasers: JournalTeaser[]}) {
  if (!teasers.length) return null;

  return (
    <section
      className="styx-home-journal"
      style={{background: STYX.bone, padding: '110px 56px'}}
    >
      <div style={{maxWidth: 1440, margin: '0 auto'}}>
        <HomeHead
          label="The journal"
          greek="ΛΟΓΟΣ"
          title={<>On gold.</>}
          link={{to: '/journal', label: 'All entries'}}
        />

        <div
          className="styx-home-journal-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 32,
          }}
        >
          {teasers.map((t) => (
            <Link
              key={t.handle}
              to={`/journal/${t.handle}`}
              prefetch="intent"
              data-reveal=""
              style={{display: 'block', textDecoration: 'none'}}
              onMouseEnter={(e) => {
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1.03)';
              }}
              onMouseLeave={(e) => {
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              <div
                style={{
                  aspectRatio: '4/3',
                  overflow: 'hidden',
                  marginBottom: 18,
                  background: STYX.parchment,
                }}
              >
                {t.image?.url ? (
                  <img
                    src={resizedCdnUrl(t.image.url, 800)}
                    alt={t.image.altText ?? t.title}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease',
                    }}
                  />
                ) : (
                  <PlaceholderImage aspect="4/3" tone="warm" label={t.kicker} />
                )}
              </div>
              <div
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 10,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: STYX.gold,
                }}
              >
                {t.kicker}
              </div>
              <h3
                style={{
                  fontFamily: FONT.cormorant,
                  fontSize: 26,
                  fontWeight: 500,
                  lineHeight: 1.2,
                  color: STYX.ink,
                  margin: '8px 0',
                }}
              >
                {t.title}
              </h3>
              <p
                style={{
                  fontFamily: FONT.inter,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: STYX.silt,
                  margin: 0,
                }}
              >
                {t.blurb}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
