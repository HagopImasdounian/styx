import {useCompare} from '~/context/CompareContext';
import {STYX, FONT} from './constants';

export function CompareButton({
  handle,
  length = null,
  compact = false,
}: {
  handle: string;
  /** Price-affecting variant length (e.g. "18\""). Distinguishes variants of the same chain. */
  length?: string | null;
  compact?: boolean;
}) {
  const {add, remove, has, isFull} = useCompare();
  const isActive = has(handle, length);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isActive) {
          remove(handle, length);
        } else if (!isFull) {
          add(handle, length);
        }
      }}
      title={isActive ? 'Remove from comparison' : isFull ? 'Compare list full (4 max)' : 'Add to compare'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 0 : 6,
        padding: compact ? '9px 10px' : '8px 14px',
        border: `1px solid ${isActive ? STYX.gold : STYX.line}`,
        background: isActive ? 'rgba(184,146,74,0.08)' : 'transparent',
        cursor: isFull && !isActive ? 'not-allowed' : 'pointer',
        opacity: isFull && !isActive ? 0.4 : 1,
        transition: 'all 0.2s ease',
        fontFamily: FONT.mono,
        fontSize: 9,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: isActive ? STYX.gold : STYX.silt,
      }}
    >
      {/* Scale icon */}
      <svg
        width={compact ? 14 : 16}
        height={compact ? 14 : 16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v18" />
        <path d="M5 7l-3 9h6L5 7z" />
        <path d="M19 7l-3 9h6l-3-9z" />
        <path d="M5 7h14" />
      </svg>
      {!compact && (
        <span>{isActive ? 'Added' : 'Compare'}</span>
      )}
    </button>
  );
}
