import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {FONT} from './constants';

export type LightboxImage = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_RADIUS = 30;
const FADE_MS = 160;

const CTRL: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.9)',
  border: '1px solid rgba(26,24,21,0.14)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  cursor: 'pointer',
  color: '#1A1815',
  zIndex: 2,
};
const BAR_BTN: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 999,
  border: 'none',
  background: 'transparent',
  color: '#1A1815',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

/** Upgrade a Shopify CDN URL to the highest resolution we serve (2048px). */
function highResUrl(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete('height');
    u.searchParams.set('width', '2048');
    return u.toString();
  } catch {
    return url;
  }
}

type Gesture =
  | {
      type: 'pinch';
      startDist: number;
      startMid: {x: number; y: number};
      startScale: number;
      startTx: number;
      startTy: number;
      layout: {x: number; y: number};
    }
  | {
      type: 'pan';
      start: {x: number; y: number};
      startTx: number;
      startTy: number;
    };

/**
 * Full-screen image lightbox with pinch-zoom + pan (Pointer Events),
 * double-tap zoom, wheel zoom and drag pan. Renders nothing until `image`
 * is set. Closes on overlay tap (not image tap), the X button, or Escape.
 */
export function ImageLightbox({
  image,
  images,
  startIndex = 0,
  onClose,
}: {
  /** The image to show (opens the viewer when set). */
  image: LightboxImage | null;
  /** Optional full set to step through with arrows / ← →. */
  images?: LightboxImage[];
  /** Index of `image` inside `images`. */
  startIndex?: number;
  onClose: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocus = useRef<Element | null>(null);
  const reducedMotion = useRef(false);
  const closing = useRef(false);

  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [transform, setTransform] = useState({scale: 1, tx: 0, ty: 0});

  // Gesture state lives in refs so pointer math never waits on a render.
  const tRef = useRef({scale: 1, tx: 0, ty: 0});
  const pointers = useRef(new Map<number, {x: number; y: number}>());
  const gesture = useRef<Gesture | null>(null);
  const lastTap = useRef<{t: number; x: number; y: number} | null>(null);
  const moved = useRef(false);

  const [idx, setIdx] = useState(startIndex);
  const set = images && images.length > 1 ? images : null;
  const current = set ? set[Math.min(idx, set.length - 1)] : image;
  const open = !!image;
  const url = current?.url;
  const lastPointerType = useRef<string>('mouse');
  const downOnImage = useRef(false);

  // Re-sync the index every time the viewer opens on a (possibly new) image.
  useEffect(() => {
    if (open) setIdx(startIndex);
  }, [open, startIndex]);

  const goTo = (i: number) => {
    if (!set) return;
    setIdx((i + set.length) % set.length);
  };

  function apply(next: {scale: number; tx: number; ty: number}) {
    tRef.current = next;
    setTransform(next);
  }

  function clampScale(s: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
  }

  /** Zoom so the screen point stays fixed (transform-origin is 0 0). */
  function zoomAt(
    point: {x: number; y: number},
    nextScale: number,
    smooth = false,
  ) {
    const img = imgRef.current;
    if (!img) return;
    const t = tRef.current;
    const rect = img.getBoundingClientRect();
    // Untransformed layout origin: translate moves the box, scale(0 0) doesn't.
    const px = point.x - (rect.left - t.tx);
    const py = point.y - (rect.top - t.ty);
    const s = clampScale(nextScale);
    const k = s / t.scale;
    const tx = s === MIN_SCALE ? 0 : px - k * (px - t.tx);
    const ty = s === MIN_SCALE ? 0 : py - k * (py - t.ty);
    setAnimate(smooth && !reducedMotion.current);
    apply({scale: s, tx, ty});
  }

  /** (Re)baseline the active gesture from whatever pointers remain. */
  function startGesture() {
    const img = imgRef.current;
    const t = tRef.current;
    if (!img) {
      gesture.current = null;
      return;
    }
    const pts = [...pointers.current.values()];
    if (pts.length >= 2) {
      const [a, b] = pts;
      const rect = img.getBoundingClientRect();
      gesture.current = {
        type: 'pinch',
        startDist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
        startMid: {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2},
        startScale: t.scale,
        startTx: t.tx,
        startTy: t.ty,
        layout: {x: rect.left - t.tx, y: rect.top - t.ty},
      };
    } else if (pts.length === 1 && t.scale > 1) {
      gesture.current = {
        type: 'pan',
        start: {...pts[0]},
        startTx: t.tx,
        startTy: t.ty,
      };
    } else {
      gesture.current = null;
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    stageRef.current?.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, {x: e.clientX, y: e.clientY});
    moved.current = false;
    lastPointerType.current = e.pointerType;
    // Pointer capture retargets the later click to the stage, so remember
    // here whether the press began on the photo.
    downOnImage.current = e.target === imgRef.current;
    setAnimate(false);

    if (pointers.current.size === 1 && e.pointerType !== 'mouse') {
      // Double-tap (or double-click) toggles 1x <-> 2.5x at the tap point.
      const now = Date.now();
      const lt = lastTap.current;
      if (
        lt &&
        now - lt.t < DOUBLE_TAP_MS &&
        Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < DOUBLE_TAP_RADIUS
      ) {
        lastTap.current = null;
        gesture.current = null;
        const zoomedIn = tRef.current.scale > 1;
        zoomAt(
          {x: e.clientX, y: e.clientY},
          zoomedIn ? MIN_SCALE : DOUBLE_TAP_SCALE,
          true,
        );
        return;
      }
      lastTap.current = {t: now, x: e.clientX, y: e.clientY};
    }
    startGesture();
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, {x: e.clientX, y: e.clientY});
    const g = gesture.current;
    if (!g) return;
    if (Math.hypot(e.clientX - prev.x, e.clientY - prev.y) > 2)
      moved.current = true;

    if (g.type === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
      const s = clampScale(g.startScale * (dist / g.startDist));
      const k = s / g.startScale;
      // Scale around the starting pinch midpoint, then follow the midpoint.
      const px = g.startMid.x - g.layout.x;
      const py = g.startMid.y - g.layout.y;
      let tx = px - k * (px - g.startTx) + (mid.x - g.startMid.x);
      let ty = py - k * (py - g.startTy) + (mid.y - g.startMid.y);
      if (s === MIN_SCALE) {
        tx = 0;
        ty = 0;
      }
      apply({scale: s, tx, ty});
    } else if (g.type === 'pan') {
      apply({
        scale: tRef.current.scale,
        tx: g.startTx + (e.clientX - g.start.x),
        ty: g.startTy + (e.clientY - g.start.y),
      });
    }
  }

  function onPointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    startGesture();
  }

  function onStageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (moved.current) return; // a drag, not a tap
    if (downOnImage.current || e.target === imgRef.current) {
      // Mouse: one click zooms in where you clicked, the next zooms back out.
      // (Touch uses double-tap, handled in onPointerDown.)
      if (lastPointerType.current === 'mouse') {
        const zoomedIn = tRef.current.scale > 1;
        zoomAt(
          {x: e.clientX, y: e.clientY},
          zoomedIn ? MIN_SCALE : DOUBLE_TAP_SCALE,
          true,
        );
      }
      return;
    }
    requestClose();
  }

  function zoomStep(dir: 1 | -1) {
    const img = imgRef.current;
    if (!img) return;
    const r = img.getBoundingClientRect();
    const centre = {x: r.left + r.width / 2, y: r.top + r.height / 2};
    const next = dir > 0 ? tRef.current.scale * 1.5 : tRef.current.scale / 1.5;
    zoomAt(centre, next < 1.08 ? MIN_SCALE : next, true);
  }

  function resetZoom() {
    setAnimate(!reducedMotion.current);
    apply({scale: 1, tx: 0, ty: 0});
  }

  function requestClose() {
    if (closing.current || !open) return;
    if (reducedMotion.current) {
      onClose();
      return;
    }
    closing.current = true;
    setVisible(false);
    window.setTimeout(() => {
      closing.current = false;
      onClose();
    }, FADE_MS);
  }

  // Reset zoom whenever the lightbox opens or the image changes.
  useEffect(() => {
    if (!url) return;
    pointers.current.clear();
    gesture.current = null;
    tRef.current = {scale: 1, tx: 0, ty: 0};
    setTransform({scale: 1, tx: 0, ty: 0});
    setAnimate(false);
  }, [url]);

  // Open/close side effects: body scroll lock, focus, Escape, fade-in.
  useEffect(() => {
    if (!open) return;
    closing.current = false;
    prevFocus.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    reducedMotion.current =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    if (reducedMotion.current) {
      setVisible(true);
    } else {
      raf = requestAnimationFrame(() => setVisible(true));
    }
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        requestClose();
      } else if (e.key === 'ArrowRight') {
        goTo(idx + 1);
      } else if (e.key === 'ArrowLeft') {
        goTo(idx - 1);
      } else if (e.key === '+' || e.key === '=') {
        zoomStep(1);
      } else if (e.key === '-') {
        zoomStep(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      setVisible(false);
      (prevFocus.current as HTMLElement | null)?.focus?.();
    };
    // requestClose is stable enough here: it only reads refs + onClose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx, set?.length]);

  // Wheel zoom needs a non-passive native listener to preventDefault.
  useEffect(() => {
    if (!open) return;
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(
        {x: e.clientX, y: e.clientY},
        tRef.current.scale * Math.exp(-e.deltaY * 0.002),
      );
    };
    stage.addEventListener('wheel', onWheel, {passive: false});
    return () => stage.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!image || !current) return null;

  const alt = current.altText || '';
  const zoomedIn = transform.scale > 1;
  const fade = reducedMotion.current ? 'none' : `opacity ${FADE_MS}ms ease`;

  // Portal to <body>: the gallery ancestors create stacking contexts
  // (sticky buy-box column, hover-zoom transforms), which would cage the
  // overlay's z-index and let page content paint over it.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image viewer'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(247,245,240,0.78)',
        backdropFilter: 'blur(22px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(22px) saturate(1.1)',
        opacity: visible ? 1 : 0,
        transition: fade,
      }}
    >
      {/* Gesture stage, overlay tap closes, image tap doesn't */}
      <div
        ref={stageRef}
        role="presentation"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClick={onStageClick}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'none',
          overflow: 'hidden',
          cursor: zoomedIn ? 'grab' : 'zoom-in',
        }}
      >
        <img
          ref={imgRef}
          src={highResUrl(current.url)}
          alt={alt}
          draggable={false}
          style={{
            maxWidth: '94vw',
            maxHeight: '86vh',
            objectFit: 'contain',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            background: '#fff',
            transform: `translate3d(${transform.tx}px, ${transform.ty}px, 0) scale(${transform.scale})`,
            transformOrigin: '0 0',
            transition:
              animate && !reducedMotion.current
                ? 'transform 0.25s ease'
                : 'none',
            willChange: 'transform',
            userSelect: 'none',
          }}
        />
      </div>

      {/* Close, top right */}
      <button
        ref={closeRef}
        type="button"
        onClick={requestClose}
        aria-label="Close image viewer"
        style={{...CTRL, position: 'absolute', top: 14, right: 14}}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Prev / next between photos */}
      {set && (
        <>
          <button
            type="button"
            onClick={() => goTo(idx - 1)}
            aria-label="Previous image"
            style={{
              ...CTRL,
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M15 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => goTo(idx + 1)}
            aria-label="Next image"
            style={{
              ...CTRL,
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M9 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div
            style={{
              position: 'absolute',
              top: 24,
              left: 0,
              right: 0,
              textAlign: 'center',
              pointerEvents: 'none',
              fontFamily: FONT.mono,
              fontSize: 11,
              letterSpacing: '0.12em',
              color: 'rgba(26,24,21,0.7)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {idx + 1} / {set.length}
          </div>
        </>
      )}

      {/* Zoom bar: −  fit  + */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: alt ? 44 : 18,
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: 4,
          borderRadius: 999,
          background: 'rgba(26,24,21,0.72)',
          border: '1px solid rgba(239,234,224,0.16)',
        }}
      >
        <button
          type="button"
          onClick={() => zoomStep(-1)}
          aria-label="Zoom out"
          disabled={!zoomedIn}
          style={{...BAR_BTN, opacity: zoomedIn ? 1 : 0.4}}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 12h14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={resetZoom}
          aria-label="Fit to screen"
          style={{
            ...BAR_BTN,
            width: 'auto',
            padding: '0 12px',
            fontFamily: FONT.mono,
            fontSize: 11,
            letterSpacing: '0.08em',
          }}
        >
          {zoomedIn ? `${Math.round(transform.scale * 100)}%` : 'FIT'}
        </button>
        <button
          type="button"
          onClick={() => zoomStep(1)}
          aria-label="Zoom in"
          disabled={transform.scale >= MAX_SCALE}
          style={{...BAR_BTN, opacity: transform.scale >= MAX_SCALE ? 0.4 : 1}}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Caption */}
      {!!alt && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 14,
            textAlign: 'center',
            pointerEvents: 'none',
            fontFamily: FONT.mono,
            fontSize: 11,
            letterSpacing: '0.08em',
            color: 'rgba(26,24,21,0.65)',
            padding: '0 56px',
          }}
        >
          {alt}
        </div>
      )}
    </div>,
    document.body,
  );
}
