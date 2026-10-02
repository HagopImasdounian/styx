import {data, type LoaderFunctionArgs, type MetaArgs} from 'react-router';
import {useEffect, useMemo, useRef, useState} from 'react';

import {Link} from '~/components/Link';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel, Obol} from '~/components/styx';
import {trackFormSubmit} from '~/components/GTMDataLayer';
import {getStyxSeoMeta} from '~/lib/seo-meta';
import {validateLocale} from '~/lib/utils';
import {CACHE_LONG, routeHeaders} from '~/data/cache';

/** This route renders its own GoldTicker + StyxNav + StyxFooter. */
export const handle = {ownChrome: true};

export const headers = routeHeaders;

export async function loader({request, params}: LoaderFunctionArgs) {
  validateLocale(params);
  return data({url: request.url}, {headers: {'Cache-Control': CACHE_LONG}});
}

export const meta = ({data}: MetaArgs<typeof loader>) => {
  return getStyxSeoMeta({
    title: 'Customize Your Chain',
    titleTemplate: '%s | STYX Gold',
    description:
      'Commission a custom gold chain. Custom clasps, diamond accents, bespoke lengths, and one-of-one pieces. Handcrafted in solid gold.',
    url: data?.url,
  });
};

const CUSTOM_OPTIONS = [
  {
    id: 'clasp',
    icon: '⚓',
    title: 'Custom Clasp',
    subtitle: 'Lobster, box, toggle, or something entirely yours',
    description: 'The clasp is the first thing you touch and the last thing you see. We can fabricate custom clasps in any style, from oversized lobster claws to hidden magnetic closures to hand-engraved box clasps with your initials.',
  },
  {
    id: 'diamonds',
    icon: '◆',
    title: 'Diamond Accents',
    subtitle: 'A little bit of diamonds never hurt nobody',
    description: 'Set VS1/VS2 natural diamonds directly into your chain links, clasp, or a custom pendant bail. Micro-pave, channel-set, or bezel, we work with your vision and budget to add just the right amount of fire.',
  },
  {
    id: 'length',
    icon: '↔',
    title: 'Bespoke Length',
    subtitle: 'Sized to your frame, not a factory default',
    description: 'Standard lengths are 16" to 26". We can go shorter, longer, or anywhere in between, measured to your exact neck circumference for a perfect lay. Bracelets and anklets too.',
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
    description: 'If you have a design in mind, a sketch, a photo, a memory, we can bring it to life in solid gold. Our master jewelers have built everything from replica vintage chains to completely original link patterns. Start the conversation.',
  },
];

// Client-side mirror of the limits enforced in api.customize-submit.
const SKETCH_MAX_FILES = 3;
const SKETCH_MAX_FILE_BYTES = 5 * 1024 * 1024;
const SKETCH_MAX_TOTAL_BYTES = 12 * 1024 * 1024;
const SKETCH_ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);
const HEIC_EXT_RE = /\.(heic|heif)$/i;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isHeic(file: File): boolean {
  const t = (file.type || '').toLowerCase();
  return t === 'image/heic' || t === 'image/heif' || HEIC_EXT_RE.test(file.name);
}

function isAllowedImage(file: File): boolean {
  const t = (file.type || '').toLowerCase();
  if (SKETCH_ALLOWED_TYPES.has(t)) return true;
  return (t === '' || t === 'application/octet-stream') && HEIC_EXT_RE.test(file.name);
}

/** Returns an error string, or null when the combined list is acceptable. */
function validateSketches(files: File[]): string | null {
  if (files.length > SKETCH_MAX_FILES) {
    return `You can attach up to ${SKETCH_MAX_FILES} images.`;
  }
  let total = 0;
  for (const f of files) {
    if (!isAllowedImage(f)) {
      return `"${f.name}" is not a supported image. Please use JPG, PNG, WebP, or HEIC.`;
    }
    if (f.size > SKETCH_MAX_FILE_BYTES) {
      return `"${f.name}" is ${formatBytes(f.size)}. Each image must be 5 MB or smaller.`;
    }
    total += f.size;
  }
  if (total > SKETCH_MAX_TOTAL_BYTES) {
    return `Your images total ${formatBytes(total)}. Together they must be 12 MB or smaller.`;
  }
  return null;
}

