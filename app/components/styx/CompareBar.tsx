import {useCompare} from '~/context/CompareContext';
import {Link} from 'react-router';
import {STYX, FONT} from './constants';

export function CompareBar() {
  const {handles, remove, clear} = useCompare();

  if (handles.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: STYX.ink,
        borderTop: `1px solid rgba(184,146,74,0.3)`,
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      {/* Left: item count + handles */}
      <div style={{display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0}}>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: STYX.gold,
            flexShrink: 0,
          }}
        >
          {handles.length}/4
        </span>

        {/* Chips */}
        <div style={{display: 'flex', gap: 8, overflow: 'hidden', flexWrap: 'wrap'}}>
          {handles.map((handle) => (
            <div
              key={handle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid rgba(255,255,255,0.1)`,
                padding: '4px 10px',
                maxWidth: 180,
              }}
            >
              <span
                style={{
                  fontFamily: FONT.inter,
                  fontSize: 10,
                  color: STYX.bone,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {handle.replace(/-/g, ' ')}
              </span>
              <button
                type="button"
                onClick={() => remove(handle)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right: actions */}
      <div style={{display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0}}>
        <button
          type="button"
          onClick={clear}
          style={{
            background: 'none',
            border: 'none',
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            padding: '6px 8px',
          }}
        >
          Clear
        </button>

        <Link
          to={`/compare?products=${handles.join(',')}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: STYX.gold,
            color: STYX.ink,
            fontFamily: FONT.cinzel,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}
        >
          Compare Now
        </Link>
      </div>
    </div>
  );
}
