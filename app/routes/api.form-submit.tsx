import {type ActionFunctionArgs, data} from 'react-router';
import {rateLimitAllow} from '~/lib/rate-limit.server';

type FormPayload = {
  formId?: string;
  formName?: string;
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  fields?: Record<string, unknown>;
  // Honeypot fields — real users never fill these (hidden inputs).
  _gotcha?: string;
  website?: string;
  // Make-an-Offer specific fields
  product?: string;
  sku?: string;
  variant?: string;
  options?: string;
  listedPrice?: string;
  offerAmount?: string;
  [key: string]: unknown;
};

// Reject request bodies larger than this (bytes of raw JSON text).
const MAX_BODY_BYTES = 10 * 1024;
// Cap any individual string field when rendering into emails.
const MAX_FIELD_LENGTH = 2000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strip newlines and control characters (header/subject injection hygiene). */
function sanitizeHeaderText(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
}

export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  // Each submission triggers outbound email from our verified domain —
  // throttle per IP so bots can't burn quota or spam arbitrary inboxes.
  if (
    !(await rateLimitAllow(request, 'form-submit', {
      limit: 5,
      windowSeconds: 600,
    }))
  ) {
    return data(
      {error: 'Too many requests — please try again in a few minutes'},
      {status: 429},
    );
  }

  let body: FormPayload;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return data({error: 'Request body too large'}, {status: 413});
    }
    body = JSON.parse(raw) as FormPayload;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return data({error: 'Invalid request body'}, {status: 400});
    }
  } catch {
    return data({error: 'Invalid request body'}, {status: 400});
  }

  // Honeypot: hidden fields humans never fill. If present, silently discard —
  // pretend success so bots don't learn they were caught.
  const gotcha = body._gotcha ?? body.website;
  if (typeof gotcha === 'string' && gotcha.trim() !== '') {
    return data({success: true});
  }

  const {formId, formName, name, email} = body;

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return data({error: 'A valid email address is required'}, {status: 400});
  }

  const env = context.env as Record<string, string>;
  const webhookUrl = env.FORM_WEBHOOK_URL;
  const resendKey = env.RESEND_API_KEY;
  // Owner notification goes to OWNER_EMAIL, then FORM_NOTIFY_EMAIL, then a hard fallback.
  const ownerEmail =
    env.OWNER_EMAIL || env.FORM_NOTIFY_EMAIL || 'hagop@itshco.com';

  // NOTE: This from-address must be on a domain verified in the Resend dashboard,
  // otherwise sends will fail. Verify "styxgold.com" (or change to a verified domain).
  const fromAddress = 'STYX Gold <noreply@styxgold.com>';

  const friendlyFormName = prettyFormName(formName);
  // Subject-line hygiene: never let newlines/control chars reach the subject.
  const safeName = sanitizeHeaderText(String(name || '')).slice(0, 120);
  const safeEmail = sanitizeHeaderText(email).slice(0, 254);
  const timestamp = new Date().toISOString();
  const payload: FormPayload = {
    ...body,
    formId,
    formName,
    timestamp,
    source: new URL(request.url).origin,
  };

  const results: {
    webhook?: string;
    notification?: string;
    confirmation?: string;
  } = {};

  // 1. Send to webhook (optional)
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      results.webhook = res.ok ? 'sent' : `failed: ${res.status}`;
    } catch (err) {
      results.webhook = `error: ${
        err instanceof Error ? err.message : 'unknown'
      }`;
    }
  }

  // 2. Send emails via Resend HTTP API
  if (resendKey) {
    // 2a. OWNER notification — every submitted field, scannable summary.
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [ownerEmail],
          reply_to: email,
          subject: `[${friendlyFormName}] New submission from ${
            safeName || safeEmail
          }`,
          html: buildOwnerEmail(friendlyFormName, payload),
        }),
      });
      results.notification = res.ok ? 'sent' : `failed: ${res.status}`;
    } catch (err) {
      results.notification = `error: ${
        err instanceof Error ? err.message : 'unknown'
      }`;
    }

    // 2b. CUSTOMER confirmation — short, branded, no internal info.
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject: getConfirmationSubject(formName),
          html: buildConfirmationEmail(formName, name),
        }),
      });
      results.confirmation = res.ok ? 'sent' : `failed: ${res.status}`;
    } catch (err) {
      results.confirmation = `error: ${
        err instanceof Error ? err.message : 'unknown'
      }`;
    }
  }

  // Keep delivery details server-side only — never leak webhook/notification
  // internals to the client. Log failures for operator visibility.
  const failures = Object.entries(results).filter(
    ([, status]) => status !== 'sent',
  );
  if (failures.length > 0) {
    console.error(
      `[form-submit] delivery issues for "${friendlyFormName}":`,
      JSON.stringify(results),
    );
  }

  if (process.env.NODE_ENV === 'development') {
    // Dev-only: surface delivery results to make local debugging easier.
    return data({success: true, results});
  }
  return data({success: true});
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function prettyFormName(formName?: string): string {
  switch (formName) {
    case 'contact':
      return 'Contact';
    case 'newsletter':
      return 'Newsletter';
    case 'make-offer':
    case 'offer':
      return 'Make an Offer';
    default:
      return formName
        ? formName
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Form';
  }
}

