import {data, type LoaderFunctionArgs, type MetaArgs} from 'react-router';
import {Link} from 'react-router';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel, Obol} from '~/components/styx';
import {computeGoldPrice, formatUSD} from '~/lib/gold';
import {getStyxSeoMeta} from '~/lib/seo-meta';
import {validateLocale} from '~/lib/utils';
import {CACHE_LONG, routeHeaders} from '~/data/cache';

export const headers = routeHeaders;

export async function loader({request, params}: LoaderFunctionArgs) {
  validateLocale(params);
  return data({url: request.url}, {headers: {'Cache-Control': CACHE_LONG}});
}

export const meta = ({data}: MetaArgs<typeof loader>) => {
  return getStyxSeoMeta({
    title: '5-Year Buyback Guarantee',
    titleTemplate: '%s | STYX Gold',
    description:
      'Every STYX chain carries a 5-year buyback guarantee. We buy back your gold at the prevailing market price, minus only the original labor. How it works, what you get back, and the terms.',
    url: data?.url,
  });
};

/* Gutter collapses to 16px at phone width, 56px on desktop. */
const GUTTER = 'clamp(16px, 4vw, 56px)';

/* Worked example. Static and illustrative: the spot price is a stated
   assumption, not a live quote. Labor uses the same default the PDP falls
   back to when a product has no custom.labor_cost metafield. */
const EXAMPLE = {spotPerOz: 3200, weight: 30, karat: 14, laborCost: 280};

const STEPS = [
  {
    num: 'I',
    title: 'Weigh and test',
    body: 'Send the piece back to us. On receipt we weigh it and test the karat, the same way we test every chain before it ships.',
  },
  {
    num: 'II',
    title: "Price at that day's gold",
    body: 'We take the gold content, by weight and purity, and value it at the prevailing market price. The number comes from the market, not from us.',
  },
  {
    num: 'III',
    title: 'Pay',
    body: 'We pay you the gold value, minus only the original labor. The craft was spent when the chain was made. The metal is still metal.',
  },
];

const TERMS = [
  'Five years from the date of purchase.',
  'The original piece, as it was sold by Styx.',
  'Weighed and tested on receipt. The buyback is priced on the gold content we confirm at that weighing.',
  // TODO(hagop): confirm which day sets the price (day of receipt, day of test, or day the request is opened).
  'Valued at the prevailing market price of gold on the day we price it.',
  'Minus only the original labor: the craft portion shown on your product page and receipt. Nothing else is deducted.',
  // TODO(hagop): confirm payout methods and whether wire is required above a threshold.
  'Paid by wire or to your original payment method.',
  // TODO(hagop): confirm who covers return shipping for a buyback and any carrier requirement (returns policy requires USPS Registered Mail over $500).
  'Ship it insured and trackable. Gold in transit should never be uninsured.',
];

const FAQ = [
  {
    q: 'What if the gold price has dropped since I bought?',
    a: "You receive that day's price, up or down. The buyback pays for the gold in the piece at the market, the same way we priced it the day you bought it. Gold moves. The guarantee is that the metal always has a buyer, and that buyer is us.",
  },
  {
    q: 'Does the buyback cover hollow chains?',
    a: 'Yes. Every piece we sell carries the guarantee. Solid and hollow chains are both real karat gold, and both are bought back on the grams of gold they contain. A hollow chain weighs less, so it holds less gold and returns less.',
  },
  {
    q: 'How is this different from a return?',
    a: 'A return happens within 14 days of delivery and refunds the purchase price under our return policy, with a restocking fee and a market adjustment where they apply. The buyback is for later: any time in the five years, we pay the value of the gold at that day’s price, minus the original labor.',
  },
  {
    q: 'What do I need to send?',
    // TODO(hagop): confirm what happens with a damaged, shortened, or altered piece.
    a: 'The original piece and your order number. We weigh and test what arrives and price the gold that is there. Start with the contact form, choose Buyback, and we will send instructions.',
  },
];

function SectionHeading({kicker, title}: {kicker: string; title: string}) {
  return (
    <div style={{marginBottom: 40}}>
      <StyxLabel>{kicker}</StyxLabel>
      <h2
        data-reveal=""
        style={{
          fontFamily: FONT.cinzel,
          fontSize: 'clamp(24px, 3vw, 32px)',
          fontWeight: 400,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: STYX.ink,
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  highlight = false,
  minus = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  minus?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 16,
        padding: '12px 0',
        borderBottom: '1px solid rgba(239,234,224,0.12)',
        color: highlight ? STYX.goldLight : 'rgba(239,234,224,0.75)',
      }}
    >
      <span style={{flex: 1, minWidth: 0}}>{label}</span>
      <span style={{whiteSpace: 'nowrap', fontWeight: highlight ? 600 : 400}}>
        {minus ? '− ' : ''}
        {value}
      </span>
    </div>
  );
}

