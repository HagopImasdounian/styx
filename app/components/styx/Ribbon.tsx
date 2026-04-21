import {STYX, FONT} from './constants';

const ITEMS = [
  'Solid gold · 10k & 14k',
  'Every piece weighed & tested',
  'Transparent pricing',
  'Launch: 1g free per $1.5k spent',
  'Meets or exceeds stamped karat',
];

// Triple for seamless loop
const TRIPLE = [...ITEMS, ...ITEMS, ...ITEMS];

export function Ribbon() {
  return (
    <div
      style={{
        background: STYX.parchment,
        borderTop: `1px solid ${STYX.line}`,
        borderBottom: `1px solid ${STYX.line}`,
        overflow: 'hidden',
        padding: '16px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          animation: 'styx-marquee 30s linear infinite',
          width: 'fit-content',
        }}
      >
        {TRIPLE.map((item, i) => (
          <span
            key={i}
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 12,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: STYX.ink,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0,
            }}
          >
            <span style={{padding: '0 24px'}}>{item}</span>
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: STYX.gold,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
