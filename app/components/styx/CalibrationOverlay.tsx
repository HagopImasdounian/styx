import {useEffect, useRef, useState} from 'react';
import {STYX, FONT} from './constants';
import {useScaleCalibration} from '~/context/ScaleCalibrationContext';
import {CARD_LONG_MM, CARD_SHORT_MM} from '~/lib/chains';

/**
 * One-time screen calibration. The user resizes the on-screen card until it
 * matches a real bank card / ID held to the glass, then we store
 * CSS-px-per-mm = matchedLongEdgePx / 85.6.
 *
 * A real ID-1 card (85.6mm long edge) is physically WIDER than most phones in
 * portrait, so on narrow screens we show the card UPRIGHT (long edge vertical)
 * where the tall axis has room; on wide screens it lies landscape. Either way
 * `longPx` is the 85.6mm edge and the calibration formula is identical.
 *
 * Landscape phones are short: a true-size card is ~300px tall, which leaves no
 * vertical room for controls stacked beneath it. So when the viewport is wide
 * but short we lay the controls BESIDE the card (there's plenty of horizontal
 * room) — letting the card grow all the way to true size while the slider and
 * buttons stay reachable. Rendered once, globally, in PageLayout.
 */
const SHORT_RATIO = CARD_SHORT_MM / CARD_LONG_MM; // ~0.63
const MIN = 120;
const CTRL_COL = 300; // width reserved for the controls column in side-by-side mode

