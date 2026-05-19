import {useState} from 'react';
import {type MetaFunction} from 'react-router';
import {Link} from 'react-router';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter, StyxLabel} from '~/components/styx';

export const meta: MetaFunction = () => {
  return [
    {title: 'FAQ — STYX'},
    {name: 'description', content: 'Frequently asked questions about Styx Gold chains — pricing, shipping, returns, gold purity, and care.'},
  ];
};

const FAQ_SECTIONS = [
  {
    heading: 'Gold & Pricing',
    items: [
      {
        q: 'How is your pricing calculated?',
        a: 'Every chain is priced from the live gold spot price. We show a full breakdown on each product page: the weight of pure gold in the piece, its current market value, and our markup. No mystery pricing.',
      },
      {
        q: 'What is the difference between 10K, 14K, and 18K gold?',
        a: '10K is 41.7% pure gold — the hardest wearing and most affordable. 14K is 58.5% pure — the sweet spot of durability and color. 18K is 75% pure — richer color, softer metal. All three are real, solid gold alloys.',
      },
      {
        q: 'What is the wire transfer discount?',
        a: 'We offer a 4% discount when you pay by wire transfer instead of credit card. This reflects the processing fees we save. The wire price is shown on every product page alongside the card price.',
      },
      {
        q: 'Do your prices change?',
        a: 'Yes. Our prices track the gold market and update multiple times throughout the day. The price you see at checkout is the price you pay.',
      },
      {
        q: 'Is your gold plated or filled?',
        a: 'No. Every piece is solid karat gold — cast or machine-made from real gold alloy. No plating, no gold-fill, no vermeil.',
      },
    ],
  },
  {
    heading: 'Solid vs. Hollow',
    items: [
      {
        q: 'What is the difference between solid and hollow chains?',
        a: 'Solid chains are made from a continuous piece of gold alloy — they are denser, heavier, and more durable. Hollow chains use a tube construction to achieve a larger look at a fraction of the weight and cost. Both are real karat gold.',
      },
      {
        q: 'Which should I choose?',
        a: 'Solid if you want an investment piece that holds up to daily wear. Hollow if you want a bigger look at a lower price point, and you are careful with your jewelry. We carry both.',
      },
      {
        q: 'Can hollow chains be repaired?',
        a: 'Hollow chains can be soldered, but repairs are more delicate than with solid chains. A skilled jeweler can fix most breaks, but the repair may be visible. Solid chains are easier to repair seamlessly.',
      },
    ],
  },
  {
    heading: 'Shipping & Delivery',
    items: [
      {
        q: 'How much does shipping cost?',
        a: 'Shipping is free on all orders. Every package is fully insured and ships via priority courier with signature required on delivery.',
      },
      {
        q: 'How long does delivery take?',
        a: 'Orders ship within 1\u20132 business days. Domestic delivery is typically 3\u20135 business days. International orders may take 7\u201314 business days depending on destination and customs.',
      },
      {
        q: 'Is my shipment insured?',
        a: 'Yes. Every order is fully insured from our door to yours. If anything happens in transit, we replace it at no cost.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Yes. We ship worldwide. International customers are responsible for any local import duties or taxes assessed by their country.',
      },
    ],
  },
  {
    heading: 'Returns & Exchanges',
    items: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 14 days of delivery. The piece must be unworn, in its original packaging, and in the same condition it was received. Return shipping is the buyer\u2019s responsibility.',
      },
      {
        q: 'Can I exchange for a different length or karat?',
        a: 'Yes. Contact us within 14 days and we will arrange an exchange. If there is a price difference, we will charge or refund the difference.',
      },
      {
        q: 'Do you offer refunds on wire transfer orders?',
        a: 'Yes. Wire transfer refunds are issued to the originating bank account within 5\u201310 business days of receiving the returned item.',
      },
    ],
  },
  {
    heading: 'Care & Maintenance',
    items: [
      {
        q: 'How do I clean my gold chain?',
        a: 'Warm water, a drop of mild dish soap, and a soft cloth. Soak for 10 minutes, gently wipe, rinse, and pat dry. Avoid abrasive cleaners and ultrasonic machines on hollow chains.',
      },
      {
        q: 'Can I shower or swim with my chain?',
        a: 'Solid gold will not tarnish in water. However, chlorine and salt water can weaken solder joints over time. We recommend removing your chain before swimming. Showering is generally fine for solid chains.',
      },
      {
        q: 'Will my chain tarnish?',
        a: 'Pure gold does not tarnish. 10K and 14K alloys may develop a very slight patina over years of wear, which is easily cleaned. This is normal and does not indicate damage.',
      },
    ],
  },
];

function AccordionItem({q, a}: {q: string; a: string}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: `1px solid ${STYX.line}`,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '22px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 24,
        }}
      >
        <span
          style={{
            fontFamily: FONT.inter,
            fontSize: 15,
            color: STYX.ink,
            lineHeight: 1.5,
          }}
        >
          {q}
        </span>
        <span
          style={{
            fontFamily: FONT.cinzel,
            fontSize: 14,
            color: STYX.silt,
            flexShrink: 0,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(45deg)' : 'none',
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: '0 0 24px',
            fontFamily: FONT.inter,
            fontSize: 14,
            color: STYX.graphite,
            lineHeight: 1.7,
            maxWidth: 640,
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      {/* Header */}
      <div style={{borderBottom: `1px solid ${STYX.line}`}}>
        <div style={{maxWidth: 1440, margin: '0 auto', padding: '80px 56px 60px'}}>
          <StyxLabel>Service &middot; Questions Answered</StyxLabel>
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
            FAQ
          </h1>
          <p
            style={{
              fontFamily: FONT.cormorant,
              fontStyle: 'italic',
              fontSize: 20,
              color: STYX.silt,
              lineHeight: 1.6,
              marginTop: 16,
              maxWidth: 520,
            }}
          >
            Everything you need to know before you buy.
            If your question isn't here,{' '}
            <Link
              to="/contact"
              style={{color: STYX.gold, textDecoration: 'none'}}
            >
              reach out
            </Link>
            .
          </p>
        </div>
      </div>

      {/* FAQ Sections */}
      <div style={{maxWidth: 800, margin: '0 auto', padding: '80px 56px 120px'}}>
        {FAQ_SECTIONS.map((section, si) => (
          <div key={section.heading} style={{marginBottom: si < FAQ_SECTIONS.length - 1 ? 64 : 0}}>
            <h2
              style={{
                fontFamily: FONT.cinzel,
                fontSize: 12,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: STYX.gold,
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: `1px solid ${STYX.line}`,
              }}
            >
              {section.heading}
            </h2>
            {section.items.map((item) => (
              <AccordionItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        ))}

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
            Still have questions?
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
