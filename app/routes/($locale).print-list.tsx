import {useState, useEffect} from 'react';
import {type LoaderFunctionArgs, type MetaFunction} from 'react-router';
import {useLoaderData, useNavigate, useFetcher} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, ChainSilhouette, ActualSizeToggle} from '~/components/styx';
import {usePrintList} from '~/context/PrintListContext';
import {useScaleCalibration} from '~/context/ScaleCalibrationContext';
import {usePrefixPathWithLocale} from '~/lib/utils';
import {STYX_PRINT_LOGO} from '~/components/styx/printLogo';
import {styleToSlug} from '~/lib/chains';

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

export const meta: MetaFunction = () => {
  return [
    {title: 'Print List — STYX Gold'},
    {
      name: 'description',
      content:
        'A printable, true-to-scale spec sheet of your selected gold chains — widths shown at actual physical size.',
    },
    // Transient, query-param-driven utility page — keep it out of the index.
    {name: 'robots', content: 'noindex, follow'},
  ];
};

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
  /** Chain-family slug for the per-type outline silhouette (e.g. "cuban-link"). */
  styleSlug: string | null;
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

  return {
    handle: p.handle,
    title: p.title,
    image,
    mm,
    karat,
    style,
    model,
    styleSlug: styleToSlug(style, p.title),
  };
}

/** "Cuban Link · 5.4 mm" */
function oneLiner(s: PrintSpec): string {
  const parts: string[] = [];
  if (s.style) parts.push(s.style);
  if (s.mm != null) parts.push(`${s.mm} mm`);
  return parts.join(' · ') || s.title;
}

/* ─────────────────── Component ─────────────────── */

