import {useEffect, useState, Suspense, useRef, useCallback, createContext, useContext} from 'react';
import {
  Await,
  useRouteLoaderData,
  Link,
  useParams,
  Form,
} from '@remix-run/react';
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

type ChainItem = {name: string; popular?: boolean};
type ChainGroup = {group: string; kicker: string; chains: ChainItem[]};

const CHAIN_TAXONOMY: ChainGroup[] = [
  {
    group: 'Classic Curb Weaves',
    kicker: 'I',
    chains: [
      {name: 'Cuban Link', popular: true},
      {name: 'Curb Chain'},
      {name: 'Figaro Chain', popular: true},
      {name: 'Franco Chain'},
      {name: 'Mariner Chain'},
      {name: 'Gucci Link'},
      {name: 'Panther Link'},
    ],
  },
  {
    group: 'Woven & Braided',
    kicker: 'II',
    chains: [
      {name: 'Rope Chain', popular: true},
      {name: 'Wheat Chain'},
      {name: 'Byzantine Chain'},
      {name: 'Foxtail Chain'},
      {name: 'Bismark Chain'},
      {name: 'San Marco Chain'},
      {name: 'Criss-Cross Chain'},
      {name: 'Forsantina Chain'},
      {name: 'Tinsel Chain'},
    ],
  },
  {
    group: 'Round & Rolling',
    kicker: 'III',
    chains: [
      {name: 'Rolo Chain'},
      {name: 'Cable Chain'},
      {name: 'Ball Chain'},
      {name: 'Popcorn Chain'},
      {name: 'Singapore Chain'},
      {name: 'Satellite Chain'},
      {name: 'Rosary Chain'},
    ],
  },
  {
    group: 'Flat & Architectural',
    kicker: 'IV',
    chains: [
      {name: 'Herringbone Chain'},
      {name: 'Snake Chain'},
      {name: 'Omega Chain'},
      {name: 'Box Chain'},
      {name: 'Mesh Chain'},
      {name: 'Mirror Chain'},
      {name: 'Cobra Chain'},
      {name: 'Bar Chain'},
      {name: 'Ladder Chain'},
      {name: 'Paperclip Chain'},
    ],
  },
  {
    group: 'Figural & Decorative',
    kicker: 'V',
    chains: [
      {name: 'Heart Chain'},
      {name: 'Tulip Chain'},
      {name: 'Peanut Chain'},
      {name: 'Valentino Chain'},
      {name: 'Scroll Chain'},
      {name: 'S-Link Chain'},
      {name: 'Tennis Chain', popular: true},
    ],
  },
];

const METALS = [
  {label: 'Yellow Gold', hex: '#C5A059', sub: 'The original alloy', handle: 'yellow-gold'},
  {label: 'Rose Gold', hex: '#C08572', sub: 'Copper-warmed', handle: 'rose-gold'},
  {label: 'White Gold', hex: '#D4D2CC', sub: 'Palladium-alloyed', handle: 'white-gold'},
];

const KARATS = [
  {label: '14k · Everyday', detail: '58.5% pure — strong and versatile', handle: '14k-gold'},
  {label: '10k · Durable', detail: '41.7% pure — hardest wearing', handle: '10k-gold'},
];

const PRICE_TIERS = [
  {label: 'Under $500', sub: 'Thin chains · daily wear'},
  {label: '$500 – $1,500', sub: 'Mid-weight chains'},
  {label: '$1,500 – $5,000', sub: 'Signature pieces'},
  {label: '$5,000 & over', sub: 'Statement weight'},
];

