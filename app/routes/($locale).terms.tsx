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
              By accessing or placing an order on styxgold.com (the "Site"), you agree to be bound by these Terms and Conditions. If you do not agree, do not use the Site or make a purchase. We reserve the right to update these terms at any time. Continued use of the Site after changes constitutes acceptance.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="2" title="Products & Descriptions" />
            <Paragraph>
              We make every effort to display product colors, weights, and dimensions as accurately as possible. However, actual items may vary slightly from photographs due to lighting, screen settings, and the nature of handcrafted goods. All product weights are approximate and may vary by +/- 5% from the listed weight.
            </Paragraph>
            <Paragraph>
              Gold purity is stamped on each piece and meets or exceeds the stated karat. We test every piece multiple times before shipping to verify purity.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="3" title="Pricing & Payment" />
            <Paragraph>
              All prices are listed in US Dollars (USD). Prices are based on the current gold spot price and may change without notice. The price at the time of checkout is the price you pay.
            </Paragraph>
            <Paragraph>
              We accept major credit cards and wire transfers. Wire transfer orders receive a 4% discount. Payment must be received in full before an order ships. We reserve the right to cancel any order where payment cannot be verified.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="4" title="Orders & Cancellations" />
            <Paragraph>
              Placing an order constitutes an offer to purchase. We reserve the right to refuse or cancel any order for any reason, including pricing errors, suspected fraud, or inventory issues. If we cancel your order, you will receive a full refund.
            </Paragraph>
            <Paragraph>
              Orders may be cancelled within 1 hour of placement by contacting us. After that window, the order enters fulfillment and is subject to our return policy.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="5" title="Shipping & Delivery" />
            <Paragraph>
              We offer free insured shipping on all orders. Delivery times are estimates and not guarantees. Risk of loss transfers to the buyer upon delivery confirmation or signature. See our{' '}
              <Link to="/shipping" style={{color: STYX.gold, textDecoration: 'none'}}>
                Shipping & Returns
              </Link>{' '}
              page for full details.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="6" title="Returns & Refunds" />
            <Paragraph>
              Returns are accepted within 14 days of delivery. Items must be unworn and in original packaging. Custom orders are final sale. Return shipping is the buyer's responsibility. Refunds are processed within 5-7 business days of receiving the returned item. See our{' '}
              <Link to="/shipping" style={{color: STYX.gold, textDecoration: 'none'}}>
                Shipping & Returns
              </Link>{' '}
              page for full details.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="7" title="Intellectual Property" />
            <Paragraph>
              All content on this Site — including text, images, logos, product descriptions, journal articles, and design — is the property of Styx Gold and protected by applicable copyright and trademark laws. You may not reproduce, distribute, or create derivative works from any content without written permission.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="8" title="Limitation of Liability" />
            <Paragraph>
              Styx Gold is not liable for any indirect, incidental, or consequential damages arising from your use of the Site or purchase of products. Our total liability for any claim is limited to the amount you paid for the product in question.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="9" title="Governing Law" />
            <Paragraph>
              These terms are governed by the laws of the State of New York, United States. Any disputes shall be resolved in the courts located in New York County, New York.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="10" title="Contact" />
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