export default function Customize() {
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const [formSent, setFormSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [sketches, setSketches] = useState<File[]>([]);
  const [sketchError, setSketchError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Object URLs for thumbnails. HEIC does not render in most browsers, so
  // those get a filename chip instead (null URL).
  const previews = useMemo(
    () =>
      sketches.map((f) =>
        isHeic(f) ? null : URL.createObjectURL(f),
      ),
    [sketches],
  );
  useEffect(() => {
    return () => {
      previews.forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, [previews]);

  const addSketches = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const list = Array.from(incoming);
    if (list.length === 0) return;
    // Dedupe on name+size so re-picking the same photo does not double up.
    const key = (f: File) => `${f.name}:${f.size}`;
    const seen = new Set(sketches.map(key));
    const merged = [...sketches, ...list.filter((f) => !seen.has(key(f)))];
    const err = validateSketches(merged);
    if (err) {
      setSketchError(err);
      return;
    }
    setSketchError(null);
    setSketches(merged);
  };

  const removeSketch = (index: number) => {
    setSketches((prev) => prev.filter((_, i) => i !== index));
    setSketchError(null);
  };

  const handleCommissionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;

    const err = validateSketches(sketches);
    if (err) {
      setSketchError(err);
      return;
    }

    const source = new FormData(form);
    const name = (source.get('name') as string) || '';
    const email = (source.get('email') as string) || '';
    const fd = new FormData();
    for (const field of ['name', 'email', 'phone', 'budget', 'description', 'website']) {
      const v = source.get(field);
      if (typeof v === 'string') fd.append(field, v);
    }
    sketches.forEach((f) => fd.append('sketches', f, f.name));

    setSubmitting(true);
    setSubmitError(null);

    try {
      // No Content-Type header: the browser sets the multipart boundary.
      const res = await fetch('/api/customize-submit', {method: 'POST', body: fd});

      if (!res.ok && res.status >= 400 && res.status < 500) {
        // Validation or rate-limit problem the customer can act on.
        let message = 'Something went wrong. Please check your details and try again.';
        try {
          const json = (await res.json()) as {error?: string};
          if (json?.error) message = json.error;
        } catch {
          // fall through with the generic message
        }
        setSubmitError(message);
        return;
      }

      trackFormSubmit({
        formId: 'custom-commission',
        formName: 'custom-commission',
        email,
        name,
      });
      setFormSent(true);
    } catch {
      // Network failure or 5xx: do not block the confirmation UI on
      // email/webhook delivery problems (matches the other forms).
      setFormSent(true);
    } finally {
      setSubmitting(false);
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
            data-reveal=""
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
            data-reveal=""
            style={{
              fontFamily: FONT.cormorant,
              fontSize: 20,
              lineHeight: 1.7,
              color: STYX.silt,
              marginTop: 24,
              maxWidth: 600,
            }}
          >
            Every chain in our vault can be modified, and anything not in our vault can be built from scratch. Custom clasps, diamond settings, bespoke lengths, engravings, and true one-of-one pieces, all in solid gold.
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
                        color: 'rgba(235,235,232,0.75)',
                        lineHeight: 1.7,
                        marginTop: 8,
                        borderTop: '1px solid rgba(235,235,232,0.12)',
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
            data-reveal=""
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
              {step: '01', title: 'Tell Us What You Want', desc: 'Fill out the form below with as much detail as possible. Photos, sketches, references: anything helps. We respond within 24 hours.'},
              {step: '02', title: 'We Quote It', desc: 'Our team prices the piece based on gold weight, labor, and any stone settings. You get a transparent breakdown: no hidden fees, no markups on materials.'},
              {step: '03', title: 'You Approve', desc: 'Once you approve the quote, we collect a 50% deposit and begin fabrication. Timeline depends on complexity: typically 2 to 4 weeks.'},
              {step: '04', title: 'We Deliver', desc: 'Final balance due on completion. Your piece ships fully insured with signature confirmation. Every custom piece includes a certificate of authenticity.'},
            ].map((item, i) => (
              <div
                data-reveal=""
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
              data-reveal=""
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
              data-reveal=""
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
                  placeholder="Describe your vision: chain type, width, length, karat, clasp style, diamond details, or anything else. Add sketches or reference photos below if you have them."
                  style={{width: '100%', padding: '14px', border: `1px solid ${STYX.line}`, background: '#fff', fontFamily: FONT.cormorant, fontSize: 17, color: STYX.ink, outline: 'none', resize: 'vertical'}}
                />
              </div>

              {/* Sketches / references */}
              <div>
                <label
                  htmlFor="customize-sketches"
                  style={{fontFamily: FONT.cinzel, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: STYX.silt, display: 'block', marginBottom: 6}}
                >
                  Sketches or references
                </label>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Add sketches or reference images"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!dragging) setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    addSketches(e.dataTransfer?.files ?? null);
                  }}
                  style={{
                    border: `1px dashed ${dragging ? STYX.gold : STYX.line}`,
                    background: dragging ? STYX.paper : '#fff',
                    padding: '22px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  <div style={{fontFamily: FONT.cormorant, fontSize: 17, color: STYX.ink}}>
                    {sketches.length >= SKETCH_MAX_FILES
                      ? 'Three images attached'
                      : 'Drop images here or tap to choose'}
                  </div>
                  <div style={{fontFamily: FONT.inter, fontSize: 12, color: STYX.silt2, marginTop: 4}}>
                    Up to 3 images, 5 MB each. Phone photos are fine.
                  </div>
                  <input
                    ref={fileInputRef}
                    id="customize-sketches"
                    type="file"
                    accept="image/*,.heic,.heif"
                    multiple
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      addSketches(e.currentTarget.files);
                      // Reset so choosing the same file again re-fires onChange.
                      e.currentTarget.value = '';
                    }}
                    style={{display: 'none'}}
                  />
                </div>

                {sketches.length > 0 && (
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10}}>
                    {sketches.map((f, i) => {
                      const url = previews[i];
                      return (
                        <div
                          key={`${f.name}:${f.size}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            border: `1px solid ${STYX.line}`,
                            background: STYX.paper,
                            padding: 6,
                            paddingRight: 8,
                            maxWidth: '100%',
                          }}
                        >
                          {url ? (
                            <img
                              src={url}
                              alt=""
                              width={56}
                              height={56}
                              style={{width: 56, height: 56, objectFit: 'cover', display: 'block', background: '#fff'}}
                            />
                          ) : (
                            <div
                              aria-hidden="true"
                              style={{
                                width: 56,
                                height: 56,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#fff',
                                border: `1px solid ${STYX.line}`,
                                fontFamily: FONT.mono,
                                fontSize: 10,
                                letterSpacing: '0.1em',
                                color: STYX.silt2,
                              }}
                            >
                              HEIC
                            </div>
                          )}
                          <div style={{minWidth: 0}}>
                            <div
                              title={f.name}
                              style={{fontFamily: FONT.inter, fontSize: 12, color: STYX.ink, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
                            >
                              {f.name}
                            </div>
                            <div style={{fontFamily: FONT.inter, fontSize: 11, color: STYX.silt2}}>
                              {formatBytes(f.size)}
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${f.name}`}
                            onClick={() => removeSketch(i)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: STYX.silt,
                              cursor: 'pointer',
                              fontFamily: FONT.inter,
                              fontSize: 16,
                              lineHeight: 1,
                              padding: '6px 4px',
                            }}
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {sketchError && (
                  <div role="alert" style={{fontFamily: FONT.inter, fontSize: 13, color: STYX.taupe, marginTop: 8}}>
                    {sketchError}
                  </div>
                )}
              </div>

              {/* Honeypot: hidden from humans, bots tend to fill it. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0}}
              />

              {submitError && (
                <div role="alert" style={{fontFamily: FONT.inter, fontSize: 13, color: STYX.taupe}}>
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '18px 24px',
                  background: STYX.ink,
                  color: STYX.bone,
                  fontFamily: FONT.cinzel,
                  fontSize: 12,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: submitting ? 'wait' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  transition: 'background 0.2s, opacity 0.2s',
                }}
              >
                {submitting
                  ? sketches.length > 0
                    ? 'Uploading'
                    : 'Sending'
                  : 'Submit Request'}
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
