import {useEffect, useId, useRef, useState} from 'react';

import {Link} from '~/components/Link';
import {STYX, FONT} from './constants';

/**
 * PDP delivery promise row + "Delivery & Returns" drawer.
 *
 * The row keeps the exact shipping line the page already carried. The button
 * opens an accessible dialog (focus trap, Esc closes, aria-modal) that slides
 * in from the right on desktop and up as a bottom sheet on phones (position
 * and transform live in app.css under `.styx-dr-panel`). Visual language is
 * borrowed from the cart drawer in StyxNav: bone panel, mono eyebrow, Cinzel
 * title, round close button, dimmed blurred backdrop.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ROWS: Array<{label: string; body: string}> = [
  {
    label: 'Dispatch',
    body: 'Ships fully insured in 1 to 2 business days. Free shipping on every order, by priority courier.',
  },
  {
    label: 'Delivery',
    body: 'Domestic delivery typically 3 to 5 business days. Signature required on arrival, so the parcel is handed to a person, not left at a door.',
  },
  {
    label: 'Returns',
    body: '14-day returns. Send the piece back within 14 days of delivery; it is inspected on arrival and the refund follows.',
  },
  {
    label: 'Buyback',
    body: 'Every piece carries a 5-year buyback guarantee. We buy back your gold at the prevailing market price, minus only the original labor.',
  },
];

export function DeliveryReturns() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  // Focus management + Esc + scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const trigger = triggerRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(
      () => closeRef.current?.focus(),
      30,
    );

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey) {
        if (activeEl === first || !panel.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else if (activeEl === last || !panel.contains(activeEl)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      // Taps don't focus buttons on iOS, so "previously focused" is often
      // <body>; send focus back to the trigger in that case.
      const restoreTo =
        previouslyFocused && previouslyFocused !== document.body
          ? previouslyFocused
          : trigger;
      restoreTo?.focus?.();
    };
  }, [open]);

  return (
    <>
      {/* Row: the existing delivery promise line + drawer trigger */}
      <div
        style={{
          marginTop: 16,
          textAlign: 'center',
          fontFamily: FONT.inter,
          fontSize: 11,
          color: 'var(--styx-muted)',
          lineHeight: 1.6,
        }}
      >
        Ships fully insured in 1 to 2 business days. Domestic delivery
        typically 3 to 5 business days, signature on arrival.
      </div>
      <div style={{marginTop: 10, textAlign: 'center'}}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #b9b9b4',
            padding: '0 0 4px',
            cursor: 'pointer',
            fontFamily: FONT.inter,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: '#1a1b1c',
          }}
        >
          Delivery &amp; returns
        </button>
      </div>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26,27,28,0.5)',
          backdropFilter: 'blur(2px)',
          zIndex: 60,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Panel: right-side drawer on desktop, bottom sheet on phones (app.css) */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-labelledby={titleId}
        aria-hidden={open ? undefined : true}
        {...(!open ? ({inert: ''} as any) : {})}
        className="styx-dr-panel"
        data-open={open ? 'true' : 'false'}
        style={{
          background: 'var(--styx-surface)',
          borderLeft: '1px solid var(--styx-border)',
          boxShadow: '-24px 0 60px rgba(26,27,28,0.12)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--styx-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: '#7d6a3f',
                marginBottom: 6,
              }}
            >
              Service
            </div>
            <div
              id={titleId}
              style={{
                fontFamily: FONT.cormorant,
                fontSize: 30,
                fontWeight: 500,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: '#1a1b1c',
              }}
            >
              Delivery &amp; returns
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              width: 36,
              height: 36,
              borderRadius: 3,
              border: '1px solid var(--styx-border)',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              stroke={STYX.ink}
              strokeWidth="1.2"
              aria-hidden="true"
            >
              <line x1="2" y1="2" x2="10" y2="10" />
              <line x1="10" y1="2" x2="2" y2="10" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{flex: 1, overflowY: 'auto', padding: '8px 24px 24px'}}>
          {ROWS.map(({label, body}) => (
            <div
              key={label}
              style={{
                padding: '18px 0',
                borderBottom: '1px solid var(--styx-border)',
              }}
            >
              <div
                style={{
                  fontFamily: FONT.inter,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#1e2021',
                  marginBottom: 6,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: FONT.inter,
                  fontSize: 13,
                  lineHeight: 1.75,
                  color: 'var(--styx-muted)',
                }}
              >
                {body}
              </div>
            </div>
          ))}

          {/* Links */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              paddingTop: 22,
            }}
          >
            {[
              {to: '/shipping', label: 'Full shipping & returns terms'},
              {to: '/buyback', label: 'How the 5-year buyback works'},
            ].map(({to, label}) => (
              <Link
                key={to}
                to={to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  textDecoration: 'none',
                  fontFamily: FONT.inter,
                  fontSize: 12,
                  color: '#1a1b1c',
                  border: '1px solid var(--styx-border)',
                  borderRadius: 3,
                  background: '#ffffff',
                  padding: '14px 16px',
                  minHeight: 48,
                }}
              >
                <span>{label}</span>
                <span aria-hidden="true" style={{color: '#8c7a4b'}}>
                  ↗
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
