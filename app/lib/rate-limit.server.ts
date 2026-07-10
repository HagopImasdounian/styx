/**
 * Best-effort per-IP rate limiting for abuse-prone endpoints (email senders).
 *
 * Uses the worker Cache API (available on Oxygen and mini-oxygen), so counts
 * are per-colo and not atomic — good enough to blunt spam/quota-burn abuse,
 * not a hard quota. Fails OPEN: any cache error allows the request.
 */

const CACHE_NAME = 'styx-rate-limit';

export type RateLimitOptions = {
  /** Max requests allowed per window. */
  limit?: number;
  /** Window length in seconds. Each hit slides the window forward. */
  windowSeconds?: number;
};

function clientIp(request: Request): string {
  return (
    request.headers.get('oxygen-buyer-ip') ??
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

/**
 * Returns true when the request is allowed, false when the caller should
 * respond 429. `key` namespaces the counter per endpoint.
 */
export async function rateLimitAllow(
  request: Request,
  key: string,
  {limit = 5, windowSeconds = 600}: RateLimitOptions = {},
): Promise<boolean> {
  try {
    const cache = await caches.open(CACHE_NAME);
    // Synthetic URL — the Cache API keys entries by request URL.
    const cacheKey = new Request(
      `https://rate-limit.invalid/${encodeURIComponent(
        key,
      )}/${encodeURIComponent(clientIp(request))}`,
    );

    const hit = await cache.match(cacheKey);
    const count = hit ? parseInt((await hit.text()) || '0', 10) : 0;

    if (count >= limit) return false;

    await cache.put(
      cacheKey,
      new Response(String(count + 1), {
        headers: {'Cache-Control': `max-age=${windowSeconds}`},
      }),
    );
    return true;
  } catch {
    return true;
  }
}
