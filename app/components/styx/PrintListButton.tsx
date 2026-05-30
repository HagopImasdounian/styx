import {usePrintList} from '~/context/PrintListContext';
import {STYX, FONT} from './constants';

export function PrintListButton({
  handle,
  compact = false,
}: {
  handle: string;
  compact?: boolean;
}) {
  const {add, remove, has, isFull} = usePrintList();
  const isActive = has(handle);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isActive) {
          remove(handle);
        } else if (!isFull) {
          add(handle);
        }
      }}
      title={
        isActive
          ? 'Remove from print list'
          : isFull
            ? 'Print list full (8 max)'
            : 'Add to print-to-scale list'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 0 : 6,
        padding: compact ? '6px 8px' : '8px 14px',
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
      {/* Ruler icon — distinct from Compare's balance scale */}
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
        <rect x="2" y="8" width="20" height="8" rx="1" />
        <path d="M6 8v3M10 8v4M14 8v3M18 8v4" />
      </svg>
      {!compact && <span>{isActive ? 'On Print List' : 'Add to Print'}</span>}
    </button>
  );
}
