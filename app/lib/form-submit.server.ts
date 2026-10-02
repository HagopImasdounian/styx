/**
 * Shared helpers for form-submission endpoints (currently used by
 * api.customize-submit). Pure functions only, Web APIs only: this runs on
 * Oxygen (Cloudflare Workers), so no Node Buffer or fs.
 *
 * NOTE: api.form-submit.tsx keeps its own private copies of the sanitizers
 * on purpose; do not change its behaviour from here.
 */

// ── Text field hygiene ────────────────────────────────────────────────────

/** Cap any individual string field when rendering into emails. */
export const MAX_FIELD_LENGTH = 2000;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strip newlines and control characters (header/subject injection hygiene). */
export function sanitizeHeaderText(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function humanizeKey(key: string): string {
  const overrides: Record<string, string> = {
    sku: 'SKU',
    offerAmount: 'Offer Amount',
    listedPrice: 'Listed Price',
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

/** Escape + cap a value for an email cell. Preserves user line breaks. */
export function renderTextCell(value: string): string {
  return escapeHtml(value.slice(0, MAX_FIELD_LENGTH)).replace(/\r?\n/g, '<br/>');
}

// ── Attachment validation ─────────────────────────────────────────────────

export const SKETCH_MAX_FILES = 3;
export const SKETCH_MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB each
export const SKETCH_MAX_TOTAL_BYTES = 12 * 1024 * 1024; // 12 MB combined

/** MIME types we accept. HEIC/HEIF covers iPhone camera output. */
export const SKETCH_ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

/**
 * Browsers frequently report an empty or generic MIME type for .heic files
 * (macOS Safari, some Androids). Fall back to the extension in that case.
 */
const HEIC_EXT_RE = /\.(heic|heif)$/i;

export type FileMeta = {name: string; size: number; type: string};

export type FileValidation = {ok: true} | {ok: false; error: string};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isAllowedImageType(file: FileMeta): boolean {
  const type = (file.type || '').toLowerCase();
  if (SKETCH_ALLOWED_TYPES.has(type)) return true;
  if ((type === '' || type === 'application/octet-stream') && HEIC_EXT_RE.test(file.name)) {
    return true;
  }
  return false;
}

/**
 * Validate a set of candidate sketch files. Returns a human-readable error
 * (no dashes, safe to show to the customer) on the first problem found.
 */
export function validateSketchFiles(files: FileMeta[]): FileValidation {
  if (files.length > SKETCH_MAX_FILES) {
    return {
      ok: false,
      error: `You can attach up to ${SKETCH_MAX_FILES} images. Please remove ${
        files.length - SKETCH_MAX_FILES
      }.`,
    };
  }

  let total = 0;
  for (const f of files) {
    if (!isAllowedImageType(f)) {
      return {
        ok: false,
        error: `"${f.name}" is not a supported image. Please use JPG, PNG, WebP, or HEIC.`,
      };
    }
    if (f.size <= 0) {
      return {ok: false, error: `"${f.name}" appears to be empty.`};
    }
    if (f.size > SKETCH_MAX_FILE_BYTES) {
      return {
        ok: false,
        error: `"${f.name}" is ${formatBytes(f.size)}. Each image must be 5 MB or smaller.`,
      };
    }
    total += f.size;
  }

  if (total > SKETCH_MAX_TOTAL_BYTES) {
    return {
      ok: false,
      error: `Your images total ${formatBytes(total)}. Together they must be 12 MB or smaller.`,
    };
  }

  return {ok: true};
}

/** Keep attachment filenames boring: no paths, control chars, or absurd length. */
export function safeFilename(name: string, fallback = 'image'): string {
  const base = name.split(/[\\/]/).pop() || fallback;
  const cleaned = sanitizeHeaderText(base)
    .replace(/[^\w.\- ()]+/g, '_')
    .slice(0, 120);
  return cleaned || fallback;
}

// ── Base64 (Workers-safe) ─────────────────────────────────────────────────

/**
 * Encode bytes to base64 without Buffer. Uses btoa on chunks so a 5 MB file
 * does not blow the call stack via String.fromCharCode(...hugeArray).
 */
export function bytesToBase64(bytes: Uint8Array, chunkSize = 0x8000): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    let s = '';
    for (let j = 0; j < chunk.length; j++) s += String.fromCharCode(chunk[j]);
    binary += s;
  }
  return btoa(binary);
}

// ── Email shells ──────────────────────────────────────────────────────────

/** Row list for the owner email. Values must already be HTML-safe. */
export function ownerRows(rows: Array<[label: string, html: string]>): string {
  return rows
    .filter(([, html]) => html && html.trim() !== '')
    .map(
      ([label, html]) => `<tr>
        <td style="padding:10px 14px;font-weight:600;color:#1a1a1a;border-bottom:1px solid #eee;vertical-align:top;white-space:nowrap">${escapeHtml(
          label,
        )}</td>
        <td style="padding:10px 14px;color:#333;border-bottom:1px solid #eee;vertical-align:top">${html}</td>
      </tr>`,
    )
    .join('');
}

export function wrapOwnerEmail(friendlyFormName: string, rowsHtml: string): string {
  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto">
      <h2 style="color:#1a1a1a;border-bottom:2px solid #b8a26a;padding-bottom:8px;margin-bottom:4px">New ${escapeHtml(
        friendlyFormName,
      )} Submission</h2>
      <p style="color:#888;font-size:13px;margin:0 0 16px">A customer just submitted the ${escapeHtml(
        friendlyFormName,
      )} form on styxgold.com.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rowsHtml}</table>
    </div>
  `;
}

/**
 * Dark, premium Styx-branded email shell for customer confirmations.
 * Inline styles only (email-safe).
 */
export function wrapBrandedEmail(heading: string, innerHtml: string): string {
  return `
  <div style="margin:0;padding:0;background:#0d0d0c">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0c;padding:40px 16px">
      <tr>
        <td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#141516;border:1px solid #28292a">
            <tr>
              <td style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid #28292a">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:0.32em;text-transform:uppercase;color:#b8a26a;font-weight:400">STYX</div>
                <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#76787a;margin-top:8px">Gold &middot; Worn for the Crossing</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px 40px">
                <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:22px;letter-spacing:0.04em;color:#f1f1ef;margin:0 0 20px">${escapeHtml(
                  heading,
                )}</h1>
                <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#cfcfcb">
                  ${innerHtml}
                  <p style="margin:24px 0 0;color:#cfcfcb">The STYX Gold Team</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 40px;border-top:1px solid #28292a;text-align:center">
                <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#66686a;line-height:1.6">
                  STYX Gold &middot; <a href="https://styxgold.com" style="color:#b8a26a;text-decoration:none">styxgold.com</a><br/>
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
