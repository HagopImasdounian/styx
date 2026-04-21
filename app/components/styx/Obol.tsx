import {useId} from 'react';
import {STYX} from './constants';

/**
 * The Obol — a 3D wireframe coin.
 * Uses CSS 3D transforms: front/back faces separated on Z-axis,
 * with stacked edge rings between them for visible thickness at 90°.
 * Flips on X-axis (coin-toss motion: top tilts back).
 */
export function Obol({
  size = 56,
  color = STYX.gold,
  speed = 4,
  spin = true,
  flyIn = false,
  style,
}: {
  size?: number;
  color?: string;
  speed?: number;
  spin?: boolean;
  flyIn?: boolean;
  style?: React.CSSProperties;
}) {
  const id = useId();
  const teeth = 60;
  const thickness = Math.max(4, Math.round(size * 0.14));
  const halfT = thickness / 2;
  const edgeLayers = Math.max(8, thickness);

  const coinFaceSvg = (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <radialGradient id={`obol-face-${id}`} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="70%" stopColor={color} stopOpacity="0.1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill={`url(#obol-face-${id})`} />
      {Array.from({length: teeth}).map((_, i) => {
        const a = (i * (360 / teeth) * Math.PI) / 180;
        return (
          <line
            key={`t-${i}`}
            x1={50 + Math.cos(a) * 45.5} y1={50 + Math.sin(a) * 45.5}
            x2={50 + Math.cos(a) * 48} y2={50 + Math.sin(a) * 48}
            stroke={color} strokeWidth="0.6"
          />
        );
      })}
      <circle cx="50" cy="50" r="45.5" fill="none" stroke={color} strokeWidth="0.9" />
      <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="0.9" />
      <circle cx="50" cy="50" r="38.5" fill="none" stroke={color} strokeWidth="0.4" opacity="0.55" />
      {Array.from({length: 11}).map((_, i) => {
        const a = ((-140 + i * 8) * Math.PI) / 180;
        return (
          <circle key={`d-${i}`} cx={50 + Math.cos(a) * 34} cy={50 + Math.sin(a) * 34} r="0.6" fill={color} opacity="0.8" />
        );
      })}
      <text x="50" y="28" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="5.5" fill={color} letterSpacing="1.5" opacity="0.85">ΣΤΥΞ</text>
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M 30,52 Q 50,38 70,52 Q 50,66 30,52 Z" strokeWidth="1.2" />
        <path d="M 32,53 Q 50,64 68,53" strokeWidth="0.5" opacity="0.55" />
        <circle cx="50" cy="52" r="7" strokeWidth="1" />
        <circle cx="50" cy="52" r="3" fill={color} />
        <circle cx="52" cy="50" r="0.9" fill={color === STYX.bone ? STYX.ink : STYX.bone} opacity="0.9" />
        <line x1="30" y1="52" x2="26" y2="52" strokeWidth="0.7" />
        <line x1="70" y1="52" x2="74" y2="52" strokeWidth="0.7" />
        <line x1="38" y1="43" x2="36" y2="40" strokeWidth="0.5" opacity="0.7" />
        <line x1="50" y1="40" x2="50" y2="37" strokeWidth="0.5" opacity="0.7" />
        <line x1="62" y1="43" x2="64" y2="40" strokeWidth="0.5" opacity="0.7" />
      </g>
      <text x="50" y="80" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="4.5" fill={color} letterSpacing="1" opacity="0.75">· OBOL ·</text>
    </svg>
  );

  // The 3D coin internals: front face, back face, and edge rings all on Z-axis.
  // The parent rotates on X-axis, so at 90° you see the Z-depth edge.
  const coinInternals = (
    <>
      {/* FRONT face — pushed forward on Z */}
      <div style={{
        position: 'absolute' as const, inset: 0,
        backfaceVisibility: 'hidden' as const,
        transform: `translateZ(${halfT}px)`,
      }}>
        {coinFaceSvg}
      </div>
      {/* BACK face — pushed back on Z, flipped so it reads correctly from behind */}
      <div style={{
        position: 'absolute' as const, inset: 0,
        backfaceVisibility: 'hidden' as const,
        transform: `translateZ(-${halfT}px) rotateX(180deg)`,
      }}>
        {coinFaceSvg}
      </div>
      {/* EDGE — stacked rings across Z depth, visible at 90° */}
      {Array.from({length: edgeLayers}).map((_, i) => {
        const z = halfT - (i / (edgeLayers - 1)) * thickness;
        const shade = 0.3 + (i / (edgeLayers - 1)) * 0.5;
        return (
          <div
            key={`e-${i}`}
            style={{
              position: 'absolute' as const,
              inset: 0,
              transform: `translateZ(${z}px)`,
              borderRadius: '50%',
              boxShadow: `inset 0 0 0 1px ${color}`,
              opacity: shade,
              pointerEvents: 'none' as const,
            }}
          />
        );
      })}
    </>
  );

  if (flyIn) {
    const FLYIN_MS = 2200;
    return (
      <div style={{width: size, height: size, display: 'inline-block', perspective: `${size * 8}px`, isolation: 'isolate' as const, ...style}}>
        {/* Outer: one-shot fly-in */}
        <div style={{
          width: '100%', height: '100%',
          transformStyle: 'preserve-3d' as const,
          animation: `styx-coin-flyin ${FLYIN_MS}ms cubic-bezier(.2,.7,.25,1) both`,
        }}>
          {/* Inner: continuous flip after fly-in */}
          <div style={{
            width: '100%', height: '100%',
            transformStyle: 'preserve-3d' as const,
            animation: spin ? `styx-coinflip ${speed}s linear ${FLYIN_MS}ms infinite` : 'none',
          }}>
            {coinInternals}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{width: size, height: size, display: 'inline-block', perspective: `${size * 8}px`, isolation: 'isolate' as const, ...style}}>
      <div style={{
        position: 'relative' as const,
        width: '100%', height: '100%',
        transformStyle: 'preserve-3d' as const,
        animation: spin ? `styx-coinflip ${speed}s cubic-bezier(.5,.05,.5,.95) infinite` : 'none',
      }}>
        {coinInternals}
      </div>
    </div>
  );
}
