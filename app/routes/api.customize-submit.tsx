import {type ActionFunctionArgs, data} from 'react-router';

import {rateLimitAllow} from '~/lib/rate-limit.server';
import {
  EMAIL_RE,
  SKETCH_MAX_FILES,
  SKETCH_MAX_TOTAL_BYTES,
  bytesToBase64,
  formatBytes,
  escapeHtml,
  ownerRows,
  renderTextCell,
  safeFilename,
  sanitizeHeaderText,
  validateSketchFiles,
  wrapBrandedEmail,
  wrapOwnerEmail,
} from '~/lib/form-submit.server';

/**
 * Custom-commission form handler (multipart/form-data).
 *
 * Text fields: name, email, phone, budget, description, plus the honeypot
 * `website` / `_gotcha`. Files: up to 3 under `sketches`. Images are
 * validated, base64-encoded, and attached to the owner email via Resend.
 * The optional webhook gets the text fields plus attachment metadata only.
 */

const FORM_ID = 'custom-commission';
const FRIENDLY_NAME = 'Custom Commission';

// Cheap early reject before we buffer the body. Files (12 MB) + multipart
// overhead + text fields. Anything bigger is not a legitimate submission.
const MAX_REQUEST_BYTES = SKETCH_MAX_TOTAL_BYTES + 256 * 1024;

// Per-field caps (characters) for the text inputs.
const FIELD_CAPS: Record<string, number> = {
  name: 120,
  email: 254,
  phone: 40,
  budget: 40,
  description: 4000,
};

const BUDGET_LABELS: Record<string, string> = {
  'under-1000': 'Under $1,000',
  '1000-5000': '$1,000 to $5,000',
  '5000-15000': '$5,000 to $15,000',
  '15000-50000': '$15,000 to $50,000',
  '50000+': '$50,000+',
};

function text(fd: FormData, key: string): string {
  const v = fd.get(key);
  if (typeof v !== 'string') return '';
  return v.slice(0, FIELD_CAPS[key] ?? 2000);
}

