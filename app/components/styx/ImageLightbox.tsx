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
  | {type: 'pan'; start: {x: number; y: number}; startTx: number; startTy: number};

/**
 * Full-screen image lightbox with pinch-zoom + pan (Pointer Events),
 * double-tap zoom, wheel zoom and drag pan. Renders nothing until `image`
 * is set. Closes on overlay tap (not image tap), the X button, or Escape.
 */
export function ImageLightbox({
  image,
  onClose,
}: {
  image: LightboxImage | null;
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

  const open = !!image;
  const url = image?.url;

  function apply(next: {scale: number; tx: number; ty: number}) {
    tRef.current = next;
    setTransform(next);
  }

  function clampScale(s: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
  }

  /** Zoom so the screen point stays fixed (transform-origin is 0 0). */
  function zoomAt(point: {x: number; y: number}, nextScale: number, smooth = false) {
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
      gesture.current = {type: 'pan', start: {...pts[0]}, startTx: t.tx, startTy: t.ty};
    } else {
      gesture.current = null;
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    stageRef.current?.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, {x: e.clientX, y: e.clientY});
    moved.current = false;
    setAnimate(false);

    if (pointers.current.size === 1) {
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
    if (Math.hypot(e.clientX - prev.x, e.clientY - prev.y) > 2) moved.current = true;

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
    if (e.target === imgRef.current) return; // image tap never closes
    requestClose();
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
  }, [open]);

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

  if (!image) return null;

  const alt = image.altText || '';
  const fade = reducedMotion.current ? 'none' : `opacity ${FADE_MS}ms ease`;

  // Portal to <body>: the gallery ancestors create stacking contexts
  // (sticky buy-box column, hover-zoom transforms), which would cage the
  // overlay's z-index and let page content paint over it.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image viewer'}
      onKeyDown={(e) => {
        // Single focusable control — keep Tab on the close button.
        if (e.key === 'Tab') {
          e.preventDefault();
          closeRef.current?.focus();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(13,13,12,0.96)',
        opacity: visible ? 1 : 0,
        transition: fade,
      }}
    >
      {/* Gesture stage — overlay tap closes, image tap doesn't */}
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
          cursor: transform.scale > 1 ? 'grab' : 'zoom-in',
        }}
      >
        <img
          ref={imgRef}
          src={highResUrl(image.url)}
          alt={alt}
          draggable={false}
          style={{
            maxWidth: '94vw',
            maxHeight: '86vh',
            objectFit: 'contain',
            transform: `translate3d(${transform.tx}px, ${transform.ty}px, 0) scale(${transform.scale})`,
            transformOrigin: '0 0',
            transition:
              animate && !reducedMotion.current ? 'transform 0.25s ease' : 'none',
            willChange: 'transform',
            userSelect: 'none',
          }}
        />
      </div>

      {/* Close — 44px tap target */}
      <button
        ref={closeRef}
        type="button"
        onClick={requestClose}
        aria-label="Close image viewer"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#EFEAE0',
          fontSize: 28,
          lineHeight: 1,
          fontFamily: FONT.inter,
        }}
      >
        ×
      </button>

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
            color: 'rgba(239,234,224,0.72)',
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
