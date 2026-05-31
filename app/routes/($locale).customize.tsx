import {type LoaderFunctionArgs} from 'react-router';
import {useState} from 'react';

import {Link} from '~/components/Link';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel, Obol} from '~/components/styx';
import {trackFormSubmit} from '~/components/GTMDataLayer';

export async function loader({context}: LoaderFunctionArgs) {
  return {};
}

export const meta = () => {
  return [
    {title: 'Customize Your Chain | STYX Gold'},
    {name: 'description', content: 'Commission a custom gold chain. Custom clasps, diamond accents, bespoke lengths, and one-of-one pieces. Handcrafted in solid gold.'},
  ];
};

const CUSTOM_OPTIONS = [
  {
    id: 'clasp',
    icon: '⚓',
    title: 'Custom Clasp',
    subtitle: 'Lobster, box, toggle, or something entirely yours',
    description: 'The clasp is the first thing you touch and the last thing you see. We can fabricate custom clasps in any style — from oversized lobster claws to hidden magnetic closures to hand-engraved box clasps with your initials.',
  },
  {
    id: 'diamonds',
    icon: '◆',
    title: 'Diamond Accents',
    subtitle: 'A little bit of diamonds never hurt nobody',
    description: 'Set VS1/VS2 natural diamonds directly into your chain links, clasp, or a custom pendant bail. Micro-pave, channel-set, or bezel — we work with your vision and budget to add just the right amount of fire.',
  },
  {
    id: 'length',
    icon: '↔',
    title: 'Bespoke Length',
    subtitle: 'Sized to your frame, not a factory default',
    description: 'Standard lengths are 16" to 26". We can go shorter, longer, or anywhere in between — measured to your exact neck circumference for a perfect lay. Bracelets and anklets too.',
  },
  {
    id: 'width',
    icon: '◐',
    title: 'Custom Width',
    subtitle: 'Heavier, thinner, or somewhere between',
    description: 'Want a 7mm Cuban that nobody stocks? Or a 0.5mm cable chain that barely whispers? We can source or fabricate non-standard widths for any chain type in our catalog.',
  },
  {
    id: 'engraving',
    icon: 'A',
    title: 'Engraving',
    subtitle: 'Your mark, invisible or bold',
    description: 'Laser or hand engraving on the clasp, a tag, or the links themselves. Initials, dates, coordinates, or a short message. The words become part of the gold.',
  },
  {
    id: 'oneofone',
    icon: '①',
    title: 'One of One',
    subtitle: 'Something that has never existed before',
    description: 'If you have a design in mind — a sketch, a photo, a memory — we can bring it to life in solid gold. Our master jewelers have built everything from replica vintage chains to completely original link patterns. Start the conversation.',
  },
];

