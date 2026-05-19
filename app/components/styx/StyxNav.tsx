import {useEffect, useState, Suspense, useRef, useCallback, createContext, useContext} from 'react';
import {
  Await,
  useRouteLoaderData,
  Link,
  useParams,
  Form,
} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import {STYX, FONT, type CollectionNode} from './constants';
import {Cart} from '~/components/Cart';
import {CartLoading} from '~/components/CartLoading';
import {Drawer, useDrawer} from '~/components/Drawer';
import {useIsHydrated} from '~/hooks/useIsHydrated';
import {useCartFetchers} from '~/hooks/useCartFetchers';
import type {RootLoader} from '~/root';

/* ═══════════════════════════════════════════════════════════════
   Icons
   ═══════════════════════════════════════════════════════════════ */

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <circle cx="10.5" cy="10.5" r="7" />
      <line x1="16" y1="16" x2="21" y2="21" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M5 8h14l-1 13H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Catalog taxonomy
   ═══════════════════════════════════════════════════════════════ */

type ChainItem = {name: string; handle: string; popular?: boolean};
type ChainGroup = {group: string; kicker: string; chains: ChainItem[]};

// Map chain collection handle → close-up chain image (transparent PNG) for mega menu hover
const CHAIN_IMAGE_MAP: Record<string, string> = {
  'cuban': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-chains-PNG-cuban.png?v=1779151408',
  'curb': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-chains-PNG-curb.png?v=1779151414',
  'box': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-chains-PNG-box.png?v=1779151394',
  'rope': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-chains-PNG-rope.png?v=1779151436',
  'cable': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-chains-PNG-cable.png?v=1779151401',
  'figaro': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-chains-PNG-figaro.png?v=1779151422',
  'wheat': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-chains-PNG-wheat.png?v=1779151450',
  'rolo': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-chains-PNG-rolo.png?v=1779151429',
  'singapore': 'https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-chains-PNG-singapore.png?v=1779151442',
};

const CHAIN_TAXONOMY: ChainGroup[] = [
  {
    group: 'Classic Curb Weaves',
    kicker: 'I',
    chains: [
      {name: 'Cuban Link', handle: 'cuban', popular: true},
      {name: 'Curb Chain', handle: 'curb'},
      {name: 'Figaro Chain', handle: 'figaro', popular: true},
      {name: 'Franco Chain', handle: 'franco'},
      {name: 'Mariner Chain', handle: 'mariner'},
      {name: 'Gucci Link', handle: 'gucci'},
      {name: 'Panther Link', handle: 'panther'},
    ],
  },
  {
    group: 'Woven & Braided',
    kicker: 'II',
    chains: [
      {name: 'Rope Chain', handle: 'rope', popular: true},
      {name: 'Wheat Chain', handle: 'wheat'},
      {name: 'Byzantine Chain', handle: 'byzantine'},
      {name: 'Foxtail Chain', handle: 'foxtail'},
      {name: 'Bismark Chain', handle: 'bismark'},
      {name: 'San Marco Chain', handle: 'san-marco'},
      {name: 'Criss-Cross Chain', handle: 'criss-cross'},
      {name: 'Forsantina Chain', handle: 'forsantina'},
    ],
  },
  {
    group: 'Round & Rolling',
    kicker: 'III',
    chains: [
      {name: 'Rolo Chain', handle: 'rolo'},
      {name: 'Cable Chain', handle: 'cable'},
      {name: 'Ball Chain', handle: 'ball'},
      {name: 'Popcorn Chain', handle: 'popcorn'},
      {name: 'Singapore Chain', handle: 'singapore'},
      {name: 'Satellite Chain', handle: 'satellite'},
      {name: 'Rosary Chain', handle: 'rosary'},
    ],
  },
  {
    group: 'Flat & Architectural',
    kicker: 'IV',
    chains: [
      {name: 'Herringbone Chain', handle: 'herringbone'},
      {name: 'Snake Chain', handle: 'snake'},
      {name: 'Omega Chain', handle: 'omega'},
      {name: 'Box Chain', handle: 'box'},
      {name: 'Mesh Chain', handle: 'mesh'},
      {name: 'Mirror Chain', handle: 'mirror'},
      {name: 'Cobra Chain', handle: 'cobra'},
      {name: 'Bar Chain', handle: 'bar'},
      {name: 'Ladder Chain', handle: 'ladder'},
      {name: 'Paperclip Chain', handle: 'paperclip'},
    ],
  },
  {
    group: 'Figural & Decorative',
    kicker: 'V',
    chains: [
      {name: 'Heart Chain', handle: 'heart'},
      {name: 'Tulip Chain', handle: 'tulip'},
      {name: 'Peanut Chain', handle: 'peanut'},
      {name: 'Valentino Chain', handle: 'valentino'},
      {name: 'Scroll Chain', handle: 'scroll'},
      {name: 'S-Link Chain', handle: 's-link'},
      {name: 'Tennis Chain', handle: 'tennis', popular: true},
    ],
  },
];

const METALS = [
  {label: 'Yellow Gold', hex: '#C5A059', sub: 'The original alloy', handle: 'yellow-gold'},
  {label: 'Rose Gold', hex: '#C08572', sub: 'Copper-warmed', handle: 'rose-gold'},
  {label: 'White Gold', hex: '#D4D2CC', sub: 'Palladium-alloyed', handle: 'white-gold'},
];

const KARATS = [
  {label: '10k · Durable', detail: '41.7% pure — hardest wearing', handle: '10k-gold'},
  {label: '14k · Everyday', detail: '58.5% pure — strong and versatile', handle: '14k-gold'},
  {label: '18k · Premium', detail: '75% pure — rich color', handle: '18k-gold'},
];

