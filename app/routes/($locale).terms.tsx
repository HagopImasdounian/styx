import {type LoaderFunctionArgs, type MetaArgs} from 'react-router';
import {Link} from 'react-router';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel} from '~/components/styx';
import {getStyxSeoMeta} from '~/lib/seo-meta';
import {validateLocale} from '~/lib/utils';

/** This route renders its own GoldTicker + StyxNav + StyxFooter. */
export const handle = {ownChrome: true};

export async function loader({request, params}: LoaderFunctionArgs) {
  validateLocale(params);
  return {url: request.url};
}

export const meta = ({data}: MetaArgs<typeof loader>) => {
  return getStyxSeoMeta({
    title: 'Terms & Conditions',
    titleTemplate: '%s | STYX Gold',
    description:
      'The terms and conditions for buying gold chains from STYX Gold, pricing, ordering, payment, and your rights. Read before purchasing.',
    url: data?.url,
  });
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
            Last updated: October 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth: 800, margin: '0 auto', padding: '80px 56px 120px'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 48}}>

          <section>
            <SectionHeading number="1" title="About These Terms" />
            <Paragraph>
              These Terms and Conditions (the &ldquo;Terms&rdquo;) apply when you visit styxgold.com (the &ldquo;Site&rdquo;) or buy from us. By using the Site or placing an order, you agree to these Terms. If you do not agree, please do not use the Site or place an order. In these Terms, &ldquo;Styx Gold&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; mean Styx Gold and, for orders delivered in the United States, our US affiliate. &ldquo;You&rdquo; means the person using the Site or placing the order.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="2" title="Who We Are" />
            <Paragraph>
              Styx Gold is based in Toronto, Ontario, Canada. We sell 10K and 14K gold chains and bracelets online. Orders delivered in Canada are sold and shipped by Styx Gold from Canada. Orders delivered in the United States are fulfilled and shipped from the United States by our US affiliate. You can reach us at{' '}
              <a href="mailto:hello@styxgold.com" style={{color: STYX.gold, textDecoration: 'none'}}>
                hello@styxgold.com
              </a>.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="3" title="Your Consumer Rights" />
            <Paragraph>
              Nothing in these Terms limits or excludes any right you have under the consumer protection laws of the province, territory or state where you live, including the Ontario <em>Consumer Protection Act, 2002</em> and similar laws elsewhere in Canada and the United States. If any part of these Terms conflicts with those laws, those laws apply and the conflicting part of these Terms does not apply to you to the extent of the conflict.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="4" title="Our Products" />
            <Paragraph>
              Our chains are machine-made in Italy. Most are solid gold; some are hollow. Every listing states the karat and whether the piece is solid or hollow. Gold purity is stamped on each piece and meets or exceeds the stated karat. We test every piece before shipping to verify purity.
            </Paragraph>
            <Paragraph>
              We work to show colours, weights and dimensions as accurately as we can, but items may look slightly different from photos because of lighting and screen settings. Listed weights are approximate and may vary by up to 5% either way.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="5" title="Gold Pricing" />
            <Paragraph>
              Gold is a commodity and its market value changes constantly. Our prices are tied to the live gold spot price and may change without notice. The price shown at checkout is the price you pay. If the gold price moves after you buy, up or down, the price of your order does not change, and the movement does not entitle you to a price adjustment, partial refund or cancellation.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="6" title="Prices, Currency & Taxes" />
            <Paragraph>
              Prices are shown in Canadian dollars (CAD) by default. If you choose another country on the Site, prices and checkout are shown in that country&rsquo;s currency, converted by Shopify at the current exchange rate. Your card issuer may charge its own conversion or foreign transaction fees.
            </Paragraph>
            <Paragraph>
              Applicable sales taxes, such as GST, HST, PST or QST in Canada, or state and local sales tax in the United States, are calculated and charged at checkout where required by law. The total shown at checkout, including taxes, is the amount you pay.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="7" title="Payment" />
            <Paragraph>
              <strong>Credit &amp; debit cards:</strong> We accept major credit and debit cards through Shopify Payments. All card payments are subject to authorization and fraud review. We may hold shipment for up to five (5) business days while payment is verified. Orders over $1,000 may need extra verification, such as identity confirmation (see Section 10).
            </Paragraph>
            <Paragraph>
              <strong>Wire transfers:</strong> Orders paid by wire transfer receive a 4% discount. Wire transfer orders ship once the funds have been received and fully cleared in our bank account, which usually takes one (1) to three (3) business days. Your price is locked at checkout, not when the funds clear. Payment must arrive within seven (7) calendar days of your order. If it does not, we may cancel the order. Because we commit to your price at checkout, if the gold spot price has fallen by the time the order is cancelled, we may charge a market loss fee equal to the actual decline, to the extent permitted by law.
            </Paragraph>
            <Paragraph>
              Payment must be received in full before any order ships. We may cancel any order where payment cannot be verified or where we reasonably suspect fraud. If we cancel, we refund anything you have paid.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="8" title="Orders & Cancellations" />
            <Paragraph>
              When you place an order, you are offering to buy the items at the price shown at checkout. Your order is accepted when we confirm it. We may refuse or cancel an order, for example because of a pricing or listing error, suspected fraud, failed verification, an address we do not ship to, or an item being unavailable. If we cancel your order, we will tell you and give you a full refund.
            </Paragraph>
            <Paragraph>
              <strong>Cancelling your order:</strong> You can ask to cancel within one (1) hour of placing your order by contacting us. After that, your order goes into processing and is handled under our return policy (Section 12), including the restocking fee and any market loss adjustment.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="9" title="Where We Ship" />
            <Paragraph>
              We ship to addresses in Canada and the United States only. We do not ship anywhere else. If an order has a shipping address outside Canada or the United States, we will cancel it and give you a full refund.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="10" title="Identity Verification & Fraud Prevention" />
            <Paragraph>
              Because our products are high-value and their price follows the gold market, we may take any of these steps before shipping an order:
            </Paragraph>
            <BulletList items={[
              'Ask for a copy of a valid government-issued photo ID (driver\'s licence, passport or equivalent).',
              'Check that the billing name and address match the cardholder on file.',
              'Require that the shipping address match the billing address, or ask for more verification if they differ.',
              'Call the phone number on file to confirm the order details.',
              'Hold or cancel orders that fail verification or show signs of fraud.',
            ]} />
            <Paragraph>
              If you do not respond to a verification request within forty-eight (48) hours, we will cancel the order and give you a full refund. We may share order and identity information with our payment processor, fraud screening services and law enforcement where needed to investigate suspected fraud, as described in our <Link to="/privacy" style={{color: STYX.gold, textDecoration: 'none'}}>Privacy Policy</Link>.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="11" title="Shipping & Delivery" />
            <Paragraph>
              Shipping is free on all orders. Every shipment is insured and tracked, and a signature is required on delivery. Delivery times are estimates, not guarantees. Ownership of and responsibility for the item pass to you on delivery, when the recipient or a person at the delivery address signs for it.
            </Paragraph>
            <Paragraph>
              See our{' '}
              <Link to="/shipping" style={{color: STYX.gold, textDecoration: 'none'}}>
                Shipping &amp; Returns
              </Link>{' '}
              page for transit times and insurance details.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="12" title="Returns, Restocking Fee & Market Loss" />
            <Paragraph>
              You can return an item within fourteen (14) days of delivery, subject to the conditions below and on our{' '}
              <Link to="/shipping" style={{color: STYX.gold, textDecoration: 'none'}}>
                Shipping &amp; Returns
              </Link>{' '}
              page. These conditions do not affect any return or cancellation rights you have by law (see Section 3).
            </Paragraph>
            <Paragraph>
              <strong>Return authorization required:</strong> Contact us for a Return Merchandise Authorization (RMA) number before sending anything back. Packages that arrive without an RMA number will be refused.
            </Paragraph>
            <Paragraph>
              <strong>Condition:</strong> Items must be unworn, unaltered and in their original condition, with all packaging, documentation and tags. We inspect, weigh and purity-test every return. If an item shows wear, alteration or damage, or does not match the condition it was shipped in, we will refuse the return and send the item back to you at your cost.
            </Paragraph>
            <Paragraph>
              <strong>Restocking fee:</strong> Approved returns are subject to a restocking fee of 10% of the original purchase price. This covers inspection, testing and handling.
            </Paragraph>
            <Paragraph>
              <strong>Market loss adjustment:</strong> If the gold spot price has fallen between your purchase date and the date we receive and inspect your return, we deduct the actual decline in the item&rsquo;s gold value from your refund. If the spot price has risen, no extra credit is owed.
            </Paragraph>
            <Paragraph>
              <strong>Your refund:</strong> Your refund is the original purchase price, minus the 10% restocking fee, minus any market loss adjustment. We process refunds within fourteen (14) to twenty-one (21) business days after we receive and inspect the item. Card refunds go back to the original card and usually show within one or two billing cycles. Wire transfer refunds go back to the bank account that sent the payment.
            </Paragraph>
            <Paragraph>
              <strong>Custom and final sale items:</strong> Custom orders, personalized items and anything marked &ldquo;Final Sale&rdquo; at purchase cannot be returned or exchanged, except for a defect (see Section 14).
            </Paragraph>
            <Paragraph>
              <strong>Return shipping:</strong> Return shipping is at your cost. Items valued over $500 must be sent insured and tracked, with signature required. We are not responsible for items lost, stolen or damaged on the way back to us, to the extent permitted by law.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="13" title="Exchanges" />
            <Paragraph>
              You can exchange an item within fourteen (14) days of delivery for a different length, karat or style, subject to availability. The original item must meet the return conditions in Section 12, and an RMA number is required. If the replacement costs more or less than the original, including because the gold spot price has changed, we will charge or refund the difference.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="14" title="Damaged or Defective Items" />
            <Paragraph>
              If your item arrives damaged or defective, contact us within forty-eight (48) hours of delivery with clear photos of the issue from several angles, including the packaging. We will review them and, where needed, send you a prepaid return label so we can inspect the item. If we confirm the defect, we will send a replacement or give you a full refund. No restocking fee or market loss adjustment applies to confirmed defects.
            </Paragraph>
            <Paragraph>
              We inspect and test every piece before it ships. We may decline a defect claim if inspection shows the item was damaged after delivery, was altered, or is not in the condition we shipped it in. This does not limit any warranty or other rights you have by law.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="15" title="Chargebacks & Payment Disputes" />
            <Paragraph>
              If something is wrong with your order, please contact us first. Most issues can be resolved quickly, and it is usually faster than a dispute with your bank. Nothing in these Terms limits any right you have by law, or under your card agreement, to dispute a charge or request a chargeback.
            </Paragraph>
            <Paragraph>
              If a chargeback or payment reversal is made in bad faith, for example on an order that was delivered as described, or a wire transfer is recalled after the order has shipped, we may, to the extent permitted by law:
            </Paragraph>
            <BulletList items={[
              'Suspend or cancel any pending or future orders linked to you.',
              'Contest the dispute with your bank or card issuer, using order, delivery and signature records.',
              'Recover the order amount and the costs we incurred because of the dispute, including chargeback fees charged by our payment processor.',
              'Report suspected fraud to fraud prevention services and, where warranted, to law enforcement.',
            ]} />
          </section>

          <section>
            <SectionHeading number="16" title="Intellectual Property" />
            <Paragraph>
              All content on the Site, including text, images, logos, product descriptions, journal articles and design, belongs to Styx Gold or its licensors and is protected by copyright and trademark laws. You may not copy, distribute or create derivative works from it without our written permission.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="17" title="Limitation of Liability" />
            <Paragraph>
              To the extent permitted by law, Styx Gold is not liable for any indirect, incidental, special or consequential damages arising from your use of the Site or your purchase. To the extent permitted by law, our total liability for any claim relating to an order is limited to the amount you paid for that order. We are not responsible for delays caused by shipping carriers, payment processors, customs authorities or other third parties outside our reasonable control. None of this limits any liability that cannot be limited by law, or your rights under Section 3.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="18" title="Indemnification" />
            <Paragraph>
              To the extent permitted by law, you agree to indemnify Styx Gold, its owners, employees and agents against claims, losses and reasonable costs (including legal fees) arising from your breach of these Terms or from fraudulent or unauthorized use of a payment method or account by you.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="19" title="Governing Law & Disputes" />
            <Paragraph>
              These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada that apply there. Subject to your rights under Section 3, any dispute will be heard by the courts of Ontario sitting in Toronto. If you live outside Ontario, you may also have the right to bring a claim in the courts, or under the consumer protection laws, of the place where you live. If you have a concern, please contact us first so we can try to resolve it.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="20" title="Changes to These Terms" />
            <Paragraph>
              We may update these Terms from time to time. Changes take effect when posted on this page, and the &ldquo;Last updated&rdquo; date above will change. The Terms in place when you place an order apply to that order.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="21" title="Severability & Entire Agreement" />
            <Paragraph>
              If any part of these Terms is found invalid or unenforceable, that part will be limited or removed only as much as needed, and the rest of these Terms will stay in effect. These Terms, together with our{' '}
              <Link to="/privacy" style={{color: STYX.gold, textDecoration: 'none'}}>
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link to="/shipping" style={{color: STYX.gold, textDecoration: 'none'}}>
                Shipping &amp; Returns
              </Link>{' '}
              page, are the entire agreement between you and us about your use of the Site and your purchases.
            </Paragraph>
          </section>

          <section>
            <SectionHeading number="22" title="Contact" />
            <Paragraph>
              Questions about these Terms? Email us at{' '}
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
