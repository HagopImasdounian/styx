import {type MetaFunction} from 'react-router';
import {Link} from 'react-router';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel} from '~/components/styx';

export const meta: MetaFunction = () => {
  return [
    {title: 'Terms & Conditions — STYX'},
    {name: 'description', content: 'Terms and conditions for Styx Gold. Read before purchasing.'},
  ];
};

function SectionHeading({number, title}: {number: string; title: string}) {
  return (
    <h2
      style={{
        fontFamily: FONT.cinzel,
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: STYX.ink,
        margin: '0 0 16px',
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
      }}
    >
      <span style={{color: STYX.gold, fontSize: 11, letterSpacing: '0.15em'}}>{number}</span>
      {title}
    </h2>
  );
}

function Paragraph({children}: {children: React.ReactNode}) {
  return (
    <p
      style={{
        fontFamily: FONT.inter,
        fontSize: 14,
        color: STYX.graphite,
        lineHeight: 1.8,
        margin: '0 0 16px',
        maxWidth: 680,
      }}
    >
      {children}
    </p>
  );
}

function BulletList({items}: {items: React.ReactNode[]}) {
  return (
    <ul
      style={{
        fontFamily: FONT.inter,
        fontSize: 14,
        color: STYX.graphite,
        lineHeight: 1.8,
        margin: '0 0 16px',
        paddingLeft: 20,
        maxWidth: 680,
      }}
    >
      {items.map((item, i) => (
        <li key={i} style={{marginBottom: 8}}>{item}</li>
      ))}
    </ul>
  );
}

