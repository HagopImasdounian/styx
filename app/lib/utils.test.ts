import {describe, expect, it} from 'vitest';

import {
  getExcerpt,
  getLocaleFromRequest,
  isLocalPath,
  missingClass,
  statusMessage,
  validateLocale,
} from '~/lib/utils';

describe('validateLocale', () => {
  it('is a no-op when no locale param is present (default market)', () => {
    expect(() => validateLocale({})).not.toThrow();
    expect(() => validateLocale({locale: undefined})).not.toThrow();
  });

  it('throws a 404 Response for a bogus locale prefix', () => {
    let thrown: unknown;
    try {
      validateLocale({locale: 'xx-yy'});
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response).status).toBe(404);
  });

  it('rejects en-ca while only the default (unprefixed en-us) market is active', () => {
    // countries.ts currently contains only the `default` key; any /locale/
    // prefix, even a real-looking one, must 404 to avoid duplicate content.
    expect(() => validateLocale({locale: 'en-ca'})).toThrow();
    expect(() => validateLocale({locale: 'EN-CA'})).toThrow();
  });
});

describe('isLocalPath', () => {
  it('returns true for relative paths', () => {
    expect(isLocalPath('/products/cuban-link')).toBe(true);
    expect(isLocalPath('collections/all')).toBe(true);
  });

  it('returns false for fully-qualified cross-domain URLs', () => {
    expect(isLocalPath('https://evil.example.com/phish')).toBe(false);
    expect(isLocalPath('http://styxgold.com/products/x')).toBe(false);
  });
});

describe('missingClass', () => {
  it('is true when no class string is provided', () => {
    expect(missingClass(undefined, 'bg-')).toBe(true);
    expect(missingClass('', 'bg-')).toBe(true);
  });

  it('is false when the prefix is present', () => {
    expect(missingClass('bg-red-500 text-white', 'bg-')).toBe(false);
  });

  it('is true when the prefix is absent', () => {
    expect(missingClass('text-white font-bold', 'bg-')).toBe(true);
  });
});

describe('getExcerpt', () => {
  it('returns the first paragraph of an HTML string', () => {
    expect(getExcerpt('<p>First paragraph.</p>\nTrailing text')).toBe(
      '<p>First paragraph.</p>',
    );
  });

  it('returns the input unchanged when no <p> tag exists', () => {
    expect(getExcerpt('Just plain text')).toBe('Just plain text');
  });
});

describe('statusMessage', () => {
  it('maps fulfillment statuses to display labels', () => {
    expect(statusMessage('SUCCESS')).toBe('Success');
    expect(statusMessage('PENDING')).toBe('Pending');
    expect(statusMessage('CANCELLED')).toBe('Cancelled');
  });
});

describe('getLocaleFromRequest', () => {
  const req = (headers: Record<string, string> = {}) =>
    new Request('https://styxgold.com/products/x', {headers});

  it('defaults to Canada / CAD', () => {
    const l = getLocaleFromRequest(req());
    expect(l.country).toBe('CA');
    expect(l.currency).toBe('CAD');
    expect(l.pathPrefix).toBe('');
  });

  it('uses the visitor geo country when no choice was made', () => {
    expect(getLocaleFromRequest(req({'oxygen-buyer-country': 'US'})).country).toBe('US');
    expect(getLocaleFromRequest(req({'oxygen-buyer-country': 'DE'})).country).toBe('DE');
  });

  it('prefers the switcher cookie over geo', () => {
    const l = getLocaleFromRequest(
      req({cookie: 'a=1; styx_country=ca; b=2', 'oxygen-buyer-country': 'US'}),
    );
    expect(l.country).toBe('CA');
  });

  it('ignores malformed values', () => {
    expect(getLocaleFromRequest(req({cookie: 'styx_country=USA'})).country).toBe('CA');
    expect(getLocaleFromRequest(req({'oxygen-buyer-country': '<x>'})).country).toBe('CA');
  });
});
