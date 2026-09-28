import {Link} from 'react-router';
import {STYX, FONT} from './constants';

/**
 * Small shared pieces for the homepage sections: an editorial serif
 * headline, a gold italic emphasis span, and the underlined caps link the
 * section headers use ("All chains", "All entries").
 */

export function HomeH2({
  children,
  color = STYX.ink,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <h2
      data-reveal=""
      style={{
        fontFamily: FONT.cormorant,
        fontWeight: 400,
        fontSize: 'clamp(34px, 4.2vw, 54px)',
        lineHeight: 1.08,
        letterSpacing: '-0.005em',
        color,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

export function Em({children}: {children: React.ReactNode}) {
  return <em style={{fontStyle: 'italic', color: STYX.gold}}>{children}</em>;
}

export function HomeLink({
  to,
  children,
  color = STYX.ink,
}: {
  to: string;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Link
      to={to}
      prefetch="intent"
      style={{
        fontFamily: FONT.cinzel,
        fontSize: 11,
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
        color,
        textDecoration: 'none',
        borderBottom: `1px solid ${color}`,
        paddingBottom: 4,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {children}
    </Link>
  );
}

/** Section header row: label + headline on the left, a caps link on the right. */
export function HomeHead({
  label,
  title,
  link,
  color,
}: {
  label: React.ReactNode;
  title: React.ReactNode;
  link?: {to: string; label: string};
  color?: string;
}) {
  return (
    <div
      className="styx-home-head"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 24,
        marginBottom: 48,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 11,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: STYX.gold,
            marginBottom: 14,
          }}
        >
          {label}
        </div>
        <HomeH2 color={color}>{title}</HomeH2>
      </div>
      {link && (
        <HomeLink to={link.to} color={color}>
          {link.label}
        </HomeLink>
      )}
    </div>
  );
}

/** Body copy under a homepage headline. */
export function HomeBody({
  children,
  color = STYX.silt,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <p
      style={{
        fontFamily: FONT.inter,
        fontSize: 16,
        lineHeight: 1.7,
        color,
        maxWidth: 440,
        margin: '22px 0 32px',
        ...style,
      }}
    >
      {children}
    </p>
  );
}

/** Shopify CDN images arrive full size; ask for a rendition instead. */
export function resizedCdnUrl(url: string, width = 800): string {
  try {
    const u = new URL(url);
    u.searchParams.set('width', String(width));
    return u.toString();
  } catch {
    return url;
  }
}