// Fields we never want to render as raw rows in the owner email.
const HIDDEN_OWNER_KEYS = new Set(['formId', 'formName', '_gotcha', 'website']);

function humanizeKey(key: string): string {
  const overrides: Record<string, string> = {
    sku: 'SKU',
    offerAmount: 'Offer Amount',
    listedPrice: 'Listed Price',
    emailOptIn: 'Email Opt-In',
    smsOptIn: 'SMS Opt-In',
    firstName: 'First Name',
    lastName: 'Last Name',
  };
  if (overrides[key]) return overrides[key];
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    // Flatten nested `fields` objects into readable lines.
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v != null && v !== '')
      .map(
        ([k, v]) =>
          `${escapeHtml(humanizeKey(k))}: ${escapeHtml(renderValue(v))}`,
      )
      .join('<br/>');
  }
  // Cap individual values so a single oversized field can't bloat the email.
  return escapeHtml(String(value).slice(0, MAX_FIELD_LENGTH));
}

function buildOwnerEmail(friendlyFormName: string, data: FormPayload): string {
  const rows = Object.entries(data)
    .filter(([k, v]) => !HIDDEN_OWNER_KEYS.has(k) && v != null && v !== '')
    .map(([k, v]) => {
      const label = humanizeKey(k);
      const rendered = renderValue(v);
      if (!rendered) return '';
      return `<tr>
        <td style="padding:10px 14px;font-weight:600;color:#1a1a1a;border-bottom:1px solid #eee;vertical-align:top;white-space:nowrap">${escapeHtml(
          label,
        )}</td>
        <td style="padding:10px 14px;color:#333;border-bottom:1px solid #eee;vertical-align:top">${rendered}</td>
      </tr>`;
    })
    .join('');

  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto">
      <h2 style="color:#1a1a1a;border-bottom:2px solid #c9a84c;padding-bottom:8px;margin-bottom:4px">New ${escapeHtml(
        friendlyFormName,
      )} Submission</h2>
      <p style="color:#888;font-size:13px;margin:0 0 16px">A customer just submitted the ${escapeHtml(
        friendlyFormName,
      )} form on styxgold.com.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
    </div>
  `;
}

function getConfirmationSubject(formName?: string): string {
  if (formName === 'newsletter') return 'Welcome to The Dispatch — STYX Gold';
  if (formName === 'make-offer' || formName === 'offer') {
    return "We've received your offer — STYX Gold";
  }
  return "We've received your inquiry — STYX Gold";
}

function buildConfirmationEmail(formName?: string, name?: string): string {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,';

  // Newsletter gets its own short welcome.
  if (formName === 'newsletter') {
    return wrapBrandedEmail(
      'Welcome to The Dispatch',
      `
        <p style="margin:0 0 16px">${greeting}</p>
        <p style="margin:0 0 16px">You're on the list. You'll be first to hear about new drops, restocks, and stories from the workshop.</p>
      `,
    );
  }

  const isOffer = formName === 'make-offer' || formName === 'offer';
  const heading = isOffer ? 'Your Offer Is In' : 'We Have Your Message';
  const lead = isOffer
    ? `Thank you for your offer. Our team reviews every offer carefully and will get back to you within 24–48 hours.`
    : `Thank you for reaching out. We've received your inquiry and will get back to you within 24–48 hours.`;

  return wrapBrandedEmail(
    heading,
    `
      <p style="margin:0 0 16px">${greeting}</p>
      <p style="margin:0 0 16px">${lead}</p>
    `,
  );
}

/**
 * Dark, premium Styx-branded email shell. Inline styles only (email-safe).
 */
function wrapBrandedEmail(heading: string, innerHtml: string): string {
  return `
  <div style="margin:0;padding:0;background:#0d0d0c">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0c;padding:40px 16px">
      <tr>
        <td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#15140f;border:1px solid #2a271d">
            <tr>
              <td style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid #2a271d">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:0.32em;text-transform:uppercase;color:#c9a84c;font-weight:400">STYX</div>
                <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#7a7568;margin-top:8px">Gold &middot; Worn for the Crossing</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px 40px">
                <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:22px;letter-spacing:0.04em;color:#f3eee2;margin:0 0 20px">${escapeHtml(
                  heading,
                )}</h1>
                <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#cfc8b8">
                  ${innerHtml}
                  <p style="margin:24px 0 0;color:#cfc8b8">— The STYX Gold Team</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 40px;border-top:1px solid #2a271d;text-align:center">
                <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#6b665a;line-height:1.6">
                  STYX Gold &middot; <a href="https://styxgold.com" style="color:#c9a84c;text-decoration:none">styxgold.com</a><br/>
                  This message confirms we received your inquiry. No reply is needed.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;
}
