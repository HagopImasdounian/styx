import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

/**
 * Screen scale calibration.
 *
 * CSS `mm` is NOT physically accurate on screens (the browser assumes 96px =
 * 1in regardless of the device's real pixel density), so to show a chain at
 * true physical size on a phone or laptop we must measure the screen once:
 * the user matches an on-screen box to a real ID-1 card (85.6mm) and we store
 * how many CSS pixels equal one physical millimetre. Calibration is
 * self-consistent in CSS px as long as the browser zoom doesn't change.
 */

const STORAGE_KEY = 'styx-screen-calibration';
// Whether the shopper wants actual-size on. Persisted so that, once calibrated
// and switched on, every page they visit (and future visits) shows true size
// without re-toggling — we already know their screen.
const PREF_KEY = 'styx-actual-size-on';

type Stored = {pxPerMm: number; dpr: number};

type Ctx = {
  /** CSS pixels per physical millimetre on this screen, or null if uncalibrated. */
  pxPerMm: number | null;
  isCalibrated: boolean;
  /** True if browser zoom / device-pixel-ratio changed since calibrating. */
  staleZoom: boolean;
  /** Whether actual-size rendering is currently switched on (consumers read this). */
  actualSizeOn: boolean;
  setActualSizeOn: (on: boolean) => void;
  /** Open the calibration overlay. `thenEnable` turns actual-size on after a save. */
  openCalibration: (opts?: {thenEnable?: boolean}) => void;
  closeCalibration: () => void;
  isOpen: boolean;
  /** Save a calibration in CSS px per mm (called by the overlay on confirm). */
  setCalibration: (pxPerMm: number) => void;
  clearCalibration: () => void;
};

const noop = () => {};
const ScaleCalibrationContext = createContext<Ctx>({
  pxPerMm: null,
  isCalibrated: false,
  staleZoom: false,
  actualSizeOn: false,
  setActualSizeOn: noop,
  openCalibration: noop,
  closeCalibration: noop,
  isOpen: false,
  setCalibration: noop,
  clearCalibration: noop,
});

export function ScaleCalibrationProvider({children}: {children: React.ReactNode}) {
  const [pxPerMm, setPxPerMm] = useState<number | null>(null);
  const [dpr, setDpr] = useState<number | null>(null);
  const [staleZoom, setStaleZoom] = useState(false);
  const [actualSizeOn, setActualSizeOnState] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const thenEnableRef = useRef(false);

  // Hydrate stored calibration on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Stored;
        if (parsed && typeof parsed.pxPerMm === 'number' && parsed.pxPerMm > 0) {
          setPxPerMm(parsed.pxPerMm);
          setDpr(typeof parsed.dpr === 'number' ? parsed.dpr : null);
          // Restore the on/off preference — once on, stays on across pages/visits.
          if (localStorage.getItem(PREF_KEY) === '1') setActualSizeOnState(true);
        }
      }
    } catch {}
  }, []);

  // Watch for zoom / DPR changes that would invalidate the stored scale.
  useEffect(() => {
    if (dpr == null) return;
    const check = () =>
      setStaleZoom(Math.abs((window.devicePixelRatio || 1) - dpr) > 0.05);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [dpr]);

  // Set the on/off preference AND persist it, so it survives reloads and
  // carries to every page once the shopper has switched it on.
  const applyActualSizeOn = useCallback((on: boolean) => {
    setActualSizeOnState(on);
    try {
      localStorage.setItem(PREF_KEY, on ? '1' : '0');
    } catch {}
  }, []);

  const setCalibration = useCallback(
    (value: number) => {
      const d = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      setPxPerMm(value);
      setDpr(d);
      setStaleZoom(false);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({pxPerMm: value, dpr: d}));
      } catch {}
      setIsOpen(false);
      if (thenEnableRef.current) {
        applyActualSizeOn(true);
        thenEnableRef.current = false;
      }
    },
    [applyActualSizeOn],
  );

  const clearCalibration = useCallback(() => {
    setPxPerMm(null);
    setDpr(null);
    setStaleZoom(false);
    applyActualSizeOn(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [applyActualSizeOn]);

  const openCalibration = useCallback((opts?: {thenEnable?: boolean}) => {
    thenEnableRef.current = !!opts?.thenEnable;
    setIsOpen(true);
  }, []);

  const closeCalibration = useCallback(() => {
    thenEnableRef.current = false;
    setIsOpen(false);
  }, []);

  // Turning actual-size on with no calibration yet kicks off the overlay first.
  // Guard against the one-frame hydration gap by checking storage synchronously
  // before assuming the screen is uncalibrated.
  const setActualSizeOn = useCallback(
    (on: boolean) => {
      if (on && pxPerMm == null) {
        let stored: number | null = null;
        try {
          const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Stored | null;
          if (raw && typeof raw.pxPerMm === 'number' && raw.pxPerMm > 0) stored = raw.pxPerMm;
        } catch {}
        if (stored != null) {
          setPxPerMm(stored);
          applyActualSizeOn(true);
          return;
        }
        openCalibration({thenEnable: true});
        return;
      }
      applyActualSizeOn(on);
    },
    [pxPerMm, openCalibration, applyActualSizeOn],
  );

  return (
    <ScaleCalibrationContext.Provider
      value={{
        pxPerMm,
        isCalibrated: pxPerMm != null,
        staleZoom,
        actualSizeOn,
        setActualSizeOn,
        openCalibration,
        closeCalibration,
        isOpen,
        setCalibration,
        clearCalibration,
      }}
    >
      {children}
    </ScaleCalibrationContext.Provider>
  );
}

export function useScaleCalibration() {
  return useContext(ScaleCalibrationContext);
}
