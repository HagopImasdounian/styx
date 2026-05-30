import {createContext, useContext, useState, useEffect, useCallback, useRef} from 'react';

const MAX_COMPARE = 4;
const STORAGE_KEY = 'styx-compare';

type CompareContextValue = {
  handles: string[];
  add: (handle: string) => void;
  remove: (handle: string) => void;
  clear: () => void;
  has: (handle: string) => boolean;
  isFull: boolean;
};

const CompareContext = createContext<CompareContextValue>({
  handles: [],
  add: () => {},
  remove: () => {},
  clear: () => {},
  has: () => false,
  isFull: false,
});

export function CompareProvider({children}: {children: React.ReactNode}) {
  const [handles, setHandles] = useState<string[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) setHandles(parsed.slice(0, MAX_COMPARE));
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
    setHandles((prev) => {
      if (prev.includes(handle) || prev.length >= MAX_COMPARE) return prev;
      return [...prev, handle];
    });
  }, []);

  const remove = useCallback((handle: string) => {
    setHandles((prev) => prev.filter((h) => h !== handle));
  }, []);

  const clear = useCallback(() => setHandles([]), []);

  const has = useCallback((handle: string) => handles.includes(handle), [handles]);

  return (
    <CompareContext.Provider value={{handles, add, remove, clear, has, isFull: handles.length >= MAX_COMPARE}}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
