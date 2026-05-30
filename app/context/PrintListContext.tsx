import {createContext, useContext, useState, useEffect, useCallback} from 'react';

const MAX_PRINT = 8;
const STORAGE_KEY = 'styx-print-list';

type PrintListContextValue = {
  handles: string[];
  add: (handle: string) => void;
  remove: (handle: string) => void;
  clear: () => void;
  has: (handle: string) => boolean;
  isFull: boolean;
  /** Move an item left (-1) or right (+1) in the print order. Persisted. */
  move: (handle: string, dir: -1 | 1) => void;
};

const PrintListContext = createContext<PrintListContextValue>({
  handles: [],
  add: () => {},
  remove: () => {},
  clear: () => {},
  has: () => false,
  isFull: false,
  move: () => {},
});

export function PrintListProvider({children}: {children: React.ReactNode}) {
  const [handles, setHandles] = useState<string[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) setHandles(parsed.slice(0, MAX_PRINT));
      }
    } catch {}
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(handles));
    } catch {}
  }, [handles]);

  const add = useCallback((handle: string) => {
    setHandles((prev) => {
      if (prev.includes(handle) || prev.length >= MAX_PRINT) return prev;
      return [...prev, handle];
    });
  }, []);

  const remove = useCallback((handle: string) => {
    setHandles((prev) => prev.filter((h) => h !== handle));
  }, []);

  const clear = useCallback(() => setHandles([]), []);

  const has = useCallback((handle: string) => handles.includes(handle), [handles]);

  const move = useCallback((handle: string, dir: -1 | 1) => {
    setHandles((prev) => {
      const idx = prev.indexOf(handle);
      if (idx === -1) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  return (
    <PrintListContext.Provider
      value={{
        handles,
        add,
        remove,
        clear,
        has,
        isFull: handles.length >= MAX_PRINT,
        move,
      }}
    >
      {children}
    </PrintListContext.Provider>
  );
}

export function usePrintList() {
  return useContext(PrintListContext);
}
