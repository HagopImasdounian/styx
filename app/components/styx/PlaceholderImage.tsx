import {STYX, FONT} from './constants';
import {Obol} from './Obol';

export function PlaceholderImage({
  aspect = '4/5',
  label,
  tone = 'warm',
  style,
}: {
  aspect?: string;
  label?: string;
  tone?: 'warm' | 'stone' | 'dark' | 'silt';
  style?: React.CSSProperties;
}) {
  const tones = {
    warm: {base: '#E0E0DC', stripe: 'rgba(26,27,28,0.04)'},
    stone: {base: '#D4D4D0', stripe: 'rgba(26,27,28,0.05)'},
    dark: {base: STYX.taupeDeep, stripe: 'rgba(255,255,255,0.05)'},
    silt: {base: '#C8C8C4', stripe: 'rgba(26,27,28,0.04)'},
  };
  const t = tones[tone] || tones.warm;
  const isDark = tone === 'dark';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: aspect,
        background: t.base,
        backgroundImage: `repeating-linear-gradient(90deg, transparent 0 24px, ${t.stripe} 24px 25px)`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {/* Marble swoosh */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? `radial-gradient(ellipse 80% 50% at 30% 30%, rgba(168,146,92,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 75% 70%, rgba(168,146,92,0.04) 0%, transparent 55%)`
            : `radial-gradient(ellipse 80% 50% at 30% 30%, rgba(255,255,255,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 75% 70%, rgba(26,27,28,0.05) 0%, transparent 55%)`,
          pointerEvents: 'none',
        }}
      />
      {/* Center: obol + label */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          opacity: 0.7,
        }}
      >
        <Obol
          size={44}
          color={isDark ? STYX.gold : 'rgba(26,27,28,0.5)'}
          speed={6}
          flyIn
        />
        {label && (
          <div
            style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: isDark
                ? 'rgba(235,235,232,0.75)'
                : 'rgba(26,27,28,0.55)',
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
