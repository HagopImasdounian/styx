import {useState} from 'react';
import {STYX, FONT} from './constants';
import {StyxLabel} from './StyxLabel';
import {Obol} from './Obol';

export function Newsletter() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && firstName) setSubmitted(true);
  };

  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${STYX.line}`,
    padding: '14px 0',
    fontFamily: FONT.inter,
    fontSize: 14,
    color: STYX.ink,
    outline: 'none',
    width: '100%',
  };

  return (
    <section
      className="styx-newsletter"
      style={{
        background: STYX.bone,
        padding: '96px 56px',
        textAlign: 'center',
      }}
    >
      <div style={{display: 'flex', justifyContent: 'center', marginBottom: 32}}>
        <Obol size={56} />
      </div>

      <StyxLabel>The Dispatch</StyxLabel>

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
            maxWidth: 520,
            margin: '0 auto',
          }}
          className="styx-newsletter-form"
        >
          {/* Name row */}
          <div
            style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24}}
            className="styx-newsletter-name-row"
          >
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
              style={inputStyle}
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            style={{...inputStyle, marginTop: 8}}
          />

          {/* Phone / SMS */}
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (for SMS updates)"
            style={{...inputStyle, marginTop: 8}}
          />

          {/* Opt-in checkboxes */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 24,
              textAlign: 'left',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
                style={{
                  accentColor: STYX.gold,
                  width: 16,
                  height: 16,
                  cursor: 'pointer',
                }}
              />
              <span
                style={{
                  fontFamily: FONT.inter,
                  fontSize: 13,
                  color: STYX.silt,
                }}
              >
                I'd like to receive emails about new drops, restocks, and stories.
              </span>
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={smsOptIn}
                onChange={(e) => setSmsOptIn(e.target.checked)}
                style={{
                  accentColor: STYX.gold,
                  width: 16,
                  height: 16,
                  cursor: 'pointer',
                }}
              />
              <span
                style={{
                  fontFamily: FONT.inter,
                  fontSize: 13,
                  color: STYX.silt,
                }}
              >
                I'd like to receive SMS updates about new drops and exclusive offers.
              </span>
            </label>
            <p
              style={{
                fontFamily: FONT.inter,
                fontSize: 11,
                color: STYX.silt2,
                margin: '4px 0 0',
                lineHeight: 1.5,
              }}
            >
              You can opt out anytime. We respect your inbox and your phone.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            style={{
              marginTop: 32,
              background: STYX.ink,
              border: 'none',
              fontFamily: FONT.cinzel,
              fontSize: 11,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: STYX.bone,
              padding: '16px 48px',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = STYX.graphite;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = STYX.ink;
            }}
          >
            Subscribe
          </button>
        </form>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 32em) {
          .styx-newsletter { padding: 64px 20px !important; }
          .styx-newsletter-name-row { grid-template-columns: 1fr !important; }
        }
      `,
        }}
      />
    </section>
  );
}
