import {STYX, FONT} from './constants';

/**
 * Section eyebrow. `greek` adds a small ancient-Greek gloss after the Latin
 * label (Styx is named for the river; the glosses are decorative and hidden
 * from assistive tech). Rendered in the mono face, whose subset carries the
 * Greek block; Cinzel does not.
 */
export function StyxLabel({
  children,
  greek,
  light = false,
}: {
  children: React.ReactNode;
  greek?: string;
  /** On dark imagery: pale gold label, pale gloss. */
  light?: boolean;
}) {
  return (
    <div
      style={{
        fontFamily: FONT.cinzel,
        fontSize: 11,
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color: light ? STYX.goldLight : STYX.gold,
        marginBottom: 12,
        display: 'flex',
        alignItems: 'baseline',
        gap: 14,
        flexWrap: 'wrap',
      }}
    >
      <span>{children}</span>
      {greek && (
        <GreekGloss color={light ? 'rgba(236,235,231,0.6)' : undefined}>
          {greek}
        </GreekGloss>
      )}
    </div>
  );
}

/** Decorative ancient-Greek gloss, e.g. ΧΡΥΣΟΣ next to "The gold". */
export function GreekGloss({
  children,
  size = 9,
  color = STYX.goldDeep,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
}) {
  return (
    <span
      lang="el"
      aria-hidden="true"
      style={{
        fontFamily: FONT.mono,
        fontSize: size,
        letterSpacing: '0.32em',
        color,
        opacity: 0.85,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
