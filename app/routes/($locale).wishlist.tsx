import {useEffect, useState} from 'react';
import {type LoaderFunctionArgs} from 'react-router';
import {useLoaderData, useNavigate} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter} from '~/components/styx';
import {useWishlist} from '~/context/WishlistContext';
import {useCompare, encodeCompareItems} from '~/context/CompareContext';
import {usePrintList} from '~/context/PrintListContext';
import {usePrefixPathWithLocale} from '~/lib/utils';

export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const handles = (url.searchParams.get('products') || '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 50);

  if (handles.length === 0) return {products: []};

  const results = await Promise.all(
    handles.map((handle) =>
      context.storefront.query(WISHLIST_PRODUCT_QUERY, {
        variables: {
          handle,
          country: context.storefront.i18n.country,
          language: context.storefront.i18n.language,
        },
      }),
    ),
  );
  return {products: results.map((r) => r.product).filter(Boolean)};
}

// Compare and Print lists have their own size caps; respect them so we don't
// silently drop items in a confusing way.
const MAX_COMPARE = 4;
const MAX_PRINT = 8;

export default function WishlistPage() {
  const {products} = useLoaderData<typeof loader>();
  const {handles, remove, clear} = useWishlist();
  const compare = useCompare();
  const printList = usePrintList();
  const navigate = useNavigate();
  const compareBase = usePrefixPathWithLocale('/compare');
  const printBase = usePrefixPathWithLocale('/print-list');
  const emailApi = usePrefixPathWithLocale('/api/wishlist-email');

  // The heart writes handles to localStorage; this page needs product data by
  // handle from the loader (?products=). Show items in saved order.
  const byHandle = new Map(products.map((p: any) => [p.handle, p]));
  const items = handles.map((h) => byHandle.get(h)).filter(Boolean) as any[];

  // ── Push wishlist → Compare, then navigate. Compare caps at 4 ──
  const sendToCompare = () => {
    const chosen = handles.slice(0, MAX_COMPARE);
    if (chosen.length === 0) return;
    compare.clear();
    // length is null here — wishlist saves the whole product, and Compare
    // scopes to the full length range when length is omitted.
    chosen.forEach((h) => compare.add(h, null));
    const param = encodeCompareItems(chosen.map((h) => ({handle: h, length: null})));
    navigate(`${compareBase}?products=${param}`);
  };

  // ── Push wishlist → Print List, then navigate. Print caps at 8 ──
  const sendToPrint = () => {
    const chosen = handles.slice(0, MAX_PRINT);
    if (chosen.length === 0) return;
    printList.clear();
    chosen.forEach((h) => printList.add(h));
    navigate(`${printBase}?products=${chosen.join(',')}`);
  };

  // ── Email this wishlist ──
  const [emailOpen, setEmailOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<
    {kind: 'ok' | 'err'; msg: string} | null
  >(null);

  const sendEmail = async () => {
    if (sending) return;
    setEmailStatus(null);
    const to = recipient.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      setEmailStatus({kind: 'err', msg: 'Enter a valid email address.'});
      return;
    }
    // Build the payload from already-loaded product data so the email has
    // titles, prices and images without a second round trip.
    const payloadItems = items.map((p) => {
      const variant = p.variants?.nodes?.[0];
      const lengthOpt = variant?.selectedOptions?.find(
        (o: any) => o.name?.toLowerCase() === 'length',
      )?.value;
      return {
        handle: p.handle,
        title: p.title,
        length: lengthOpt ?? null,
        price: variant?.price?.amount ?? null,
        currency: variant?.price?.currencyCode ?? null,
        image: (p.featuredImage || variant?.image)?.url ?? null,
      };
    });
    if (payloadItems.length === 0) {
      setEmailStatus({kind: 'err', msg: 'Your wishlist is empty.'});
      return;
    }
    setSending(true);
    try {
      const res = await fetch(emailApi, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          to,
          note: note.trim(),
          origin: window.location.origin,
          items: payloadItems,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (res.ok && json.success) {
        setEmailStatus({kind: 'ok', msg: `Sent to ${to}.`});
        setRecipient('');
        setNote('');
      } else {
        setEmailStatus({
          kind: 'err',
          msg: json.error || 'Could not send. Please try again.',
        });
      }
    } catch {
      setEmailStatus({kind: 'err', msg: 'Could not send. Please try again.'});
    } finally {
      setSending(false);
    }
  };

  // If we have saved handles whose data isn't loaded (e.g. a direct visit to
  // /wishlist with no query string), redirect once to the param URL so the
  // loader fetches them. Removing an item doesn't trigger this (its data is
  // already loaded), so removal stays instant with no reload.
  const missingCount = handles.filter((h) => !byHandle.has(h)).length;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (missingCount > 0) {
      window.location.replace(`/wishlist?products=${handles.join(',')}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingCount]);

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      <div style={{maxWidth: 1200, margin: '0 auto', padding: '48px 24px 120px'}}>
        <div style={{textAlign: 'center', marginBottom: 40}}>
          <h1 style={{fontFamily: FONT.cinzel, fontSize: 28, fontWeight: 500, letterSpacing: '0.08em', color: STYX.ink, marginBottom: 8}}>
            Your Wishlist
          </h1>
          <p style={{fontFamily: FONT.mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.silt}}>
            {handles.length} piece{handles.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {handles.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px 0'}}>
            <p style={{fontFamily: FONT.cormorant, fontSize: 18, color: STYX.silt, margin: '0 auto 28px', maxWidth: 460}}>
              Tap the heart on any chain to save it here for later.
            </p>
            <Link
              to="/collections/chains"
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                background: STYX.ink,
                color: STYX.bone,
                fontFamily: FONT.cinzel,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Browse Our Chains
            </Link>
          </div>
        ) : (
          <>
            {/* ───── Wishlist actions ───── */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: 16,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setEmailOpen((v) => !v);
                  setEmailStatus(null);
                }}
                style={actionBtnStyle(emailOpen)}
              >
                Email this wishlist
              </button>
              <button
                type="button"
                onClick={sendToCompare}
                title={
                  handles.length > MAX_COMPARE
                    ? `Compares the first ${MAX_COMPARE} pieces`
                    : undefined
                }
                style={actionBtnStyle(false)}
              >
                Compare wishlist
              </button>
              <button
                type="button"
                onClick={sendToPrint}
                title={
                  handles.length > MAX_PRINT
                    ? `Prints the first ${MAX_PRINT} pieces`
                    : undefined
                }
                style={actionBtnStyle(false)}
              >
                Print wishlist
              </button>
            </div>

            {/* ───── Email panel ───── */}
            {emailOpen && (
              <div
                style={{
                  maxWidth: 480,
                  margin: '0 auto 28px',
                  padding: 24,
                  border: `1px solid ${STYX.line}`,
                  background: STYX.paper,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: STYX.ink,
                    marginBottom: 4,
                    textAlign: 'center',
                  }}
                >
                  Email this wishlist
                </div>
                <p
                  style={{
                    fontFamily: FONT.inter,
                    fontSize: 12,
                    color: STYX.silt,
                    textAlign: 'center',
                    margin: '0 0 18px',
                  }}
                >
                  Send it to yourself or to someone else.
                </p>

                <label style={emailLabelStyle}>Recipient email</label>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="name@example.com"
                  style={emailInputStyle}
                />

                <label style={{...emailLabelStyle, marginTop: 14}}>
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Thought you'd like these…"
                  rows={3}
                  maxLength={500}
                  style={{...emailInputStyle, resize: 'vertical'}}
                />

                <button
                  type="button"
                  onClick={sendEmail}
                  disabled={sending}
                  style={{
                    marginTop: 18,
                    width: '100%',
                    padding: '14px 28px',
                    background: sending ? STYX.line : STYX.ink,
                    color: sending ? STYX.silt : STYX.bone,
                    border: 'none',
                    fontFamily: FONT.cinzel,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    cursor: sending ? 'default' : 'pointer',
                  }}
                >
                  {sending ? 'Sending…' : 'Send Wishlist'}
                </button>

                {emailStatus && (
                  <div
                    style={{
                      marginTop: 12,
                      fontFamily: FONT.mono,
                      fontSize: 11,
                      letterSpacing: '0.06em',
                      textAlign: 'center',
                      color:
                        emailStatus.kind === 'ok' ? STYX.goldDeep : '#a3402f',
                    }}
                  >
                    {emailStatus.msg}
                  </div>
                )}
              </div>
            )}

            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 28}}>
              <button
                type="button"
                onClick={clear}
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: STYX.silt,
                  cursor: 'pointer',
                }}
              >
                Clear wishlist
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 24,
              }}
            >
              {items.map((p) => {
                const variant = p.variants?.nodes?.[0];
                const image = p.featuredImage || variant?.image;
                const price = variant?.price;
                return (
                  <div key={p.handle} style={{position: 'relative', border: `1px solid ${STYX.line}`, background: STYX.paper}}>
                    <button
                      type="button"
                      onClick={() => remove(p.handle)}
                      aria-label="Remove from wishlist"
                      title="Remove from wishlist"
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 2,
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        border: `1px solid ${STYX.gold}`,
                        background: 'rgba(245,242,234,0.9)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="16" height="15" viewBox="0 0 22 20" fill={STYX.gold} stroke={STYX.gold} strokeWidth="1.5">
                        <path d="M11 18.5C11 18.5 1.5 13 1.5 6.5C1.5 3.46 3.96 1 7 1C8.8 1 10.37 1.89 11 3.18C11.63 1.89 13.2 1 15 1C18.04 1 20.5 3.46 20.5 6.5C20.5 13 11 18.5 11 18.5Z" />
                      </svg>
                    </button>

                    <Link to={`/products/${p.handle}`} style={{textDecoration: 'none', display: 'block'}}>
                      <div style={{aspectRatio: '4/5', background: '#fff', overflow: 'hidden'}}>
                        {image && (
                          <Image data={image} aspectRatio="4/5" sizes="(min-width: 768px) 25vw, 50vw" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        )}
                      </div>
                      <div style={{padding: '14px 16px'}}>
                        <div style={{fontFamily: FONT.cinzel, fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', color: STYX.ink, textTransform: 'uppercase'}}>
                          {p.title}
                        </div>
                        {price && (
                          <div style={{fontFamily: FONT.mono, fontSize: 12, color: STYX.gold, marginTop: 6}}>
                            <Money data={price} />
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <StyxFooter />
    </div>
  );
}

/* ─────────────────── Shared styles ─────────────────── */

function actionBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '12px 22px',
    background: active ? STYX.ink : 'transparent',
    border: `1px solid ${active ? STYX.ink : STYX.line}`,
    fontFamily: FONT.cinzel,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.13em',
    textTransform: 'uppercase',
    color: active ? STYX.bone : STYX.ink,
    cursor: 'pointer',
  };
}

const emailLabelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: FONT.mono,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: STYX.silt,
  marginBottom: 6,
};

const emailInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: `1px solid ${STYX.line}`,
  background: '#fff',
  fontFamily: FONT.inter,
  fontSize: 13,
  color: STYX.ink,
  outline: 'none',
  boxSizing: 'border-box',
};

const WISHLIST_PRODUCT_QUERY = `#graphql
  query WishlistProduct(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      featuredImage { url altText width height }
      variants(first: 1) {
        nodes {
          image { url altText width height }
          price { amount currencyCode }
          selectedOptions { name value }
        }
      }
    }
  }
` as const;
