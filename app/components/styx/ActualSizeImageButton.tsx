import {STYX, FONT} from './constants';
import {useScaleCalibration} from '~/context/ScaleCalibrationContext';

/**
 * Overlay button pinned to the product lead image. Toggles the site-wide
 * actual-size state: when on, the lead photo is swapped IN PLACE for the
 * true-size ActualSizeImagePanel (no scrolling anywhere); tapping again
 * restores the photo.
 */
export function ActualSizeImageButton() {
  const {actualSizeOn, setActualSizeOn} = useScaleCalibration();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={actualSizeOn}
      onClick={(e) => {
        e.stopPropagation();
        setActualSizeOn(!actualSizeOn);
      }}
      style={{
        position: 'absolute',
        bottom: 18,
        right: 18,
        zIndex: 3,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderRadius: 999,
        border: `1px solid ${actualSizeOn ? STYX.gold : STYX.line}`,
        background: actualSizeOn ? STYX.gold : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
        cursor: 'pointer',
        fontFamily: FONT.mono,
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: actualSizeOn ? '#fff' : STYX.ink,
        transition: 'background 140ms, border-color 140ms, color 140ms',
      }}
    >
      {/* ruler / scale glyph */}
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
      {actualSizeOn ? 'Actual size: on' : 'View actual size'}
    </button>
  );
}