const THICKNESS_TIERS = [
  {label: '1mm – 2mm', sub: 'Whisper thin', handle: 'thickness-1-2mm'},
  {label: '2mm – 3mm', sub: 'Everyday', handle: 'thickness-2-3mm'},
  {label: '3mm – 5mm', sub: 'Statement', handle: 'thickness-3-5mm'},
  {label: '5mm – 7mm', sub: 'Bold', handle: 'thickness-5-7mm'},
  {label: '7mm – 10mm', sub: 'Heavy', handle: 'thickness-7-10mm'},
  {label: '10mm+', sub: 'Foundry weight', handle: 'thickness-10mm-plus'},
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
}: {
  children: React.ReactNode;
  popular?: boolean;
  to: string;
}) {
  const [hover, setHover] = useState(false);
  const closeMenu = useContext(CloseMenuContext);
  return (
    <Link
      to={to}
      prefetch="intent"
      onClick={() => closeMenu?.()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
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

  // Filter each taxonomy group to only show chains that exist as collections
  const filteredGroups = CHAIN_TAXONOMY.map((group) => ({
    ...group,
    chains: group.chains.filter((c) =>
      existingHandles.has(nameToHandle(c.name)),
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
  const hasAttributes =
    filteredMetals.length > 0 ||
    filteredKarats.length > 0 ||
    filteredThickness.length > 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: hasChains && hasAttributes ? '1fr 1fr 1.1fr' : hasChains ? '1fr 1fr' : '1fr 1.1fr',
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
                    to={`/collections/${nameToHandle(c.name)}`}
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
                    to={`/collections/${nameToHandle(c.name)}`}
                  >
                    {c.name}
                  </MenuLink>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Attributes column + promo */}
      {hasAttributes && (
        <div>
          {filteredMetals.length > 0 && (
            <>
              <MenuColumnHeader kicker="α" title="By Metal" />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginBottom: 28,
                }}
              >
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
                      <div
                        style={{
                          fontFamily: FONT.cinzel,
                          fontSize: 12,
                          letterSpacing: '0.1em',
                          color: STYX.ink,
                          textTransform: 'uppercase',
                        }}
                      >
                        {m.label}
                      </div>
                      <div
                        style={{
                          fontFamily: FONT.cormorant,
                          fontSize: 12,
                          fontStyle: 'italic',
                          color: STYX.silt,
                        }}
                      >
                        {m.sub}
                      </div>
                    </span>
                  </MegaLink>
                ))}
              </div>
            </>
          )}

          {filteredKarats.length > 0 && (
            <>
              <MenuColumnHeader kicker="β" title="By Karat" />
              <div style={{display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 28}}>
                {filteredKarats.map((k) => (
                  <MegaLink
                    key={k.label}
                    to={`/collections/${k.handle}`}
                    prefetch="intent"
                    style={{
                      padding: '7px 0',
                      textDecoration: 'none',
                      borderBottom: `1px solid ${STYX.lineSoft}`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONT.cinzel,
                        fontSize: 12,
                        letterSpacing: '0.08em',
                        color: STYX.ink,
                        fontWeight: 500,
                      }}
                    >
                      {k.label}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT.cormorant,
                        fontSize: 12,
                        fontStyle: 'italic',
                        color: STYX.silt,
                      }}
                    >
                      {k.detail}
                    </div>
                  </MegaLink>
                ))}
              </div>
            </>
          )}

          {filteredThickness.length > 0 && (
            <>
              <MenuColumnHeader kicker="γ" title="By Thickness" />
              <div style={{display: 'flex', flexDirection: 'column'}}>
                {filteredThickness.map((t, i) => (
                  <MegaLink
                    key={t.label}
                    to={`/collections/${t.handle}`}
                    prefetch="intent"
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      padding: '7px 0',
                      textDecoration: 'none',
                      borderBottom:
                        i === filteredThickness.length - 1
                          ? 'none'
                          : `1px solid ${STYX.lineSoft}`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONT.cinzel,
                        fontSize: 12,
                        letterSpacing: '0.08em',
                        color: STYX.ink,
                      }}
                    >
                      {t.label}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT.cormorant,
                        fontSize: 11,
                        fontStyle: 'italic',
                        color: STYX.silt,
                      }}
                    >
                      {t.sub}
                    </div>
                  </MegaLink>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COLLECTIONS mega-panel
   ═══════════════════════════════════════════════════════════════ */

function CollectionsMegaPanel() {
  const existingHandles = useContext(ExistingHandlesContext);

  // Show all existing collections (excluding frontpage), dynamically
  const collectionsToShow = Array.from(existingHandles)
    .filter((h) => h !== 'frontpage')
    .map((handle) => ({handle, name: handle.replace(/-/g, ' ')}));

  if (collectionsToShow.length === 0) {
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

  return (
    <div style={{padding: '44px 56px 48px'}}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(collectionsToShow.length, 3)}, 1fr)`,
          gap: 2,
          background: STYX.line,
        }}
      >
        {collectionsToShow.map((c) => (
          <MegaLink
            key={c.handle}
            to={`/collections/${c.handle}`}
            prefetch="intent"
            style={{
              background: STYX.bone,
              padding: '28px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = STYX.paper)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = STYX.bone)
            }
          >
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 16,
                letterSpacing: '0.04em',
                color: STYX.ink,
                textTransform: 'uppercase',
              }}
            >
              {c.name}
            </div>
          </MegaLink>
        ))}
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
    {title: 'On the Cuban · Miami · 1974', handle: 'on-the-cuban'},
    {title: 'On the Byzantine · Constantinople · 500 AD', handle: 'on-the-byzantine'},
    {title: 'On the Figaro · Vicenza · 1885', handle: 'on-the-figaro'},
    {title: 'Why weight matters more than karat', handle: 'weight-matters'},
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
  {label: 'About', to: '/about'},
  {label: 'Journal', to: '/journal', mega: 'Journal'},
];

/* ═══════════════════════════════════════════════════════════════
   Main Nav export
   ═══════════════════════════════════════════════════════════════ */

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
      {/* Cart Drawer */}
      <Drawer
        open={isCartOpen}
        onClose={closeCart}
        heading="Cart"
        openFrom="right"
      >
        <div className="grid">
          <Suspense fallback={<CartLoading />}>
            <Await resolve={useRouteLoaderData<RootLoader>('root')?.cart}>
              {(cart) => (
                <Cart layout="drawer" onClose={closeCart} cart={cart || null} />
              )}
            </Await>
          </Suspense>
        </div>
      </Drawer>

      <div style={{position: 'sticky', top: 0, background: STYX.bone, zIndex: 40}}>
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
          {/* Left: shop links */}
          <div
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
              fontFamily: FONT.cinzel,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '0.4em',
              color: STYX.ink,
              textDecoration: 'none',
              textTransform: 'uppercase',
              flex: '0 0 auto',
            }}
          >
            STYX
          </Link>

          {/* Right: search, account, size guide, cart */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              alignItems: 'center',
              flex: 1,
              justifyContent: 'flex-end',
              color: STYX.ink,
            }}
          >
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
            <Link
              to="/account"
              style={{display: 'flex', padding: 4, color: 'inherit'}}
            >
              <AccountIcon />
            </Link>
            <Link
              to="#"
              style={{
                fontFamily: FONT.inter,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: STYX.silt,
                textDecoration: 'none',
              }}
            >
              Size Guide
            </Link>
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
              <CloseMenuContext.Provider value={closeMenuNow}>
                <Panel />
              </CloseMenuContext.Provider>
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
