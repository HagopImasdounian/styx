import type {AppLoadContext, EntryContext} from 'react-router';
import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  context: AppLoadContext,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    scriptSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://tagmanager.google.com',
      // Meta pixel (pre-added for future paid social)
      'https://connect.facebook.net',
      ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:*'] : []),
    ],
    imgSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://*.googletagmanager.com',
      // Google Ads / consent-mode conversion pings (ccm/collect)
      'https://www.google.com',
      // Meta pixel (pre-added for future paid social)
      'https://www.facebook.com',
      'data:',
    ],
    connectSrc: [
      "'self'",
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://*.googletagmanager.com',
      'https://cdn.shopify.com',
      // Google Ads / consent-mode conversion pings (ccm/collect)
      'https://www.google.com',
      // Meta pixel (pre-added for future paid social)
      'https://www.facebook.com',
      'https://connect.facebook.net',
    ],
    frameSrc: [
      "'self'",
      'https://www.googletagmanager.com',
      // Meta pixel (pre-added for future paid social)
      'https://www.facebook.com',
    ],
    styleSrc: [
      "'self'",
      'https://tagmanager.google.com',
      'https://fonts.googleapis.com',
      "'unsafe-inline'",
    ],
    fontSrc: [
      "'self'",
      'https://cdn.shopify.com',
      // Google Fonts woff2 files (the CSS comes from fonts.googleapis.com)
      'https://fonts.gstatic.com',
      'data:',
    ],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter context={routerContext} url={request.url} nonce={nonce} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        // eslint-disable-next-line no-console
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  // Security headers
  if (process.env.NODE_ENV === 'production') {
    responseHeaders.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
  }
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // No app code uses camera/microphone/geolocation (screen calibration is
  // CSS/manual — no getUserMedia), so deny all three.
  responseHeaders.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
