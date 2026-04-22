import type {AppLoadContext, EntryContext} from '@remix-run/node';
import {RemixServer} from '@remix-run/react';
import isbot from 'isbot';
import {renderToPipeableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';
import {PassThrough} from 'node:stream';

const ABORT_DELAY = 5000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  context: AppLoadContext,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    scriptSrc: [
      'self',
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:*'] : []),
    ],
  });

  const callbackName = isbot(request.headers.get('user-agent'))
    ? 'onAllReady'
    : 'onShellReady';

  return new Promise((resolve, reject) => {
    let shellRendered = false;

    const {pipe, abort} = renderToPipeableStream(
      <NonceProvider>
        <RemixServer context={remixContext} url={request.url} nonce={nonce} />
      </NonceProvider>,
      {
        nonce,
        [callbackName]() {
          shellRendered = true;
          const body = new PassThrough();

          responseHeaders.set('Content-Type', 'text/html');
          responseHeaders.set('Content-Security-Policy', header);

          resolve(
            new Response(body as unknown as ReadableStream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
