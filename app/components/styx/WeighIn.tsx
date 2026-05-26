import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {STYX, FONT} from './constants';
import {Obol} from './Obol';
import {KARAT_PURITY} from '~/lib/gold';

type ChainData = {
  handle: string;
  title: string;
  image?: any;
  karat: number;
  weight: number | null;
  pureGold: number | null;
  meltValue: number | null;
  pricePerPureGram: number | null;
  minPrice: number;
  thickness: string | null;
  construction: string;
  origin: string | null;
};

export function WeighIn({
  chainA,
  chainB,
  spotPerOz,
}: {
  chainA: ChainData;
  chainB: ChainData;
  spotPerOz: number;
}) {
  const A = chainA;
  const B = chainB;
  const maxWeight = Math.max(A.weight || 0, B.weight || 0);
  const purityA = KARAT_PURITY[A.karat] ?? 10 / 24;
  const purityB = KARAT_PURITY[B.karat] ?? 10 / 24;

  // Short names — extract chain style from title (e.g. "10K Gold 1.5mm Curb Chain" → "Curb")
  const CHAIN_STYLES = ['Cuban Link', 'Cuban', 'Curb', 'Box', 'Rope', 'Cable', 'Figaro', 'Wheat', 'Rolo', 'Singapore', 'Franco', 'Herringbone', 'Paperclip', 'Snake', 'Byzantine', 'Mariner'];
  const extractShort = (title: string) => {
    for (const style of CHAIN_STYLES) {
      if (title.toLowerCase().includes(style.toLowerCase())) return style;
    }
    // Fallback: remove karat prefix and "Chain" suffix
    return title.replace(/^\d+k\s+gold\s+/i, '').replace(/\s+chain$/i, '').trim();
  };
  const shortA = extractShort(A.title);
  const shortB = extractShort(B.title);

  // Verdict
  const heavier = (A.weight || 0) > (B.weight || 0) ? A : (B.weight || 0) > (A.weight || 0) ? B : null;
  const lighter = heavier === A ? B : heavier === B ? A : null;
  const weightDelta = heavier && lighter ? ((heavier.weight || 0) - (lighter.weight || 0)).toFixed(1) : '0';
  const goldDelta = heavier && lighter ? ((heavier.pureGold || 0) - (lighter.pureGold || 0)).toFixed(1) : '0';
  // Value tolerance: if $/g difference < $2, consider equal
  const ppgA = A.pricePerPureGram || Infinity;
  const ppgB = B.pricePerPureGram || Infinity;
  const valueDiff = Math.abs(ppgA - ppgB);
  const valueWinner = valueDiff > 2 ? (ppgA < ppgB ? A : B) : null;
  const sameKarat = A.karat === B.karat;
  const shortFor = (c: ChainData) => c === A ? shortA : shortB;

  return (
    <div className="weighin-root">
      {/* ─── HEADER ─── */}
      <div className="weighin-header">
        <div>
          <div style={{fontFamily: FONT.cinzel, fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: STYX.gold, marginBottom: 18}}>
            The Weigh-In
          </div>
          <h2 className="weighin-title">
            Two chains,<br/>
            <span style={{fontFamily: FONT.cormorant, fontStyle: 'italic', fontWeight: 400, textTransform: 'none', letterSpacing: 0}}>
              weighed and read.
            </span>
          </h2>
        </div>
        <div className="weighin-subtitle">
          A ledger, not a tagline. Same scale, same fix, same math — so you can pick the piece that's right and the price that's honest.
        </div>
      </div>

      {/* ─── TWO COLUMNS — images + identity ─── */}
      <div className="weighin-columns">
        <ChainColumn chain={A} purity={purityA} />
        <div className="weighin-vs">vs.</div>
        <ChainColumn chain={B} purity={purityB} />
      </div>

      {/* ─── LEDGER ─── */}
      <div className="weighin-ledger">
        <LedgerHeader />
        <CompareRow
          num="I"
          k="Your Toll"
          sub="retail price, today's fix"
          aVal={`$${A.minPrice.toLocaleString()}`}
          bVal={`$${B.minPrice.toLocaleString()}`}
          aWin={A.minPrice < B.minPrice}
          bWin={B.minPrice < A.minPrice}
          winTag="less"
          aLabel={shortA} bLabel={shortB}
        />
        <CompareRow
          num="II"
          k="Value"
          sub="dollars per gram of pure gold"
          aVal={A.pricePerPureGram ? `$${A.pricePerPureGram.toFixed(0)}/g` : '—'}
          bVal={B.pricePerPureGram ? `$${B.pricePerPureGram.toFixed(0)}/g` : '—'}
          aWin={valueDiff > 2 && ppgA < ppgB}
          bWin={valueDiff > 2 && ppgB < ppgA}
          winTag="better value"
          aLabel={shortA} bLabel={shortB}
        />
        <CompareRow
          num="III"
          k="Karat"
          sub="alloy mix, purity by mass"
          aVal={<KaratStamp karat={A.karat} purity={purityA} />}
          bVal={<KaratStamp karat={B.karat} purity={purityB} />}
          aWin={A.karat > B.karat}
          bWin={B.karat > A.karat}
          winTag="purer"
          aLabel={shortA} bLabel={shortB}
        />
        <CompareRow
          num="IV"
          k="Total weight"
          sub="entire chain, including alloy"
          aVal={<WeightBar weight={A.weight || 0} max={maxWeight} purity={purityA} />}
          bVal={<WeightBar weight={B.weight || 0} max={maxWeight} purity={purityB} />}
          aWin={(A.weight || 0) > (B.weight || 0)}
          bWin={(B.weight || 0) > (A.weight || 0)}
          winTag="heavier"
          aLabel={shortA} bLabel={shortB}
        />
        <CompareRow
          num="V"
          k="Pure gold"
          sub="alloy stripped — what melts to bullion"
          aVal={<PureGoldBar pure={A.pureGold || 0} max={maxWeight} weight={A.weight || 0} />}
          bVal={<PureGoldBar pure={B.pureGold || 0} max={maxWeight} weight={B.weight || 0} />}
          aWin={(A.pureGold || 0) > (B.pureGold || 0)}
          bWin={(B.pureGold || 0) > (A.pureGold || 0)}
          winTag="more gold"
          aLabel={shortA} bLabel={shortB}
          last
        />
      </div>

      {/* ─── VERDICT ─── */}
      <div className="weighin-verdict">
        <Obol size={48} color={STYX.gold} speed={6} />
        <div style={{flex: 1}}>
          <div style={{fontFamily: FONT.cinzel, fontSize: 10, letterSpacing: '0.3em', color: STYX.gold, textTransform: 'uppercase', marginBottom: 10}}>
            The Verdict
          </div>
          <div style={{fontFamily: FONT.cormorant, fontSize: 17, fontStyle: 'italic', lineHeight: 1.55, color: 'rgba(239,234,224,0.92)'}}>
            {heavier && lighter ? (
              <>
                The <strong style={{fontWeight: 600}}>{shortFor(heavier)}</strong> carries{' '}
                <NumInline>{weightDelta}g</NumInline> more metal and{' '}
                <NumInline>{goldDelta}g</NumInline> more pure gold than the{' '}
                {shortFor(lighter)}.{' '}
              </>
            ) : (
              <>Both pieces hit the scale at the same mass. </>
            )}
            {valueWinner ? (
              <>
                The <strong style={{fontWeight: 600}}>{shortFor(valueWinner)}</strong> is the better value at{' '}
                <NumInline>${valueWinner.pricePerPureGram?.toFixed(0)}/g</NumInline> of pure gold.{' '}
              </>
            ) : ppgA !== Infinity && ppgB !== Infinity ? (
              <>
                Both come in at <NumInline>${Math.round((ppgA + ppgB) / 2)}/g</NumInline> of pure gold — equal value.{' '}
              </>
            ) : null}
            {sameKarat
              ? `Both are ${A.karat}K — same fineness, different masters.`
              : `${A.karat}K versus ${B.karat}K — different fineness, same honesty about it.`}
          </div>
        </div>
        <div className="weighin-verdict-ctas">
          <Link
            to={`/products/${A.handle}`}
            style={{padding: '14px 22px', fontFamily: FONT.cinzel, fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', background: STYX.gold, color: STYX.ink, border: 'none', textDecoration: 'none', whiteSpace: 'nowrap', textAlign: 'center'}}
          >
            View the {shortA} →
          </Link>
          <Link
            to={`/products/${B.handle}`}
            style={{padding: '14px 22px', fontFamily: FONT.cinzel, fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', background: 'transparent', color: STYX.bone, border: `1px solid rgba(239,234,224,0.7)`, textDecoration: 'none', whiteSpace: 'nowrap', textAlign: 'center'}}
          >
            View the {shortB} →
          </Link>
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

      <style dangerouslySetInnerHTML={{__html: WEIGHIN_CSS}} />
    </div>
  );
}

/* ─── Sub-components ─── */

function NumInline({children}: {children: React.ReactNode}) {
  return (
    <span style={{fontFamily: FONT.mono, fontSize: '0.85em', color: STYX.gold, padding: '1px 6px', background: 'rgba(184,146,74,0.12)', fontStyle: 'normal', whiteSpace: 'nowrap'}}>
      {children}
    </span>
  );
}

function ChainColumn({chain, purity}: {chain: ChainData; purity: number}) {
  return (
    <div className="weighin-chain-col">
      <div style={{position: 'relative', overflow: 'hidden'}}>
        {chain.image ? (
          <Link to={`/products/${chain.handle}`}>
            <Image data={chain.image} aspectRatio="16/10" sizes="(min-width: 768px) 45vw, 90vw" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </Link>
        ) : (
          <div style={{aspectRatio: '16/10', background: STYX.parchment, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.mono, fontSize: 10, color: STYX.silt}}>
            {chain.title}
          </div>
        )}
        {/* Price badge */}
        <div style={{position: 'absolute', bottom: 0, right: 0, padding: '10px 14px', background: STYX.ink, color: STYX.bone, fontFamily: FONT.mono, fontSize: 11, letterSpacing: '0.1em', display: 'flex', gap: 10}}>
          <span>{chain.weight}g</span>
          <span style={{color: STYX.gold}}>·</span>
          <span>{chain.karat}K</span>
          <span style={{color: STYX.gold}}>·</span>
          <span style={{color: STYX.gold}}>${chain.minPrice.toLocaleString()}</span>
        </div>
      </div>
      <div style={{padding: '18px 22px'}}>
        <Link to={`/products/${chain.handle}`} style={{textDecoration: 'none'}}>
          <div style={{fontFamily: FONT.cinzel, fontSize: 13, letterSpacing: '0.1em', color: STYX.ink, textTransform: 'uppercase', marginBottom: 4, fontWeight: 500}}>
            {chain.title}
          </div>
        </Link>
        <div style={{fontFamily: FONT.mono, fontSize: 10, color: STYX.silt, letterSpacing: '0.08em'}}>
          {chain.thickness && <span>{chain.thickness}</span>}
          {chain.thickness && chain.construction && <span> · </span>}
          {chain.construction !== '—' && <span>{chain.construction}</span>}
          {chain.origin && <span> · {chain.origin}</span>}
        </div>
      </div>
    </div>
  );
}

function LedgerHeader() {
  return (
    <div className="weighin-ledger-header">
      <div>№</div>
      <div>Measure</div>
      <div className="weighin-ledger-header-a">First</div>
      <div className="weighin-ledger-header-b">Second</div>
    </div>
  );
}

function CompareRow({num, k, sub, aVal, bVal, aWin, bWin, winTag, aLabel, bLabel, last}: {
  num: string; k: string; sub: string;
  aVal: React.ReactNode; bVal: React.ReactNode;
  aWin: boolean; bWin: boolean; winTag: string;
  aLabel: string; bLabel: string; last?: boolean;
}) {
  return (
    <div className="weighin-row" style={{borderBottom: last ? 'none' : `1px solid ${STYX.line}`}}>
      <div style={{fontFamily: FONT.cinzel, fontSize: 16, color: STYX.gold, fontWeight: 500}}>
        {num}
      </div>
      <div>
        <div style={{fontFamily: FONT.cinzel, fontSize: 12, letterSpacing: '0.18em', color: STYX.ink, textTransform: 'uppercase', marginBottom: 3}}>
          {k}
        </div>
        <div style={{fontFamily: FONT.cormorant, fontSize: 13, fontStyle: 'italic', color: STYX.silt}}>
          {sub}
        </div>
      </div>
      <LedgerCell value={aVal} win={aWin} winTag={winTag} mobileLabel={aLabel} />
      <LedgerCell value={bVal} win={bWin} winTag={winTag} mobileLabel={bLabel} />
    </div>
  );
}

function LedgerCell({value, win, winTag, mobileLabel}: {value: React.ReactNode; win: boolean; winTag: string; mobileLabel?: string}) {
  return (
    <div style={{paddingRight: 12}}>
      {mobileLabel && <div className="weighin-mobile-label">{mobileLabel}</div>}
      <div style={{display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap'}}>
        {typeof value === 'string' ? (
          <div style={{fontFamily: FONT.cinzel, fontSize: 24, color: STYX.ink, fontVariantNumeric: 'tabular-nums', fontWeight: 600}}>
            {value}
          </div>
        ) : value}
      </div>
      {win && (
        <div style={{marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: STYX.gold, color: STYX.ink, fontFamily: FONT.cinzel, fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 600}}>
          <span>↳</span><span>{winTag}</span>
        </div>
      )}
    </div>
  );
}

function KaratStamp({karat, purity}: {karat: number; purity: number}) {
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
      <div style={{fontFamily: FONT.cinzel, fontSize: 26, color: STYX.ink, fontVariantNumeric: 'tabular-nums', fontWeight: 600}}>
        {karat}<span style={{fontSize: 14}}>K</span>
      </div>
      <div style={{flex: 1, maxWidth: 160}}>
        <div style={{fontFamily: FONT.mono, fontSize: 9, color: STYX.silt, letterSpacing: '0.1em', marginBottom: 3}}>
          {(purity * 100).toFixed(1)}% pure
        </div>
        <div style={{height: 8, background: STYX.parchment, position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', inset: 0, width: `${purity * 100}%`, background: STYX.gold}} />
        </div>
      </div>
    </div>
  );
}

function WeightBar({weight, max, purity}: {weight: number; max: number; purity: number}) {
  const pct = max > 0 ? (weight / max) * 100 : 0;
  const purePct = pct * purity;
  return (
    <div className="weighin-bar-wrap">
      <div style={{fontFamily: FONT.cinzel, fontSize: 24, color: STYX.ink, fontVariantNumeric: 'tabular-nums', fontWeight: 600, minWidth: 60}}>
        {weight}<span style={{fontSize: 12, color: STYX.silt}}>g</span>
      </div>
      <div className="weighin-bar-track" style={{flex: 1, maxWidth: 180}}>
        <div style={{height: 16, background: STYX.parchment, border: `1px solid ${STYX.line}`, position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', top: 0, bottom: 0, left: 0, width: `${pct}%`, background: `repeating-linear-gradient(45deg, ${STYX.silt} 0 5px, ${STYX.silt2} 5px 6px)`}} />
          <div style={{position: 'absolute', top: 0, bottom: 0, left: 0, width: `${purePct}%`, background: STYX.gold}} />
        </div>
        <div style={{marginTop: 4, display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontSize: 8, letterSpacing: '0.1em', color: STYX.silt}}>
          <span style={{color: STYX.gold}}>■ gold</span>
          <span>■ alloy</span>
        </div>
      </div>
    </div>
  );
}

function PureGoldBar({pure, max, weight}: {pure: number; max: number; weight: number}) {
  const purePct = max > 0 ? (pure / max) * 100 : 0;
  return (
    <div className="weighin-bar-wrap">
      <div style={{fontFamily: FONT.cinzel, fontSize: 24, color: STYX.ink, fontVariantNumeric: 'tabular-nums', fontWeight: 600, minWidth: 60}}>
        {pure.toFixed(1)}<span style={{fontSize: 12, color: STYX.silt}}>g</span>
      </div>
      <div className="weighin-bar-track" style={{flex: 1, maxWidth: 180}}>
        <div style={{height: 16, background: STYX.parchment, border: `1px solid ${STYX.line}`, position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', top: 0, bottom: 0, left: 0, width: `${purePct}%`, background: `linear-gradient(180deg, ${STYX.goldLight} 0%, ${STYX.gold} 50%, ${STYX.goldDeep} 100%)`, boxShadow: 'inset 0 0 0 1px rgba(26,24,21,0.1)'}} />
        </div>
        <div style={{marginTop: 4, fontFamily: FONT.mono, fontSize: 8, letterSpacing: '0.1em', color: STYX.silt}}>
          {weight > 0 ? `${((pure / weight) * 100).toFixed(1)}% of total mass` : '—'}
        </div>
      </div>
    </div>
  );
}

/* ─── CSS (responsive) ─── */

const WEIGHIN_CSS = `
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
  font-size: 52px;
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
  grid-template-columns: 1fr 60px 1fr;
  gap: 8px;
  align-items: stretch;
  margin-bottom: 4px;
}
.weighin-vs {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${FONT.cinzel};
  font-size: 18px;
  letter-spacing: 0.3em;
  color: ${STYX.gold};
  text-transform: uppercase;
  padding: 0;
  position: relative;
}
.weighin-vs::before,
.weighin-vs::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 1px;
  background: ${STYX.line};
}
.weighin-vs::before { top: 0; height: 30%; }
.weighin-vs::after { bottom: 0; height: 30%; }
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
  grid-template-columns: 50px 1fr 1.2fr 1.2fr;
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
  grid-template-columns: 50px 1fr 1.2fr 1.2fr;
  padding: 22px 24px;
  align-items: center;
  gap: 0;
}
.weighin-bar-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
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
  gap: 10px;
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
/* Mobile chain label in ledger */
.weighin-mobile-label {
  display: none;
}

/* ─── MOBILE ─── */
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
    grid-template-columns: 1fr;
    gap: 0;
  }
  .weighin-vs {
    padding: 10px 0;
    font-size: 13px;
  }
  .weighin-vs::before,
  .weighin-vs::after {
    display: none;
  }
  .weighin-ledger-header {
    display: none;
  }
  .weighin-row {
    grid-template-columns: 1fr;
    padding: 20px 16px;
    gap: 16px;
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
