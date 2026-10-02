import {FONT} from './constants';
import {useScaleCalibration} from '~/context/ScaleCalibrationContext';
import {usePrintList} from '~/context/PrintListContext';

/**
 * True-size tool cluster pinned to the bottom edge of the product lead image
 * (desktop lead photo, the mobile carousel's first slide, and the actual-size
 * panel that swaps in for the photo, so "Back to photo" sits exactly where
 * "View actual size" was).
 *
 * Bottom edge is the safe zone: the year/origin badge lives top-left, the
 * carousel counter top-right, and the chain runs horizontally through the
 * middle of most photos.
 */
export function TrueSizeControls({
  handle,
  showHint,
  onInteract,
}: {
  /** Product handle for the print list. Omit to hide the print pill. */
  handle?: string;
  /** Helper line under the pills; the parent hides it after the first tap. */
  showHint?: boolean;
  onInteract?: () => void;
}) {
  const {actualSizeOn, setActualSizeOn} = useScaleCalibration();
  const printList = usePrintList();
  const onPrintList = handle ? printList.has(handle) : false;
  const printFull = printList.isFull && !onPrintList;

  return (
    <div
      className="styx-true-size-controls"
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        // Let taps on the bare photo fall through; only the pills catch them.
        pointerEvents: 'none',
      }}
    >
      <div
        className="styx-true-size-pills"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          pointerEvents: 'auto',
        }}
      >
        <Pill
          active={actualSizeOn}
          role="switch"
          ariaChecked={actualSizeOn}
          title={
            actualSizeOn
              ? 'Show the product photo again'
              : 'Show this chain at its real width on your screen'
          }
          onClick={() => {
            setActualSizeOn(!actualSizeOn);
            onInteract?.();
          }}
          icon={
            actualSizeOn ? (
              // photo glyph
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="3" y="4" width="18" height="16" rx="1" />
                <circle cx="9" cy="10" r="2" />
                <path d="M21 16l-5-5-9 9" />
              </svg>
            ) : (
              // ruler glyph
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="2" y="7" width="20" height="10" rx="1" />
                <path d="M7 7v3M12 7v4M17 7v3" />
              </svg>
            )
          }
        >
          {actualSizeOn ? 'Back to photo' : 'View actual size'}
        </Pill>

        {handle && (
          <Pill
            active={onPrintList}
            disabled={printFull}
            ariaPressed={onPrintList}
            title={
              onPrintList
                ? 'Remove from print list'
                : printFull
                  ? 'Print list full (8 max)'
                  : 'Add to the 1:1 print sheet'
            }
            onClick={() => {
              if (onPrintList) printList.remove(handle);
              else if (!printFull) printList.add(handle);
              onInteract?.();
            }}
            icon={
              // printer glyph
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 9V3h12v6" />
                <rect x="3" y="9" width="18" height="8" rx="1" />
                <path d="M7 14h10v7H7z" />
              </svg>
            }
          >
            {onPrintList ? 'On print list' : 'Download print'}
          </Pill>
        )}
      </div>

      {showHint && !actualSizeOn && !onPrintList && (
        <div
          style={{
            fontFamily: FONT.inter,
            fontSize: 11,
            lineHeight: 1.4,
            color: '#46484a',
            background: 'rgba(244,244,242,0.92)',
            padding: '4px 10px',
            borderRadius: 3,
            maxWidth: '100%',
            pointerEvents: 'none',
          }}
        >
          See it at true size on your screen, or print it 1:1.
        </div>
      )}
    </div>
  );
}

function Pill({
  active,
  disabled,
  role,
  ariaChecked,
  ariaPressed,
  title,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  role?: 'switch';
  ariaChecked?: boolean;
  ariaPressed?: boolean;
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === 'switch' ? ariaChecked : undefined}
      aria-pressed={role ? undefined : ariaPressed}
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 44,
        padding: '0 16px',
        borderRadius: 3,
        border: `1px solid ${active ? '#7d6a3f' : 'var(--styx-border)'}`,
        boxShadow: active ? 'inset 0 0 0 1px #7d6a3f' : 'none',
        background: active ? '#ffffff' : 'rgba(244,244,242,0.94)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: FONT.inter,
        fontSize: 12,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        color: active ? '#1e2021' : '#1a1b1c',
        transition: 'border-color 140ms, color 140ms',
      }}
    >
      <span style={{display: 'inline-flex', color: active ? '#7d6a3f' : '#1a1b1c'}}>
        {icon}
      </span>
      {children}
    </button>
  );
}
