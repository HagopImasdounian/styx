import {STYX, FONT} from './constants';

type Variant = 'primary' | 'ghost' | 'gold';

export function CTAButton({
  children,
  variant = 'primary',
  href,
  onClick,
  style,
}: {
  children: React.ReactNode;
  variant?: Variant;
  href?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    fontFamily: FONT.cinzel,
    fontSize: 11,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  };

  const variants: Record<Variant, React.CSSProperties> = {
    primary: {
      ...base,
      border: `1px solid ${STYX.ink}`,
      background: 'transparent',
      color: STYX.ink,
      padding: '14px 36px',
    },
    ghost: {
      ...base,
      border: 'none',
      background: 'transparent',
      color: STYX.silt,
      padding: '14px 24px',
      borderBottom: `1px solid ${STYX.line}`,
    },
    gold: {
      ...base,
      border: `1px solid ${STYX.gold}`,
      background: 'transparent',
      color: STYX.gold,
      padding: '14px 36px',
    },
  };

  const s = {...variants[variant], ...style};

  if (href) {
    return (
      <a href={href} style={s}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} style={s}>
      {children}
    </button>
  );
}
