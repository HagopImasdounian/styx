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

/** "The price, in full": narrative plus a live receipt for one real chain. */
export function HomePriceLedger({sample}: {sample: PriceSample | null}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const goldData = (rootData as any)?.goldData;
  const spotPerOz: number = goldData?.spotPerOz ?? 4700;

  return (
    <section
      id="how-we-price"
      className="styx-home-ledger"
      style={{background: STYX.bone, padding: '110px 56px', scrollMarginTop: 96}}
    >
      <div
        className="styx-home-ledger-grid"
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: sample ? '1fr 1fr' : '1fr',
          gap: 72,
          alignItems: 'center',
        }}
      >
        <div>
          <StyxLabel>The price, in full</StyxLabel>
          <HomeH2>
            Most jewelers hide the gold inside the price. We <Em>print</Em> it.
          </HomeH2>
          <HomeBody>
            Every chain breaks down into two numbers: the gold, at today&apos;s
            price, and the craft. Nothing else goes in.
          </HomeBody>
          <CTAButton variant="primary" href="/compare">
            Compare chains
          </CTAButton>
        </div>

        {sample && <Receipt sample={sample} spotPerOz={spotPerOz} />}
      </div>
    </section>
  );
}

function Receipt({sample, spotPerOz}: {sample: PriceSample; spotPerOz: number}) {
  const purity = KARAT_PURITY[sample.karat] ?? KARAT_PURITY[10];
  const pureGrams = sample.weightGrams * purity;
  const gold = pureGrams * (spotPerOz / TROY_OZ_GRAMS);
  const craft = Math.max(0, sample.price - gold);

  const spec = [
    `${sample.karat}K ${sample.style ?? 'chain'}`,
    sample.thickness,
    sample.length,
  ]
    .filter(Boolean)
    .join(' · ');

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    fontFamily: FONT.mono,
    fontSize: 13,
    letterSpacing: '0.02em',
    padding: '10px 0',
    borderBottom: '1px solid rgba(239,234,224,0.12)',
  };
  const dim: React.CSSProperties = {...rowStyle, color: 'rgba(239,234,224,0.55)'};

  return (
    <div
      data-reveal=""
      className="styx-home-receipt"
      style={{
        background: STYX.ink,
        color: STYX.bone,
        padding: '34px 36px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 60% 40% at 85% 10%, ${STYX.gold}1a, transparent)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{position: 'relative'}}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: STYX.gold,
            }}
          >
            One real chain
          </span>
          <Link
            to={`/products/${sample.handle}`}
            prefetch="intent"
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(239,234,224,0.6)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(239,234,224,0.3)',
              paddingBottom: 2,
              whiteSpace: 'nowrap',
            }}
          >
            See it
          </Link>
        </div>

        <div style={dim}>
          <span>{spec}</span>
          <span style={{textAlign: 'right'}}>
            {pureGrams.toFixed(2)}g pure ({Math.round(purity * 100)}%)
          </span>
        </div>
        <div style={rowStyle}>
          <span>The gold</span>
          <span style={{color: STYX.gold}}>{formatUSD(gold)}</span>
        </div>
        <div style={rowStyle}>
          <span>The craft</span>
          <span style={{color: STYX.gold}}>{formatUSD(craft)}</span>
        </div>
        <div style={dim}>
          <span>Buyback floor</span>
          <span style={{textAlign: 'right'}}>gold value, 5 yrs</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 16,
            marginTop: 22,
          }}
        >
          <span
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 11,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: STYX.gold,
            }}
          >
            The fare
          </span>
          <span
            style={{
              fontFamily: FONT.cormorant,
              fontSize: 44,
              lineHeight: 1,
              color: STYX.bone,
            }}
          >
            {formatUSD(sample.price)}
          </span>
        </div>

        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.06em',
            color: 'rgba(239,234,224,0.4)',
            marginTop: 18,
          }}
        >
          {sample.weightGrams.toFixed(2)}g total · gold at{' '}
          {formatUSD(spotPerOz)}/oz
        </div>
      </div>
    </div>
  );
}
