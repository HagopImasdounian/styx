import {createContext, useContext, useState, useEffect, useCallback, useRef} from 'react';

const STORAGE_KEY = 'styx-wishlist';

type WishlistContextValue = {
  handles: string[];
  add: (handle: string) => void;
  remove: (handle: string) => void;
  toggle: (handle: string) => void;
  clear: () => void;
  has: (handle: string) => boolean;
  count: number;
};

const WishlistContext = createContext<WishlistContextValue>({
  handles: [],
  add: () => {},
  remove: () => {},
  toggle: () => {},
  clear: () => {},
  has: () => false,
  count: 0,
});

export function WishlistProvider({children}: {children: React.ReactNode}) {
  const [handles, setHandles] = useState<string[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) setHandles(parsed);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(handles));
    } catch {}
  }, [handles]);

  const add = useCallback((handle: string) => {
    setHandles((prev) => (prev.includes(handle) ? prev : [...prev, handle]));
  }, []);

  const remove = useCallback((handle: string) => {
    setHandles((prev) => prev.filter((h) => h !== handle));
  }, []);

  const toggle = useCallback((handle: string) => {
    setHandles((prev) =>
      prev.includes(handle) ? prev.filter((h) => h !== handle) : [...prev, handle],
    );
  }, []);

  const clear = useCallback(() => setHandles([]), []);

  const has = useCallback((handle: string) => handles.includes(handle), [handles]);

  return (
    <WishlistContext.Provider
      value={{handles, add, remove, toggle, clear, has, count: handles.length}}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