export function CalibrationOverlay() {
  const {isOpen, closeCalibration, setCalibration, pxPerMm} = useScaleCalibration();

  // The card's LONG (85.6mm) edge, in CSS px — the thing being matched.
  const [longPx, setLongPx] = useState(330);
  const [maxPx, setMaxPx] = useState(820);
  const [portrait, setPortrait] = useState(false);
  const [side, setSide] = useState(false);
  const dragRef = useRef<{x: number; y: number; size: number} | null>(null);

  // On open: decide orientation & layout, cap the size to the available room,
  // seed a starting value.
  useEffect(() => {
    if (!isOpen) return;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
    // Narrow screens can't fit the card's long edge horizontally → stand it up.
    const isPortrait = vw < 540;
    // Wide-but-short (landscape phone): put controls beside the card.
    const sideBySide = !isPortrait && vh < 620;
    setPortrait(isPortrait);
    setSide(sideBySide);

    let cap: number;
    if (isPortrait) {
      // Long edge is vertical; height-bound, minus heading/controls below.
      cap = Math.min(Math.round(vh - 280), 680);
    } else if (sideBySide) {
      // Card height = long × ratio must fit the (short) viewport; width is
      // whatever's left after the controls column. Lets it reach true size.
      const byHeight = Math.round((vh - 48) / SHORT_RATIO);
      const byWidth = Math.round(vw - CTRL_COL - 48);
      cap = Math.min(byHeight, byWidth, 1100);
    } else {
      // Roomy desktop: width-bound.
      cap = Math.min(Math.round(vw * 0.96), 1100);
    }
    setMaxPx(cap);

    // Start near the available size so matching a real card is mostly
    // *shrinking* the outline (easy) instead of dragging it bigger toward the
    // screen edge (the hard, finger-runs-off motion phones suffer from). On
    // landscape phones the old 0.7 seed felt far too small. Reuse a saved scale.
    const factor = isPortrait ? 0.82 : sideBySide ? 0.9 : 0.72;
    const seed = pxPerMm ? Math.round(pxPerMm * CARD_LONG_MM) : Math.round(cap * factor);
    setLongPx(Math.max(MIN, Math.min(cap, seed)));
  }, [isOpen, pxPerMm]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const clamp = (v: number) => Math.max(MIN, Math.min(maxPx, v));
  const shortPx = longPx * SHORT_RATIO;
  const cardW = portrait ? shortPx : longPx;
  const cardH = portrait ? longPx : shortPx;
  const radius = longPx * 0.037; // ~3.18mm corner radius, proportional

  // Corner-drag resize: in portrait the long edge is vertical (track clientY),
  // in landscape it's horizontal (track clientX). Card is centred → ×2.
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {x: e.clientX, y: e.clientY, size: longPx};
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const delta = portrait
      ? e.clientY - dragRef.current.y
      : e.clientX - dragRef.current.x;
    setLongPx(clamp(dragRef.current.size + delta * 2));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const confirm = () => setCalibration(longPx / CARD_LONG_MM);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Calibrate your screen"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCalibration();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: side ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: side ? 28 : 20,
        padding: side ? 16 : 20,
        background: 'rgba(26,24,21,0.72)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        overflow: 'auto',
      }}
    >
      {/* The card being matched */}
      <div
        style={{
          width: cardW,
          height: cardH,
          borderRadius: radius,
          border: `2px dashed ${STYX.goldLight}`,
          background: 'rgba(239,234,224,0.06)',
          position: 'relative',
          flexShrink: 0,
          touchAction: 'none',
        }}
      >
        {/* faux chip for "card" legibility (sits near a corner) */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '8%',
            width: shortPx * 0.22,
            height: shortPx * 0.16,
            borderRadius: radius * 0.5,
            border: `1px solid rgba(212,180,120,0.55)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 4,
            textAlign: 'center',
            color: STYX.goldLight,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            Match your card
          </span>
          <span style={{fontFamily: FONT.mono, fontSize: 8, opacity: 0.8}}>
            85.6 × 54 mm
          </span>
        </div>
        {/* drag handle, bottom-right */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-hidden
          style={{
            position: 'absolute',
            right: -13,
            bottom: -13,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: STYX.gold,
            border: `2px solid ${STYX.bone}`,
            cursor: portrait ? 'ns-resize' : 'ew-resize',
            touchAction: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        />
      </div>

      {/* Controls — below the card (column) or beside it (landscape phone). */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: side ? 16 : 20,
          width: side ? CTRL_COL : 'auto',
          maxWidth: side ? CTRL_COL : '100%',
          flexShrink: 0,
        }}
      >
        {/* Heading */}
        <div style={{textAlign: 'center', maxWidth: 460}}>
          <div
            style={{
              fontFamily: FONT.cinzel,
              fontSize: side ? 17 : 20,
              fontWeight: 500,
              letterSpacing: '0.08em',
              color: STYX.bone,
              marginBottom: 8,
            }}
          >
            Calibrate Your Screen
          </div>
          <div
            style={{
              fontFamily: FONT.cormorant,
              fontSize: side ? 15 : 17,
              color: 'rgba(239,234,224,0.82)',
              lineHeight: 1.4,
            }}
          >
            Hold any bank card or ID {portrait ? 'upright' : 'flat'} against the
            screen and resize the outline until it matches the card exactly.
          </div>
        </div>

        {/* Size control. The slider is deliberately NARROWER than the screen so
            both thumb extremes stay well inside the edges — your finger reaches
            full/empty without sliding off the side of the phone — and a shorter
            track means more size change per unit of travel (more sensitive). The
            fine +/– buttons are grouped in the centre, not pinned to the edges
            where they were hard to thumb. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            width: '100%',
          }}
        >
          <input
            type="range"
            min={MIN}
            max={maxPx}
            step={1}
            value={longPx}
            onChange={(e) => setLongPx(clamp(parseInt(e.target.value, 10)))}
            aria-label="Card size"
            style={{
              width: side ? '88%' : 'min(64vw, 320px)',
              accentColor: STYX.gold,
              cursor: 'pointer',
            }}
          />
          <div style={{display: 'flex', gap: 16, alignItems: 'center'}}>
            <StepBtn label="–" onClick={() => setLongPx(clamp(longPx - 1))} />
            <StepBtn label="+" onClick={() => setLongPx(clamp(longPx + 1))} />
          </div>
        </div>

        {/* Actions */}
        <div style={{display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center'}}>
          <button
            type="button"
            onClick={confirm}
            style={{
              padding: '13px 30px',
              background: STYX.gold,
              color: STYX.ink,
              border: 'none',
              fontFamily: FONT.cinzel,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            That&rsquo;s a match ✓
          </button>
          <button
            type="button"
            onClick={closeCalibration}
            style={{
              padding: '13px 18px',
              background: 'none',
              border: 'none',
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(239,234,224,0.7)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>

        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: '0.08em',
            color: 'rgba(239,234,224,0.5)',
            textAlign: 'center',
            maxWidth: 360,
          }}
        >
          {portrait
            ? 'Hold your card upright and line its long side up with the outline.'
            : 'Line your card up edge-to-edge with the dashed outline.'}
        </div>
      </div>
    </div>
  );
}

function StepBtn({label, onClick}: {label: string; onClick: () => void}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label === '+' ? 'Larger' : 'Smaller'}
      style={{
        width: 44,
        height: 44,
        flexShrink: 0,
        borderRadius: '50%',
        border: `1px solid ${STYX.goldLight}`,
        background: 'rgba(239,234,224,0.06)',
        color: STYX.goldLight,
        fontSize: 22,
        lineHeight: 1,
        cursor: 'pointer',
        touchAction: 'manipulation',
      }}
    >
      {label}
    </button>
  );
}
