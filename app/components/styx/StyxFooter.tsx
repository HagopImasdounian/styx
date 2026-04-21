import {STYX, FONT, type CollectionNode} from './constants';

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
      ],
    },
    {
      heading: 'The House',
      links: [
        {label: 'Our Story', to: '/about'},
        {label: 'The Journal', to: '/journal'},
        {label: 'Lookbook', to: '/lookbook'},
      ],
    },
    {
      heading: 'Service',
      links: [
        {label: 'Size Guide', to: '/pages/size-guide'},
        {label: 'Care & Repair', to: '/pages/care'},
        {label: 'Shipping', to: '/pages/shipping'},
        {label: 'Returns', to: '/pages/returns'},
        {label: 'Contact', to: '/contact'},
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
      style={{
        background: STYX.graphite,
        padding: '64px 56px 40px',
      }}
    >
      <div
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
            {col.links.map((link) => (
              <a
                key={link.label}
                href={link.to}
                style={linkStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
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
