import {useState} from 'react';
import {type MetaFunction} from '@shopify/remix-oxygen';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel} from '~/components/styx';

export const meta: MetaFunction = () => {
  return [{title: 'Contact — STYX'}, {name: 'description', content: 'Get in touch with Styx Gold. Questions about chains, pricing, custom orders, or anything else.'}];
};

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      {/* Header */}
      <div style={{borderBottom: `1px solid ${STYX.line}`}}>
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '80px 56px 60px',
          }}
        >
          <StyxLabel>Contact &middot; Reach the Ferryman</StyxLabel>
          <h1
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 56,
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              color: STYX.ink,
              lineHeight: 0.95,
              margin: '12px 0 0',
            }}
          >
            Get in Touch
          </h1>
          <p
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontSize: 20,
              color: STYX.silt,
              lineHeight: 1.6,
              marginTop: 16,
              maxWidth: 500,
            }}
          >
            Questions about a piece, custom orders, or just want to talk gold?
            We're here.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '80px 56px 120px',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 100,
          alignItems: 'start',
        }}
      >
        {/* Left: Info */}
        <div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 40,
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 12,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: STYX.silt,
                  margin: '0 0 12px',
                }}
              >
                Email
              </h3>
              <a
                href="mailto:hello@styxgold.com"
                style={{
                  fontFamily: FONT.inter,
                  fontSize: 16,
                  color: STYX.ink,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${STYX.line}`,
                  paddingBottom: 2,
                }}
              >
                hello@styxgold.com
              </a>
            </div>

            <div>
              <h3
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 12,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: STYX.silt,
                  margin: '0 0 12px',
                }}
              >
                Response Time
              </h3>
              <p
                style={{
                  fontFamily: FONT.inter,
                  fontSize: 15,
                  color: STYX.graphite,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                We typically respond within 24 hours. For urgent order questions,
                include your order number in the subject line.
              </p>
            </div>

            <div>
              <h3
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 12,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: STYX.silt,
                  margin: '0 0 12px',
                }}
              >
                Common Questions
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  fontFamily: FONT.cormorant,
                  fontSize: 16,
                  color: STYX.graphite,
                  lineHeight: 1.5,
                }}
              >
                <p style={{margin: 0}}>• Custom chain lengths and widths</p>
                <p style={{margin: 0}}>• Price quotes for specific weights</p>
                <p style={{margin: 0}}>• Buyback program details</p>
                <p style={{margin: 0}}>• Wholesale inquiries</p>
                <p style={{margin: 0}}>• Press and collaboration</p>
              </div>
            </div>
          </div>

          {/* Social / Newsletter CTA */}
          <div
            style={{
              marginTop: 56,
              paddingTop: 40,
              borderTop: `1px solid ${STYX.line}`,
            }}
          >
            <h3
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 12,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: STYX.silt,
                margin: '0 0 16px',
              }}
            >
              Follow the Crossing
            </h3>
            <div
              style={{
                display: 'flex',
                gap: 20,
                fontFamily: FONT.inter,
                fontSize: 14,
              }}
            >
              <a href="#" style={{color: STYX.ink, textDecoration: 'none'}}>Instagram</a>
              <a href="#" style={{color: STYX.ink, textDecoration: 'none'}}>Twitter/X</a>
            </div>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div
          style={{
            background: STYX.paper,
            border: `1px solid ${STYX.line}`,
            padding: '48px 40px',
          }}
        >
          {submitted ? (
            <div style={{textAlign: 'center', padding: '40px 0'}}>
              <div
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 24,
                  color: STYX.ink,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 16,
                }}
              >
                Message Sent
              </div>
              <p
                style={{
                  fontFamily: FONT.cormorant,
                  fontSize: 18,
                  fontStyle: 'italic',
                  color: STYX.graphite,
                }}
              >
                We'll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 28,
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: FONT.cinzel,
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: STYX.silt,
                    marginBottom: 8,
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontFamily: FONT.inter,
                    fontSize: 15,
                    color: STYX.ink,
                    background: STYX.bone,
                    border: `1px solid ${STYX.line}`,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: FONT.cinzel,
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: STYX.silt,
                    marginBottom: 8,
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontFamily: FONT.inter,
                    fontSize: 15,
                    color: STYX.ink,
                    background: STYX.bone,
                    border: `1px solid ${STYX.line}`,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: FONT.cinzel,
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: STYX.silt,
                    marginBottom: 8,
                  }}
                >
                  Subject
                </label>
                <select
                  name="subject"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontFamily: FONT.inter,
                    fontSize: 15,
                    color: STYX.ink,
                    background: STYX.bone,
                    border: `1px solid ${STYX.line}`,
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option>General Question</option>
                  <option>Order Inquiry</option>
                  <option>Custom Order</option>
                  <option>Buyback / Returns</option>
                  <option>Wholesale</option>
                  <option>Press / Collaboration</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: FONT.cinzel,
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: STYX.silt,
                    marginBottom: 8,
                  }}
                >
                  Message
                </label>
                <textarea
                  name="message"
                  rows={6}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontFamily: FONT.inter,
                    fontSize: 15,
                    color: STYX.ink,
                    background: STYX.bone,
                    border: `1px solid ${STYX.line}`,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  background: STYX.ink,
                  color: STYX.bone,
                  fontFamily: FONT.cinzel,
                  fontSize: 12,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>

      <StyxFooter />
    </div>
  );
}
