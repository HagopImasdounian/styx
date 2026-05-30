import {useEffect} from 'react';
import {type LoaderFunctionArgs} from 'react-router';
import {useLoaderData} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import {STYX, FONT, GoldTicker, StyxNav, StyxFooter} from '~/components/styx';
import {useWishlist} from '~/context/WishlistContext';

export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const handles = (url.searchParams.get('products') || '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 50);

  if (handles.length === 0) return {products: []};

  const results = await Promise.all(
    handles.map((handle) =>
      context.storefront.query(WISHLIST_PRODUCT_QUERY, {
        variables: {
          handle,
          country: context.storefront.i18n.country,
          language: context.storefront.i18n.language,
        },
      }),
    ),
  );
  return {products: results.map((r) => r.product).filter(Boolean)};
}

export default function WishlistPage() {
  const {products} = useLoaderData<typeof loader>();
  const {handles, remove, clear} = useWishlist();

  // The heart writes handles to localStorage; this page needs product data by
  // handle from the loader (?products=). Show items in saved order.
  const byHandle = new Map(products.map((p: any) => [p.handle, p]));
  const items = handles.map((h) => byHandle.get(h)).filter(Boolean) as any[];

  // If we have saved handles whose data isn't loaded (e.g. a direct visit to
  // /wishlist with no query string), redirect once to the param URL so the
  // loader fetches them. Removing an item doesn't trigger this (its data is
  // already loaded), so removal stays instant with no reload.
  const missingCount = handles.filter((h) => !byHandle.has(h)).length;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (missingCount > 0) {
      window.location.replace(`/wishlist?products=${handles.join(',')}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingCount]);

  return (
    <div style={{background: STYX.bone, minHeight: '100vh'}}>
      <GoldTicker />
      <StyxNav />

      <div style={{maxWidth: 1200, margin: '0 auto', padding: '48px 24px 120px'}}>
        <div style={{textAlign: 'center', marginBottom: 40}}>
          <h1 style={{fontFamily: FONT.cinzel, fontSize: 28, fontWeight: 500, letterSpacing: '0.08em', color: STYX.ink, marginBottom: 8}}>
            Your Wishlist
          </h1>
          <p style={{fontFamily: FONT.mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: STYX.silt}}>
            {handles.length} piece{handles.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {handles.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px 0'}}>
            <p style={{fontFamily: FONT.cormorant, fontSize: 18, color: STYX.silt, margin: '0 auto 28px', maxWidth: 460}}>
              Tap the heart on any chain to save it here for later.
            </p>
            <Link
              to="/collections/chains"
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                background: STYX.ink,
                color: STYX.bone,
                fontFamily: FONT.cinzel,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Browse Our Chains
            </Link>
          </div>
        ) : (
          <>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 28}}>
              <button
                type="button"
                onClick={clear}
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: STYX.silt,
                  cursor: 'pointer',
                }}
              >
                Clear wishlist
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 24,
              }}
            >
              {items.map((p) => {
                const variant = p.variants?.nodes?.[0];
                const image = p.featuredImage || variant?.image;
                const price = variant?.price;
                return (
                  <div key={p.handle} style={{position: 'relative', border: `1px solid ${STYX.line}`, background: STYX.paper}}>
                    <button
                      type="button"
                      onClick={() => remove(p.handle)}
                      aria-label="Remove from wishlist"
                      title="Remove from wishlist"
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 2,
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        border: `1px solid ${STYX.gold}`,
                        background: 'rgba(245,242,234,0.9)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="16" height="15" viewBox="0 0 22 20" fill={STYX.gold} stroke={STYX.gold} strokeWidth="1.5">
                        <path d="M11 18.5C11 18.5 1.5 13 1.5 6.5C1.5 3.46 3.96 1 7 1C8.8 1 10.37 1.89 11 3.18C11.63 1.89 13.2 1 15 1C18.04 1 20.5 3.46 20.5 6.5C20.5 13 11 18.5 11 18.5Z" />
                      </svg>
                    </button>

                    <Link to={`/products/${p.handle}`} style={{textDecoration: 'none', display: 'block'}}>
                      <div style={{aspectRatio: '4/5', background: '#fff', overflow: 'hidden'}}>
                        {image && (
                          <Image data={image} aspectRatio="4/5" sizes="(min-width: 768px) 25vw, 50vw" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        )}
                      </div>
                      <div style={{padding: '14px 16px'}}>
                        <div style={{fontFamily: FONT.cinzel, fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', color: STYX.ink, textTransform: 'uppercase'}}>
                          {p.title}
                        </div>
                        {price && (
                          <div style={{fontFamily: FONT.mono, fontSize: 12, color: STYX.gold, marginTop: 6}}>
                            <Money data={price} />
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <StyxFooter />
    </div>
  );
}

const WISHLIST_PRODUCT_QUERY = `#graphql
  query WishlistProduct(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
      featuredImage { url altText width height }
      variants(first: 1) {
        nodes {
          image { url altText width height }
          price { amount currencyCode }
        }
      }
    }
  }
` as const;
