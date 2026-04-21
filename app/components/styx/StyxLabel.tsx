import {STYX, FONT} from './constants';

export function StyxLabel({children}: {children: React.ReactNode}) {
  return (
    <div
      style={{
        fontFamily: FONT.cinzel,
        fontSize: 11,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color: STYX.gold,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}
