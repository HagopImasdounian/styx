import {type MetaFunction} from 'react-router';
import {Link} from 'react-router';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel} from '~/components/styx';

export const meta: MetaFunction = () => {
  return [
    {title: 'Shipping & Returns — STYX'},
    {name: 'description', content: 'Free insured shipping on every order. 14-day return policy. Full details on delivery, tracking, and exchanges at Styx Gold.'},
  ];
};

const SHIPPING_DETAILS = [
  {
    label: 'Domestic (US)',
    transit: '3\u20135 business days',
    cost: 'Free',
    carrier: 'Priority courier, signature required',
  },
  {
    label: 'Canada',
    transit: '5\u20137 business days',
    cost: 'Free',
    carrier: 'Insured international priority',
  },
  {
    label: 'International',
    transit: '7\u201314 business days',
    cost: 'Free',
    carrier: 'Insured international priority',
  },
];

function SectionHeading({kicker, title}: {kicker: string; title: string}) {
  return (
    <div style={{marginBottom: 32}}>
      <div
        style={{
          fontFamily: FONT.cinzel,
          fontSize: 11,
          letterSpacing: '0.15em',
          color: STYX.gold,
          marginBottom: 8,
        }}
      >
        {kicker}
      </div>
      <h2
        style={{
          fontFamily: FONT.cinzel,
          fontSize: 24,
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

function PolicyBlock({children}: {children: React.ReactNode}) {
  return (
    <div
      style={{
        fontFamily: FONT.inter,
        fontSize: 14,
        color: STYX.graphite,
        lineHeight: 1.8,
        maxWidth: 640,
      }}
    >
      {children}
    </div>
  );
}

export default function ShippingReturns() {
  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      {/* Header */}
      <div style={{borderBottom: `1px solid ${STYX.line}`}}>
        <div style={{maxWidth: 1440, margin: '0 auto', padding: '80px 56px 60px'}}>
          <StyxLabel>Service &middot; Delivery & Returns</StyxLabel>
          <h1
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 56,
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              color: STYX.ink,
              lineHeight: 0.95,
              margin: '12px 0 0',
            }}
          >
            Shipping &<br />
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
              returns.
            </span>
          </h1>
          <p
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontSize: 20,
              color: STYX.silt,
              lineHeight: 1.6,
              marginTop: 16,
              maxWidth: 480,
            }}
          >
            Every order ships free, fully insured, with signature confirmation.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth: 900, margin: '0 auto', padding: '80px 56px 120px'}}>

        {/* Shipping */}
        <section style={{marginBottom: 80}}>
          <SectionHeading kicker="I" title="Shipping" />

          {/* Table */}
          <div
            style={{
              border: `1px solid ${STYX.line}`,
              marginBottom: 32,
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1.5fr',
                padding: '14px 20px',
                background: STYX.parchment,
                borderBottom: `1px solid ${STYX.line}`,
                fontFamily: FONT.cinzel,
                fontSize: 9,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: STYX.silt,
              }}
            >
              <span>Destination</span>
              <span>Transit</span>
              <span>Cost</span>
              <span>Method</span>
            </div>
            {SHIPPING_DETAILS.map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1.5fr',
                  padding: '16px 20px',
                  borderBottom: i < SHIPPING_DETAILS.length - 1 ? `1px solid ${STYX.line}` : 'none',
                  fontFamily: FONT.inter,
                  fontSize: 14,
                  color: STYX.ink,
                }}
              >
                <span style={{fontWeight: 500}}>{row.label}</span>
                <span style={{color: STYX.graphite}}>{row.transit}</span>
                <span style={{color: STYX.gold, fontWeight: 500}}>{row.cost}</span>
                <span style={{color: STYX.graphite}}>{row.carrier}</span>
              </div>
            ))}
          </div>

          <PolicyBlock>
            <p style={{margin: '0 0 16px'}}>
              Orders are processed and shipped within 1&ndash;2 business days. You will receive a tracking number by email once your order ships.
            </p>
            <p style={{margin: '0 0 16px'}}>
              All shipments require a signature on delivery. If no one is available to sign, the carrier will leave a notice and attempt redelivery.
            </p>
            <p style={{margin: 0}}>
              International customers are responsible for any import duties, taxes, or customs fees assessed by their country. These charges are not included in the purchase price.
            </p>
          </PolicyBlock>
        </section>

        {/* Insurance */}
        <section style={{marginBottom: 80}}>
          <SectionHeading kicker="II" title="Insurance" />
          <PolicyBlock>
            <p style={{margin: 0}}>
              Every order is fully insured from our facility to your door. If your package is lost, stolen, or damaged in transit, we will replace the item or issue a full refund at no additional cost. File a claim by contacting us within 48 hours of the expected delivery date.
            </p>
          </PolicyBlock>
        </section>

        {/* Returns */}
        <section style={{marginBottom: 80}}>
          <SectionHeading kicker="III" title="Returns" />
          <PolicyBlock>
            <p style={{margin: '0 0 16px'}}>
              We accept returns within <strong>14 days</strong> of delivery. To be eligible:
            </p>
            <ul style={{margin: '0 0 16px', paddingLeft: 20}}>
              <li style={{marginBottom: 8}}>The item must be unworn and in its original condition.</li>
              <li style={{marginBottom: 8}}>All original packaging and documentation must be included.</li>
              <li style={{marginBottom: 8}}>Custom or personalized orders are final sale.</li>
            </ul>
            <p style={{margin: '0 0 16px'}}>
              Return shipping is the buyer's responsibility. We recommend using an insured, trackable shipping method. Styx Gold is not responsible for items lost during return transit.
            </p>
            <p style={{margin: 0}}>
              Refunds are processed within 5&ndash;7 business days of receiving the returned item. Credit card refunds appear on your statement within 1&ndash;2 billing cycles. Wire transfer refunds are issued to the originating bank account.
            </p>
          </PolicyBlock>
        </section>

        {/* Exchanges */}
        <section style={{marginBottom: 80}}>
          <SectionHeading kicker="IV" title="Exchanges" />
          <PolicyBlock>
            <p style={{margin: 0}}>
              Want a different length, karat, or color? Contact us within 14 days of delivery and we will arrange an exchange. If there is a price difference between the original and replacement item, we will charge or refund the difference. The original item must meet the same return conditions listed above.
            </p>
          </PolicyBlock>
        </section>

        {/* Damaged / Defective */}
        <section>
          <SectionHeading kicker="V" title="Damaged or Defective Items" />
          <PolicyBlock>
            <p style={{margin: 0}}>
              If your item arrives damaged or defective, contact us immediately with photos. We will arrange a prepaid return label and ship a replacement or issue a full refund — your choice. No questions asked.
            </p>
          </PolicyBlock>
        </section>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: 80,
            padding: '40px 0',
            borderTop: `1px solid ${STYX.line}`,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontSize: 20,
              color: STYX.silt,
              marginBottom: 20,
            }}
          >
            Questions about an order?
          </p>
          <Link
            to="/contact"
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 11,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: STYX.ink,
              textDecoration: 'none',
              borderBottom: `1px solid ${STYX.ink}`,
              paddingBottom: 4,
            }}
          >
            Contact Us
          </Link>
        </div>
      </div>

      <StyxFooter />
    </div>
  );
}
