import {type ActionFunctionArgs, data} from 'react-router';

/**
 * Sends a customer's wishlist to an email address via Resend.
 *
 * This route owns its own Resend call on purpose — the shared form-submit email
 * code is maintained separately, so we instantiate everything locally here to
 * avoid collisions. Uses the same verified from-address as api.form-submit.tsx.
 *
 * POST body (JSON):
 *   to:     recipient email (required)
 *   note:   optional short message from the sender
 *   origin: site origin for building product links (optional; falls back to request origin)
 *   items:  [{ handle, title, length?, price?, currency?, image? }]
 */

type WishlistEmailItem = {
  handle: string;
  title: string;
  length?: string | null;
  price?: string | null;
  currency?: string | null;
  image?: string | null;
};

const FROM = 'STYX Gold <noreply@styxgold.com>';

export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  let body: {
    to?: string;
    note?: string;
    origin?: string;
    items?: WishlistEmailItem[];
  };
  try {
    body = (await request.json()) as {
      to?: string;
      note?: string;
      origin?: string;
      items?: WishlistEmailItem[];
    };
  } catch {
    return data({error: 'Invalid request body'}, {status: 400});
  }

  const to = (body.to || '').trim();
  const note = (body.note || '').trim();
  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];

  // Basic email validation
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return data({error: 'A valid email address is required'}, {status: 400});
  }
  if (items.length === 0) {
    return data({error: 'Your wishlist is empty'}, {status: 400});
  }

  const env = context.env as Record<string, string>;
  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) {
    return data({error: 'Email is not configured'}, {status: 500});
  }

  const origin = (body.origin || new URL(request.url).origin).replace(/\/$/, '');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject: 'Your STYX Gold Wishlist',
        html: buildWishlistEmail(items, note, origin),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return data(
        {error: `Failed to send (${res.status})`, detail},
        {status: 502},
      );
    }
  } catch (err) {
    return data(
      {error: err instanceof Error ? err.message : 'Failed to send email'},
      {status: 502},
    );
  }

  return data({success: true});
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPrice(item: WishlistEmailItem): string {
  if (item.price == null || item.price === '') return '';
  const amount = Number(item.price);
  if (!Number.isFinite(amount)) return esc(String(item.price));
  const currency = item.currency || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function buildWishlistEmail(
  items: WishlistEmailItem[],
  note: string,
  origin: string,
): string {
  const rows = items
    .map((item) => {
      const url = `${origin}/products/${encodeURIComponent(item.handle)}`;
      const price = formatPrice(item);
      const lengthLine = item.length
        ? `<div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.08em;color:#8A6A32;margin-top:4px;text-transform:uppercase">Length · ${esc(
            item.length,
          )}</div>`
        : '';
      const priceLine = price
        ? `<div style="font-family:'Courier New',monospace;font-size:13px;color:#b8924a;margin-top:6px">${esc(
            price,
          )}</div>`
        : '';
      const thumb = item.image
        ? `<td width="72" valign="top" style="padding:0 16px 0 0">
             <img src="${esc(
               item.image,
             )}" width="72" height="90" alt="" style="display:block;width:72px;height:90px;object-fit:cover;border:1px solid #e5e0d6" />
           </td>`
        : '';
      return `
        <tr>
          <td style="padding:18px 0;border-bottom:1px solid #e5e0d6">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                ${thumb}
                <td valign="top">
                  <a href="${url}" style="font-family:'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:0.04em;color:#1a1815;text-decoration:none;text-transform:uppercase">${esc(
                    item.title,
                  )}</a>
                  ${lengthLine}
                  ${priceLine}
                  <div style="margin-top:8px">
                    <a href="${url}" style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.1em;color:#6B6459;text-decoration:none;text-transform:uppercase">View piece &rarr;</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join('');

  const noteBlock = note
    ? `<tr><td style="padding:0 0 24px">
         <div style="font-family:'Georgia',serif;font-size:15px;font-style:italic;color:#4A443B;line-height:1.6;padding:16px 20px;background:#f5f2ea;border-left:3px solid #b8924a">${esc(
           note,
         )}</div>
       </td></tr>`
    : '';

  return `
  <div style="background:#efeae0;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e0d6">
      <tr>
        <td style="padding:32px 32px 0;text-align:center">
          <div style="font-family:'Times New Roman',serif;font-size:22px;letter-spacing:0.2em;color:#1a1815;text-transform:uppercase">STYX</div>
          <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.18em;color:#8A6A32;text-transform:uppercase;margin-top:6px">Solid Gold Chains</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 8px">
          <h1 style="font-family:'Times New Roman',serif;font-size:20px;font-weight:500;letter-spacing:0.06em;color:#1a1815;margin:0 0 4px;text-align:center">A Wishlist For You</h1>
          <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.12em;color:#6B6459;text-transform:uppercase;text-align:center;margin:0 0 24px">${
            items.length
          } piece${items.length !== 1 ? 's' : ''} saved</p>
        </td>
      </tr>
      <tr><td style="padding:0 32px">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${noteBlock}
          ${rows}
        </table>
      </td></tr>
      <tr>
        <td style="padding:32px;text-align:center">
          <a href="${origin}/collections/chains" style="display:inline-block;padding:14px 28px;background:#1a1815;color:#efeae0;font-family:'Times New Roman',serif;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none">Browse The Collection</a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px;text-align:center;border-top:1px solid #e5e0d6">
          <p style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.1em;color:#8a8378;text-transform:uppercase;margin:20px 0 0">Solid gold, every weight in the open — styxgold.com</p>
        </td>
      </tr>
    </table>
  </div>`;
}
