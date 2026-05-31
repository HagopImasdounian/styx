import {createContext, useContext, useState, useEffect, useCallback, useRef} from 'react';

const MAX_COMPARE = 4;
const STORAGE_KEY = 'styx-compare';

/**
 * A compare entry is a product plus the price-affecting variant option (length).
 * Colour does not change price, so it is intentionally NOT part of the key —
 * comparing a 16" and an 18" of the same chain yields two entries, but toggling
 * colour on the same length does not.
 */
export type CompareItem = {handle: string; length: string | null};

export function compareKey(handle: string, length?: string | null): string {
  return length ? `${handle}::${length}` : handle;
}

/** Serialise items for the ?products= URL param. */
export function encodeCompareItems(items: CompareItem[]): string {
  return items
    .map((it) => (it.length ? `${it.handle}~${encodeURIComponent(it.length)}` : it.handle))
    .join(',');
}

/** Parse the ?products= URL param back into items (handle + optional length). */
export function parseCompareItems(param: string): CompareItem[] {
  return param
    .split(',')
    .map((tok) => tok.trim())
    .filter(Boolean)
    .map((tok) => {
      const sep = tok.indexOf('~');
      if (sep === -1) return {handle: tok, length: null};
      return {handle: tok.slice(0, sep), length: decodeURIComponent(tok.slice(sep + 1))};
    })
    .slice(0, MAX_COMPARE);
}

type CompareContextValue = {
  items: CompareItem[];
  add: (handle: string, length?: string | null) => void;
  remove: (handle: string, length?: string | null) => void;
  clear: () => void;
  has: (handle: string, length?: string | null) => boolean;
  isFull: boolean;
};

const CompareContext = createContext<CompareContextValue>({
  items: [],
  add: () => {},
  remove: () => {},
  clear: () => {},
  has: () => false,
  isFull: false,
});

export function CompareProvider({children}: {children: React.ReactNode}) {
  const [items, setItems] = useState<CompareItem[]>([]);

  // Hydrate from localStorage on mount. Supports the legacy string[] format.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const migrated = parsed
            .map((entry: any): CompareItem | null => {
              if (typeof entry === 'string') return {handle: entry, length: null};
              if (entry && typeof entry === 'object' && typeof entry.handle === 'string') {
                return {handle: entry.handle, length: entry.length ?? null};
              }
              return null;
            })
            .filter((x): x is CompareItem => x !== null);
          setItems(migrated.slice(0, MAX_COMPARE));
        }
      }
    } catch {}
  }, []);

  // Persist to localStorage on change. Skip the first run so the initial empty
  // state doesn't clobber stored data before hydration completes.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const add = useCallback((handle: string, length: string | null = null) => {
    setItems((prev) => {
      const key = compareKey(handle, length);
      if (prev.some((it) => compareKey(it.handle, it.length) === key) || prev.length >= MAX_COMPARE) {
        return prev;
      }
      return [...prev, {handle, length}];
    });
  }, []);

  const remove = useCallback((handle: string, length: string | null = null) => {
    const key = compareKey(handle, length);
    setItems((prev) => prev.filter((it) => compareKey(it.handle, it.length) !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const has = useCallback(
    (handle: string, length: string | null = null) => {
      const key = compareKey(handle, length);
      return items.some((it) => compareKey(it.handle, it.length) === key);
    },
    [items],
  );

  return (
    <CompareContext.Provider value={{items, add, remove, clear, has, isFull: items.length >= MAX_COMPARE}}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