export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  if (
    !(await rateLimitAllow(request, 'customize-submit', {
      limit: 5,
      windowSeconds: 600,
    }))
  ) {
    return data(
      {error: 'Too many requests. Please try again in a few minutes.'},
      {status: 429},
    );
  }

  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_REQUEST_BYTES) {
    return data(
      {error: 'Your images are too large. Together they must be 12 MB or smaller.'},
      {status: 413},
    );
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    return data({error: 'Expected multipart/form-data'}, {status: 400});
  }

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return data({error: 'Invalid form data'}, {status: 400});
  }

  // Honeypot: hidden fields humans never fill. Pretend success so bots
  // don't learn they were caught.
  const gotcha = text(fd, '_gotcha') || text(fd, 'website');
  if (gotcha.trim() !== '') {
    return data({success: true});
  }

  const name = text(fd, 'name').trim();
  const email = text(fd, 'email').trim();
  const phone = text(fd, 'phone').trim();
  const budget = text(fd, 'budget').trim();
  const description = text(fd, 'description').trim();

  if (!EMAIL_RE.test(email)) {
    return data({error: 'A valid email address is required.'}, {status: 400});
  }
  if (!name) {
    return data({error: 'Please tell us your name.'}, {status: 400});
  }
  if (!description) {
    return data(
      {error: 'Please describe what you are looking for.'},
      {status: 400},
    );
  }

  // Files: only File entries under `sketches`; ignore stray strings.
  const files = fd
    .getAll('sketches')
    .filter((v): v is File => typeof v !== 'string' && v.size > 0);

  const check = validateSketchFiles(
    files.map((f) => ({name: f.name, size: f.size, type: f.type})),
  );
  if (!check.ok) {
    return data({error: check.error}, {status: 400});
  }

  // Encode attachments. Sequential on purpose: keeps peak memory to one
  // decoded file + its base64 string at a time.
  const attachments: Array<{filename: string; content: string}> = [];
  const attachmentMeta: Array<{filename: string; size: number; type: string}> =
    [];
  for (let i = 0; i < files.length && i < SKETCH_MAX_FILES; i++) {
    const f = files[i];
    const bytes = new Uint8Array(await f.arrayBuffer());
    const filename = safeFilename(f.name, `sketch-${i + 1}`);
    attachments.push({filename, content: bytesToBase64(bytes)});
    attachmentMeta.push({filename, size: f.size, type: f.type || 'unknown'});
  }

  const env = context.env as Record<string, string>;
  const webhookUrl = env.FORM_WEBHOOK_URL;
  const resendKey = env.RESEND_API_KEY;
  const ownerEmail =
    env.OWNER_EMAIL || env.FORM_NOTIFY_EMAIL || 'hagop@itshco.com';
  // Must be on a domain verified in Resend (same as api.form-submit).
  const fromAddress = 'STYX Gold <noreply@styxgold.com>';

  const safeName = sanitizeHeaderText(name).slice(0, 120);
  const safeEmail = sanitizeHeaderText(email).slice(0, 254);
  const timestamp = new Date().toISOString();
  const source = new URL(request.url).origin;

  const results: {
    webhook?: string;
    notification?: string;
    confirmation?: string;
  } = {};

  // 1. Webhook (optional): text fields + attachment metadata, no bytes.
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          formId: FORM_ID,
          formName: FORM_ID,
          name,
          email,
          phone: phone || undefined,
          message: description,
          fields: {budget},
          sketches: attachmentMeta,
          timestamp,
          source,
        }),
      });
      results.webhook = res.ok ? 'sent' : `failed: ${res.status}`;
    } catch (err) {
      results.webhook = `error: ${err instanceof Error ? err.message : 'unknown'}`;
    }
  }

  // 2. Emails via Resend.
  if (resendKey) {
    const budgetLabel = BUDGET_LABELS[budget] || budget;
    const attachmentList =
      attachmentMeta.length === 0
        ? '<span style="color:#888">None</span>'
        : `<ol style="margin:0;padding-left:18px">${attachmentMeta
            .map(
              (a) =>
                `<li>${escapeHtml(a.filename)} <span style="color:#888">(${formatBytes(
                  a.size,
                )})</span></li>`,
            )
            .join('')}</ol>`;

    const rows = ownerRows([
      ['Name', renderTextCell(name)],
      ['Email', renderTextCell(email)],
      ['Phone', renderTextCell(phone)],
      ['Budget', renderTextCell(budgetLabel)],
      ['Description', renderTextCell(description)],
      [
        `Sketches (${attachmentMeta.length})`,
        attachmentList,
      ],
      ['Timestamp', renderTextCell(timestamp)],
      ['Source', renderTextCell(source)],
    ]);

    // 2a. Owner notification with attachments.
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
          subject: `[${FRIENDLY_NAME}] New submission from ${
            safeName || safeEmail
          }${attachments.length ? ` (${attachments.length} image${
            attachments.length === 1 ? '' : 's'
          })` : ''}`,
          html: wrapOwnerEmail(FRIENDLY_NAME, rows),
          attachments,
        }),
      });
      results.notification = res.ok ? 'sent' : `failed: ${res.status}`;
    } catch (err) {
      results.notification = `error: ${
        err instanceof Error ? err.message : 'unknown'
      }`;
    }

    // 2b. Customer confirmation, short and branded.
    try {
      const greeting = safeName ? `Hi ${escapeHtml(safeName)},` : 'Hi,';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject: 'We have your commission request. STYX Gold',
          html: wrapBrandedEmail(
            'Your Commission Request Is In',
            `
              <p style="margin:0 0 16px">${greeting}</p>
              <p style="margin:0 0 16px">Thank you for starting a commission with us. Our team will review your request${
                attachments.length ? ' and your reference images' : ''
              } and get back to you within 24 to 48 hours.</p>
            `,
          ),
        }),
      });
      results.confirmation = res.ok ? 'sent' : `failed: ${res.status}`;
    } catch (err) {
      results.confirmation = `error: ${
        err instanceof Error ? err.message : 'unknown'
      }`;
    }
  }

  const failures = Object.entries(results).filter(
    ([, status]) => status !== 'sent',
  );
  if (failures.length > 0) {
    console.error(
      `[customize-submit] delivery issues:`,
      JSON.stringify(results),
    );
  }

  if (process.env.NODE_ENV === 'development') {
    return data({success: true, results});
  }
  return data({success: true});
}
