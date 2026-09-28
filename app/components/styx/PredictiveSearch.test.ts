import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {
  RECENT_SEARCHES_KEY,
  RECENT_SEARCHES_MAX,
  TRENDING_SEARCHES,
  clearRecentSearches,
  mergeRecentSearch,
  pushRecentSearch,
  readRecentSearches,
} from './PredictiveSearch';

/** Minimal in-memory Storage so the helpers run under the node test env. */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => Array.from(map.keys())[i] ?? null,
    removeItem: (k) => {
      map.delete(k);
    },
    setItem: (k, v) => {
      map.set(k, String(v));
    },
  };
}

describe('mergeRecentSearch', () => {
  it('puts the newest term first and dedupes case-insensitively', () => {
    const list = mergeRecentSearch(['rope', 'Cuban'], 'cuban');
    expect(list).toEqual(['cuban', 'rope']);
  });

  it('ignores blank terms and trims whitespace', () => {
    expect(mergeRecentSearch(['rope'], '   ')).toEqual(['rope']);
    expect(mergeRecentSearch([], '  6mm cuban ')).toEqual(['6mm cuban']);
  });

  it('caps the list at RECENT_SEARCHES_MAX', () => {
    let list: string[] = [];
    for (let i = 0; i < RECENT_SEARCHES_MAX + 3; i++) {
      list = mergeRecentSearch(list, `term ${i}`);
    }
    expect(list).toHaveLength(RECENT_SEARCHES_MAX);
    expect(list[0]).toBe(`term ${RECENT_SEARCHES_MAX + 2}`);
  });
});

describe('recent searches storage', () => {
  beforeEach(() => {
    (globalThis as any).window = {localStorage: memoryStorage()};
  });
  afterEach(() => {
    delete (globalThis as any).window;
  });

  it('round-trips through localStorage under the styx key', () => {
    pushRecentSearch('rope');
    pushRecentSearch('figaro');
    expect(readRecentSearches()).toEqual(['figaro', 'rope']);
    expect(
      JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY) as string),
    ).toEqual(['figaro', 'rope']);
  });

  it('clear all removes the key', () => {
    pushRecentSearch('rope');
    clearRecentSearches();
    expect(window.localStorage.getItem(RECENT_SEARCHES_KEY)).toBeNull();
    expect(readRecentSearches()).toEqual([]);
  });

  it('tolerates corrupt storage', () => {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, '{not json');
    expect(readRecentSearches()).toEqual([]);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([1, 'ok']));
    expect(readRecentSearches()).toEqual(['ok']);
  });

  it('returns empty without a window', () => {
    delete (globalThis as any).window;
    expect(readRecentSearches()).toEqual([]);
    expect(() => pushRecentSearch('rope')).not.toThrow();
  });
});

describe('TRENDING_SEARCHES', () => {
  it('maps every trending style to a real collection handle', () => {
    expect(TRENDING_SEARCHES.map((t) => t.handle)).toEqual([
      'cuban',
      'rope',
      'figaro',
      'franco',
      'curb',
      'box',
      'wheat',
      'paperclip',
      'herringbone',
      'singapore',
    ]);
  });
});