export default function PrintListPage() {
  const {products} = useLoaderData<typeof loader>();
  const {handles, add, move, remove, clear, isFull} = usePrintList();
  const {actualSizeOn, pxPerMm, staleZoom, openCalibration} = useScaleCalibration();
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
                    <img src={r.image} alt={r.title} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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
            <li><strong>No ruler?</strong> Lay a credit card or ID over the <strong>dashed card box</strong> at the bottom — if it fills the outline edge&#8209;to&#8209;edge, your scale is correct. Or check the <strong>ruler</strong> beside it reads <strong>6&nbsp;cm / 2&nbsp;in</strong> exactly. If either is off, adjust the scale and reprint.</li>
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

        {/* View at actual size on this screen (card-calibrated) — screen only.
            The printed sheet stays true on paper; this is for shoppers without
            a printer who want real size right on their phone or laptop. */}
        <div className="pl-no-print" style={{maxWidth: 820, margin: '0 auto 40px', textAlign: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap'}}>
            <span style={{fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: STYX.silt}}>
              No printer? See them at actual size on screen
            </span>
            <ActualSizeToggle />
          </div>

          {actualSizeOn && pxPerMm != null && (
            <div style={{marginTop: 24}}>
              <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 30, flexWrap: 'wrap'}}>
                {specs.map((s) =>
                  s.mm != null ? (
                    <div key={s.handle} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
                      <div style={{display: 'flex', alignItems: 'flex-end', height: 180, overflow: 'hidden'}}>
                        <ChainSilhouette
                          styleSlug={s.styleSlug}
                          widthMm={s.mm}
                          pxPerMm={pxPerMm}
                          heightPx={180}
                          title={s.title}
                        />
                      </div>
                      <div style={{fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: STYX.silt}}>
                        {s.mm} mm
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
              <div style={{marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6}}>
                {staleZoom && (
                  <span style={{fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: STYX.goldDeep}}>
                    Your browser zoom changed — re-calibrate for accuracy
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => openCalibration()}
                  style={{fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.silt, background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer'}}
                >
                  Re-calibrate screen
                </button>
              </div>
            </div>
          )}
        </div>

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
                  <Image data={s.image} alt={s.image?.altText ?? s.title} aspectRatio="1/1" sizes="48px" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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
              // Per-chain-type outline tile (tiles/cuban.png, …) repeated
              // vertically to fill the window, so every chain shows the SAME
              // length at its true mm width; falls back to the solid gold bar
              // when no outline asset exists.
              const showSilhouette = s.mm != null && s.styleSlug != null;
              return (
                <div key={s.handle} className="pl-col">
                  <div className="pl-visual">
                    {s.mm != null ? (
                      showSilhouette ? (
                        <div
                          className="pl-silhouette"
                          role="img"
                          aria-label={`${s.title} link outline shown at actual ${s.mm}mm width`}
                          style={{
                            width: `${s.mm}mm`,
                            backgroundImage: `url(/images/silhouettes/tiles/${s.styleSlug}.png)`,
                            backgroundSize: `${s.mm}mm auto`,
                          }}
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
                    <div className="pl-sub">{s.karat ? `${s.karat}K` : ''}</div>
                    {s.model && <div className="pl-model">Model {s.model}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Approximation disclaimer */}
          <div className="pl-approx">
            Widths and link profiles are shown to scale as a guide. Each chain is
            individually cast and hand-finished, so the actual piece may vary
            slightly from this illustration.
          </div>

          {/* Scale check — a thin dual ruler for those who have one, plus a
              card cutout for those who don't. */}
          <div className="pl-scale">
            {/* One hairline ruler: inches above the line, centimetres below. */}
            <div className="pl-ruler2">
              <div className="pl-ruler2-line" />
              {/* inch ticks above (every 1/8"), numbered each inch */}
              {Array.from({length: 21}, (_, i) => (
                <span
                  key={`in${i}`}
                  className={`pl-t-up ${i % 8 === 0 ? 'pl-t-up-lg' : i % 4 === 0 ? 'pl-t-up-md' : ''}`}
                  style={{left: `${(i * 25.4) / 8}mm`}}
                />
              ))}
              {Array.from({length: 3}, (_, i) => (
                <span key={`inl${i}`} className="pl-l-up" style={{left: `${i * 25.4}mm`}}>{i}</span>
              ))}
              <span className="pl-u-up">in</span>
              {/* cm ticks below (every mm), numbered each cm */}
              {Array.from({length: 64}, (_, mm) => (
                <span
                  key={`mm${mm}`}
                  className={`pl-t-dn ${mm % 10 === 0 ? 'pl-t-dn-lg' : mm % 5 === 0 ? 'pl-t-dn-md' : ''}`}
                  style={{left: `${mm}mm`}}
                />
              ))}
              {Array.from({length: 7}, (_, cm) => (
                <span key={`cml${cm}`} className="pl-l-dn" style={{left: `${cm * 10}mm`}}>{cm}</span>
              ))}
              <span className="pl-u-dn">cm</span>
            </div>

            {/* No-ruler calibration: a true-size card outline. */}
            <div className="pl-card">
              <div className="pl-card-box">
                <div className="pl-card-title">Lay any card here</div>
                <div className="pl-card-dims">Credit card / ID · 85.6 × 54&nbsp;mm</div>
              </div>
              <div className="pl-card-cap">
                No ruler? Place a credit card or ID over the dashed box. If it
                fills the outline edge&#8209;to&#8209;edge, your print is at true
                100% scale.
              </div>
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
/* Fixed 90mm window. Clips tall chains rather than scaling them down, so the
   silhouette's WIDTH always stays exactly true-to-scale; the taller window lets
   each chain run longer instead of looking stubby. */
.pl-visual { display: flex; align-items: flex-end; justify-content: center; height: 90mm; margin-bottom: 3mm; overflow: hidden; }
.pl-bar {
  height: 86mm;
  background: linear-gradient(90deg, #b8924a, #d4b478 50%, #8a6a32);
  border: 0.2mm solid #8a6a32;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
/* Width is set inline to the true mm; a single seamless link tile is repeated
   down the column to fill the window, so every chain shows the same length at
   its real width regardless of how dense its weave is. */
.pl-silhouette {
  height: 100%; flex-shrink: 0;
  background-repeat: repeat-y;
  background-position: center bottom;
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

.pl-approx {
  font-family: 'Cormorant Garamond', serif; font-style: italic;
  font-size: 9pt; color: #6B6459; line-height: 1.5;
  text-align: center; max-width: 150mm; margin: 0 auto 8mm;
}
/* ── Scale check: thin dual-unit ruler + true-size card cutout ── */
.pl-scale {
  display: flex; align-items: center; justify-content: space-between;
  gap: 9mm; margin-top: 7mm; flex-wrap: wrap;
}

/* One hairline, ticks above (inches) and below (cm). 63.5mm = 2.5in = 6.35cm. */
.pl-ruler2 { position: relative; width: 63.5mm; height: 12mm; flex-shrink: 0; }
.pl-ruler2-line { position: absolute; top: 50%; left: 0; right: 0; height: 0.25mm; background: #1a1815; transform: translateY(-50%); }
.pl-t-up, .pl-t-dn { position: absolute; left: 0; width: 0.2mm; background: #1a1815; }
.pl-t-up { bottom: 50%; height: 1.3mm; }
.pl-t-up-md { height: 2.1mm; }
.pl-t-up-lg { height: 3mm; width: 0.35mm; }
.pl-t-dn { top: 50%; height: 1.3mm; }
.pl-t-dn-md { height: 2.1mm; }
.pl-t-dn-lg { height: 3mm; width: 0.35mm; }
.pl-l-up, .pl-l-dn {
  position: absolute; transform: translateX(-50%);
  font-family: 'JetBrains Mono', monospace; font-size: 6pt; color: #4A443B;
}
.pl-l-up { bottom: 50%; margin-bottom: 3.2mm; }
.pl-l-dn { top: 50%; margin-top: 3.2mm; }
.pl-u-up, .pl-u-dn { position: absolute; right: -5.5mm; font-family: 'JetBrains Mono', monospace; font-size: 6pt; color: #6B6459; }
.pl-u-up { bottom: 50%; margin-bottom: 0.4mm; }
.pl-u-dn { top: 50%; margin-top: 0.4mm; }

.pl-card { display: flex; flex-direction: column; align-items: flex-start; gap: 2.5mm; }
.pl-card-box {
  width: 85.6mm; height: 53.98mm; box-sizing: border-box;
  border: 0.3mm dashed #8a6a32; border-radius: 3.18mm;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5mm;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.pl-card-title { font-family: 'Cinzel', serif; font-size: 10pt; letter-spacing: 0.08em; color: #4A443B; }
.pl-card-dims { font-family: 'JetBrains Mono', monospace; font-size: 7pt; letter-spacing: 0.08em; color: #8A6A32; text-transform: uppercase; }
.pl-card-cap {
  font-family: 'Cormorant Garamond', serif; font-style: italic;
  font-size: 9pt; color: #6B6459; line-height: 1.4; max-width: 85.6mm;
}

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