const PRICE_TIERS = [
  {label: 'Under $500', sub: 'Thin chains · daily wear'},
  {label: '$500 – $1,500', sub: 'Mid-weight chains'},
  {label: '$1,500 – $5,000', sub: 'Signature pieces'},
  {label: '$5,000 & over', sub: 'Statement weight'},
];

const THICKNESS_TIERS = [
  {label: '1mm', sub: 'Whisper thin', handle: 'thickness-1mm'},
  {label: '1.5mm', sub: 'Delicate', handle: 'thickness-1-5mm'},
  {label: '2mm', sub: 'Light daily', handle: 'thickness-2mm'},
  {label: '2.5mm', sub: 'Everyday', handle: 'thickness-2-5mm'},
  {label: '3mm', sub: 'Mid-weight', handle: 'thickness-3mm'},
  {label: '4mm', sub: 'Substantial', handle: 'thickness-4mm'},
  {label: '5mm', sub: 'Statement', handle: 'thickness-5mm'},
  {label: '6mm', sub: 'Bold', handle: 'thickness-6mm'},
  {label: '7mm', sub: 'Heavy', handle: 'thickness-7mm'},
  {label: '10mm', sub: 'Foundry weight', handle: 'thickness-10mm'},
];

/* ═══════════════════════════════════════════════════════════════
   Shared sub-components
   ═══════════════════════════════════════════════════════════════ */

function MenuColumnHeader({
  kicker,
  title,
}: {
  kicker?: string;
  title: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        paddingBottom: 14,
        marginBottom: 18,
        borderBottom: `1px solid ${STYX.line}`,
      }}
    >
      {kicker && (
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 11,
            color: STYX.gold,
            letterSpacing: '0.15em',
            fontWeight: 500,
            minWidth: 18,
          }}
        >
          {kicker}
        </div>
      )}
      <div
        style={{
          fontFamily: FONT.cinzel,
          fontSize: 11,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: STYX.silt,
          fontWeight: 500,
        }}
      >
        {title}
      </div>
    </div>
  );
}

const CloseMenuContext = createContext<(() => void) | null>(null);
const ExistingHandlesContext = createContext<Set<string>>(new Set());
const CollectionsListContext = createContext<CollectionNode[]>([]);

/** Link that closes the mega menu on click */
function MegaLink(props: React.ComponentProps<typeof Link>) {
  const closeMenu = useContext(CloseMenuContext);
  return (
    <Link
      {...props}
      onClick={(e) => {
        closeMenu?.();
        (props as any).onClick?.(e);
      }}
    />
  );
}

function nameToHandle(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function MenuLink({
  children,
  popular,
  to,
  onHover,
}: {
  children: React.ReactNode;
  popular?: boolean;
  to: string;
  onHover?: (hovering: boolean) => void;
}) {
  const [hover, setHover] = useState(false);
  const closeMenu = useContext(CloseMenuContext);
  return (
    <Link
      to={to}
      prefetch="intent"
      onClick={() => closeMenu?.()}
      onMouseEnter={() => { setHover(true); onHover?.(true); }}
      onMouseLeave={() => { setHover(false); onHover?.(false); }}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 10,
        padding: '7px 0',
        cursor: 'pointer',
        fontFamily: FONT.cormorant,
        fontSize: 16,
        color: hover ? STYX.gold : STYX.ink,
        transition: 'color 0.15s',
        textDecoration: 'none',
      }}
    >
      <span style={{display: 'flex', alignItems: 'baseline', gap: 8}}>
        <span
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 9,
            letterSpacing: '0.1em',
            color: hover ? STYX.gold : 'rgba(26,24,21,0.25)',
            width: 12,
            transition: 'color 0.15s',
          }}
        >
          {hover ? '→' : '·'}
        </span>
        {children}
      </span>
      {popular && (
        <span
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 8,
            letterSpacing: '0.2em',
            color: STYX.gold,
            textTransform: 'uppercase',
          }}
        >
          Popular
        </span>
      )}
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHAINS mega-panel — the main event
   ═══════════════════════════════════════════════════════════════ */

