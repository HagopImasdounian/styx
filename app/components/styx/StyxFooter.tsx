import {Link} from 'react-router';
import {STYX, FONT, type CollectionNode} from './constants';

/** Small inline icon for the Compare / Print footer links. */
function FooterToolIcon({kind}: {kind: 'scale' | 'ruler'}) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{flexShrink: 0}}
      aria-hidden="true"
    >
      {kind === 'scale' ? (
        <>
          <path d="M12 3v18" />
          <path d="M5 7l-3 9h6L5 7z" />
          <path d="M19 7l-3 9h6l-3-9z" />
          <path d="M5 7h14" />
        </>
      ) : (
        <>
          <rect x="2" y="8" width="20" height="8" rx="1" />
          <path d="M6 8v3M10 8v4M14 8v3M18 8v4" />
        </>
      )}
    </svg>
  );
}

export function StyxFooter({collections = []}: {collections?: CollectionNode[]}) {
  // Build "Shop" column dynamically from collections
  const shopLinks = collections
    .filter((c) => c.handle !== 'frontpage')
    .slice(0, 5)
    .map((c) => ({label: c.title, to: `/collections/${c.handle}`}));

  const COLUMNS = [
    {
      heading: 'Shop',
      links: [
        ...shopLinks,
        {label: 'All Collections', to: '/collections'},
        {label: 'Compare Chains', to: '/compare', icon: 'scale' as const},
        {label: 'Print to Scale', to: '/print-list', icon: 'ruler' as const},
      ],
    },
    {
      heading: 'The House',
      links: [
        {label: 'Our Story', to: '/about'},
        {label: 'The Journal', to: '/journal'},
        {label: 'Customize', to: '/customize'},
      ],
    },
    {
      heading: 'Service',
      links: [
        {label: 'FAQ', to: '/faq'},
        {label: 'Shipping & Returns', to: '/shipping'},
        {label: 'Contact', to: '/contact'},
        {label: 'Terms & Conditions', to: '/terms'},
        {label: 'Privacy Policy', to: '/privacy'},
      ],
    },
  ];
  const linkStyle: React.CSSProperties = {
    fontFamily: FONT.inter,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textDecoration: 'none',
    display: 'block',
    marginBottom: 10,
    transition: 'color 0.2s ease',
  };

  return (
    <footer
      className="styx-footer"
      style={{
        background: STYX.graphite,
        padding: '64px 56px 40px',
      }}
    >
      <div
        data-grid=""
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
          gap: 48,
          marginBottom: 48,
        }}
      >
        {/* Brand column */}
        <div>
          <div
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 20,
              letterSpacing: '0.4em',
              color: '#fff',
              marginBottom: 16,
              textTransform: 'uppercase',
            }}
          >
            STYX
          </div>
          <p
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontSize: 16,
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.6,
              maxWidth: 280,
            }}
          >
            Gold for men who carry weight. Solid-cast, delivered worldwide.
          </p>
        </div>

        {/* Link columns */}
        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 11,
                letterSpacing: '0.25em',
                color: STYX.gold,
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              {col.heading}
            </div>
            {col.links.map((link) => {
              const icon = (link as {icon?: 'scale' | 'ruler'}).icon;
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  prefetch="intent"
                  style={icon ? {...linkStyle, display: 'flex', alignItems: 'center', gap: 7} : linkStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                  }}
                >
                  {icon && <FooterToolIcon kind={icon} />}
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        className="styx-footer-bottom"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: FONT.inter,
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.05em',
          }}
        >
          &copy; MMXXVI · Styx Gold
        </span>

        {/* Social icons */}
        <div style={{display: 'flex', gap: 16}}>
          {['Instagram', 'Twitter', 'Pinterest'].map((name) => (
            <a
              key={name}
              href="#"
              style={{
                fontFamily: FONT.inter,
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
                textDecoration: 'none',
                letterSpacing: '0.05em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = STYX.gold;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
              }}
            >
              {name}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
