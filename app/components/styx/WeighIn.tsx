import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {STYX, FONT} from './constants';
import {Obol} from './Obol';
import {KARAT_PURITY} from '~/lib/gold';

export type WeighInChain = {
  type: 'product' | 'custom';
  handle?: string;
  title: string;
  image?: any;
  karat: number;
  weight: number | null;
  pureGold: number | null;
  meltValue: number | null;
  pricePerPureGram: number | null;
  valueScore: number | null;
  minPrice: number;
  maxPrice: number;
  thickness: string | null;
  construction: string;
  origin: string | null;
  weightPerInch: number | null;
  goldPerInch: number | null;
  pricePerInch: number | null;
  premiumOverMelt: number | null;
  lengths: string[];
  colors: string[];
};

const CHAIN_STYLES = ['Cuban Link', 'Cuban', 'Curb', 'Box', 'Rope', 'Cable', 'Figaro', 'Wheat', 'Rolo', 'Singapore', 'Franco', 'Herringbone', 'Paperclip', 'Snake', 'Byzantine', 'Mariner'];

function extractShort(title: string): string {
  for (const style of CHAIN_STYLES) {
    if (title.toLowerCase().includes(style.toLowerCase())) return style;
  }
  return title.replace(/^\d+k\s+gold\s+/i, '').replace(/\s+chain$/i, '').trim();
}