function ChainsMegaPanel() {
  const existingHandles = useContext(ExistingHandlesContext);
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);

  // Filter each taxonomy group to only show chains that exist as collections
  const filteredGroups = CHAIN_TAXONOMY.map((group) => ({
    ...group,
    chains: group.chains.filter((c) =>
      existingHandles.has(c.handle),
    ),
  })).filter((g) => g.chains.length > 0);

  // Filter metals, karats, thickness, price tiers to existing handles
  const filteredMetals = METALS.filter((m) => existingHandles.has(m.handle));
  const filteredKarats = KARATS.filter((k) => existingHandles.has(k.handle));
  const filteredThickness = THICKNESS_TIERS.filter((t) =>
    existingHandles.has(t.handle),
  );

  // Collect all chain links into a single flat list for dynamic layout
  const allChainLinks = filteredGroups.flatMap((g) =>
    g.chains.map((c) => ({...c, group: g.group, kicker: g.kicker})),
  );

  // If nothing exists at all, show a simple "Shop All" link
  if (
    allChainLinks.length === 0 &&
    filteredMetals.length === 0 &&
    filteredKarats.length === 0
  ) {
    return (
      <div style={{padding: '44px 56px 48px'}}>
        <MegaLink
          to="/collections"
          prefetch="intent"
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 14,
            letterSpacing: '0.1em',
            color: STYX.ink,
            textDecoration: 'none',
          }}
        >
          Shop All Collections →
        </MegaLink>
      </div>
    );
  }

  // Determine grid columns based on content
  const hasChains = allChainLinks.length > 0;

  // Resolve the hovered image
  const hoveredImage = hoveredChain ? CHAIN_IMAGE_MAP[hoveredChain] : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: hasChains ? '1fr 1fr 1.5fr' : '1fr',
        gap: 44,
        padding: '44px 56px 48px',
      }}
    >
      {/* Chain links by group */}
      {hasChains && (
        <>
          {/* Split chains into two columns */}
          <div>
            {filteredGroups.slice(0, Math.ceil(filteredGroups.length / 2)).map((g) => (
              <div key={g.group} style={{marginBottom: 28}}>
                <MenuColumnHeader kicker={g.kicker} title={g.group} />
                {g.chains.map((c) => (
                    <MenuLink
                      key={c.name}
                      popular={c.popular}
                      to={`/collections/${c.handle}`}
                      onHover={(h) => setHoveredChain(h ? c.handle : null)}
                    >
                      {c.name}
                    </MenuLink>
                ))}
              </div>
            ))}
          </div>
          <div>
            {filteredGroups.slice(Math.ceil(filteredGroups.length / 2)).map((g) => (
              <div key={g.group} style={{marginBottom: 28}}>
                <MenuColumnHeader kicker={g.kicker} title={g.group} />
                {g.chains.map((c) => (
                    <MenuLink
                      key={c.name}
                      popular={c.popular}
                      to={`/collections/${c.handle}`}
                      onHover={(h) => setHoveredChain(h ? c.handle : null)}
                    >
                      {c.name}
                    </MenuLink>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Hover image preview column */}
      {hasChains && (
        <div
          style={{
            overflow: 'hidden',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
          }}
        >
          {hoveredImage ? (
            <img
              key={hoveredChain}
              src={hoveredImage}
              alt={hoveredChain?.replace(/-/g, ' ') ?? ''}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                animation: 'fadeInAnimation 0.2s ease',
              }}
            />
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 24px',
              }}
            >
              <div
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 10,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: STYX.silt,
                  marginBottom: 8,
                }}
              >
                Preview
              </div>
              <div
                style={{
                  fontFamily: FONT.cormorant,
                  fontSize: 14,
                  fontStyle: 'italic',
                  color: STYX.silt2,
                }}
              >
                Hover a chain to see it
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COLLECTIONS mega-panel — fully dynamic from Shopify
   ═══════════════════════════════════════════════════════════════ */

// Handles to exclude from the collections menu (shown elsewhere or internal)
const COLLECTIONS_EXCLUDE = new Set([
  'frontpage', 'automated-collection', 'hydrogen', 'chains',
]);

// Handles that belong to "filter" groupings (metal, karat, thickness, weave group)
const isFilterCollection = (handle: string) =>
  ['yellow-gold', 'white-gold', 'rose-gold', '10k-gold', '14k-gold', '18k-gold', '22k-gold'].includes(handle) ||
  handle.startsWith('thickness-') ||
  ['classic-curb', 'woven-braided', 'round-rolling', 'flat-architectural', 'figural-decorative'].includes(handle);

// Chain type handles (already shown in the Chains panel)
const isChainType = (handle: string) =>
  handle.endsWith('-chain') || handle.endsWith('-link');

function CollectionsMegaPanel() {
  const existingHandles = useContext(ExistingHandlesContext);

  const filteredMetals = METALS.filter((m) => existingHandles.has(m.handle));
  const filteredKarats = KARATS.filter((k) => existingHandles.has(k.handle));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1.2fr',
        gap: 44,
        padding: '44px 56px 48px',
      }}
    >
      {/* By Karat */}
      <div>
        <MenuColumnHeader kicker="I" title="By Karat" />
        {filteredKarats.map((k) => (
          <MegaLink
            key={k.label}
            to={`/collections/${k.handle}`}
            prefetch="intent"
            style={{
              padding: '8px 0',
              textDecoration: 'none',
              borderBottom: `1px solid ${STYX.lineSoft}`,
            }}
          >
            <div style={{fontFamily: FONT.cinzel, fontSize: 13, letterSpacing: '0.08em', color: STYX.ink, fontWeight: 500}}>
              {k.label}
            </div>
            <div style={{fontFamily: FONT.cormorant, fontSize: 13, fontStyle: 'italic', color: STYX.silt}}>
              {k.detail}
            </div>
          </MegaLink>
        ))}

        {/* All chains link */}
        <MegaLink
          to="/collections/chains"
          prefetch="intent"
          style={{
            display: 'block',
            padding: '12px 0',
            textDecoration: 'none',
            fontFamily: FONT.cinzel,
            fontSize: 11,
            letterSpacing: '0.15em',
            color: STYX.gold,
            textTransform: 'uppercase',
            marginTop: 8,
          }}
        >
          All Chains &rarr;
        </MegaLink>
      </div>

      {/* By Metal */}
      <div>
        <MenuColumnHeader kicker="II" title="By Metal" />
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          {filteredMetals.map((m) => (
            <MegaLink
              key={m.label}
              to={`/collections/${m.handle}`}
              prefetch="intent"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '6px 0',
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 30% 30%, #fff6 0%, transparent 40%), ${m.hex}`,
                  boxShadow: 'inset 0 0 0 1px rgba(26,24,21,0.15)',
                  flexShrink: 0,
                }}
              />
              <span>
                <div style={{fontFamily: FONT.cinzel, fontSize: 12, letterSpacing: '0.1em', color: STYX.ink, textTransform: 'uppercase'}}>
                  {m.label}
                </div>
                <div style={{fontFamily: FONT.cormorant, fontSize: 12, fontStyle: 'italic', color: STYX.silt}}>
                  {m.sub}
                </div>
              </span>
            </MegaLink>
          ))}
        </div>

        {/* By Build */}
        <div style={{marginTop: 28}}>
          <MenuColumnHeader kicker="III" title="By Build" />
          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            {[
              {label: 'Solid', sub: 'Dense · investment-grade'},
              {label: 'Hollow', sub: 'Lighter · everyday wear'},
            ].map((b) => (
              <MegaLink
                key={b.label}
                to={`/collections/chains?construction=${b.label}`}
                prefetch="intent"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '6px 0',
                  textDecoration: 'none',
                }}
              >
                <span>
                  <div style={{fontFamily: FONT.cinzel, fontSize: 12, letterSpacing: '0.1em', color: STYX.ink, textTransform: 'uppercase'}}>
                    {b.label}
                  </div>
                  <div style={{fontFamily: FONT.cormorant, fontSize: 12, fontStyle: 'italic', color: STYX.silt}}>
                    {b.sub}
                  </div>
                </span>
              </MegaLink>
            ))}
          </div>
        </div>
      </div>

      {/* Right column — browse all */}
      <div
        style={{
          background: STYX.parchment,
          padding: '28px 24px',
          border: `1px solid ${STYX.line}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 10,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: STYX.gold,
            marginBottom: 4,
          }}
        >
          Browse
        </div>
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 18,
            letterSpacing: '0.02em',
            color: STYX.ink,
            textTransform: 'uppercase',
            lineHeight: 1.2,
          }}
        >
          All Collections
        </div>
        <div
          style={{
            fontFamily: FONT.cormorant,
            fontSize: 14,
            fontStyle: 'italic',
            color: STYX.graphite,
            lineHeight: 1.5,
          }}
        >
          Browse every collection — by metal, karat, chain type, and more.
        </div>
        <MegaLink
          to="/collections"
          prefetch="intent"
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 10,
            letterSpacing: '0.25em',
            color: STYX.gold,
            textTransform: 'uppercase',
            textDecoration: 'none',
            marginTop: 'auto',
          }}
        >
          View all collections →
        </MegaLink>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   JOURNAL mega-panel
   ═══════════════════════════════════════════════════════════════ */

function JournalMegaPanel() {
  const volumes = [
    {vol: 'I', title: 'The Weaves', kicker: 'Chain history, origin to alloy', count: 9},
    {vol: 'II', title: 'The Foundry', kicker: 'Inside the workshop', count: 6},
    {vol: 'III', title: 'The Owners', kicker: 'Worn, in the world', count: 12},
    {vol: 'IV', title: 'The Almanac', kicker: 'Spot, assay, context', count: 24},
  ];
  const recent = [
    {title: 'On the Cuban Link · Miami · 1974', handle: 'history-of-the-cuban-link'},
    {title: 'On the Rope Chain · The Nile Delta', handle: 'history-of-the-rope-chain'},
    {title: 'On the Figaro · Vicenza · 1885', handle: 'history-of-the-figaro-chain'},
    {title: 'On the Byzantine · Constantinople · 500 AD', handle: 'history-of-the-byzantine-chain'},
  ];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1.2fr',
        gap: 44,
        padding: '44px 56px 48px',
      }}
    >
      <div>
        <MenuColumnHeader kicker="§" title="Volumes" />
        {volumes.map((v) => (
          <MegaLink
            key={v.vol}
            to="/journal"
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr auto',
              gap: 16,
              padding: '14px 0',
              alignItems: 'baseline',
              borderBottom: `1px solid ${STYX.lineSoft}`,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 13,
                color: STYX.gold,
                letterSpacing: '0.1em',
              }}
            >
              {v.vol}
            </div>
            <div>
              <div
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 13,
                  letterSpacing: '0.06em',
                  color: STYX.ink,
                  textTransform: 'uppercase',
                }}
              >
                {v.title}
              </div>
              <div
                style={{
                  fontFamily: FONT.cormorant,
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: STYX.silt,
                }}
              >
                {v.kicker}
              </div>
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                color: STYX.silt,
              }}
            >
              {v.count}
            </div>
          </MegaLink>
        ))}
      </div>
      <div>
        <MenuColumnHeader kicker="§" title="Recent chapters" />
        {recent.map((r) => (
          <MenuLink key={r.title} to={`/journal/${r.handle}`}>
            {r.title}
          </MenuLink>
        ))}
      </div>
      <div
        style={{
          background: STYX.parchment,
          padding: '28px 24px',
          border: `1px solid ${STYX.line}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
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
          The Dispatch
        </div>
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 20,
            letterSpacing: '0.02em',
            color: STYX.ink,
            textTransform: 'uppercase',
            lineHeight: 1.1,
          }}
        >
          A quiet letter.
          <br />
          <span
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            Twelve times a year.
          </span>
        </div>
        <div
          style={{
            fontFamily: FONT.cormorant,
            fontSize: 14,
            fontStyle: 'italic',
            color: STYX.graphite,
            lineHeight: 1.5,
            marginTop: 4,
          }}
        >
          No discounts. No urgency. New pieces and the stories behind them.
        </div>
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 10,
            letterSpacing: '0.25em',
            color: STYX.gold,
            textTransform: 'uppercase',
            marginTop: 'auto',
          }}
        >
          Subscribe →
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Panel registry
   ═══════════════════════════════════════════════════════════════ */

