import {useState} from 'react';
import {type LoaderFunctionArgs} from 'react-router';
import {useLoaderData, useRouteLoaderData} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import {
  STYX,
  FONT,
  GoldTicker,
  StyxNav,
  StyxFooter,
} from '~/components/styx';
import {CompareButton} from '~/components/styx/CompareButton';
import {KARAT_PURITY} from '~/lib/gold';
import {CURATED_COMPARISONS} from '~/data/comparisons';
import type {RootLoader} from '~/root';

export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const productsParam = url.searchParams.get('products') || '';
  const handles = productsParam
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (handles.length === 0) {
    return {products: []};
  }

  const results = await Promise.all(
    handles.map((handle) =>
      context.storefront.query(COMPARE_PRODUCT_QUERY, {
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

/* ─────────────────── Types ─────────────────── */

type CompareSpec = {
  type: 'product' | 'custom';
  handle?: string;
  title: string;
  image?: any;
  karat: number;
  thickness: string | null;
  construction: string;
  chainStyle: string | null;
  origin: string | null;
  specWeave: string | null;
  specProfile: string | null;
  specClasp: string | null;
  specCast: string | null;
  minPrice: number;
  maxPrice: number;
  lengths: string[];
  colors: string[];
  weight: number | null;
  lengthInches: number | null;
  weightPerInch: number | null;
  pureGold: number | null;
  goldPerInch: number | null;
  meltValue: number | null;
  premiumOverMelt: number | null;
  pricePerInch: number | null;
  pricePerPureGram: number | null;
  valueScore: number | null;
};

/* ─────────────────── Component ─────────────────── */

export default function ComparePage() {
  const {products} = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData<RootLoader>('root');
  const spotPerOz = (rootData as any)?.goldData?.spotPerOz ?? 4700;
  const spotPerGram = spotPerOz / 31.1035;
  // Custom entries state
  const [customEntries, setCustomEntries] = useState<Array<{
    name: string;
    price: string;
    weight: string;
    karat: string;
    length: string;
  }>>([]);

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formKarat, setFormKarat] = useState('14');
  const [formLength, setFormLength] = useState('');

  const addCustomEntry = () => {
    if (!formPrice || !formWeight) return;
    setCustomEntries((prev) => [
      ...prev,
      {name: formName || `Custom Chain ${prev.length + 1}`, price: formPrice, weight: formWeight, karat: formKarat, length: formLength},
    ]);
    setFormName('');
    setFormPrice('');
    setFormWeight('');
    setFormKarat('14');
    setFormLength('');
    setShowCustomForm(false);
  };

  const removeCustomEntry = (idx: number) => {
    setCustomEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  // Build specs from products
  const productSpecs: CompareSpec[] = products.map((p: any) => {
    const karat = p.karat?.value
      ? parseInt(p.karat.value, 10)
      : /18\s*k/i.test(p.title) ? 18
      : /14\s*k/i.test(p.title) ? 14
      : 10;

    const thickness = p.chain_thickness?.value
      || (p.title.match(/(\d+(?:\.\d+)?)\s*mm/i)?.[0] ?? null);

    const construction = p.chain_construction?.value || (/hollow/i.test(p.title) ? 'Hollow' : 'Solid');
    const chainStyle = p.chain_style?.value || null;
    const origin = p.chain_origin?.value || null;

    const prices = p.variants.nodes.map((v: any) => parseFloat(v.price.amount));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const lengths = Array.from(
      new Set(
        p.variants.nodes
          .map((v: any) => v.selectedOptions?.find((o: any) => o.name.toLowerCase() === 'length')?.value)
          .filter(Boolean),
      ),
    ) as string[];

    const colors = Array.from(
      new Set(
        p.variants.nodes
          .map((v: any) => v.selectedOptions?.find((o: any) => o.name.toLowerCase() === 'color')?.value)
          .filter(Boolean),
      ),
    ) as string[];

    // Find a variant with weight and extract its length for per-inch calc
    const weightVariant = p.variants.nodes.find((v: any) => v.weight && v.weight > 0);
    const weight = weightVariant?.weight ?? null;
    const variantLengthStr = weightVariant?.selectedOptions?.find((o: any) => o.name.toLowerCase() === 'length')?.value;
    const lengthInches = variantLengthStr ? parseFloat(variantLengthStr.replace(/[^0-9.]/g, '')) : null;

    const purity = KARAT_PURITY[karat] ?? 10 / 24;
    const pureGold = weight ? weight * purity : null;
    const goldPerInch = pureGold && lengthInches ? pureGold / lengthInches : null;
    const weightPerInch = weight && lengthInches ? weight / lengthInches : null;
    const meltValue = pureGold ? pureGold * spotPerGram : null;
    const premiumOverMelt = meltValue ? minPrice - meltValue : null;
    const pricePerInch = lengthInches ? minPrice / lengthInches : null;
    const pricePerPureGram = pureGold && pureGold > 0 ? minPrice / pureGold : null;
    const valueScore = meltValue && minPrice > 0 ? (meltValue / minPrice) * 100 : null;

    const image = p.variants.nodes[0]?.image || p.featuredImage;

    return {
      type: 'product' as const,
      handle: p.handle,
      title: p.title,
      image,
      karat,
      thickness,
      construction,
      chainStyle,
      origin,
      specWeave: p.spec_weave?.value || null,
      specProfile: p.spec_profile?.value || null,
      specClasp: p.spec_clasp?.value || null,
      specCast: p.spec_cast?.value || null,
      minPrice,
      maxPrice,
      lengths,
      colors,
      weight,
      lengthInches,
      weightPerInch,
      pureGold,
      goldPerInch,
      meltValue,
      premiumOverMelt,
      pricePerInch,
      pricePerPureGram,
      valueScore,
    };
  });

  // Build specs from custom entries
  const customSpecs: CompareSpec[] = customEntries.map((entry) => {
    const karat = parseInt(entry.karat, 10);
    const weight = parseFloat(entry.weight);
    const price = parseFloat(entry.price);
    const lengthInches = entry.length ? parseFloat(entry.length) : null;
    const purity = KARAT_PURITY[karat] ?? 10 / 24;
    const pureGold = weight * purity;
    const goldPerInch = lengthInches ? pureGold / lengthInches : null;
    const weightPerInch = lengthInches ? weight / lengthInches : null;
    const meltValue = pureGold * spotPerGram;
    const premiumOverMelt = price - meltValue;
    const pricePerInch = lengthInches ? price / lengthInches : null;
    const pricePerPureGram = pureGold > 0 ? price / pureGold : null;
    const valueScore = meltValue > 0 && price > 0 ? (meltValue / price) * 100 : null;

    return {
      type: 'custom' as const,
      title: entry.name,
      karat,
      thickness: null,
      construction: '—',
      chainStyle: null,
      origin: null,
      specWeave: null,
      specProfile: null,
      specClasp: null,
      specCast: null,
      minPrice: price,
      maxPrice: price,
      lengths: lengthInches ? [`${lengthInches}"`] : [],
      colors: [],
      weight,
      lengthInches,
      weightPerInch,
      pureGold,
      goldPerInch,
      meltValue,
      premiumOverMelt,
      pricePerInch,
      pricePerPureGram,
      valueScore,
    };
  });

  const allSpecs = [...productSpecs, ...customSpecs];
  const totalSlots = products.length + customEntries.length;
  const canAddMore = totalSlots < 4;

  // Empty state
  if (allSpecs.length === 0) {
    return (
      <div style={{background: STYX.bone, minHeight: '100vh'}}>
        <GoldTicker />
        <StyxNav />
        <div style={{maxWidth: 800, margin: '0 auto', padding: '80px 24px', textAlign: 'center'}}>
          <h1 style={{fontFamily: FONT.cinzel, fontSize: 28, fontWeight: 500, color: STYX.ink, marginBottom: 16}}>
            Chain Comparison
          </h1>
          <p style={{fontFamily: FONT.cormorant, fontSize: 18, color: STYX.silt, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px'}}>
            Compare up to 4 chains side by side — pick from our collection or enter specs from any chain you're considering.
          </p>

          <div style={{display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap'}}>
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
            <button
              onClick={() => setShowCustomForm(true)}
              style={{
                padding: '14px 28px',
                background: 'transparent',
                border: `1px solid ${STYX.ink}`,
                color: STYX.ink,
                fontFamily: FONT.cinzel,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Enter Custom Specs
            </button>
          </div>

          {/* Custom form in empty state */}
          {showCustomForm && (
            <div style={{marginTop: 40}}>
              <CustomEntryForm
                name={formName}
                price={formPrice}
                weight={formWeight}
                karat={formKarat}
                length={formLength}
                onNameChange={setFormName}
                onPriceChange={setFormPrice}
                onWeightChange={setFormWeight}
                onKaratChange={setFormKarat}
                onLengthChange={setFormLength}
                onSubmit={addCustomEntry}
                onCancel={() => setShowCustomForm(false)}
              />
            </div>
          )}

          {/* Show custom entries if added (no products yet) */}
          {customSpecs.length > 0 && (
            <div style={{marginTop: 48}}>
              <ComparisonTable specs={customSpecs} spotPerGram={spotPerGram} onRemoveCustom={removeCustomEntry} />
            </div>
          )}

          {/* Popular Comparisons */}
          <div style={{marginTop: 64, textAlign: 'left', maxWidth: 600, margin: '64px auto 0'}}>
            <h2 style={{fontFamily: FONT.cinzel, fontSize: 18, fontWeight: 500, letterSpacing: '0.06em', color: STYX.ink, marginBottom: 20, textAlign: 'center'}}>
              Popular Comparisons
            </h2>
            <div style={{display: 'grid', gap: 12}}>
              {CURATED_COMPARISONS.slice(0, 6).map((c) => (
                <Link
                  key={c.slug}
                  to={`/compare/${c.slug}`}
                  style={{
                    display: 'block',
                    padding: '16px 20px',
                    border: `1px solid ${STYX.line}`,
                    background: STYX.paper,
                    textDecoration: 'none',
                  }}
                >
                  <div style={{fontFamily: FONT.cinzel, fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', color: STYX.ink}}>
                    {c.title}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <StyxFooter />
      </div>
    );
  }

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      <div style={{maxWidth: 1440, margin: '0 auto', padding: '48px 24px 120px'}}>
        {/* Header */}
        <div style={{marginBottom: 40, textAlign: 'center'}}>
          <h1 style={{fontFamily: FONT.cinzel, fontSize: 28, fontWeight: 500, letterSpacing: '0.08em', color: STYX.ink, marginBottom: 8}}>
            Chain Comparison
          </h1>
          <p style={{fontFamily: FONT.mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.silt}}>
            {allSpecs.length} chain{allSpecs.length !== 1 ? 's' : ''} compared
          </p>
        </div>

        {/* Add more controls */}
        {canAddMore && (
          <div style={{display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap'}}>
            <Link
              to="/collections/chains"
              style={{
                padding: '10px 20px',
                border: `1px solid ${STYX.line}`,
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: STYX.silt,
                textDecoration: 'none',
              }}
            >
              + Add from catalog
            </Link>
            <button
              onClick={() => setShowCustomForm(true)}
              style={{
                padding: '10px 20px',
                border: `1px solid ${STYX.line}`,
                background: 'transparent',
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: STYX.silt,
                cursor: 'pointer',
              }}
            >
              + Add custom chain
                </button>
              </div>
            )}

        {/* Custom entry form */}
        {showCustomForm && (
          <div style={{maxWidth: 480, margin: '0 auto 40px'}}>
            <CustomEntryForm
              name={formName}
              price={formPrice}
              weight={formWeight}
              karat={formKarat}
              length={formLength}
              onNameChange={setFormName}
              onPriceChange={setFormPrice}
              onWeightChange={setFormWeight}
              onKaratChange={setFormKarat}
              onLengthChange={setFormLength}
              onSubmit={addCustomEntry}
              onCancel={() => setShowCustomForm(false)}
            />
          </div>
        )}

        {/* Comparison Table — always shown */}
        <ComparisonTable specs={allSpecs} spotPerGram={spotPerGram} onRemoveCustom={removeCustomEntry} />
      </div>

      <StyxFooter />
    </div>
  );
}

/* ─────────────────── Custom Entry Form ─────────────────── */

function CustomEntryForm({
  name, price, weight, karat, length,
  onNameChange, onPriceChange, onWeightChange, onKaratChange, onLengthChange,
  onSubmit, onCancel,
}: {
  name: string; price: string; weight: string; karat: string; length: string;
  onNameChange: (v: string) => void;
  onPriceChange: (v: string) => void;
  onWeightChange: (v: string) => void;
  onKaratChange: (v: string) => void;
  onLengthChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const inputStyle: React.CSSProperties = {
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

  const labelStyle: React.CSSProperties = {
    fontFamily: FONT.mono,
    fontSize: 9,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: STYX.silt,
    marginBottom: 6,
    display: 'block',
  };

  return (
    <div style={{border: `1px solid ${STYX.line}`, padding: 24, background: STYX.paper}}>
      <div style={{fontFamily: FONT.cinzel, fontSize: 14, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.ink, marginBottom: 20, textAlign: 'center'}}>
        Add a Chain to Compare
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16}}>
        <div style={{gridColumn: '1 / -1'}}>
          <label style={labelStyle}>Name (optional)</label>
          <input
            type="text"
            placeholder="e.g. Kay Jewelers 14K Cuban"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Price ($) *</label>
          <input
            type="number"
            placeholder="450"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            style={inputStyle}
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label style={labelStyle}>Weight (grams) *</label>
          <input
            type="number"
            placeholder="8.2"
            value={weight}
            onChange={(e) => onWeightChange(e.target.value)}
            style={inputStyle}
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label style={labelStyle}>Karat *</label>
          <select
            value={karat}
            onChange={(e) => onKaratChange(e.target.value)}
            style={{...inputStyle, appearance: 'none', cursor: 'pointer'}}
          >
            <option value="10">10K</option>
            <option value="14">14K</option>
            <option value="18">18K</option>
            <option value="22">22K</option>
            <option value="24">24K</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Length (inches)</label>
          <input
            type="number"
            placeholder="20"
            value={length}
            onChange={(e) => onLengthChange(e.target.value)}
            style={inputStyle}
            min="0"
            step="0.5"
          />
        </div>
      </div>

      <div style={{display: 'flex', gap: 12, justifyContent: 'center'}}>
        <button
          onClick={onSubmit}
          disabled={!price || !weight}
          style={{
            padding: '12px 24px',
            background: price && weight ? STYX.ink : STYX.line,
            color: price && weight ? STYX.bone : STYX.silt,
            border: 'none',
            fontFamily: FONT.cinzel,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            cursor: price && weight ? 'pointer' : 'not-allowed',
          }}
        >
          Add to Comparison
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: `1px solid ${STYX.line}`,
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: STYX.silt,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─────────────────── Comparison Table ─────────────────── */

function ComparisonTable({
  specs,
  spotPerGram,
  onRemoveCustom,
}: {
  specs: CompareSpec[];
  spotPerGram: number;
  onRemoveCustom: (idx: number) => void;
}) {
  const ROWS: Array<{label: string; render: (s: CompareSpec) => string; alwaysShow?: boolean}> = [
    // �� Price & Value ─
    {label: 'Price', render: (s) => s.minPrice === s.maxPrice ? `$${s.minPrice.toFixed(2)}` : `$${s.minPrice.toFixed(2)} – $${s.maxPrice.toFixed(2)}`, alwaysShow: true},
    {label: 'Karat', render: (s) => `${s.karat}K`, alwaysShow: true},
    {label: 'Total Weight', render: (s) => s.weight ? `${s.weight}g` : '—', alwaysShow: true},
    {label: 'Pure Gold', render: (s) => s.pureGold ? `${s.pureGold.toFixed(2)}g` : '—', alwaysShow: true},
    {label: 'Melt Value', render: (s) => s.meltValue ? `$${s.meltValue.toFixed(2)}` : '—', alwaysShow: true},
    {label: 'Value %', render: (s) => s.valueScore ? `${s.valueScore.toFixed(0)}%` : '—', alwaysShow: true},
    // ─ Per-Inch Metrics ─
    {label: 'Weight/Inch', render: (s) => s.weightPerInch ? `${s.weightPerInch.toFixed(3)}g` : '—', alwaysShow: true},
    {label: 'Gold/Inch', render: (s) => s.goldPerInch ? `${s.goldPerInch.toFixed(3)}g` : '—', alwaysShow: true},
    {label: 'Price/Inch', render: (s) => s.pricePerInch ? `$${s.pricePerInch.toFixed(2)}` : '—', alwaysShow: true},
    // ─ Cost Analysis ─
    {label: 'Premium Over Melt', render: (s) => s.premiumOverMelt != null ? `$${s.premiumOverMelt.toFixed(2)}` : '—', alwaysShow: true},
    {label: '$/g Pure Gold', render: (s) => s.pricePerPureGram ? `$${s.pricePerPureGram.toFixed(2)}` : '—', alwaysShow: true},
    // ─ Specs ─
    {label: 'Thickness', render: (s) => s.thickness || '—'},
    {label: 'Style', render: (s) => s.chainStyle || '—'},
    {label: 'Construction', render: (s) => s.construction === '—' ? '—' : s.construction},
    {label: 'Clasp', render: (s) => s.specClasp || '—'},
    {label: 'Weave', render: (s) => s.specWeave || '—'},
    {label: 'Profile', render: (s) => s.specProfile || '—'},
    {label: 'Cast', render: (s) => s.specCast || '—'},
    {label: 'Origin', render: (s) => s.origin || '—'},
    {label: 'Lengths', render: (s) => s.lengths.length > 0 ? s.lengths.join(', ') : '—'},
    {label: 'Colors', render: (s) => s.colors.length > 0 ? s.colors.join(', ') : '—'},
  ];

  // Filter out rows where every spec is "—" (unless alwaysShow)
  const activeRows = ROWS.filter((row) =>
    row.alwaysShow || specs.some((s) => row.render(s) !== '—'),
  );

  // Find best value score
  const valueScores = specs.map((s) => s.valueScore ?? 0);
  const bestValueIdx = valueScores.indexOf(Math.max(...valueScores));

  return (
    <div style={{overflowX: 'auto'}}>
      <table style={{width: '100%', borderCollapse: 'collapse', minWidth: specs.length > 2 ? 700 : 400}}>
        <thead>
          <tr>
            <th style={{width: 110}} />
            {specs.map((s, idx) => (
              <th
                key={s.handle || `custom-${idx}`}
                style={{
                  padding: '0 12px 20px',
                  verticalAlign: 'bottom',
                  textAlign: 'center',
                  width: `${(100 - 10) / specs.length}%`,
                }}
              >
                {/* Image (products only) */}
                {s.type === 'product' && s.image && (
                  <Link to={`/products/${s.handle}`} style={{textDecoration: 'none'}}>
                    <div style={{width: '100%', maxWidth: 160, aspectRatio: '4/5', margin: '0 auto 12px', background: '#fff', overflow: 'hidden'}}>
                      <Image data={s.image} aspectRatio="4/5" sizes="160px" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    </div>
                  </Link>
                )}

                {/* Custom entry icon */}
                {s.type === 'custom' && (
                  <div style={{width: '100%', maxWidth: 160, aspectRatio: '4/5', margin: '0 auto 12px', background: STYX.paper, border: `1px dashed ${STYX.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8}}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={STYX.silt} strokeWidth="1.2">
                      <path d="M12 3v18M5 7l-3 9h6L5 7zM19 7l-3 9h6l-3-9zM5 7h14" />
                    </svg>
                    <span style={{fontFamily: FONT.mono, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.silt}}>Custom</span>
                  </div>
                )}

                {/* Title */}
                {s.type === 'product' ? (
                  <Link
                    to={`/products/${s.handle}`}
                    style={{textDecoration: 'none', fontFamily: FONT.cinzel, fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: STYX.ink, display: 'block', marginBottom: 8}}
                  >
                    {s.title}
                  </Link>
                ) : (
                  <div style={{fontFamily: FONT.cinzel, fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: STYX.ink, marginBottom: 8}}>
                    {s.title}
                  </div>
                )}

                {/* Best value badge */}
                {idx === bestValueIdx && specs.length > 1 && (
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    background: 'rgba(184,146,74,0.12)',
                    border: `1px solid ${STYX.gold}`,
                    fontFamily: FONT.mono,
                    fontSize: 8,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: STYX.goldDeep,
                    marginBottom: 8,
                  }}>
                    Best Value
                  </div>
                )}

                {/* Actions */}
                {s.type === 'product' && s.handle && (
                  <CompareButton handle={s.handle} compact />
                )}
                {s.type === 'custom' && (
                  <button
                    onClick={() => {
                      const customIdx = idx - specs.filter((sp, i) => i < idx && sp.type === 'product').length;
                      onRemoveCustom(customIdx);
                    }}
                    style={{
                      padding: '4px 10px',
                      border: `1px solid ${STYX.line}`,
                      background: 'transparent',
                      fontFamily: FONT.mono,
                      fontSize: 9,
                      color: STYX.silt,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {activeRows.map((row, i) => (
            <tr key={row.label} style={{background: i % 2 === 0 ? 'transparent' : 'rgba(26,24,21,0.02)'}}>
              <td style={{
                padding: '12px 16px',
                fontFamily: FONT.mono,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: STYX.silt,
                whiteSpace: 'nowrap',
                borderBottom: `1px solid ${STYX.lineSoft}`,
              }}>
                {row.label}
              </td>
              {specs.map((s, idx) => {
                const val = row.render(s);
                const allVals = specs.map((sp) => row.render(sp));
                const allSame = allVals.every((v) => v === allVals[0]);
                // Highlight the best value row
                const isBestInRow = row.label === 'Value %' && idx === bestValueIdx && specs.length > 1;
                return (
                  <td
                    key={s.handle || `custom-${idx}`}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontFamily: FONT.inter,
                      fontSize: 13,
                      color: isBestInRow ? STYX.goldDeep : val === '—' ? STYX.silt : STYX.ink,
                      fontWeight: isBestInRow ? 600 : !allSame && val !== '—' ? 500 : 400,
                      borderBottom: `1px solid ${STYX.lineSoft}`,
                    }}
                  >
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div style={{marginTop: 24, padding: '16px 20px', border: `1px solid ${STYX.lineSoft}`, background: STYX.paper}}>
        <div style={{fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.silt, marginBottom: 8}}>
          How to read this
        </div>
        <div style={{fontFamily: FONT.inter, fontSize: 12, color: STYX.silt, lineHeight: 1.9}}>
          <strong>Pure Gold</strong> = total weight x karat purity &nbsp;|&nbsp;
          <strong>Melt Value</strong> = pure gold x spot price (${spotPerGram.toFixed(2)}/g today) &nbsp;|&nbsp;
          <strong>Value %</strong> = melt value / price (higher = more gold for your money)<br/>
          <strong>Gold/Inch</strong> = pure gold per inch of chain &nbsp;|&nbsp;
          <strong>Weight/Inch</strong> = total weight per inch &nbsp;|&nbsp;
          <strong>Premium</strong> = what you pay above raw gold value (craftsmanship + margin)
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── GraphQL ─────────────────── */

const COMPARE_PRODUCT_QUERY = `#graphql
  query CompareProduct(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      featuredImage {
        url
        altText
        width
        height
      }
      variants(first: 100) {
        nodes {
          id
          availableForSale
          image {
            url
            altText
            width
            height
          }
          price {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
          weight
          weightUnit
        }
      }
      karat: metafield(namespace: "chain", key: "karat") {
        value
      }
      chain_thickness: metafield(namespace: "chain", key: "thickness") {
        value
      }
      chain_construction: metafield(namespace: "chain", key: "construction") {
        value
      }
      chain_style: metafield(namespace: "chain", key: "chain_style") {
        value
      }
      chain_origin: metafield(namespace: "custom", key: "chain_origin") {
        value
      }
      spec_weave: metafield(namespace: "custom", key: "spec_weave") {
        value
      }
      spec_profile: metafield(namespace: "custom", key: "spec_profile") {
        value
      }
      spec_clasp: metafield(namespace: "custom", key: "spec_clasp") {
        value
      }
      spec_cast: metafield(namespace: "custom", key: "spec_cast") {
        value
      }
    }
  }
` as const;
