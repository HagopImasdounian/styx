import {type MetaFunction} from 'react-router';
import {Link} from 'react-router';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel} from '~/components/styx';

export const meta: MetaFunction = () => {
  return [
    {title: 'Privacy Policy — STYX'},
    {name: 'description', content: 'Privacy policy for Styx Gold. How we collect, use, and protect your personal information.'},
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

export default function Privacy() {
  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      {/* Header */}
      <div style={{borderBottom: `1px solid ${STYX.line}`}}>
        <div style={{maxWidth: 1440, margin: '0 auto', padding: '80px 56px 60px'}}>
          <StyxLabel>Legal &middot; Your Data</StyxLabel>
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
            Privacy
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
              policy.
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
            <SectionHeading number="1" title="Information We Collect" />
            <Paragraph>
              When you visit styxgold.com or make a purchase, we may collect the following information:
            </Paragraph>
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
              <li style={{marginBottom: 8}}><strong>Personal information:</strong> name, email address, shipping address, billing address, and phone number (provided at checkout).</li>
              <li style={{marginBottom: 8}}><strong>Payment information:</strong> credit card details are processed securely by our payment provider (Shopify Payments). We do not store your full card number.</li>
              <li style={{marginBottom: 8}}><strong>Identity verification data:</strong> government-issued photo ID (when requested for order verification), billing and shipping address confirmation, and phone verification records. See Section 3 for details.</li>
              <li style={{marginBottom: 8}}><strong>Browsing data:</strong> IP address, browser type, device information, pages visited, referring URL, and behavioral patterns, collected automatically through cookies and analytics tools.</li>
              <li style={{marginBottom: 8}}><strong>Device and fraud signals:</strong> device fingerprint, geolocation data, and transaction risk indicators collected by our payment processor and fraud screening tools to detect and prevent fraudulent activity.</li>
              <li style={{marginBottom: 8}}><strong>Communications:</strong> any emails, phone calls, or messages you send us through our contact form or customer service channels.</li>
            </ul>
          </section>

          <section>
            <SectionHeading number="2" title="How We Use Your Information" />
            <Paragraph>
              We use your information to:
            </Paragraph>
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
              <li style={{marginBottom: 8}}>Process and fulfill your orders, including shipping and payment.</li>
              <li style={{marginBottom: 8}}>Verify your identity and payment method to prevent fraud and protect against unauthorized transactions.</li>
              <li style={{marginBottom: 8}}>Screen orders for risk indicators including mismatched billing/shipping addresses, unusual order patterns, and known fraud signals.</li>
              <li style={{marginBottom: 8}}>Communicate with you about your order, respond to inquiries, and provide customer support.</li>
              <li style={{marginBottom: 8}}>Improve our website, products, and services based on browsing behavior and feedback.</li>
              <li style={{marginBottom: 8}}>Send marketing communications (only if you have opted in; you may unsubscribe at any time).</li>
              <li style={{marginBottom: 8}}>Comply with legal obligations, prevent fraud, enforce our terms, and cooperate with law enforcement when required.</li>
            </ul>
          </section>

          <section>
            <SectionHeading number="3" title="Identity Verification & Fraud Prevention" />
            <Paragraph>
              Due to the high-value nature of our products, we may request additional identity verification before shipping your order. This may include a government-issued photo ID, phone verification, or confirmation that your billing and shipping details match.
            </Paragraph>
            <Paragraph>
              <strong>How we handle your ID:</strong> If you submit a photo ID for verification, it is reviewed solely to confirm your identity against your order details. ID images are stored securely and retained for up to ninety (90) days after the order is fulfilled, after which they are permanently deleted. We do not use your ID for any purpose other than order verification and fraud prevention.
            </Paragraph>
            <Paragraph>
              We use automated fraud screening tools provided by our payment processor (Shopify Payments) that analyze transaction data, device information, and behavioral patterns to assign risk scores to orders. Orders flagged as high-risk may be held for manual review. These tools do not make autonomous decisions to deny orders &mdash; final decisions are made by our team.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="4" title="Cookies & Analytics" />
            <Paragraph>
              We use cookies and similar technologies to analyze site traffic, remember preferences, and improve your experience. This includes Google Analytics 4 and Google Tag Manager. You can disable cookies through your browser settings, though some site features may not function properly without them.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="5" title="Third-Party Services" />
            <Paragraph>
              We share your information only with third parties necessary to operate our business and protect against fraud:
            </Paragraph>
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
              <li style={{marginBottom: 8}}><strong>Shopify:</strong> our e-commerce platform, which processes orders, payments, and fraud screening.</li>
              <li style={{marginBottom: 8}}><strong>Payment processors:</strong> for credit card authorization, fraud detection, and chargeback management.</li>
              <li style={{marginBottom: 8}}><strong>Shipping carriers:</strong> to deliver your order (name and address only).</li>
              <li style={{marginBottom: 8}}><strong>Fraud prevention services:</strong> to verify identity, screen transactions, and share data with industry fraud prevention databases when fraudulent activity is detected or suspected.</li>
              <li style={{marginBottom: 8}}><strong>Analytics providers:</strong> Google Analytics, for aggregated site usage data.</li>
              <li style={{marginBottom: 8}}><strong>Email service:</strong> for transactional and marketing emails (if opted in).</li>
              <li style={{marginBottom: 8}}><strong>Law enforcement:</strong> we may disclose personal information to law enforcement agencies, regulators, or other authorities when required by law, subpoena, or court order, or when we believe in good faith that disclosure is necessary to prevent fraud, investigate criminal activity, or protect our rights.</li>
            </ul>
            <Paragraph>
              We do not sell, rent, or trade your personal information to third parties for their marketing purposes.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="6" title="Data Security" />
            <Paragraph>
              We use industry-standard security measures to protect your information, including SSL/TLS encryption for all data transmitted between your browser and our servers. Payment processing is handled by PCI-compliant providers. Identity documents submitted for verification are stored with encryption at rest and access-controlled to authorized personnel only. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="7" title="Data Retention" />
            <Paragraph>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy:
            </Paragraph>
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
              <li style={{marginBottom: 8}}><strong>Order records:</strong> retained for a minimum of 7 years for tax and legal compliance.</li>
              <li style={{marginBottom: 8}}><strong>Identity verification documents:</strong> retained for up to 90 days after order fulfillment, then permanently deleted.</li>
              <li style={{marginBottom: 8}}><strong>Fraud investigation records:</strong> retained for up to 5 years to support ongoing fraud prevention and any legal proceedings.</li>
              <li style={{marginBottom: 8}}><strong>Marketing preferences:</strong> retained until you unsubscribe or request deletion.</li>
              <li style={{marginBottom: 8}}><strong>Browsing and analytics data:</strong> retained per the default retention periods of our analytics providers (typically 14&ndash;26 months).</li>
            </ul>
          </section>

          <section>
            <SectionHeading number="8" title="Your Rights" />
            <Paragraph>
              Depending on your jurisdiction, you may have the right to:
            </Paragraph>
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
              <li style={{marginBottom: 8}}>Access the personal data we hold about you.</li>
              <li style={{marginBottom: 8}}>Request correction or deletion of your personal data.</li>
              <li style={{marginBottom: 8}}>Opt out of marketing communications at any time.</li>
              <li style={{marginBottom: 8}}>Request a copy of your data in a portable format.</li>
            </ul>
            <Paragraph>
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:hello@styxgold.com" style={{color: STYX.gold, textDecoration: 'none'}}>
                hello@styxgold.com
              </a>
              . We will respond within 30 days. Note that certain data (such as order records and fraud investigation records) may be retained even after a deletion request where required by law or necessary for legitimate business purposes.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="9" title="California Residents (CCPA)" />
            <Paragraph>
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect and the right to request deletion. We do not sell personal information as defined by the CCPA. We do not use or disclose sensitive personal information for purposes other than those permitted under the CCPA.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="10" title="Children's Privacy" />
            <Paragraph>
              Our Site is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a minor has provided us with personal information, we will delete it promptly.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="11" title="Changes to This Policy" />
            <Paragraph>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. Continued use of the Site after changes constitutes acceptance of the revised policy.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="12" title="Contact" />
            <Paragraph>
              Questions about this policy? Contact us at{' '}
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