export default function Buyback() {
  const ex = computeGoldPrice(EXAMPLE);
  const pureGrams = ex.weight * ex.purity;
  const payout = Math.max(0, ex.materialCost - ex.laborCost);

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      {/* Hero */}
      <section style={{borderBottom: `1px solid ${STYX.line}`}}>
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: `clamp(56px, 7vw, 100px) ${GUTTER} clamp(48px, 6vw, 80px)`,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
            gap: 'clamp(28px, 5vw, 80px)',
            alignItems: 'end',
          }}
        >
          <div>
            <StyxLabel>Service &middot; The Ferryman&rsquo;s Pact</StyxLabel>
            <h1
              data-reveal=""
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 'clamp(40px, 6vw, 72px)',
                fontWeight: 400,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                color: STYX.ink,
                lineHeight: 0.95,
                margin: '12px 0 0',
              }}
            >
              The
              <br />
              <span
                style={{
                  fontFamily: FONT.cormorant,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  textTransform: 'none',
                  letterSpacing: 0,
                  fontSize: '0.7em',
                }}
              >
                buyback.
              </span>
            </h1>
          </div>
          <div
            data-reveal=""
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontSize: 20,
              color: STYX.graphite,
              lineHeight: 1.7,
            }}
          >
            Every piece carries a 5-year buyback guarantee. If you ever wish to
            return to shore, we buy back your gold at the prevailing market
            price, minus only the original labor. The metal never loses its
            passage.
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{background: STYX.paper}}>
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: `clamp(56px, 7vw, 100px) ${GUTTER}`,
          }}
        >
          <SectionHeading kicker="I &middot; The Crossing Back" title="How It Works" />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: 2,
              background: STYX.line,
            }}
          >
            {STEPS.map((step) => (
              <div
                key={step.num}
                data-reveal=""
                style={{background: STYX.bone, padding: 'clamp(28px, 3vw, 40px) clamp(20px, 2.5vw, 32px)'}}
              >
                <div
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 20,
                    color: STYX.gold,
                    marginBottom: 16,
                  }}
                >
                  {step.num}
                </div>
                <h3
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: STYX.ink,
                    margin: '0 0 12px',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: FONT.cormorant,
                    fontSize: 17,
                    fontStyle: 'italic',
                    lineHeight: 1.6,
                    color: STYX.graphite,
                    margin: 0,
                  }}
                >
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get back */}
      <section>
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: `clamp(56px, 7vw, 100px) ${GUTTER}`,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
            gap: 'clamp(32px, 5vw, 80px)',
            alignItems: 'start',
          }}
        >
          <div>
            <SectionHeading kicker="II &middot; The Math" title="What You Get Back" />
            <div
              style={{
                fontFamily: FONT.inter,
                fontSize: 16,
                lineHeight: 1.8,
                color: STYX.graphite,
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                maxWidth: 560,
              }}
            >
              <p data-reveal="" style={{margin: 0}}>
                Every product page shows the price in two parts: the gold, and
                the craft. The gold is the weight of pure metal in the chain
                at the live market price. The craft is the casting, finishing,
                testing, shipping and our margin. That is the labor.
              </p>
              <p data-reveal="" style={{margin: 0}}>
                The buyback returns the first part. We weigh the piece, apply
                the karat purity, and value the pure gold at that day&rsquo;s
                price. Then we subtract only the original labor. What is left
                is yours.
              </p>
              <p data-reveal="" style={{margin: 0}}>
                The example uses an illustrative spot price. The real number
                will be whatever gold is trading at when we price your piece.
              </p>
            </div>
          </div>

          {/* Worked example receipt */}
          <div
            data-reveal=""
            style={{
              background: STYX.ink,
              color: STYX.bone,
              padding: 'clamp(24px, 3vw, 40px)',
              fontFamily: FONT.mono,
              fontSize: 13,
              lineHeight: 1.5,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                flexWrap: 'wrap',
                gap: 8,
                paddingBottom: 16,
                marginBottom: 8,
                borderBottom: '1px solid rgba(239,234,224,0.2)',
              }}
            >
              <span
                style={{
                  fontFamily: FONT.cinzel,
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: STYX.gold,
                }}
              >
                Worked example
              </span>
              <span style={{fontSize: 11, letterSpacing: '0.08em', color: 'rgba(239,234,224,0.45)'}}>
                Illustrative &middot; spot {formatUSD(ex.spotPerOz)}/oz
              </span>
            </div>

            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(239,234,224,0.45)',
                padding: '12px 0 4px',
              }}
            >
              The gold
            </div>
            <ReceiptRow label={`${ex.weight.toFixed(1)}g total weight`} value={`${ex.karat}K gold`} />
            <ReceiptRow
              label={`${pureGrams.toFixed(2)}g pure gold (${Math.round(ex.purity * 100)}%)`}
              value={`@ ${formatUSD(ex.goldPerGram)}/g`}
            />
            <ReceiptRow label="Worth today, by weight" value={formatUSD(ex.materialCost)} highlight />

            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(239,234,224,0.45)',
                padding: '20px 0 4px',
              }}
            >
              The labor
            </div>
            <ReceiptRow label="Original labor, as shown at purchase" value={formatUSD(ex.laborCost)} minus />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 16,
                padding: '20px 0 0',
                fontFamily: FONT.cinzel,
                fontSize: 13,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: STYX.goldLight,
              }}
            >
              <span>Buyback paid to you</span>
              <span style={{whiteSpace: 'nowrap', fontSize: 18}}>{formatUSD(payout)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* The terms */}
      <section style={{background: STYX.paper}}>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: `clamp(56px, 7vw, 100px) ${GUTTER}`,
          }}
        >
          <SectionHeading kicker="III &middot; In Plain Terms" title="The Terms" />
          <ol
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              borderTop: `1px solid ${STYX.line}`,
            }}
          >
            {TERMS.map((term, i) => (
              <li
                key={term}
                data-reveal=""
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr',
                  gap: 16,
                  padding: '18px 0',
                  borderBottom: `1px solid ${STYX.line}`,
                  fontFamily: FONT.inter,
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: STYX.graphite,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 14,
                    color: STYX.gold,
                    paddingTop: 2,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{term}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: `clamp(56px, 7vw, 100px) ${GUTTER}`,
          }}
        >
          <SectionHeading kicker="IV &middot; Asked Often" title="Questions" />
          <div style={{display: 'flex', flexDirection: 'column', gap: 36}}>
            {FAQ.map((item) => (
              <div key={item.q} data-reveal="">
                <h3
                  style={{
                    fontFamily: FONT.cinzel,
                    fontSize: 15,
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    color: STYX.ink,
                    margin: '0 0 10px',
                  }}
                >
                  {item.q}
                </h3>
                <p
                  style={{
                    fontFamily: FONT.inter,
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: STYX.graphite,
                    margin: 0,
                    maxWidth: 680,
                  }}
                >
                  {item.a}
                </p>
              </div>
            ))}
          </div>
          <p
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontSize: 17,
              color: STYX.silt,
              marginTop: 40,
            }}
          >
            For returns inside 14 days, see{' '}
            <Link to="/shipping" prefetch="intent" style={{color: STYX.ink}}>
              Shipping &amp; Returns
            </Link>
            .
          </p>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{background: STYX.taupe, color: STYX.bone}}>
        <div
          className="styx-about-cta"
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: `clamp(48px, 5vw, 80px) ${GUTTER}`,
            display: 'flex',
            alignItems: 'center',
            gap: 40,
          }}
        >
          <Obol size={64} color={STYX.goldLight} speed={6} />
          <div style={{flex: 1}}>
            <div
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 11,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: STYX.goldLight,
                marginBottom: 8,
              }}
            >
              Ready to return to shore?
            </div>
            <p
              data-reveal=""
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                fontSize: 22,
                lineHeight: 1.5,
                color: STYX.bone,
                margin: 0,
                maxWidth: 600,
              }}
            >
              Open a buyback through the contact form and we will send
              instructions. Or keep the chain and cross the other way.
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              flexShrink: 0,
              justifyContent: 'center',
            }}
          >
            <Link
              to="/contact?subject=Buyback"
              prefetch="intent"
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 12,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: STYX.taupeDeep,
                background: STYX.goldLight,
                textDecoration: 'none',
                padding: '18px 32px',
                border: `1px solid ${STYX.goldLight}`,
                transition: 'all 0.2s',
              }}
            >
              Start a Buyback
            </Link>
            <Link
              to="/collections"
              prefetch="intent"
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 12,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: STYX.bone,
                textDecoration: 'none',
                padding: '18px 32px',
                border: '1px solid rgba(239,234,224,0.3)',
                transition: 'all 0.2s',
              }}
            >
              The Collections
            </Link>
          </div>
        </div>
      </section>

      <StyxFooter />
    </div>
  );
}