export default function Customize() {
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const [formSent, setFormSent] = useState(false);

  const handleCommissionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = (fd.get('name') as string) || '';
    const email = (fd.get('email') as string) || '';

    const payload = {
      formId: 'custom-commission',
      formName: 'custom-commission',
      name,
      email,
      phone: (fd.get('phone') as string) || undefined,
      message: (fd.get('description') as string) || '',
      fields: {
        budget: (fd.get('budget') as string) || '',
      },
    };

    try {
      await fetch('/api/form-submit', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      trackFormSubmit({
        formId: 'custom-commission',
        formName: 'custom-commission',
        email,
        name,
      });
    } catch {
      // Don't block the confirmation UI on email/webhook failure.
    } finally {
      setFormSent(true);
    }
  };

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      {/* Hero */}
      <section
        style={{
          padding: '80px 56px 64px',
          borderBottom: `1px solid ${STYX.line}`,
        }}
        className="styx-customize-hero"
      >
        <div style={{maxWidth: 900, margin: '0 auto'}}>
          <StyxLabel>Bespoke</StyxLabel>
          <h1
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              lineHeight: 1,
              color: STYX.ink,
              margin: '16px 0 0',
            }}
          >
            Customize{' '}
            <span
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                fontWeight: 400,
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              Your Chain
            </span>
          </h1>
          <p
            style={{
              fontFamily: FONT.cormorant,
              fontSize: 20,
              lineHeight: 1.7,
              color: STYX.silt,
              marginTop: 24,
              maxWidth: 600,
            }}
          >
            Every chain in our vault can be modified, and anything not in our vault can be built from scratch. Custom clasps, diamond settings, bespoke lengths, engravings, and true one-of-one pieces — all in solid gold.
          </p>
        </div>
      </section>

      {/* Options Grid */}
      <section style={{padding: '64px 56px'}} className="styx-customize-options">
        <div style={{maxWidth: 1200, margin: '0 auto'}}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1,
              background: STYX.line,
            }}
            className="styx-customize-grid"
          >
            {CUSTOM_OPTIONS.map((opt) => {
              const isActive = activeOption === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveOption(isActive ? null : opt.id)}
                  style={{
                    background: isActive ? STYX.ink : STYX.bone,
                    padding: '48px 36px',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 24,
                      color: isActive ? STYX.gold : STYX.silt2,
                      lineHeight: 1,
                    }}
                  >
                    {opt.icon}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 14,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: isActive ? STYX.bone : STYX.ink,
                    }}
                  >
                    {opt.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT.cormorant,
                      fontSize: 15,
                      fontStyle: 'italic',
                      color: isActive ? STYX.goldLight : STYX.silt,
                      lineHeight: 1.5,
                    }}
                  >
                    {opt.subtitle}
                  </div>
                  {isActive && (
                    <div
                      style={{
                        fontFamily: FONT.cormorant,
                        fontSize: 16,
                        color: 'rgba(239,234,224,0.75)',
                        lineHeight: 1.7,
                        marginTop: 8,
                        borderTop: '1px solid rgba(239,234,224,0.12)',
                        paddingTop: 16,
                      }}
                    >
                      {opt.description}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section
        style={{
          padding: '80px 56px',
          background: STYX.paper,
          borderTop: `1px solid ${STYX.line}`,
          borderBottom: `1px solid ${STYX.line}`,
        }}
        className="styx-customize-process"
      >
        <div style={{maxWidth: 900, margin: '0 auto'}}>
          <StyxLabel>The Process</StyxLabel>
          <h2
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 28,
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: STYX.ink,
              margin: '12px 0 48px',
            }}
          >
            How It Works
          </h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: 0}}>
            {[
              {step: '01', title: 'Tell Us What You Want', desc: 'Fill out the form below with as much detail as possible. Photos, sketches, references — anything helps. We respond within 24 hours.'},
              {step: '02', title: 'We Quote It', desc: 'Our team prices the piece based on gold weight, labor, and any stone settings. You get a transparent breakdown — no hidden fees, no markups on materials.'},
              {step: '03', title: 'You Approve', desc: 'Once you approve the quote, we collect a 50% deposit and begin fabrication. Timeline depends on complexity — typically 2 to 4 weeks.'},
              {step: '04', title: 'We Deliver', desc: 'Final balance due on completion. Your piece ships fully insured with signature confirmation. Every custom piece includes a certificate of authenticity.'},
            ].map((item, i) => (
              <div
                key={item.step}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr',
                  gap: 24,
                  padding: '32px 0',
                  borderBottom: i < 3 ? `1px solid ${STYX.line}` : 'none',
                }}
              >
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    color: STYX.gold,
                    letterSpacing: '0.1em',
                    paddingTop: 4,
                  }}
                >
                  {item.step}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: FONT.cinzel,
                      fontSize: 14,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: STYX.ink,
                      marginBottom: 8,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT.cormorant,
                      fontSize: 17,
                      lineHeight: 1.7,
                      color: STYX.silt,
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section style={{padding: '80px 56px'}} className="styx-customize-form">
        <div style={{maxWidth: 700, margin: '0 auto'}}>
          <div style={{textAlign: 'center', marginBottom: 48}}>
            <Obol size={48} color={STYX.gold} speed={8} />
            <h2
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 28,
                fontWeight: 400,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: STYX.ink,
                margin: '20px 0 8px',
              }}
            >
              Start Your Commission
            </h2>
            <p
              style={{
                fontFamily: FONT.cormorant,
                fontSize: 17,
                fontStyle: 'italic',
                color: STYX.silt,
              }}
            >
              Tell us everything. We will get back to you within 24 hours.
            </p>
          </div>

          {formSent ? (
            <div
              style={{
                textAlign: 'center',
                padding: '64px 32px',
                background: STYX.paper,
                border: `1px solid ${STYX.line}`,
              }}
            >
              <div style={{fontFamily: FONT.cinzel, fontSize: 20, color: STYX.ink, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12}}>
                Received
              </div>
              <div style={{fontFamily: FONT.cormorant, fontSize: 17, fontStyle: 'italic', color: STYX.silt}}>
                We will review your request and respond within 24 hours.
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleCommissionSubmit}
              style={{display: 'flex', flexDirection: 'column', gap: 20}}
            >
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}} className="styx-customize-form-row">
                <div>
                  <label style={{fontFamily: FONT.cinzel, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: STYX.silt, display: 'block', marginBottom: 6}}>
                    Name
                  </label>
                  <input
                    name="name"
                    required
                    style={{width: '100%', padding: '12px 14px', border: `1px solid ${STYX.line}`, background: '#fff', fontFamily: FONT.inter, fontSize: 14, color: STYX.ink, outline: 'none'}}
                  />
                </div>
                <div>
                  <label style={{fontFamily: FONT.cinzel, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: STYX.silt, display: 'block', marginBottom: 6}}>
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    style={{width: '100%', padding: '12px 14px', border: `1px solid ${STYX.line}`, background: '#fff', fontFamily: FONT.inter, fontSize: 14, color: STYX.ink, outline: 'none'}}
                  />
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}} className="styx-customize-form-row">
                <div>
                  <label style={{fontFamily: FONT.cinzel, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: STYX.silt, display: 'block', marginBottom: 6}}>
                    Phone
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    style={{width: '100%', padding: '12px 14px', border: `1px solid ${STYX.line}`, background: '#fff', fontFamily: FONT.inter, fontSize: 14, color: STYX.ink, outline: 'none'}}
                  />
                </div>
                <div>
                  <label style={{fontFamily: FONT.cinzel, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: STYX.silt, display: 'block', marginBottom: 6}}>
                    Budget Range
                  </label>
                  <select
                    name="budget"
                    style={{width: '100%', padding: '12px 14px', border: `1px solid ${STYX.line}`, background: '#fff', fontFamily: FONT.inter, fontSize: 14, color: STYX.ink, outline: 'none', appearance: 'none'}}
                  >
                    <option value="">Select</option>
                    <option value="under-1000">Under $1,000</option>
                    <option value="1000-5000">$1,000 - $5,000</option>
                    <option value="5000-15000">$5,000 - $15,000</option>
                    <option value="15000-50000">$15,000 - $50,000</option>
                    <option value="50000+">$50,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{fontFamily: FONT.cinzel, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: STYX.silt, display: 'block', marginBottom: 6}}>
                  What are you looking for?
                </label>
                <textarea
                  name="description"
                  required
                  rows={5}
                  placeholder="Describe your vision — chain type, width, length, karat, clasp style, diamond details, or anything else. Attach references if you have them."
                  style={{width: '100%', padding: '14px', border: `1px solid ${STYX.line}`, background: '#fff', fontFamily: FONT.cormorant, fontSize: 17, color: STYX.ink, outline: 'none', resize: 'vertical'}}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '18px 24px',
                  background: STYX.ink,
                  color: STYX.bone,
                  fontFamily: FONT.cinzel,
                  fontSize: 12,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                Submit Request
              </button>
            </form>
          )}
        </div>
      </section>

      <StyxFooter />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 48em) {
          .styx-customize-hero { padding: 48px 20px 40px !important; }
          .styx-customize-options { padding: 40px 20px !important; }
          .styx-customize-grid { grid-template-columns: 1fr !important; }
          .styx-customize-process { padding: 48px 20px !important; }
          .styx-customize-form { padding: 48px 20px !important; }
          .styx-customize-form-row { grid-template-columns: 1fr !important; }
        }
      `,
        }}
      />
    </div>
  );
}