export function WeighIn({
  chains,
  spotPerOz,
  onRemoveCustom,
}: {
  chains: WeighInChain[];
  spotPerOz: number;
  onRemoveCustom?: (idx: number) => void;
}) {
  const count = chains.length;
  if (count === 0) return null;

  const maxWeight = Math.max(...chains.map((c) => c.weight || 0));
  const shortNames = chains.map((c) => extractShort(c.title));

  // Best value (lowest $/g pure gold, with tolerance)
  const ppgs = chains.map((c) => c.pricePerPureGram || Infinity);
  const minPpg = Math.min(...ppgs);
  const bestValueIdx = ppgs.filter((p) => p !== Infinity).length > 1
    ? ppgs.findIndex((p) => p === minPpg && ppgs.filter((pp) => Math.abs(pp - minPpg) <= 2).length < ppgs.filter((p2) => p2 !== Infinity).length)
    : -1;

  // Heaviest chain
  const weights = chains.map((c) => c.weight || 0);
  const maxW = Math.max(...weights);
  const heaviestIdx = weights.filter((w) => w === maxW).length === 1 ? weights.indexOf(maxW) : -1;

  // Most pure gold
  const pureGolds = chains.map((c) => c.pureGold || 0);
  const maxPure = Math.max(...pureGolds);
  const mostGoldIdx = pureGolds.filter((p) => p === maxPure).length === 1 ? pureGolds.indexOf(maxPure) : -1;

  // Cheapest
  const prices = chains.map((c) => c.minPrice);
  const minPrice = Math.min(...prices);
  const cheapestIdx = prices.filter((p) => p === minPrice).length === 1 ? prices.indexOf(minPrice) : -1;

  // Purest karat
  const karats = chains.map((c) => c.karat);
  const maxKarat = Math.max(...karats);
  const purestIdx = karats.filter((k) => k === maxKarat).length === 1 ? karats.indexOf(maxKarat) : -1;

  // Dynamic grid columns for ledger
  const colFr = chains.map(() => '1fr').join(' ');
  const ledgerCols = `50px 1.2fr ${colFr}`;

  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  // Rows definition
  type Row = {
    num: string;
    label: string;
    sub: string;
    render: (c: WeighInChain, idx: number) => React.ReactNode;
    winIdx: number;
    winTag: string;
    alwaysShow?: boolean;
  };

  const rows: Row[] = [
    {
      num: ROMAN[0], label: 'Your Toll', sub: 'retail price, today\'s fix',
      render: (c) => <span>{c.minPrice === c.maxPrice ? `$${c.minPrice.toLocaleString()}` : `$${c.minPrice.toLocaleString()} – $${c.maxPrice.toLocaleString()}`}</span>,
      winIdx: cheapestIdx, winTag: 'less', alwaysShow: true,
    },
    {
      num: ROMAN[1], label: 'Value', sub: 'dollars per gram of pure gold',
      render: (c) => <span>{c.pricePerPureGram ? `$${c.pricePerPureGram.toFixed(0)}/g` : '—'}</span>,
      winIdx: bestValueIdx, winTag: 'better value', alwaysShow: true,
    },
    {
      num: ROMAN[2], label: 'Karat', sub: 'alloy mix, purity by mass',
      render: (c) => <KaratStamp karat={c.karat} purity={KARAT_PURITY[c.karat] ?? 10 / 24} />,
      winIdx: purestIdx, winTag: 'purer', alwaysShow: true,
    },
    {
      num: ROMAN[3], label: 'Total Weight', sub: 'entire chain, including alloy',
      render: (c) => <WeightBar weight={c.weight || 0} max={maxWeight} purity={KARAT_PURITY[c.karat] ?? 10 / 24} />,
      winIdx: heaviestIdx, winTag: 'heavier', alwaysShow: true,
    },
    {
      num: ROMAN[4], label: 'Pure Gold', sub: 'alloy stripped — what melts to bullion',
      render: (c) => <PureGoldBar pure={c.pureGold || 0} max={maxWeight} weight={c.weight || 0} />,
      winIdx: mostGoldIdx, winTag: 'more gold', alwaysShow: true,
    },
    {
      num: ROMAN[5], label: 'Melt Value', sub: 'gold content at spot price',
      render: (c) => <span>{c.meltValue ? `$${c.meltValue.toFixed(2)}` : '—'}</span>,
      winIdx: -1, winTag: '', alwaysShow: true,
    },
    {
      num: ROMAN[6], label: 'Value %', sub: 'how much of the price is gold',
      render: (c) => <span>{c.valueScore ? `${c.valueScore.toFixed(0)}%` : '—'}</span>,
      winIdx: (() => { const scores = chains.map((ch) => ch.valueScore || 0); const mx = Math.max(...scores); return scores.filter((s) => s === mx).length === 1 ? scores.indexOf(mx) : -1; })(),
      winTag: 'best', alwaysShow: true,
    },
    {
      num: ROMAN[7], label: 'Weight/Inch', sub: 'grams per inch of chain',
      render: (c) => <span>{c.weightPerInch ? `${c.weightPerInch.toFixed(3)}g` : '—'}</span>,
      winIdx: -1, winTag: '',
    },
    {
      num: ROMAN[8], label: 'Gold/Inch', sub: 'pure gold per inch',
      render: (c) => <span>{c.goldPerInch ? `${c.goldPerInch.toFixed(3)}g` : '—'}</span>,
      winIdx: -1, winTag: '',
    },
  ];

  // Filter rows where all values are "—"
  const activeRows = rows.filter((row) =>
    row.alwaysShow || chains.some((c, i) => {
      const node = row.render(c, i);
      // Check if it renders "—"
      return node && typeof node === 'object' && 'props' in node && node.props.children !== '—';
    }),
  );

  return (
    <div className="weighin-root">
      {/* ─── HEADER ─── */}
      <div className="weighin-header">
        <div>
          <div style={{fontFamily: FONT.cinzel, fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: STYX.gold, marginBottom: 18}}>
            The Weigh-In
          </div>
          <h2 className="weighin-title">
            {count === 2 ? 'Two' : count === 3 ? 'Three' : 'Four'} chain{count !== 1 ? 's' : ''},<br/>
            <span style={{fontFamily: FONT.cormorant, fontStyle: 'italic', fontWeight: 400, textTransform: 'none', letterSpacing: 0}}>
              weighed and read.
            </span>
          </h2>
        </div>
        <div className="weighin-subtitle">
          A ledger, not a tagline. Same scale, same fix, same math — so you can pick the piece that's right and the price that's honest.
        </div>
      </div>

      {/* ─── CHAIN COLUMNS ─── */}
      <div className="weighin-columns" style={{gridTemplateColumns: chains.map(() => '1fr').join(' ')}}>
        {chains.map((chain, idx) => (
          <ChainColumn key={chain.handle || `custom-${idx}`} chain={chain} shortName={shortNames[idx]} onRemove={chain.type === 'custom' && onRemoveCustom ? () => {
            const customIdx = chains.slice(0, idx + 1).filter((c) => c.type === 'custom').length - 1;
            onRemoveCustom(customIdx);
          } : undefined} />
        ))}
      </div>

      {/* ─── LEDGER ─── */}
      <div className="weighin-ledger">
        {/* Header */}
        <div className="weighin-ledger-header" style={{gridTemplateColumns: ledgerCols}}>
          <div>№</div>
          <div>Measure</div>
          {chains.map((c, i) => (
            <div key={i} className={`weighin-ledger-header-${i}`}>{shortNames[i]}</div>
          ))}
        </div>

        {/* Rows */}
        {activeRows.map((row, ri) => (
          <div key={row.label} className="weighin-row" style={{gridTemplateColumns: ledgerCols, borderBottom: ri === activeRows.length - 1 ? 'none' : `1px solid ${STYX.line}`}}>
            <div style={{fontFamily: FONT.cinzel, fontSize: 16, color: STYX.gold, fontWeight: 500}}>
              {row.num}
            </div>
            <div>
              <div style={{fontFamily: FONT.cinzel, fontSize: 12, letterSpacing: '0.18em', color: STYX.ink, textTransform: 'uppercase', marginBottom: 3}}>
                {row.label}
              </div>
              <div style={{fontFamily: FONT.cormorant, fontSize: 13, fontStyle: 'italic', color: STYX.silt}}>
                {row.sub}
              </div>
            </div>
            {chains.map((c, idx) => (
              <div key={idx} style={{paddingRight: 8}}>
                <div className="weighin-mobile-label">{shortNames[idx]}</div>
                <div style={{display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap'}}>
                  <div style={{fontFamily: FONT.cinzel, fontSize: 22, color: STYX.ink, fontVariantNumeric: 'tabular-nums', fontWeight: 600}}>
                    {row.render(c, idx)}
                  </div>
                </div>
                {row.winIdx === idx && row.winTag && (
                  <div style={{marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: STYX.gold, color: STYX.ink, fontFamily: FONT.cinzel, fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 600}}>
                    <span>↳</span><span>{row.winTag}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ─── VERDICT ─── */}
      <div className="weighin-verdict">
        <Obol size={48} color={STYX.gold} speed={6} />
        <div style={{flex: 1}}>
          <div style={{fontFamily: FONT.cinzel, fontSize: 10, letterSpacing: '0.3em', color: STYX.gold, textTransform: 'uppercase', marginBottom: 10}}>
            The Verdict
          </div>
          <div style={{fontFamily: FONT.cormorant, fontSize: 17, fontStyle: 'italic', lineHeight: 1.55, color: 'rgba(239,234,224,0.92)'}}>
            <VerdictText chains={chains} shortNames={shortNames} spotPerOz={spotPerOz} />
          </div>
        </div>
        <div className="weighin-verdict-ctas">
          {chains.filter((c) => c.type === 'product').slice(0, 3).map((c, i) => (
            <Link
              key={c.handle}
              to={`/products/${c.handle}`}
              style={{
                padding: '12px 20px',
                fontFamily: FONT.cinzel,
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                ...(i === 0
                  ? {background: STYX.gold, color: STYX.ink, border: 'none'}
                  : {background: 'transparent', color: STYX.bone, border: `1px solid rgba(239,234,224,0.7)`}),
              }}
            >
              View {extractShort(c.title)} →
            </Link>
          ))}
        </div>
      </div>

      {/* ─── FOOTNOTE ─── */}
      <div className="weighin-footnote">
        <span>Spot ${spotPerOz.toFixed(2)}/oz</span>
        <span style={{color: STYX.gold}}>·</span>
        <span>London fix 15:00 GMT</span>
        <span style={{color: STYX.gold}}>·</span>
        <span>Updated just now</span>
      </div>

      <style dangerouslySetInnerHTML={{__html: weighinCSS(count)}} />
    </div>
  );
}

/* ─── Verdict text — auto-narrates across N chains ─── */

function VerdictText({chains, shortNames, spotPerOz}: {chains: WeighInChain[]; shortNames: string[]; spotPerOz: number}) {
  const weights = chains.map((c) => c.weight || 0);
  const pureGolds = chains.map((c) => c.pureGold || 0);
  const ppgs = chains.map((c) => c.pricePerPureGram || Infinity);

  const heaviestIdx = weights.indexOf(Math.max(...weights));
  const lightestIdx = weights.indexOf(Math.min(...weights));
  const bestPpgIdx = ppgs.indexOf(Math.min(...ppgs.filter((p) => p !== Infinity)));

  const allSameWeight = new Set(weights).size === 1;
  const allSameKarat = new Set(chains.map((c) => c.karat)).size === 1;
  const allSamePpg = ppgs.filter((p) => p !== Infinity).every((p) => Math.abs(p - ppgs[bestPpgIdx]) <= 2);

  return (
    <>
      {!allSameWeight ? (
        <>
          The <strong style={{fontWeight: 600}}>{shortNames[heaviestIdx]}</strong> is the heaviest at{' '}
          <NumInline>{weights[heaviestIdx]}g</NumInline> with{' '}
          <NumInline>{pureGolds[heaviestIdx].toFixed(1)}g</NumInline> of pure gold.{' '}
        </>
      ) : (
        <>All pieces hit the scale at the same mass. </>
      )}
      {!allSamePpg && ppgs[bestPpgIdx] !== Infinity ? (
        <>
          The <strong style={{fontWeight: 600}}>{shortNames[bestPpgIdx]}</strong> is the best value at{' '}
          <NumInline>${ppgs[bestPpgIdx].toFixed(0)}/g</NumInline> of pure gold.{' '}
        </>
      ) : ppgs.some((p) => p !== Infinity) ? (
        <>
          All come in at <NumInline>${ppgs.find((p) => p !== Infinity)?.toFixed(0)}/g</NumInline> of pure gold — equal value.{' '}
        </>
      ) : null}
      {allSameKarat
        ? `All are ${chains[0].karat}K — same fineness, different masters.`
        : `${[...new Set(chains.map((c) => `${c.karat}K`))].join(' vs ')} — different fineness, same honesty about it.`}
    </>
  );
}

function NumInline({children}: {children: React.ReactNode}) {
  return (
    <span style={{fontFamily: FONT.mono, fontSize: '0.85em', color: STYX.gold, padding: '1px 6px', background: 'rgba(184,146,74,0.12)', fontStyle: 'normal', whiteSpace: 'nowrap'}}>
      {children}
    </span>
  );
}

/* ─── Chain column card ─── */

function ChainColumn({chain, shortName, onRemove}: {chain: WeighInChain; shortName: string; onRemove?: () => void}) {
  return (
    <div className="weighin-chain-col">
      <div style={{position: 'relative', overflow: 'hidden'}}>
        {chain.type === 'product' && chain.image ? (
          <Link to={`/products/${chain.handle}`}>
            <Image data={chain.image} aspectRatio="4/5" sizes="(min-width: 768px) 30vw, 80vw" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </Link>
        ) : chain.type === 'custom' ? (
          <div style={{aspectRatio: '4/5', background: STYX.parchment, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, border: `1px dashed ${STYX.line}`}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={STYX.silt} strokeWidth="1.2">
              <path d="M12 3v18M5 7l-3 9h6L5 7zM19 7l-3 9h6l-3-9zM5 7h14" />
            </svg>
            <span style={{fontFamily: FONT.mono, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.silt}}>Custom</span>
          </div>
        ) : (
          <div style={{aspectRatio: '4/5', background: STYX.parchment, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.mono, fontSize: 10, color: STYX.silt}}>
            {chain.title}
          </div>
        )}
        {/* Price badge */}
        <div style={{position: 'absolute', bottom: 0, right: 0, padding: '8px 12px', background: STYX.ink, color: STYX.bone, fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.08em', display: 'flex', gap: 8}}>
          {chain.weight && <span>{chain.weight}g</span>}
          <span style={{color: STYX.gold}}>·</span>
          <span>{chain.karat}K</span>
          <span style={{color: STYX.gold}}>·</span>
          <span style={{color: STYX.gold}}>${chain.minPrice.toLocaleString()}</span>
        </div>
      </div>
      <div style={{padding: '14px 16px'}}>
        {chain.type === 'product' ? (
          <Link to={`/products/${chain.handle}`} style={{textDecoration: 'none'}}>
            <div style={{fontFamily: FONT.cinzel, fontSize: 11, letterSpacing: '0.08em', color: STYX.ink, textTransform: 'uppercase', fontWeight: 500}}>
              {chain.title}
            </div>
          </Link>
        ) : (
          <div style={{fontFamily: FONT.cinzel, fontSize: 11, letterSpacing: '0.08em', color: STYX.ink, textTransform: 'uppercase', fontWeight: 500}}>
            {chain.title}
          </div>
        )}
        <div style={{fontFamily: FONT.mono, fontSize: 9, color: STYX.silt, letterSpacing: '0.06em', marginTop: 4}}>
          {chain.thickness && <span>{chain.thickness}</span>}
          {chain.thickness && chain.construction !== '—' && <span> · </span>}
          {chain.construction !== '—' && <span>{chain.construction}</span>}
          {chain.origin && <span> · {chain.origin}</span>}
        </div>
        {onRemove && (
          <button onClick={onRemove} style={{marginTop: 8, padding: '4px 10px', border: `1px solid ${STYX.line}`, background: 'transparent', fontFamily: FONT.mono, fontSize: 8, color: STYX.silt, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase'}}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Karat stamp ─── */

function KaratStamp({karat, purity}: {karat: number; purity: number}) {
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
      <span>{karat}<span style={{fontSize: '0.6em'}}>K</span></span>
      <div style={{flex: 1, maxWidth: 120}}>
        <div style={{fontFamily: FONT.mono, fontSize: 8, color: STYX.silt, letterSpacing: '0.08em', marginBottom: 2}}>
          {(purity * 100).toFixed(1)}% pure
        </div>
        <div style={{height: 8, background: STYX.parchment, position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', inset: 0, width: `${purity * 100}%`, background: STYX.gold}} />
        </div>
      </div>
    </div>
  );
}

/* ─── Weight bar ─── */

function WeightBar({weight, max, purity}: {weight: number; max: number; purity: number}) {
  const pct = max > 0 ? (weight / max) * 100 : 0;
  const purePct = pct * purity;
  return (
    <div className="weighin-bar-wrap">
      <span>{weight}<span style={{fontSize: '0.5em', color: STYX.silt}}>g</span></span>
      <div className="weighin-bar-track" style={{flex: 1, maxWidth: 160}}>
        <div style={{height: 14, background: STYX.parchment, border: `1px solid ${STYX.line}`, position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', top: 0, bottom: 0, left: 0, width: `${pct}%`, background: `repeating-linear-gradient(45deg, ${STYX.silt} 0 5px, ${STYX.silt2} 5px 6px)`}} />
          <div style={{position: 'absolute', top: 0, bottom: 0, left: 0, width: `${purePct}%`, background: STYX.gold}} />
        </div>
        <div style={{marginTop: 3, display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontSize: 7, letterSpacing: '0.08em', color: STYX.silt}}>
          <span style={{color: STYX.gold}}>■ gold</span>
          <span>■ alloy</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Pure gold bar ─── */

function PureGoldBar({pure, max, weight}: {pure: number; max: number; weight: number}) {
  const purePct = max > 0 ? (pure / max) * 100 : 0;
  return (
    <div className="weighin-bar-wrap">
      <span>{pure.toFixed(1)}<span style={{fontSize: '0.5em', color: STYX.silt}}>g</span></span>
      <div className="weighin-bar-track" style={{flex: 1, maxWidth: 160}}>
        <div style={{height: 14, background: STYX.parchment, border: `1px solid ${STYX.line}`, position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', top: 0, bottom: 0, left: 0, width: `${purePct}%`, background: `linear-gradient(180deg, ${STYX.goldLight} 0%, ${STYX.gold} 50%, ${STYX.goldDeep} 100%)`, boxShadow: 'inset 0 0 0 1px rgba(26,24,21,0.1)'}} />
        </div>
        <div style={{marginTop: 3, fontFamily: FONT.mono, fontSize: 7, letterSpacing: '0.08em', color: STYX.silt}}>
          {weight > 0 ? `${((pure / weight) * 100).toFixed(1)}% of total mass` : '—'}
        </div>
      </div>
    </div>
  );
}

/* ─── Dynamic CSS ─── */

function weighinCSS(count: number) {
  return `
.weighin-root {
  background: ${STYX.bone};
  padding: 60px 48px 80px;
}
.weighin-header {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 60px;
  align-items: end;
  margin-bottom: 48px;
}
.weighin-title {
  font-family: ${FONT.cinzel};
  font-size: ${count > 2 ? 42 : 52}px;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 0.95;
  margin: 0;
  color: ${STYX.ink};
  text-transform: uppercase;
}
.weighin-subtitle {
  font-family: ${FONT.cormorant};
  font-size: 16px;
  line-height: 1.65;
  font-style: italic;
  color: ${STYX.silt};
  max-width: 400px;
}
.weighin-columns {
  display: grid;
  gap: 12px;
  align-items: stretch;
  margin-bottom: 4px;
}
.weighin-chain-col {
  background: ${STYX.paper};
  border: 1px solid ${STYX.line};
  overflow: hidden;
}
.weighin-ledger {
  background: ${STYX.paper};
  border: 1px solid ${STYX.line};
  margin-top: 24px;
}
.weighin-ledger-header {
  display: grid;
  padding: 14px 24px;
  border-bottom: 1px solid ${STYX.line};
  background: ${STYX.bone};
  font-family: ${FONT.cinzel};
  font-size: 9px;
  letter-spacing: 0.25em;
  color: ${STYX.silt};
  text-transform: uppercase;
}
.weighin-row {
  display: grid;
  padding: 20px 24px;
  align-items: center;
  gap: 0;
}
.weighin-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.weighin-verdict {
  margin-top: 28px;
  padding: 28px 32px;
  background: ${STYX.ink};
  color: ${STYX.bone};
  display: flex;
  gap: 28px;
  align-items: center;
}
.weighin-verdict-ctas {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}
.weighin-footnote {
  margin-top: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
  font-family: ${FONT.mono};
  font-size: 10px;
  letter-spacing: 0.12em;
  color: ${STYX.silt};
  text-transform: uppercase;
  flex-wrap: wrap;
}
.weighin-mobile-label {
  display: none;
}

@media (max-width: 768px) {
  .weighin-root {
    padding: 32px 16px 48px;
  }
  .weighin-header {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 28px;
  }
  .weighin-title {
    font-size: 28px;
  }
  .weighin-subtitle {
    max-width: 100%;
    font-size: 15px;
  }
  .weighin-columns {
    grid-template-columns: 1fr !important;
    gap: 12px;
  }
  .weighin-ledger-header {
    display: none;
  }
  .weighin-row {
    grid-template-columns: 1fr !important;
    padding: 20px 16px;
    gap: 14px;
  }
  .weighin-row > div:first-child {
    display: none;
  }
  .weighin-mobile-label {
    display: block;
    font-family: ${FONT.cinzel};
    font-size: 8px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: ${STYX.silt};
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid ${STYX.lineSoft};
  }
  .weighin-bar-wrap {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .weighin-bar-track {
    max-width: 100% !important;
    width: 100%;
  }
  .weighin-verdict {
    flex-direction: column;
    padding: 20px 16px;
    gap: 16px;
    text-align: center;
  }
  .weighin-verdict-ctas {
    width: 100%;
  }
  .weighin-verdict-ctas a {
    width: 100%;
    box-sizing: border-box;
  }
  .weighin-footnote {
    font-size: 9px;
    gap: 10px;
    justify-content: center;
  }
}
`;
}