type MenuKey = 'Chains' | 'Collections' | 'Journal';

const MENU_PANELS: Record<MenuKey, React.FC> = {
  Chains: ChainsMegaPanel,
  Collections: CollectionsMegaPanel,
  Journal: JournalMegaPanel,
};

type NavItem = {
  label: string;
  to: string;
  mega?: MenuKey;
};

const NAV_ITEMS: NavItem[] = [
  {label: 'Chains', to: '/collections/chains', mega: 'Chains'},
  {label: 'Collections', to: '/collections', mega: 'Collections'},
  {label: 'Customize', to: '/customize'},
  {label: 'About', to: '/about'},
  {label: 'Journal', to: '/journal', mega: 'Journal'},
];

/* ═══════════════════════════════════════════════════════════════
   Main Nav export
   ═══════════════════════════════════════════════════════════════ */

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Mobile Menu — full-screen, slides from right, multi-layer
   ═══════════════════════════════════════════════════════════════ */

function MobileMenu({
  open,
  onClose,
  existingHandles,
}: {
  open: boolean;
  onClose: () => void;
  existingHandles: Set<string>;
}) {
  const [section, setSection] = useState<'Chains' | 'Collections' | null>(null);
  const [chainsTab, setChainsTab] = useState<'weave' | 'metal' | 'price'>('weave');

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setSection(null);
        setChainsTab('weave');
      }, 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  const filteredTaxonomy = CHAIN_TAXONOMY.map((group) => ({
    ...group,
    chains: group.chains.filter((c) => existingHandles.has(c.handle)),
  })).filter((g) => g.chains.length > 0);

  const paneTransition = "transform 0.35s cubic-bezier(.5,.1,.2,1)";
  const borderLine = `1px solid ${STYX.line}`;

  const ROOT_LINKS: {numeral: string; label: string; drillTo?: 'Chains' | 'Collections'; to?: string}[] = [
    {numeral: 'I', label: 'Chains', drillTo: 'Chains'},
    {numeral: 'II', label: 'Collections', drillTo: 'Collections'},
    {numeral: 'III', label: 'Customize', to: '/customize'},
    {numeral: 'IV', label: 'About', to: '/about'},
    {numeral: 'V', label: 'Journal', to: '/journal'},
    {numeral: 'VI', label: 'Contact', to: '/contact'},
  ];

  const CHAINS_TABS: {key: 'weave' | 'metal' | 'price'; label: string}[] = [
    {key: 'weave', label: 'Weave'},
    {key: 'metal', label: 'Metal \u00b7 Karat'},
    {key: 'price', label: 'Price'},
  ];

  const METAL_SWATCHES = [
    {label: 'Yellow Gold', hex: '#D4A844', sub: 'The classic alloy'},
    {label: 'Rose Gold', hex: '#C9877A', sub: 'Copper-warmed'},
    {label: 'White Gold', hex: '#D5D0C8', sub: 'Palladium-alloyed'},
  ];

  const PRICE_BUCKETS = [
    {label: 'Under $500', sub: 'Thin chains, daily wear', count: 24},
    {label: '$500 \u2013 $1,500', sub: 'Mid-weight chains', count: 48},
    {label: '$1,500 \u2013 $5,000', sub: 'Signature pieces', count: 36},
    {label: '$5,000+', sub: 'Statement weight', count: 12},
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26,24,21,0.6)',
          backdropFilter: 'blur(2px)',
          zIndex: 50,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 420,
          background: STYX.bone,
          zIndex: 51,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 24px',
            borderBottom: borderLine,
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {section && (
            <button
              onClick={() => setSection(null)}
              style={{
                position: 'absolute',
                left: 16,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                color: STYX.ink,
                fontFamily: FONT.cormorant,
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{fontSize: 18, lineHeight: 1}}>&larr;</span> All
            </button>
          )}
          <span
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 16,
              letterSpacing: '0.35em',
              color: STYX.gold,
              textTransform: 'uppercase',
            }}
          >
            STYX
          </span>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: 16,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              color: STYX.ink,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        {/* Two-pane container */}
        <div style={{flex: 1, position: 'relative', overflow: 'hidden'}}>

          {/* ── Root pane ── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch' as any,
              transform: section ? 'translateX(-100%)' : 'translateX(0)',
              transition: paneTransition,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{flex: 1, paddingTop: 8}}>
              {ROOT_LINKS.map((item) =>
                item.drillTo ? (
                  <button
                    key={item.label}
                    onClick={() => setSection(item.drillTo!)}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      borderBottom: borderLine,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '24px',
                      gap: 16,
                    }}
                  >
                    <span style={{fontFamily: FONT.cinzel, fontSize: 14, color: STYX.gold, letterSpacing: '0.1em', minWidth: 28}}>
                      {item.numeral}
                    </span>
                    <span style={{fontFamily: FONT.cinzel, fontSize: 28, letterSpacing: '0.08em', textTransform: 'uppercase', color: STYX.ink, flex: 1, textAlign: 'left'}}>
                      {item.label}
                    </span>
                    <span style={{color: STYX.silt, fontSize: 20}}>&rarr;</span>
                  </button>
                ) : (
                  <Link
                    key={item.label}
                    to={item.to!}
                    prefetch="intent"
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '24px',
                      gap: 16,
                      textDecoration: 'none',
                      borderBottom: borderLine,
                    }}
                  >
                    <span style={{fontFamily: FONT.cinzel, fontSize: 14, color: STYX.gold, letterSpacing: '0.1em', minWidth: 28}}>
                      {item.numeral}
                    </span>
                    <span style={{fontFamily: FONT.cinzel, fontSize: 28, letterSpacing: '0.08em', textTransform: 'uppercase', color: STYX.ink, flex: 1}}>
                      {item.label}
                    </span>
                  </Link>
                ),
              )}
            </div>

            {/* Gold ticker strip */}
            <div
              style={{
                padding: '14px 24px',
                background: 'rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderTop: borderLine,
                borderBottom: borderLine,
              }}
            >
              <span style={{width: 7, height: 7, borderRadius: '50%', background: '#4CAF50', flexShrink: 0}} />
              <span style={{fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.1em', color: STYX.silt2, textTransform: 'uppercase'}}>
                London Fix &middot; Live
              </span>
              <span style={{marginLeft: 'auto', fontFamily: FONT.mono, fontSize: 11, color: STYX.gold, letterSpacing: '0.05em'}}>
                XAU Spot
              </span>
            </div>

            {/* Shop Chains CTA */}
            <div style={{padding: 24, flexShrink: 0}}>
              <Link
                to="/collections/chains"
                prefetch="intent"
                onClick={onClose}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '18px 0',
                  background: STYX.gold,
                  color: STYX.ink,
                  fontFamily: FONT.cinzel,
                  fontSize: 13,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Shop Chains
              </Link>
            </div>
          </div>

          {/* ── Chains detail pane ── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch' as any,
              transform: section === 'Chains' ? 'translateX(0)' : 'translateX(100%)',
              transition: paneTransition,
            }}
          >
            {/* Section heading */}
            <div style={{padding: '32px 24px 20px'}}>
              <div style={{fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.2em', color: STYX.gold, textTransform: 'uppercase', marginBottom: 8}}>
                Section &middot; I
              </div>
              <div style={{fontFamily: FONT.cinzel, fontSize: 40, letterSpacing: '0.06em', color: STYX.ink, textTransform: 'uppercase', lineHeight: 1.1}}>
                Chains
              </div>
              <div style={{fontFamily: FONT.cormorant, fontSize: 16, fontStyle: 'italic', color: STYX.silt2, marginTop: 8, lineHeight: 1.4}}>
                40 weaves, three metals, every weight in the open.
              </div>
            </div>

            {/* Segmented tabs */}
            <div style={{display: 'flex', padding: '0 24px', gap: 0, borderBottom: borderLine}}>
              {CHAINS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setChainsTab(tab.key)}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    borderBottom: chainsTab === tab.key ? `2px solid ${STYX.gold}` : '2px solid transparent',
                    cursor: 'pointer',
                    padding: '14px 4px',
                    fontFamily: FONT.mono,
                    fontSize: 12,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: chainsTab === tab.key ? STYX.gold : STYX.silt,
                    transition: 'color 0.2s, border-color 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Weave tab */}
            {chainsTab === 'weave' && (
              <div style={{padding: '16px 0'}}>
                <Link
                  to="/collections/chains"
                  prefetch="intent"
                  onClick={onClose}
                  style={{
                    display: 'block',
                    padding: '14px 24px',
                    fontFamily: FONT.cinzel,
                    fontSize: 13,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: STYX.gold,
                    textDecoration: 'none',
                    borderBottom: borderLine,
                  }}
                >
                  Shop All Chains
                </Link>
                {filteredTaxonomy.map((group) => (
                  <div key={group.group} style={{marginTop: 16}}>
                    <div style={{padding: '0 24px 12px', display: 'flex', alignItems: 'baseline', gap: 10}}>
                      <span style={{fontFamily: FONT.cinzel, fontSize: 15, color: STYX.gold, letterSpacing: '0.1em'}}>{group.kicker}</span>
                      <span style={{fontFamily: FONT.mono, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: STYX.silt}}>{group.group}</span>
                    </div>
                    {group.chains.map((chain) => (
                      <Link
                        key={chain.handle}
                        to={`/collections/${chain.handle}`}
                        prefetch="intent"
                        onClick={onClose}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          padding: '16px 24px 16px 28px',
                          fontFamily: FONT.cormorant,
                          fontSize: 22,
                          color: STYX.ink,
                          textDecoration: 'none',
                          minHeight: 72,
                        }}
                      >
                        {CHAIN_IMAGE_MAP[chain.handle] && (
                          <img
                            src={CHAIN_IMAGE_MAP[chain.handle]}
                            alt=""
                            style={{width: 88, height: 88, objectFit: 'contain', flexShrink: 0}}
                          />
                        )}
                        <span style={{flex: 1}}>{chain.name}</span>
                        {chain.popular && (
                          <span
                            style={{
                              fontFamily: FONT.mono,
                              fontSize: 9,
                              letterSpacing: '0.15em',
                              color: STYX.gold,
                              border: `1px solid ${STYX.gold}`,
                              padding: '3px 8px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Popular
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Metal / Karat tab */}
            {chainsTab === 'metal' && (
              <div style={{padding: '24px'}}>
                <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                  {METAL_SWATCHES.map((m) => (
                    <button
                      key={m.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '16px 20px',
                        background: 'rgba(26,24,21,0.04)',
                        border: borderLine,
                        borderRadius: 0,
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{width: 28, height: 28, borderRadius: '50%', background: m.hex, flexShrink: 0, border: '2px solid rgba(26,24,21,0.12)'}} />
                      <div>
                        <div style={{fontFamily: FONT.cinzel, fontSize: 14, color: STYX.ink, letterSpacing: '0.08em', textTransform: 'uppercase'}}>{m.label}</div>
                        <div style={{fontFamily: FONT.cormorant, fontSize: 14, fontStyle: 'italic', color: STYX.silt2, marginTop: 2}}>{m.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{marginTop: 32, paddingTop: 20, borderTop: borderLine}}>
                  <div style={{fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: STYX.silt, marginBottom: 14}}>Karat</div>
                  {[
                    {label: '10K Gold', handle: '10k-gold'},
                    {label: '14K Gold', handle: '14k-gold'},
                  ]
                    .filter((k) => existingHandles.has(k.handle))
                    .map((k) => (
                      <Link
                        key={k.handle}
                        to={`/collections/${k.handle}`}
                        prefetch="intent"
                        onClick={onClose}
                        style={{
                          display: 'block',
                          padding: '14px 0',
                          fontFamily: FONT.cinzel,
                          fontSize: 16,
                          letterSpacing: '0.1em',
                          color: STYX.ink,
                          textDecoration: 'none',
                          borderBottom: borderLine,
                        }}
                      >
                        {k.label}
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* Price tab */}
            {chainsTab === 'price' && (
              <div style={{padding: '24px', display: 'flex', flexDirection: 'column', gap: 12}}>
                {PRICE_BUCKETS.map((tier) => (
                  <div
                    key={tier.label}
                    style={{
                      padding: '20px',
                      background: 'rgba(26,24,21,0.04)',
                      border: borderLine,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{fontFamily: FONT.cinzel, fontSize: 18, color: STYX.ink, letterSpacing: '0.06em'}}>{tier.label}</div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6}}>
                      <span style={{fontFamily: FONT.cormorant, fontSize: 14, fontStyle: 'italic', color: STYX.silt2}}>{tier.sub}</span>
                      <span style={{fontFamily: FONT.mono, fontSize: 10, color: STYX.silt, letterSpacing: '0.1em'}}>{tier.count} items</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Collections detail pane ── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch' as any,
              transform: section === 'Collections' ? 'translateX(0)' : 'translateX(100%)',
              transition: paneTransition,
            }}
          >
            <div style={{padding: '32px 24px 20px'}}>
              <div style={{fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.2em', color: STYX.gold, textTransform: 'uppercase', marginBottom: 8}}>
                Section &middot; II
              </div>
              <div style={{fontFamily: FONT.cinzel, fontSize: 40, letterSpacing: '0.06em', color: STYX.ink, textTransform: 'uppercase', lineHeight: 1.1}}>
                Collections
              </div>
            </div>

            <div style={{padding: '0 24px'}}>
              {[
                {label: 'All Collections', to: '/collections'},
                {label: '10K Gold', to: '/collections/10k-gold', handle: '10k-gold'},
                {label: '14K Gold', to: '/collections/14k-gold', handle: '14k-gold'},
              ]
                .filter((c) => !c.handle || existingHandles.has(c.handle))
                .map((c) => (
                  <Link
                    key={c.label}
                    to={c.to}
                    prefetch="intent"
                    onClick={onClose}
                    style={{
                      display: 'block',
                      padding: '20px 0',
                      fontFamily: FONT.cinzel,
                      fontSize: 18,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: STYX.ink,
                      textDecoration: 'none',
                      borderBottom: borderLine,
                    }}
                  >
                    {c.label}
                  </Link>
                ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function StyxCartDrawer({open, onClose}: {open: boolean; onClose: () => void}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26,24,21,0.5)',
          backdropFilter: 'blur(2px)',
          zIndex: 50,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 460,
          background: STYX.bone,
          zIndex: 51,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(.25,.8,.25,1)',
          boxShadow: '-24px 0 60px rgba(26,24,21,0.12)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${STYX.line}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: STYX.gold,
                marginBottom: 4,
              }}
            >
              Your Vault
            </div>
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: '0.06em',
                color: STYX.ink,
                textTransform: 'uppercase',
              }}
            >
              Cart
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: `1px solid ${STYX.line}`,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" stroke={STYX.ink} strokeWidth="1.2">
              <line x1="2" y1="2" x2="10" y2="10" />
              <line x1="10" y1="2" x2="2" y2="10" />
            </svg>
          </button>
        </div>

        {/* Cart content */}
        <div style={{flex: 1, overflow: 'hidden'}}>
          <Suspense fallback={<CartLoading />}>
            <Await resolve={useRouteLoaderData<RootLoader>('root')?.cart}>
              {(cart) => (
                <Cart layout="drawer" onClose={onClose} cart={cart || null} />
              )}
            </Await>
          </Suspense>
        </div>
      </div>
    </>
  );
}

export function StyxNav({collections: collectionsProp}: {collections?: CollectionNode[]}) {
  // Build a set of existing collection handles for dynamic menu filtering
  const rootData2 = useRouteLoaderData<RootLoader>('root');
  const collections = collectionsProp ?? (rootData2 as any)?.collections ?? [];
  const existingHandles = new Set<string>(
    collections.map((c: CollectionNode) => c.handle),
  );
  const {
    isOpen: isCartOpen,
    openDrawer: openCart,
    closeDrawer: closeCart,
  } = useDrawer();

  const {
    isOpen: isMobileMenuOpen,
    openDrawer: openMobileMenu,
    closeDrawer: closeMobileMenu,
  } = useDrawer();

  const addToCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesAdd);

  useEffect(() => {
    if (isCartOpen || !addToCartFetchers.length) return;
    openCart();
  }, [addToCartFetchers, isCartOpen, openCart]);

  const params = useParams();
  const [hoverLink, setHoverLink] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gold data for footer strip
  const rootData = useRouteLoaderData<RootLoader>('root');
  const spotPerOz = (rootData as any)?.goldData?.spotPerOz;

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const closeMenuNow = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(null);
  }, []);

  const Panel = openMenu ? MENU_PANELS[openMenu] : null;

  return (
    <>
      {/* Cart Drawer — Styx styled */}
      <StyxCartDrawer open={isCartOpen} onClose={closeCart} />

      {/* Mobile Menu */}
      <MobileMenu
        open={isMobileMenuOpen}
        onClose={closeMobileMenu}
        existingHandles={existingHandles}
      />

      <div className="styx-nav" style={{position: 'sticky', top: 0, background: STYX.bone, zIndex: 40}}>
        {/* ── Top bar ── */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 56px',
            height: 64,
            borderBottom: `1px solid ${STYX.line}`,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Mobile hamburger */}
          <button
            className="styx-nav-hamburger"
            onClick={openMobileMenu}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: STYX.ink,
              display: 'none',
            }}
          >
            <HamburgerIcon />
          </button>

          {/* Left: shop links */}
          <div
            className="styx-nav-links"
            style={{
              display: 'flex',
              gap: 32,
              alignItems: 'center',
              flex: 1,
            }}
          >
            {NAV_ITEMS.map((item) => {
              const active =
                hoverLink === item.label || openMenu === item.mega;
              return (
                <div
                  key={item.label}
                  onMouseEnter={() => {
                    setHoverLink(item.label);
                    cancelClose();
                    if (item.mega) setOpenMenu(item.mega);
                  }}
                  onMouseLeave={() => {
                    setHoverLink(null);
                    scheduleClose();
                  }}
                  style={{position: 'relative'}}
                >
                  <Link
                    to={item.to}
                    prefetch="intent"
                    style={{
                      fontFamily: FONT.inter,
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: active ? STYX.ink : STYX.silt,
                      textDecoration: 'none',
                      position: 'relative',
                      paddingBottom: 4,
                      transition: 'color 0.2s',
                    }}
                  >
                    {item.label}
                    {active && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: -4,
                          left: 0,
                          right: 0,
                          height: 1,
                          background: STYX.gold,
                        }}
                      />
                    )}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Center: logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              flex: '0 0 auto',
            }}
          >
            <img
              src="https://cdn.shopify.com/s/files/1/0754/6440/9267/files/styx-styx-logo.png?v=1779151809"
              alt="STYX"
              style={{height: 36, width: 'auto'}}
            />
            <span
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '0.4em',
                color: STYX.ink,
                textTransform: 'uppercase',
              }}
            >
              STYX
            </span>
          </Link>

          {/* Right: search, account, size guide, cart */}
          <div
            className="styx-nav-right"
            style={{
              display: 'flex',
              gap: 24,
              alignItems: 'center',
              flex: 1,
              justifyContent: 'flex-end',
              color: STYX.ink,
            }}
          >
            <Link
              to="/contact"
              prefetch="intent"
              style={{
                fontFamily: FONT.inter,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: STYX.silt,
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = STYX.ink; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = STYX.silt; }}
            >
              Contact
            </Link>
            <Form
              method="get"
              action={params.locale ? `/${params.locale}/search` : '/search'}
            >
              <button
                type="submit"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  color: 'inherit',
                }}
              >
                <SearchIcon />
              </button>
            </Form>
            <CartCount openCart={openCart} />
          </div>
        </nav>

        {/* ── Mega panel ── */}
        {Panel && (
          <div
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: STYX.bone,
              color: STYX.ink,
              borderBottom: `1px solid ${STYX.line}`,
              boxShadow: '0 24px 48px -24px rgba(26,24,21,0.2)',
              zIndex: 1,
              animation: 'styx-menu-in 0.28s cubic-bezier(.2,.8,.2,1) both',
            }}
          >
            {/* Decorative gold hairline */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 56,
                right: 56,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${STYX.gold} 30%, ${STYX.gold} 70%, transparent)`,
                opacity: 0.6,
              }}
            />
            <ExistingHandlesContext.Provider value={existingHandles}>
              <CollectionsListContext.Provider value={collections}>
                <CloseMenuContext.Provider value={closeMenuNow}>
                  <Panel />
                </CloseMenuContext.Provider>
              </CollectionsListContext.Provider>
            </ExistingHandlesContext.Provider>
            {/* Footer strip */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 56px',
                borderTop: `1px solid ${STYX.line}`,
                background: STYX.paper,
              }}
            >
              <div
                style={{display: 'flex', gap: 28, alignItems: 'center'}}
              >
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    color: STYX.silt,
                    letterSpacing: '0.1em',
                  }}
                >
                  {spotPerOz ? `LONDON FIX · $${spotPerOz.toFixed(0)}/oz` : 'STYX GOLD'}
                </div>
                <div
                  style={{
                    width: 4,
                    height: 4,
                    background: STYX.silt,
                    borderRadius: '50%',
                  }}
                />
                <div
                  style={{
                    fontFamily: FONT.cormorant,
                    fontSize: 13,
                    fontStyle: 'italic',
                    color: STYX.graphite,
                  }}
                >
                  Complimentary signature delivery over $800
                </div>
              </div>
              <Link
                to="/collections"
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 10,
                  letterSpacing: '0.25em',
                  color: STYX.gold,
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                View the full archive →
              </Link>
            </div>
          </div>
        )}

        {/* ── Scrim ── */}
        {Panel && (
          <div
            onMouseEnter={() => setOpenMenu(null)}
            style={{
              position: 'fixed',
              top: 120,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(26,24,21,0.25)',
              pointerEvents: 'auto',
              zIndex: 0,
              animation: 'styx-scrim-in 0.28s ease both',
            }}
          />
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Cart components
   ═══════════════════════════════════════════════════════════════ */

function CartCount({openCart}: {openCart: () => void}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  if (!rootData) return null;

  return (
    <Suspense fallback={<CartBadge count={0} openCart={openCart} />}>
      <Await resolve={rootData?.cart}>
        {(cart) => (
          <CartBadge count={cart?.totalQuantity || 0} openCart={openCart} />
        )}
      </Await>
    </Suspense>
  );
}

function CartBadge({
  count,
  openCart,
}: {
  count: number;
  openCart: () => void;
}) {
  const isHydrated = useIsHydrated();

  const inner = (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: 'inherit',
      }}
    >
      <BagIcon />
      {count > 0 && (
        <span
          style={{
            position: 'absolute',
            bottom: -4,
            right: -6,
            background: STYX.ink,
            color: STYX.bone,
            fontFamily: FONT.mono,
            fontSize: 9,
            width: 16,
            height: 16,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {count}
        </span>
      )}
    </div>
  );

  if (isHydrated) {
    return (
      <button
        onClick={openCart}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          color: 'inherit',
        }}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link to="/cart" style={{padding: 4, color: 'inherit'}}>
      {inner}
    </Link>
  );
}
