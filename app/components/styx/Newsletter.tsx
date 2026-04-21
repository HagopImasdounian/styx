import {useState} from 'react';
import {STYX, FONT} from './constants';
import {StyxLabel} from './StyxLabel';
import {Obol} from './Obol';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section
      style={{
        background: STYX.bone,
        padding: '96px 56px',
        textAlign: 'center',
      }}
    >
      {/* Obol */}
      <div style={{display: 'flex', justifyContent: 'center', marginBottom: 32}}>
        <Obol size={56} />
      </div>

      <StyxLabel>The Dispatch · VI</StyxLabel>

      <h2
        style={{
          fontFamily: FONT.cinzel,
          fontSize: 36,
          fontWeight: 400,
          color: STYX.ink,
          margin: '12px 0 12px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        Each new cast, delivered first.
      </h2>

      <p
        style={{
          fontFamily: FONT.cormorant,
          fontStyle: 'italic',
          fontSize: 18,
          color: STYX.silt,
          marginBottom: 40,
        }}
      >
        First access to new pieces, restocks, and stories from the workshop.
      </p>

      {submitted ? (
        <div
          style={{
            fontFamily: FONT.cormorant,
            fontStyle: 'italic',
            fontSize: 18,
            color: STYX.gold,
            animation: 'styx-fade-up 0.5s ease forwards',
          }}
        >
          The coin is received. Welcome aboard.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 0,
            maxWidth: 480,
            margin: '0 auto',
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${STYX.line}`,
              padding: '12px 0',
              fontFamily: FONT.inter,
              fontSize: 14,
              color: STYX.ink,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${STYX.gold}`,
              fontFamily: FONT.cinzel,
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: STYX.gold,
              padding: '12px 24px',
              cursor: 'pointer',
            }}
          >
            Subscribe
          </button>
        </form>
      )}
    </section>
  );
}
