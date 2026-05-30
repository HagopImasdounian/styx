import {useWishlist} from '~/context/WishlistContext';
import {STYX, FONT} from './constants';

export function WishlistButton({
  handle,
  compact = false,
}: {
  handle: string;
  compact?: boolean;
}) {
  const {toggle, has} = useWishlist();
  const isActive = has(handle);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(handle);
      }}
      title={isActive ? 'Remove from wishlist' : 'Save to wishlist'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 0 : 6,
        padding: compact ? '6px 8px' : '8px 14px',
        border: `1px solid ${isActive ? STYX.gold : STYX.line}`,
        background: isActive ? 'rgba(184,146,74,0.08)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: FONT.mono,
        fontSize: 9,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: isActive ? STYX.gold : STYX.silt,
      }}
    >
      {/* Heart icon */}
      <svg
        width={compact ? 14 : 16}
        height={compact ? 14 : 16}
        viewBox="0 0 22 20"
        fill={isActive ? STYX.gold : 'none'}
        stroke={isActive ? STYX.gold : 'currentColor'}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 18.5C11 18.5 1.5 13 1.5 6.5C1.5 3.46 3.96 1 7 1C8.8 1 10.37 1.89 11 3.18C11.63 1.89 13.2 1 15 1C18.04 1 20.5 3.46 20.5 6.5C20.5 13 11 18.5 11 18.5Z" />
      </svg>
      {!compact && <span>{isActive ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
