import {Link, useRouteLoaderData} from 'react-router';
import {STYX, FONT} from './constants';
import {StyxLabel} from './StyxLabel';
import {CTAButton} from './CTAButton';
import {HomeH2, Em, HomeBody} from './HomePrimitives';
import {KARAT_PURITY, formatUSD} from '~/lib/gold';
import type {RootLoader} from '~/root';

const TROY_OZ_GRAMS = 31.1035;

/** A real product, prepared server-side, used to print one honest receipt. */
export type PriceSample = {
  handle: string;
  title: string;
  karat: number;
  /** Weave family, capitalised ("Rope"). */
  style: string | null;
  /** e.g. "3mm" */
  thickness: string | null;
  /** e.g. '20"' */
  length: string | null;
  weightGrams: number;
  price: number;
  currencyCode: string;
};

/** "The price, in full": narrative plus a light ledger of three real chains. */
export function HomePriceLedger({samples}: {samples: PriceSample[]}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const goldData = (rootData as any)?.goldData;
  const spotPerOz: number = goldData?.spotPerOz ?? 4700;
  const show = samples.filter((s) => s && s.price > 0 && s.weightGrams > 0);

  return (
    <section
      id="how-we-price"
      className="styx-home-ledger"
      style={{background: STYX.bone, padding: '110px 56px', scrollMarginTop: 96}}
    >
      <div style={{maxWidth: 1440, margin: '0 auto'}}>
        <div
          className="styx-home-ledger-head"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
            gap: 72,
            alignItems: 'end',
            marginBottom: 48,
          }}
        >
          <div>
            <StyxLabel greek="ΑΞΙΑ">The price, in full</StyxLabel>
            <HomeH2>
              Most jewelers hide the gold inside the price. We <Em>print</Em> it.
            </HomeH2>
          </div>
          <div>
            <HomeBody>
              Every chain breaks down into two numbers: the gold, at today&apos;s
              price, and the craft. Nothing else goes in. Three chains from the
              vault, light to heavy, priced live.
            </HomeBody>
            <CTAButton variant="primary" href="/compare">
              Compare chains
            </CTAButton>
          </div>
        </div>

        {show.length > 0 && <Ledger samples={show} spotPerOz={spotPerOz} />}
      </div>
    </section>
  );
}

function split(sample: PriceSample, spotPerOz: number) {
  const purity = KARAT_PURITY[sample.karat] ?? KARAT_PURITY[10];
  const pureGrams = sample.weightGrams * purity;
  const gold = pureGrams * (spotPerOz / TROY_OZ_GRAMS);
  const craft = Math.max(0, sample.price - gold);
  const goldShare = sample.price > 0 ? Math.min(1, gold / sample.price) : 0;
  return {pureGrams, gold, craft, goldShare};
}

/** Paper ledger: one row per chain, gold vs craft as a bar, the fare once. */
function Ledger({samples, spotPerOz}: {samples: PriceSample[]; spotPerOz: number}) {
  const head: React.CSSProperties = {
    fontFamily: FONT.cinzel,
    fontSize: 10,
    letterSpacing: '0.26em',
    textTransform: 'uppercase',
    color: STYX.silt,
  };
  const mono: React.CSSProperties = {
    fontFamily: FONT.mono,
    fontSize: 13,
    letterSpacing: '0.02em',
    color: STYX.ink,
    fontVariantNumeric: 'tabular-nums',
  };
  return (
    <div
      data-reveal=""
      className="styx-home-receipt"
      style={{
        background: STYX.paper,
        border: `1px solid ${STYX.line}`,
        padding: '8px 36px 12px',
      }}
    >
      <div
        className="styx-home-ledger-row styx-home-ledger-row-head"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 0.7fr 2fr 0.8fr 0.8fr 0.9fr',
          gap: 20,
          padding: '16px 0 12px',
          borderBottom: `1px solid ${STYX.line}`,
          alignItems: 'end',
        }}
      >
        <span style={head}>Chain</span>
        <span style={head}>Weight</span>
        <span style={head}>
          Gold <span style={{color: STYX.gold}}>|</span> craft
        </span>
        <span style={{...head, textAlign: 'right'}}>The gold</span>
        <span style={{...head, textAlign: 'right'}}>The craft</span>
        <span style={{...head, textAlign: 'right'}}>The fare</span>
      </div>

      {samples.map((sample, i) => {
        const {pureGrams, gold, craft, goldShare} = split(sample, spotPerOz);
        const spec = [sample.thickness, sample.length].filter(Boolean).join(' · ');
        return (
          <Link
            key={sample.handle + i}
            to={`/products/${sample.handle}`}
            prefetch="intent"
            className="styx-home-ledger-row"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 0.7fr 2fr 0.8fr 0.8fr 0.9fr',
              gap: 20,
              padding: '18px 0',
              borderBottom: i === samples.length - 1 ? 'none' : `1px solid ${STYX.line}`,
              alignItems: 'center',
              textDecoration: 'none',
              color: STYX.ink,
            }}
          >
            <span style={{minWidth: 0}}>
              <span
                style={{
                  display: 'block',
                  fontFamily: FONT.cinzel,
                  fontSize: 13,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {sample.karat}K {sample.style ?? 'chain'}
              </span>
              <span style={{...mono, fontSize: 11, color: STYX.silt2}}>{spec}</span>
            </span>
            <span style={mono}>
              {sample.weightGrams}g
              <span style={{display: 'block', fontSize: 10, color: STYX.silt2}}>
                {pureGrams.toFixed(2)}g pure
              </span>
            </span>
            <span aria-hidden="true" style={{display: 'block'}}>
              <span
                style={{
                  display: 'flex',
                  height: 8,
                  background: `${STYX.ink}14`,
                  overflow: 'hidden',
                }}
              >
                <span style={{width: `${Math.round(goldShare * 100)}%`, background: STYX.gold}} />
              </span>
              <span style={{...mono, fontSize: 10, color: STYX.silt2, display: 'block', marginTop: 6}}>
                {Math.round(goldShare * 100)}% gold · {100 - Math.round(goldShare * 100)}% craft
              </span>
            </span>
            <span style={{...mono, textAlign: 'right', color: STYX.goldDeep}}>{formatUSD(gold)}</span>
            <span style={{...mono, textAlign: 'right'}}>{formatUSD(craft)}</span>
            <span
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 20,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatUSD(sample.price)}
            </span>
          </Link>
        );
      })}

      <div
        style={{
          ...mono,
          fontSize: 10,
          color: STYX.silt2,
          paddingTop: 14,
          borderTop: `1px solid ${STYX.line}`,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span>Gold at {formatUSD(spotPerOz)}/oz, live. Weights as weighed in our vault.</span>
        <span>Every fare buys back at its gold value for five years.</span>
      </div>
    </div>
  );
}
