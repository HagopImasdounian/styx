import {useState} from 'react';
import {Link} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import {STYX, FONT} from './constants';
import {StyxLabel} from './StyxLabel';
import {CTAButton} from './CTAButton';
import {Obol} from './Obol';
import {PlaceholderImage} from './PlaceholderImage';

type LookbookProduct = {
  id: string;
  title: string;
  handle: string;
  variants: {
    nodes: Array<{
      id: string;
      image?: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
    }>;
  };
};

export function Lookbook({products = []}: {products?: LookbookProduct[]}) {
  return (
    <section
      className="styx-lookbook"
      style={{
        background: STYX.taupe,
        color: STYX.bone,
        padding: '140px 0 140px',
        position: 'relative',
      }}
    >
      {/* Radial overlays */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 60% 40% at 20% 20%, rgba(255,250,238,0.12), transparent 60%),
            radial-gradient(ellipse 50% 50% at 85% 80%, rgba(0,0,0,0.2), transparent 60%)
          `,
        }}
      />

      <div
        style={{
          padding: '0 56px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 72,
          position: 'relative',
        }}
      >
        <div>
          <StyxLabel>The Lookbook · IV</StyxLabel>
          <h2
            style={{
              fontFamily: FONT.cinzel,
              fontSize: 60,
              fontWeight: 500,
              letterSpacing: '0.02em',
              lineHeight: 1,
              margin: '16px 0 0',
              color: STYX.bone,
              textTransform: 'uppercase',
            }}
          >
            Worn, not
            <br />
            <span
              style={{
                fontFamily: FONT.cormorant,
                fontStyle: 'italic',
                fontWeight: 400,
                textTransform: 'none',
                letterSpacing: 0,
                color: STYX.gold,
              }}
            >
              displayed.
            </span>
          </h2>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
          <StyxLabel>Spring MMXXVI · shot in Brooklyn</StyxLabel>
          <Obol size={40} color={STYX.gold} speed={14} />
        </div>
      </div>

      {/* Grid — use real products if available, otherwise placeholders */}
      <div
        data-grid=""
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr 1.2fr',
          gridTemplateRows: 'minmax(220px, auto) minmax(220px, auto) minmax(220px, auto)',
          gap: 4,
          padding: '0 56px',
        }}
      >
        {/* Position 1 — tall left, rows 1-2 */}
        <div style={{gridRow: 'span 2', position: 'relative'}}>
          <LookCell product={products[0]} index={1} />
        </div>
        {/* Position 2 — col 2, row 1 */}
        <div style={{position: 'relative'}}>
          <LookCell product={products[1]} index={2} />
        </div>
        {/* Position 3 — col 3, rows 1-3 (full height right) */}
        <div style={{gridRow: 'span 3', position: 'relative'}}>
          <LookCell product={products[2]} index={3} />
        </div>
        {/* Position 4 — col 2, row 2 */}
        <div style={{position: 'relative'}}>
          <LookCell product={products[3]} index={4} />
        </div>
        {/* Position 5 — col 1, row 3 */}
        <div style={{position: 'relative'}}>
          <LookCell product={products[4]} index={5} />
        </div>
        {/* Position 6 — col 2, row 3 */}
        <div style={{position: 'relative'}}>
          <LookCell product={products[5]} index={6} />
        </div>
      </div>

      <div style={{padding: '56px 56px 0', display: 'flex', justifyContent: 'center'}}>
        <CTAButton variant="gold" href="/collections">
          Open the Lookbook
        </CTAButton>
      </div>
    </section>
  );
}

function LookCell({product, index}: {product?: LookbookProduct; index: number}) {
  const [hovered, setHovered] = useState(false);

  if (!product) {
    return (
      <div style={{width: '100%', height: '100%', position: 'relative'}}>
        <PlaceholderImage
          aspect="auto"
          label={`Look 0${index}`}
          tone="dark"
          style={{height: '100%', aspectRatio: 'unset'}}
        />
        <LookTag>Look 0{index}</LookTag>
      </div>
    );
  }

  const img1 = product.variants.nodes[0]?.image;
  const img2 = product.variants.nodes[1]?.image || product.variants.nodes[0]?.image;

  return (
    <Link
      to={`/products/${product.handle}`}
      prefetch="intent"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        textDecoration: 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {img1 ? (
        <>
          <Image
            data={img1}
            sizes="(min-width: 1200px) 40vw, 60vw"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              inset: 0,
              opacity: hovered && img2 && img2.url !== img1.url ? 0 : 1,
              transition: 'opacity 0.4s ease',
            }}
          />
          {img2 && img2.url !== img1.url && (
            <Image
              data={img2}
              sizes="(min-width: 1200px) 40vw, 60vw"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                inset: 0,
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
            />
          )}
        </>
      ) : (
        <PlaceholderImage
          aspect="auto"
          label={product.title}
          tone="dark"
          style={{height: '100%', aspectRatio: 'unset'}}
        />
      )}
      <LookTag>Look 0{index}</LookTag>
    </Link>
  );
}

function LookTag({children}: {children: React.ReactNode}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        fontFamily: FONT.cinzel,
        fontSize: 10,
        letterSpacing: '0.3em',
        color: STYX.ink,
        textTransform: 'uppercase',
        padding: '6px 10px',
        border: '1px solid rgba(26,24,21,0.3)',
        background: 'rgba(239,234,224,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 2,
      }}
    >
      {children}
    </div>
  );
}
