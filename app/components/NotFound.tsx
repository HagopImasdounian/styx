import {Link} from 'react-router';
import {STYX, FONT} from '~/components/styx/constants';

export function NotFound({type = 'page'}: {type?: string}) {
  // Break out of any parent container constraints
  return (
    <div
      style={{
        width: '100vw',
        height: 'calc(100vh - 64px)',
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        marginTop: '-48px',
        overflow: 'hidden',
      }}
    >
      {/* Full-bleed background image */}
      <img
        src="https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-404-broken-chain.png?v=1779151345"
        alt="A broken gold Cuban link chain"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block',
        }}
      />

      {/* Text — upper area above the chain */}
      <div
        style={{
          position: 'absolute',
          top: '18%',
          left: 0,
          right: 0,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 24,
        }}
      >
        <h1
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 400,
            color: STYX.ink,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          404<br />Broken Link
        </h1>

        <p
          style={{
            fontFamily: FONT.cormorant,
            fontSize: 'clamp(18px, 2.5vw, 24px)',
            color: STYX.graphite,
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          This chain doesn&apos;t lead anywhere.
        </p>

        <Link
          to="/"
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 12,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: STYX.bone,
            backgroundColor: STYX.ink,
            padding: '16px 36px',
            textDecoration: 'none',
            border: `1px solid ${STYX.ink}`,
            transition: 'all 0.3s ease',
            marginTop: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = STYX.gold;
            e.currentTarget.style.borderColor = STYX.gold;
            e.currentTarget.style.color = STYX.ink;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = STYX.ink;
            e.currentTarget.style.borderColor = STYX.ink;
            e.currentTarget.style.color = STYX.bone;
          }}
        >
          Back to the Vault
        </Link>
      </div>
    </div>
  );
}
