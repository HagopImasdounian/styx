import {useState, useEffect} from 'react';
import {type LoaderFunctionArgs} from 'react-router';
import {useLoaderData, useNavigate, useFetcher} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter} from '~/components/styx';
import {usePrintList} from '~/context/PrintListContext';
import {usePrefixPathWithLocale} from '~/lib/utils';
import {STYX_PRINT_LOGO} from '~/components/styx/printLogo';

// Customer-facing site URL shown on the printout. Edit to the live domain.
const SITE_URL = 'styxgold.com';

export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const productsParam = url.searchParams.get('products') || '';
  const handles = productsParam
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (handles.length === 0) {
    return {products: []};
  }

  const results = await Promise.all(
    handles.map((handle) =>
      context.storefront.query(PRINT_PRODUCT_QUERY, {
        variables: {
          handle,
          country: context.storefront.i18n.country,
          language: context.storefront.i18n.language,
        },
      }),
    ),
  );

  const products = results.map((r) => r.product).filter(Boolean);
  return {products};
}

/* ─────────────────── Spec derivation ─────────────────── */

type PrintSpec = {
  handle: string;
  title: string;
  image?: any;
  /** Width in millimeters (numeric), null if unknown. */
  mm: number | null;
  karat: number | null;
  style: string | null;
  model: string | null;
};