export default function Terms() {
  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      {/* Header */}
      <div style={{borderBottom: `1px solid ${STYX.line}`}}>
        <div style={{maxWidth: 1440, margin: '0 auto', padding: '80px 56px 60px'}}>
          <StyxLabel>Legal &middot; Terms of Service</StyxLabel>
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
            Terms &<br />
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
              conditions.
            </span>
          </h1>
          <p
            style={{
              fontFamily: FONT.inter,
              fontSize: 13,
              color: STYX.silt,
              marginTop: 20,
            }}
          >
            Last updated: May 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth: 800, margin: '0 auto', padding: '80px 56px 120px'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 48}}>

          <section>
            <SectionHeading number="1" title="Agreement to Terms" />
            <Paragraph>
              By accessing or placing an order on styxgold.com (the &ldquo;Site&rdquo;), you agree to be bound by these Terms and Conditions. If you do not agree, do not use the Site or make a purchase. We reserve the right to update these terms at any time. Continued use of the Site after changes constitutes acceptance.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="2" title="Nature of Products" />
            <Paragraph>
              Styx Gold sells gold jewelry and accessories. Gold is a commodity whose market value fluctuates continuously. By placing an order, you acknowledge that the products you purchase contain precious metals subject to market volatility and that the price you pay reflects the gold spot price at the time of checkout. Price fluctuations after your purchase do not entitle you to a price adjustment, partial refund, or cancellation.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="3" title="Products & Descriptions" />
            <Paragraph>
              We make every effort to display product colors, weights, and dimensions as accurately as possible. However, actual items may vary slightly from photographs due to lighting, screen settings, and the nature of handcrafted goods. All product weights are approximate and may vary by +/- 5% from the listed weight.
            </Paragraph>
            <Paragraph>
              Gold purity is stamped on each piece and meets or exceeds the stated karat. We test every piece multiple times before shipping to verify purity.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="4" title="Pricing & Payment" />
            <Paragraph>
              All prices are listed in US Dollars (USD). Prices are based on the current gold spot price and may change without notice. The price at the time of checkout is the price you pay, regardless of subsequent market movements.
            </Paragraph>
            <Paragraph>
              <strong>Credit &amp; debit cards:</strong> We accept major credit and debit cards processed through Shopify Payments. All card transactions are subject to authorization and fraud screening. We reserve the right to hold shipment for up to five (5) business days while payment is verified and fraud review is completed. Orders over $1,000 may be subject to additional verification, including but not limited to identity confirmation (see Section 6).
            </Paragraph>
            <Paragraph>
              <strong>Wire transfers:</strong> Wire transfer orders receive a 4% discount. Orders paid by wire transfer will not ship until funds have been received and fully cleared in our bank account, which typically takes one (1) to three (3) business days. The price is locked at the time of checkout, not at the time funds clear.
            </Paragraph>
            <Paragraph>
              Payment must be received in full before any order ships. We reserve the right to cancel any order where payment cannot be verified or where fraud is suspected. Wire transfer payments must be received within seven (7) calendar days of order placement; failure to remit payment within this period constitutes cancellation and may be subject to a market loss fee if the spot price of gold has declined.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="5" title="Orders & Cancellations" />
            <Paragraph>
              Placing an order constitutes a binding offer to purchase at the agreed-upon price. We reserve the right to refuse or cancel any order for any reason, including pricing errors, suspected fraud, or inventory issues. If we cancel your order, you will receive a full refund.
            </Paragraph>
            <Paragraph>
              <strong>Customer-initiated cancellations:</strong> You may request cancellation within one (1) hour of placing your order by contacting us. After this window, your order enters processing and is subject to our return policy, including any applicable restocking fee and market loss adjustment.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="6" title="Identity Verification & Fraud Prevention" />
            <Paragraph>
              Due to the high value and commodity nature of our products, we reserve the right to take any of the following steps before shipping an order:
            </Paragraph>
            <BulletList items={[
              'Request a copy of a valid government-issued photo ID (driver\'s license, passport, or equivalent).',
              'Verify that the billing name and address match the cardholder on file.',
              'Require that the shipping address match the billing address, or request additional verification if they differ.',
              'Place a phone call to the number on file to verbally confirm the order details.',
              'Hold or cancel orders that fail verification or exhibit indicators of fraud.',
            ]} />
            <Paragraph>
              Failure or refusal to comply with a verification request within forty-eight (48) hours will result in order cancellation and a full refund. We may share order and identity information with our payment processor, fraud screening services, and law enforcement as necessary to investigate suspected fraud (see our <Link to="/privacy" style={{color: STYX.gold, textDecoration: 'none'}}>Privacy Policy</Link>).
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="7" title="Shipping & Delivery" />
            <Paragraph>
              We offer free insured shipping on all orders. All shipments require a signature upon delivery. Delivery times are estimates and not guarantees. Risk of loss and title transfer to the buyer upon delivery confirmation or signature by the recipient or any person at the delivery address.
            </Paragraph>
            <Paragraph>
              See our{' '}
              <Link to="/shipping" style={{color: STYX.gold, textDecoration: 'none'}}>
                Shipping &amp; Returns
              </Link>{' '}
              page for full details including transit times and insurance coverage.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="8" title="Returns, Restocking Fee & Market Loss" />
            <Paragraph>
              Returns are accepted within fourteen (14) days of delivery, subject to all conditions described below and on our{' '}
              <Link to="/shipping" style={{color: STYX.gold, textDecoration: 'none'}}>
                Shipping &amp; Returns
              </Link>{' '}
              page.
            </Paragraph>
            <Paragraph>
              <strong>Return Authorization Required:</strong> No returns will be accepted without a Return Merchandise Authorization (RMA) number. Contact us to initiate a return before shipping anything back. Packages received without an RMA will be refused.
            </Paragraph>
            <Paragraph>
              <strong>Condition requirements:</strong> Items must be unworn, unaltered, and in their original condition with all packaging, documentation, and tags included. All returned items will be inspected, weighed, and purity-tested upon receipt. If an item shows signs of wear, alteration, damage, or does not match its original shipped condition, the return will be refused and the item shipped back to you at your expense.
            </Paragraph>
            <Paragraph>
              <strong>Restocking fee:</strong> All approved returns are subject to a restocking fee of 10% of the original purchase price. This fee covers inspection, processing, and the costs associated with handling precious metals.
            </Paragraph>
            <Paragraph>
              <strong>Market loss adjustment:</strong> If the spot price of gold has decreased between the date of your original purchase and the date your return is received and inspected by Styx Gold, a market loss adjustment will be deducted from your refund. This adjustment reflects the actual decline in the underlying gold value of the item. If the spot price has increased, no additional credit is owed to you.
            </Paragraph>
            <Paragraph>
              <strong>Refund calculation:</strong> Your refund equals the original purchase price, minus the 10% restocking fee, minus any applicable market loss adjustment. Refunds are processed within fourteen (14) to twenty-one (21) business days of our receipt and successful inspection of the returned item. Credit card refunds appear on your statement within one to two billing cycles. Wire transfer refunds are issued to the originating bank account.
            </Paragraph>
            <Paragraph>
              <strong>Final sale items:</strong> Custom orders, personalized items, and any items marked as &ldquo;Final Sale&rdquo; at the time of purchase are not eligible for return or exchange. Final sale items will only be accepted back if they arrive with a manufacturing defect, which will be determined solely by Styx Gold upon inspection.
            </Paragraph>
            <Paragraph>
              <strong>Return shipping:</strong> Return shipping is the buyer&rsquo;s responsibility. We strongly recommend using insured, trackable shipping (USPS Registered Mail for items over $500). Styx Gold is not responsible for items lost, stolen, or damaged during return transit.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="9" title="Exchanges" />
            <Paragraph>
              We offer exchanges within fourteen (14) days of delivery for a different length, karat, or style, subject to availability. The original item must meet the same return conditions above. If there is a price difference between the original and replacement item (including any change in gold spot price), we will charge or refund the difference. An RMA number is required for all exchanges.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="10" title="Damaged or Defective Items" />
            <Paragraph>
              If your item arrives damaged or defective, contact us within forty-eight (48) hours of delivery with clear photographs showing the issue from multiple angles, including the packaging. We will review the evidence and, at our discretion, arrange a prepaid return label for inspection. Upon confirming the defect, we will ship a replacement or issue a full refund. No restocking fee or market loss adjustment applies to verified defective items.
            </Paragraph>
            <Paragraph>
              We inspect and test every piece before shipment. Styx Gold reserves the right to deny a defect claim if inspection determines the item was damaged after delivery, altered, or is not in the condition originally shipped.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="11" title="Chargebacks & Payment Disputes" />
            <Paragraph>
              If you have a concern about your order, we ask that you contact us directly so we can resolve it. Filing a chargeback or payment dispute with your bank or credit card company without first attempting to resolve the issue through our customer service constitutes a breach of these Terms.
            </Paragraph>
            <Paragraph>
              In the event of a chargeback or payment reversal, Styx Gold reserves the right to:
            </Paragraph>
            <BulletList items={[
              'Suspend or cancel any pending or future orders associated with your account.',
              'Pursue recovery of the full order amount, plus any fees, penalties, or costs incurred as a result of the dispute (including chargeback fees assessed by our payment processor).',
              'Report the matter to fraud prevention databases and, where warranted, to law enforcement.',
              'Engage a collections agency or pursue legal action to recover amounts owed.',
            ]} />
            <Paragraph>
              Retracted wire transfers, reversed ACH payments, or any attempt to reclaim funds after goods have been shipped or delivered is considered a breach of contract and will be treated accordingly.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="12" title="International Orders & Customs" />
            <Paragraph>
              International customers are solely responsible for all import duties, taxes, customs fees, and any other charges assessed by their country. These charges are not included in the purchase price and are not refundable by Styx Gold. Refused deliveries due to unexpected customs charges will be treated as a return and subject to the restocking fee and market loss adjustment described in Section 8, in addition to any return shipping costs.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="13" title="Intellectual Property" />
            <Paragraph>
              All content on this Site — including text, images, logos, product descriptions, journal articles, and design — is the property of Styx Gold and protected by applicable copyright and trademark laws. You may not reproduce, distribute, or create derivative works from any content without written permission.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="14" title="Limitation of Liability" />
            <Paragraph>
              Styx Gold is not liable for any indirect, incidental, or consequential damages arising from your use of the Site or purchase of products. Our total liability for any claim is limited to the amount you paid for the product in question. We are not liable for delays, losses, or damages caused by shipping carriers, payment processors, customs authorities, or other third parties.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="15" title="Indemnification" />
            <Paragraph>
              You agree to indemnify and hold harmless Styx Gold, its owners, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from your breach of these Terms, your use of the Site, or any fraudulent or unauthorized activity associated with your account or payment method.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="16" title="Governing Law & Disputes" />
            <Paragraph>
              These terms are governed by the laws of the State of New York, United States. Any disputes shall be resolved in the courts located in New York County, New York. You agree to submit to the personal jurisdiction of these courts and waive any objection to venue.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="17" title="Severability" />
            <Paragraph>
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="18" title="Contact" />
            <Paragraph>
              Questions about these terms? Contact us at{' '}
              <a href="mailto:hello@styxgold.com" style={{color: STYX.gold, textDecoration: 'none'}}>
                hello@styxgold.com
              </a>{' '}
              or visit our{' '}
              <Link to="/contact" style={{color: STYX.gold, textDecoration: 'none'}}>
                Contact
              </Link>{' '}
              page.
            </Paragraph>
          </section>
        </div>
      </div>

      <StyxFooter />
    </div>
  );
}
