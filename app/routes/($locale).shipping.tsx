import {type MetaFunction} from 'react-router';
import {Link} from 'react-router';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel} from '~/components/styx';

export const meta: MetaFunction = () => {
  return [
    {title: 'Shipping & Returns — STYX'},
    {name: 'description', content: 'Free insured shipping on every order. 14-day return policy with inspection. Full details on delivery, tracking, returns, and exchanges at Styx Gold.'},
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
              Orders are processed within 1&ndash;3 business days. Credit card orders may be held for up to five (5) business days for payment verification and fraud review. Wire transfer orders ship after funds have fully cleared (typically 1&ndash;3 business days). You will receive a tracking number by email once your order ships.
            </p>
            <p style={{margin: '0 0 16px'}}>
              All shipments require a signature on delivery. If no one is available to sign, the carrier will leave a notice and attempt redelivery. Risk of loss transfers to you upon delivery confirmation or signature.
            </p>
            <p style={{margin: 0}}>
              International customers are solely responsible for any import duties, taxes, or customs fees assessed by their country. These charges are not included in the purchase price and are not refundable. Refused deliveries due to customs charges will be treated as a return (see Section III).
            </p>
          </PolicyBlock>
        </section>

        {/* Insurance */}
        <section style={{marginBottom: 80}}>
          <SectionHeading kicker="II" title="Insurance" />
          <PolicyBlock>
            <p style={{margin: 0}}>
              Every order is fully insured from our facility to your door. If your package is lost or damaged in transit, contact us within forty-eight (48) hours of the expected delivery date with your order number. We will open a claim with the carrier and, upon confirmation, ship a replacement or issue a full refund.
            </p>
          </PolicyBlock>
        </section>

        {/* Returns */}
        <section style={{marginBottom: 80}}>
          <SectionHeading kicker="III" title="Returns" />
          <PolicyBlock>
            <p style={{margin: '0 0 16px'}}>
              We accept returns within <strong>14 days</strong> of delivery, subject to all of the following conditions:
            </p>
            <ul style={{margin: '0 0 16px', paddingLeft: 20}}>
              <li style={{marginBottom: 8}}><strong>RMA required:</strong> You must contact us to obtain a Return Merchandise Authorization (RMA) number before sending anything back. Packages received without an RMA will be refused.</li>
              <li style={{marginBottom: 8}}>The item must be unworn, unaltered, and in its original condition.</li>
              <li style={{marginBottom: 8}}>All original packaging, documentation, and tags must be included.</li>
              <li style={{marginBottom: 8}}>Custom orders, personalized items, and items marked &ldquo;Final Sale&rdquo; are not eligible for return.</li>
            </ul>

            <p style={{margin: '0 0 16px', fontWeight: 500, color: STYX.ink}}>
              Inspection &amp; Verification
            </p>
            <p style={{margin: '0 0 16px'}}>
              All returned items are inspected, weighed, and purity-tested upon receipt. If an item shows signs of wear, alteration, or damage, or does not match its original shipped condition, the return will be denied and the item shipped back to you at your expense.
            </p>

            <p style={{margin: '0 0 16px', fontWeight: 500, color: STYX.ink}}>
              Restocking Fee
            </p>
            <p style={{margin: '0 0 16px'}}>
              All approved returns are subject to a <strong>restocking fee of 10%</strong> of the original purchase price. This fee covers inspection, handling, and processing costs associated with precious metals.
            </p>

            <p style={{margin: '0 0 16px', fontWeight: 500, color: STYX.ink}}>
              Market Loss Adjustment
            </p>
            <p style={{margin: '0 0 16px'}}>
              Gold is a commodity with a continuously fluctuating market price. If the spot price of gold has decreased between the date of your purchase and the date your return is received and inspected, a market loss adjustment will be deducted from your refund. This adjustment reflects the actual decline in the underlying gold value of the returned item. If the spot price has increased, no additional credit is owed.
            </p>

            <p style={{margin: '0 0 16px', fontWeight: 500, color: STYX.ink}}>
              Your Refund
            </p>
            <p style={{margin: '0 0 16px'}}>
              Refund = Original Purchase Price &minus; 10% Restocking Fee &minus; Market Loss Adjustment (if applicable). Refunds are processed within <strong>14&ndash;21 business days</strong> of receiving and inspecting the returned item. Credit card refunds appear on your statement within 1&ndash;2 billing cycles. Wire transfer refunds are issued to the originating bank account.
            </p>

            <p style={{margin: '0 0 16px', fontWeight: 500, color: STYX.ink}}>
              Return Shipping
            </p>
            <p style={{margin: 0}}>
              Return shipping is the buyer&rsquo;s responsibility. We strongly recommend insured, trackable shipping &mdash; USPS Registered Mail is required for items valued over $500. Styx Gold is not responsible for items lost, stolen, or damaged during return transit.
            </p>
          </PolicyBlock>
        </section>

        {/* Exchanges */}
        <section style={{marginBottom: 80}}>
          <SectionHeading kicker="IV" title="Exchanges" />
          <PolicyBlock>
            <p style={{margin: 0}}>
              Want a different length, karat, or style? Contact us within 14 days of delivery to request an exchange. An RMA number is required. If there is a price difference between the original and replacement item &mdash; including any change in gold spot price &mdash; we will charge or refund the difference. The original item must meet the same return conditions listed above. No restocking fee applies to even exchanges of equal value.
            </p>
          </PolicyBlock>
        </section>

        {/* Damaged / Defective */}
        <section style={{marginBottom: 80}}>
          <SectionHeading kicker="V" title="Damaged or Defective Items" />
          <PolicyBlock>
            <p style={{margin: '0 0 16px'}}>
              If your item arrives damaged or defective, contact us within <strong>48 hours</strong> of delivery with clear photographs showing the issue from multiple angles, including the packaging. We will review the evidence and, if warranted, arrange a prepaid return label for inspection.
            </p>
            <p style={{margin: 0}}>
              Upon confirming the defect at our facility, we will ship a replacement or issue a full refund &mdash; your choice. No restocking fee or market loss adjustment applies to verified manufacturing defects. We reserve the right to deny a claim if inspection determines the item was damaged after delivery or is not in the condition originally shipped.
            </p>
          </PolicyBlock>
        </section>

        {/* Final Sale */}
        <section>
          <SectionHeading kicker="VI" title="Final Sale Items" />
          <PolicyBlock>
            <p style={{margin: 0}}>
              Items designated as &ldquo;Final Sale&rdquo; at the time of purchase, including custom orders and personalized pieces, cannot be returned or exchanged. The only exception is a verified manufacturing defect, which will be assessed solely by Styx Gold upon inspection. If a defect is confirmed, we will repair or replace the item at our discretion.
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
