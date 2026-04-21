import {STYX} from './constants';

export function StoneBg({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: 'relative',
        background: STYX.bone,
        ...style,
      }}
    >
      {/* Marble texture radial gradients */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 800px 600px at 20% 30%, rgba(232,225,210,0.6) 0%, transparent 70%),
            radial-gradient(ellipse 600px 400px at 80% 70%, rgba(232,225,210,0.4) 0%, transparent 70%),
            radial-gradient(ellipse 400px 300px at 50% 50%, rgba(245,242,234,0.3) 0%, transparent 60%)
          `,
        }}
      />
      {/* Faint vertical column slats */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.025,
          backgroundImage: `repeating-linear-gradient(
            90deg,
            ${STYX.ink} 0px,
            ${STYX.ink} 1px,
            transparent 1px,
            transparent 120px
          )`,
        }}
      />
      <div style={{position: 'relative', zIndex: 1}}>{children}</div>
    </div>
  );
}
