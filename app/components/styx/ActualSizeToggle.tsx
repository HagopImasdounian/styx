import {STYX, FONT} from './constants';
import {useScaleCalibration} from '~/context/ScaleCalibrationContext';

/**
 * Toggles the site-wide "show actual size on this screen" state. If the screen
 * isn't calibrated yet, flipping it on opens the calibration overlay first and
 * enables on success (handled in the context).
 */
export function ActualSizeToggle({label = 'Actual size'}: {label?: string}) {
  const {actualSizeOn, setActualSizeOn} = useScaleCalibration();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actualSizeOn}
      onClick={() => setActualSizeOn(!actualSizeOn)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        border: `1px solid ${actualSizeOn ? STYX.gold : STYX.line}`,
        background: actualSizeOn ? 'rgba(184,146,74,0.08)' : 'transparent',
        cursor: 'pointer',
        fontFamily: FONT.mono,
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: actualSizeOn ? STYX.goldDeep : STYX.silt,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 26,
          height: 14,
          borderRadius: 8,
          background: actualSizeOn ? STYX.gold : STYX.line,
          position: 'relative',
          transition: 'background 120ms',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: actualSizeOn ? 14 : 2,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 120ms',
          }}
        />
      </span>
      {label}
    </button>
  );
}