function deriveSpec(p: any): PrintSpec {
  // Width: prefer the chain.thickness metafield, fall back to the title.
  const rawThickness: string | null =
    p.chain_thickness?.value ||
    (p.title.match(/(\d+(?:\.\d+)?)\s*mm/i)?.[0] ?? null);
  const mmMatch = rawThickness?.match(/(\d+(?:\.\d+)?)/);
  const mm = mmMatch ? parseFloat(mmMatch[1]) : null;

  const karat = p.karat?.value
    ? parseInt(p.karat.value, 10)
    : /18\s*k/i.test(p.title)
      ? 18
      : /14\s*k/i.test(p.title)
        ? 14
        : /10\s*k/i.test(p.title)
          ? 10
          : null;

  const style = p.chain_style?.value || null;

  // Model #: prefer the original_sku metafield; else the base of a variant SKU
  // (strip any length suffix like "-16in" / " - 16\"").
  const rawModel =
    p.original_sku?.value ||
    p.variants?.nodes?.find((v: any) => v.sku)?.sku ||
    null;
  const model = rawModel
    ? rawModel.replace(/\s*[-/]\s*\d+\s*("|in|inch).*$/i, '').trim()
    : null;

  const image = p.featuredImage || p.variants?.nodes?.[0]?.image;

  return {handle: p.handle, title: p.title, image, mm, karat, style, model};
}

/** "Cuban Link · 5.4 mm (5.4 mil)" */
function oneLiner(s: PrintSpec): string {
  const parts: string[] = [];
  if (s.style) parts.push(s.style);
  if (s.mm != null) parts.push(`${s.mm} mm (${s.mm} mil)`);
  return parts.join(' · ') || s.title;
}

/* ─────────────────── Component ─────────────────── */

export default function PrintListPage() {
  const {products} = useLoaderData<typeof loader>();
  const {handles, add, move, remove, clear, isFull} = usePrintList();
  const navigate = useNavigate();

  const specByHandle = new Map<string, PrintSpec>(
    products.map((p: any) => [p.handle, deriveSpec(p)]),
  );

  // Follow the (reorderable) localStorage order; fall back to loader order on
  // first paint before the context hydrates.
  const orderedHandles =
    handles.length > 0
      ? handles.filter((h) => specByHandle.has(h))
      : products.map((p: any) => p.handle);

  const specs = orderedHandles
    .map((h) => specByHandle.get(h))
    .filter(Boolean) as PrintSpec[];

  const [missingSilhouette, setMissingSilhouette] = useState<Record<string, boolean>>({});

  // ── Search to add any item ──
  const [query, setQuery] = useState('');
  const search = useFetcher<{products: any[]}>();
  const apiBase = usePrefixPathWithLocale('/api/products');

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      search.load(`${apiBase}?query=${encodeURIComponent(q)}&count=8`);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, apiBase]);

  const searching = search.state === 'loading';
  const results: Array<{handle: string; title: string; image?: string | null}> =
    query.trim().length >= 2
      ? (search.data?.products ?? []).map((p: any) => ({
          handle: p.handle,
          title: p.title,
          image: p.featuredImage?.url ?? p.variants?.nodes?.[0]?.image?.url ?? null,
        }))
      : [];

  // Add a searched product and reload the loader with it included.
  const currentOrder = handles.length > 0 ? handles : products.map((p: any) => p.handle);
  const addAndShow = (handle: string) => {
    if (currentOrder.includes(handle) || isFull) return;
    add(handle);
    const next = [...currentOrder, handle];
    navigate(`/print-list?products=${next.join(',')}`);
    setQuery('');
  };

  const searchBox = (
    <div style={{maxWidth: 480, margin: '0 auto 28px', position: 'relative'}}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a chain to add (e.g. 3mm cuban)…"
        disabled={isFull}
        style={{
          width: '100%',
          padding: '13px 16px',
          border: `1px solid ${STYX.line}`,
          background: '#fff',
          fontFamily: FONT.inter,
          fontSize: 14,
          color: STYX.ink,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {isFull && (
        <div style={{fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.silt, marginTop: 6}}>
          Print list full (8 max)
        </div>
      )}
      {query.trim().length >= 2 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 20,
            background: '#fff',
            border: `1px solid ${STYX.line}`,
            borderTop: 'none',
            maxHeight: 320,
            overflowY: 'auto',
            boxShadow: '0 12px 28px -16px rgba(26,24,21,0.35)',
          }}
        >
          {searching && results.length === 0 && (
            <div style={{padding: '14px 16px', fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.silt}}>
              Searching…
            </div>
          )}
          {!searching && results.length === 0 && (
            <div style={{padding: '14px 16px', fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.silt}}>
              No matches
            </div>
          )}
          {results.map((r) => {
            const already = currentOrder.includes(r.handle);
            return (
              <button
                key={r.handle}
                type="button"
                onClick={() => addAndShow(r.handle)}
                disabled={already}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  borderBottom: `1px solid ${STYX.lineSoft}`,
                  background: 'transparent',
                  cursor: already ? 'default' : 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{width: 36, height: 36, flexShrink: 0, background: STYX.paper, overflow: 'hidden'}}>
                  {r.image && (
                    <img src={r.image} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  )}
                </div>
                <span style={{flex: 1, fontFamily: FONT.inter, fontSize: 13, color: STYX.ink}}>
                  {r.title}
                </span>
                <span style={{fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: already ? STYX.silt : STYX.gold}}>
                  {already ? 'Added' : '+ Add'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // Empty state
  if (specs.length === 0) {
    return (
      <div style={{background: STYX.bone, minHeight: '100vh'}}>
        <GoldTicker />
        <StyxNav />
        <div style={{maxWidth: 760, margin: '0 auto', padding: '80px 24px', textAlign: 'center'}}>
          <h1 style={{fontFamily: FONT.cinzel, fontSize: 28, fontWeight: 500, color: STYX.ink, marginBottom: 16}}>
            Print to Scale
          </h1>
          <p style={{fontFamily: FONT.cormorant, fontSize: 18, color: STYX.silt, margin: '0 auto 32px', maxWidth: 520}}>
            Add chains to your print list, then print this page at actual size to see and
            measure each width in real life — perfect for comparing a 3&nbsp;mm to a
            5.4&nbsp;mm side by side.
          </p>
          <div style={{marginBottom: 28}}>{searchBox}</div>
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
        <StyxFooter />
      </div>
    );
  }

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <style dangerouslySetInnerHTML={{__html: PRINT_CSS}} />

      {/* ───── Screen-only chrome + controls ───── */}
      <div className="pl-no-print">
        <GoldTicker />
        <StyxNav />
      </div>

      <div className="pl-shell" style={{maxWidth: 1100, margin: '0 auto', padding: '40px 24px 120px'}}>
        <div className="pl-no-print" style={{textAlign: 'center', marginBottom: 24}}>
          <h1 style={{fontFamily: FONT.cinzel, fontSize: 28, fontWeight: 500, letterSpacing: '0.08em', color: STYX.ink, marginBottom: 8}}>
            Print to Scale
          </h1>
          <p style={{fontFamily: FONT.mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.silt}}>
            {specs.length} chain{specs.length !== 1 ? 's' : ''} — measured in real millimeters &amp; inches
          </p>
        </div>

        {/* Calibration instructions */}
        <div className="pl-no-print" style={{maxWidth: 640, margin: '0 auto 24px', padding: '16px 20px', border: `1px solid ${STYX.gold}`, background: 'rgba(184,146,74,0.06)'}}>
          <div style={{fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: STYX.goldDeep, marginBottom: 8}}>
            For an accurate print
          </div>
          <ol style={{margin: 0, paddingLeft: 18, fontFamily: FONT.inter, fontSize: 13, color: STYX.silt, lineHeight: 1.7}}>
            <li>In the print dialog set <strong>Scale</strong> to <strong>100%</strong> (“Actual Size”). Do <strong>not</strong> use “Fit to page”.</li>
            <li>Lay a ruler along the <strong>cm / inch ruler</strong> at the bottom — <strong>10&nbsp;cm</strong> and <strong>4&nbsp;in</strong> should line up exactly with the notches. If they’re off, adjust the scale and reprint.</li>
          </ol>
        </div>

        {/* Print + clear actions */}
        <div className="pl-no-print" style={{display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap'}}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: '14px 32px',
              background: STYX.gold,
              color: STYX.ink,
              border: 'none',
              fontFamily: FONT.cinzel,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Print This Page
          </button>
          <Link
            to="/collections/chains"
            style={{
              padding: '14px 28px',
              border: `1px solid ${STYX.line}`,
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: STYX.silt,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            + Add more
          </Link>
          <button
            type="button"
            onClick={clear}
            style={{
              padding: '14px 20px',
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
            Clear list
          </button>
        </div>

        {/* Search to add any item (screen only) */}
        <div className="pl-no-print">{searchBox}</div>

        {/* Reorderable list (screen only) */}
        <div className="pl-no-print" style={{display: 'grid', gap: 10, maxWidth: 640, margin: '0 auto 40px'}}>
          {specs.map((s, idx) => (
            <div
              key={s.handle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 14px',
                border: `1px solid ${STYX.line}`,
                background: STYX.paper,
              }}
            >
              <div style={{width: 48, height: 48, flexShrink: 0, background: '#fff', overflow: 'hidden'}}>
                {s.image && (
                  <Image data={s.image} aspectRatio="1/1" sizes="48px" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                )}
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontFamily: FONT.cinzel, fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', color: STYX.ink}}>
                  {s.title}
                </div>
                <div style={{fontFamily: FONT.inter, fontSize: 12, color: STYX.silt}}>
                  {oneLiner(s)}
                  {s.karat ? ` · ${s.karat}K` : ''}
                </div>
                {s.model && (
                  <div style={{fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.08em', color: STYX.silt2}}>
                    Model {s.model}
                  </div>
                )}
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0}}>
                <ReorderBtn label="◀" disabled={idx === 0} onClick={() => move(s.handle, -1)} />
                <ReorderBtn label="▶" disabled={idx === specs.length - 1} onClick={() => move(s.handle, 1)} />
                <button
                  type="button"
                  onClick={() => remove(s.handle)}
                  title="Remove"
                  style={{
                    marginLeft: 6,
                    width: 28,
                    height: 28,
                    border: `1px solid ${STYX.line}`,
                    background: 'transparent',
                    color: STYX.silt,
                    cursor: 'pointer',
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ───── The printable sheet (also shown on screen, actual size) ───── */}
        <div className="pl-no-print" style={{fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: STYX.silt, textAlign: 'center', marginBottom: 10}}>
          Preview — shown at actual size (scroll sideways on small screens)
        </div>

        <div className="pl-sheet-scroll"><div className="pl-sheet">
          {/* Branded header */}
          <div className="pl-head">
            <img className="pl-logo" src={STYX_PRINT_LOGO} alt="STYX" />
            <div className="pl-head-right">
              <div className="pl-brand">STYX · Solid Gold Chains</div>
              <div className="pl-url">{SITE_URL}</div>
            </div>
          </div>
          <div className="pl-subhead">
            <span className="pl-subhead-title">Chain Widths — Actual Size</span>
            <span className="pl-subhead-note">Print at 100% to keep scale</span>
          </div>

          {/* Columns */}
          <div className="pl-row">
            {specs.map((s) => {
              const showSilhouette = s.mm != null && !missingSilhouette[s.handle];
              return (
                <div key={s.handle} className="pl-col">
                  <div className="pl-visual">
                    {s.mm != null ? (
                      showSilhouette ? (
                        <img
                          className="pl-silhouette"
                          src={`/images/silhouettes/${s.handle}.png`}
                          alt=""
                          style={{width: `${s.mm}mm`}}
                          onError={() =>
                            setMissingSilhouette((prev) => ({...prev, [s.handle]: true}))
                          }
                        />
                      ) : (
                        <div className="pl-bar" style={{width: `${s.mm}mm`}} />
                      )
                    ) : (
                      <div className="pl-unknown">width&nbsp;n/a</div>
                    )}
                  </div>
                  <div className="pl-col-meta">
                    <div className="pl-mm">{s.mm != null ? `${s.mm} mm` : '—'}</div>
                    <div className="pl-style">{s.style || s.title}</div>
                    <div className="pl-sub">
                      {s.karat ? `${s.karat}K` : ''}
                      {s.mm != null ? `${s.karat ? ' · ' : ''}${s.mm} mil` : ''}
                    </div>
                    {s.model && <div className="pl-model">Model {s.model}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dual ruler — lay a physical ruler here to verify scale */}
          <div className="pl-ruler-block">
            <div className="pl-ruler-label">↓ Lay a ruler along the notches — 10&nbsp;cm and 4&nbsp;in should line up exactly. If not, reprint at 100%.</div>

            {/* Centimeters */}
            <div className="pl-ruler pl-ruler-cm">
              {Array.from({length: 101}, (_, mm) => (
                <span
                  key={`cm${mm}`}
                  className={`pl-tick ${mm % 10 === 0 ? 'pl-tick-lg' : mm % 5 === 0 ? 'pl-tick-md' : ''}`}
                  style={{left: `${mm}mm`}}
                />
              ))}
              {Array.from({length: 11}, (_, cm) => (
                <span key={`cml${cm}`} className="pl-num pl-num-cm" style={{left: `${cm * 10}mm`}}>
                  {cm}
                </span>
              ))}
              <span className="pl-unit">cm</span>
            </div>

            {/* Inches (0–4", ticks every 1/16") */}
            <div className="pl-ruler pl-ruler-in">
              {Array.from({length: 65}, (_, i) => (
                <span
                  key={`in${i}`}
                  className={`pl-tick ${i % 16 === 0 ? 'pl-tick-lg' : i % 8 === 0 ? 'pl-tick-md' : i % 4 === 0 ? 'pl-tick-sm' : ''}`}
                  style={{left: `${(i * 25.4) / 16}mm`}}
                />
              ))}
              {Array.from({length: 5}, (_, inch) => (
                <span key={`inl${inch}`} className="pl-num pl-num-in" style={{left: `${inch * 25.4}mm`}}>
                  {inch}
                </span>
              ))}
              <span className="pl-unit">in</span>
            </div>
          </div>

          {/* Branded footer */}
          <div className="pl-foot">
            <span>Solid gold, every weight in the open — {SITE_URL}</span>
            <span>STYX</span>
          </div>
        </div></div>
      </div>

      <div className="pl-no-print">
        <StyxFooter />
      </div>
    </div>
  );
}

function ReorderBtn({label, disabled, onClick}: {label: string; disabled: boolean; onClick: () => void}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 28,
        height: 28,
        border: `1px solid ${STYX.line}`,
        background: 'transparent',
        color: disabled ? STYX.line : STYX.silt,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 11,
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );
}

/* ─────────────────── Sheet + Print CSS ─────────────────── */
/* Base styles render the sheet at true size on screen AND on paper. The
   @media print block only handles page setup and hides the screen chrome. */

const PRINT_CSS = `
.pl-sheet {
  background: #fff;
  color: #1a1815;
  max-width: 186mm; /* A4 portrait printable width */
  margin: 0 auto;
  padding: 10mm 12mm;
  border: 1px solid rgba(26,24,21,0.15);
  box-shadow: 0 20px 50px -30px rgba(26,24,21,0.4);
}
.pl-head {
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #1a1815; padding-bottom: 4mm;
}
.pl-logo { height: 11mm; width: auto; object-fit: contain; }
.pl-head-right { text-align: right; }
.pl-brand { font-family: 'Cinzel', serif; font-size: 11pt; letter-spacing: 0.1em; }
.pl-url { font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #8A6A32; letter-spacing: 0.08em; }
.pl-subhead {
  display: flex; align-items: baseline; justify-content: space-between;
  margin: 3mm 0 9mm;
}
.pl-subhead-title { font-family: 'Cormorant Garamond', serif; font-size: 13pt; color: #4A443B; }
.pl-subhead-note { font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; color: #6B6459; text-transform: uppercase; letter-spacing: 0.1em; }

.pl-row { display: flex; align-items: flex-end; gap: 9mm; flex-wrap: wrap; margin-bottom: 10mm; }
.pl-col { display: flex; flex-direction: column; align-items: center; width: 33mm; }
.pl-visual { display: flex; align-items: flex-end; justify-content: center; height: 60mm; margin-bottom: 3mm; }
.pl-bar {
  height: 55mm;
  background: linear-gradient(90deg, #b8924a, #d4b478 50%, #8a6a32);
  border: 0.2mm solid #8a6a32;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.pl-silhouette {
  height: auto; max-height: 60mm; object-fit: contain;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.pl-unknown {
  font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: #6B6459;
  border: 0.2mm dashed #6B6459; padding: 4mm;
}
.pl-col-meta { text-align: center; }
.pl-mm { font-family: 'Cinzel', serif; font-size: 13pt; font-weight: 600; }
.pl-style { font-family: 'Inter', sans-serif; font-size: 8pt; }
.pl-sub { font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: #4A443B; }
.pl-model { font-family: 'JetBrains Mono', monospace; font-size: 6.5pt; color: #6B6459; margin-top: 1mm; }

.pl-ruler-block { margin-top: 6mm; }
.pl-ruler-label { font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: #6B6459; margin-bottom: 3mm; letter-spacing: 0.06em; }
.pl-ruler { position: relative; width: 101.6mm; max-width: 100%; height: 10mm; border-bottom: 0.4mm solid #1a1815; margin-bottom: 9mm; }
.pl-ruler-in { margin-top: 3mm; }
.pl-tick { position: absolute; bottom: 0; width: 0.25mm; height: 2.2mm; background: #1a1815; }
.pl-tick-sm { height: 3.2mm; }
.pl-tick-md { height: 4.4mm; }
.pl-tick-lg { height: 6mm; width: 0.4mm; }
.pl-num { position: absolute; bottom: 6.2mm; transform: translateX(-50%); font-family: 'JetBrains Mono', monospace; font-size: 7pt; }
.pl-unit { position: absolute; right: -7mm; bottom: 0.5mm; font-family: 'JetBrains Mono', monospace; font-size: 6.5pt; color: #6B6459; }

.pl-foot {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-top: 10mm; padding-top: 3mm; border-top: 1px solid rgba(26,24,21,0.2);
  font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: #6B6459;
  letter-spacing: 0.08em;
}

/* Mobile: the A4 sheet preview is wider than the screen — let it scroll
   sideways (true size preserved) instead of overflowing the page. */
@media screen and (max-width: 760px) {
  .pl-shell { padding: 28px 14px 96px !important; }
  .pl-sheet-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 10px;
  }
  .pl-sheet { margin: 0; min-width: 186mm; box-shadow: none; }
}

@media print {
  @page { size: A4 portrait; margin: 12mm; }
  html, body { background: #fff !important; }
  .pl-no-print { display: none !important; }
  .pl-shell { max-width: none !important; padding: 0 !important; margin: 0 !important; }
  .pl-sheet-scroll { overflow: visible !important; }
  .pl-sheet { border: none !important; box-shadow: none !important; max-width: none !important; min-width: 0 !important; padding: 0 !important; }
}
`;

/* ─────────────────── GraphQL ─────────────────── */

const PRINT_PRODUCT_QUERY = `#graphql
  query PrintProduct(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      featuredImage { url altText width height }
      variants(first: 100) {
        nodes {
          sku
          image { url altText width height }
          selectedOptions { name value }
          weight
        }
      }
      karat: metafield(namespace: "chain", key: "karat") { value }
      chain_thickness: metafield(namespace: "chain", key: "thickness") { value }
      chain_style: metafield(namespace: "chain", key: "chain_style") { value }
      original_sku: metafield(namespace: "chain", key: "original_sku") { value }
    }
  }
` as const;
