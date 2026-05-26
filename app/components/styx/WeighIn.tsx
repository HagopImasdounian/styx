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

  // Verdict
  const heavier = (A.weight || 0) > (B.weight || 0) ? A : (B.weight || 0) > (A.weight || 0) ? B : null;
  const lighter = heavier === A ? B : heavier === B ? A : null;
  const weightDelta = heavier && lighter ? ((heavier.weight || 0) - (lighter.weight || 0)).toFixed(1) : '0';
  const goldDelta = heavier && lighter ? ((heavier.pureGold || 0) - (lighter.pureGold || 0)).toFixed(1) : '0';
  const valueWinner = (A.pricePerPureGram || Infinity) < (B.pricePerPureGram || Infinity) ? A
    : (B.pricePerPureGram || Infinity) < (A.pricePerPureGram || Infinity) ? B : null;
  const sameKarat = A.karat === B.karat;

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
        />
        <CompareRow
          num="II"
          k="Value"
          sub="dollars per gram of pure gold"
          aVal={A.pricePerPureGram ? `$${A.pricePerPureGram.toFixed(0)}/g` : '—'}
          bVal={B.pricePerPureGram ? `$${B.pricePerPureGram.toFixed(0)}/g` : '—'}
          aWin={(A.pricePerPureGram || Infinity) < (B.pricePerPureGram || Infinity)}
          bWin={(B.pricePerPureGram || Infinity) < (A.pricePerPureGram || Infinity)}
          winTag="better value"
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
                The <strong style={{fontWeight: 600}}>{heavier.title}</strong> carries{' '}
                <NumInline>{weightDelta}g</NumInline> more metal and{' '}
                <NumInline>{goldDelta}g</NumInline> more pure gold than the{' '}
                {lighter.title}.{' '}
              </>
            ) : (
              <>Both pieces hit the scale at the same mass. </>
            )}
            {valueWinner ? (
              <>
                The <strong style={{fontWeight: 600}}>{valueWinner.title}</strong> is the better value at{' '}
                <NumInline>${valueWinner.pricePerPureGram?.toFixed(0)}/g</NumInline> of pure gold.{' '}
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
            View {A.title.split(' ').slice(0, 3).join(' ')}
          </Link>
          <Link
            to={`/products/${B.handle}`}
            style={{padding: '14px 22px', fontFamily: FONT.cinzel, fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', background: 'transparent', color: STYX.bone, border: `1px solid rgba(239,234,224,0.4)`, textDecoration: 'none', whiteSpace: 'nowrap', textAlign: 'center'}}
          >
            View {B.title.split(' ').slice(0, 3).join(' ')}
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
          <div style={{fontFamily: FONT.cinzel, fontSize: 18, letterSpacing: '0.06em', color: STYX.ink, textTransform: 'uppercase', marginBottom: 4}}>
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

function CompareRow({num, k, sub, aVal, bVal, aWin, bWin, winTag, last}: {
  num: string; k: string; sub: string;
  aVal: React.ReactNode; bVal: React.ReactNode;
  aWin: boolean; bWin: boolean; winTag: string; last?: boolean;
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
      <LedgerCell value={aVal} win={aWin} winTag={winTag} />
      <LedgerCell value={bVal} win={bWin} winTag={winTag} />
    </div>
  );
}

function LedgerCell({value, win, winTag}: {value: React.ReactNode; win: boolean; winTag: string}) {
  return (
    <div style={{paddingRight: 12}}>
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
        <div style={{height: 5, background: STYX.parchment, position: 'relative', overflow: 'hidden'}}>
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
      <div style={{flex: 1, maxWidth: 180}}>
        <div style={{height: 10, background: STYX.parchment, border: `1px solid ${STYX.line}`, position: 'relative', overflow: 'hidden'}}>
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
      <div style={{flex: 1, maxWidth: 180}}>
        <div style={{height: 10, background: STYX.parchment, border: `1px solid ${STYX.line}`, position: 'relative', overflow: 'hidden'}}>
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
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: stretch;
  margin-bottom: 4px;
}
.weighin-vs {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${FONT.cinzel};
  font-size: 14px;
  letter-spacing: 0.3em;
  color: ${STYX.gold};
  text-transform: uppercase;
  padding: 0 8px;
}
.weighin-chain-col {
  background: ${STYX.paper};
  border: 1px solid ${STYX.line};
  overflow: hidden;
}
.weighin-ledger {
  background: ${STYX.paper};
  border: 1px solid ${STYX.line};
  margin-top: 20px;
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
  padding: 20px 24px;
  align-items: center;
  gap: 0;
}
.weighin-bar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.weighin-verdict {
  margin-top: 28px;
  padding: 24px 28px;
  background: ${STYX.ink};
  color: ${STYX.bone};
  display: flex;
  gap: 24px;
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

/* ─── MOBILE ─── */
@media (max-width: 768px) {
  .weighin-root {
    padding: 40px 16px 60px;
  }
  .weighin-header {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-bottom: 32px;
  }
  .weighin-title {
    font-size: 32px;
  }
  .weighin-subtitle {
    max-width: 100%;
  }
  .weighin-columns {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .weighin-vs {
    padding: 8px 0;
    font-size: 12px;
  }
  .weighin-ledger-header {
    grid-template-columns: 32px 1fr;
    padding: 12px 16px;
  }
  .weighin-ledger-header-a,
  .weighin-ledger-header-b {
    display: none;
  }
  .weighin-row {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 12px;
  }
  .weighin-row > div:first-child {
    display: none;
  }
  .weighin-bar-wrap {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .weighin-bar-wrap > div:last-child {
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
