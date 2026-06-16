import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {estimatePxPerMm, type ScaleConfidence} from '~/lib/screen-size';

/**
 * Screen scale calibration.
 *
 * CSS `mm` is NOT physically accurate on screens (the browser assumes 96px =
 * 1in regardless of the device's real pixel density), so to show a chain at
 * true physical size we need to know how many CSS pixels equal one physical
 * millimetre on THIS screen. We get that two ways, in order of preference:
 *
 *   1. Auto-estimate (`~/lib/screen-size`) — derived from the device's own
 *      metrics (platform, devicePixelRatio, resolution). Right within a few
 *      percent for phones/tablets, so actual-size can switch on with zero
 *      friction. Recomputed each load; never persisted.
 *   2. Card calibration — the shopper matches an on-screen box to a real ID-1
 *      card (85.6mm). Exact, persisted, and overrides the estimate. This is the
 *      "validate it with your credit card" path, and the honest fix on desktop
 *      where the monitor's real size can't be inferred.
 *
 * `pxPerMm` resolves to the calibration if present, else the estimate. Both are
 * self-consistent in CSS px as long as the browser zoom doesn't change.
 */

const STORAGE_KEY = 'styx-screen-calibration';
// Whether the shopper wants actual-size on. Persisted so that, once calibrated
// and switched on, every page they visit (and future visits) shows true size
// without re-toggling — we already know their screen.
const PREF_KEY = 'styx-actual-size-on';

// How a persisted, user-set scale was arrived at: matched to a card, or
// eyeballed with the bigger/smaller nudge.
type CalibSource = 'card' | 'manual';
type Stored = {pxPerMm: number; dpr: number; source?: CalibSource};

/** Where the active `pxPerMm` came from. */
export type ScaleSource = 'calibration' | 'manual' | 'estimate' | null;

// One nudge step = ±2% — fine enough to dial in, coarse enough to feel.
const NUDGE_STEP = 0.02;

type Ctx = {
  /**
   * CSS pixels per physical millimetre on this screen. Resolves to the user's
   * own scale (card-matched or nudged) if set, otherwise the auto-estimate.
   * Null only before hydration / on devices we can't estimate at all.
   */
  pxPerMm: number | null;
  /** True when the value is an exact, user-confirmed card calibration. */
  isCalibrated: boolean;
  /** Source of the current `pxPerMm`: card, manual nudge, auto-estimate, or none. */
  source: ScaleSource;
  /** How much to trust an auto-estimate ('high' phones … 'low' desktop); null once user-set. */
  estimateConfidence: ScaleConfidence | null;
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
  /** Nudge the current scale by ±`NUDGE_STEP` per step (eyeball fine-tune). */
  adjustScale: (steps: number) => void;
  /** Drop any user-set scale and fall back to the auto-estimate. */
  clearCalibration: () => void;
};

const noop = () => {};
const ScaleCalibrationContext = createContext<Ctx>({
  pxPerMm: null,
  isCalibrated: false,
  source: null,
  estimateConfidence: null,
  staleZoom: false,
  actualSizeOn: false,
  setActualSizeOn: noop,
  openCalibration: noop,
  closeCalibration: noop,
  isOpen: false,
  setCalibration: noop,
  adjustScale: noop,
  clearCalibration: noop,
});

export function ScaleCalibrationProvider({children}: {children: React.ReactNode}) {
  // The shopper's own scale, persisted: matched to a card or nudged by eye.
  // Null until they do either; takes precedence over the estimate.
  const [calibratedPxPerMm, setCalibratedPxPerMm] = useState<number | null>(null);
  const [calibSource, setCalibSource] = useState<CalibSource | null>(null);
  // Auto-estimate from device metrics (computed each load, never persisted).
  const [estimatePxPerMmVal, setEstimatePxPerMmVal] = useState<number | null>(null);
  const [estimateConfidence, setEstimateConfidence] = useState<ScaleConfidence | null>(null);
  const [dpr, setDpr] = useState<number | null>(null);
  const [staleZoom, setStaleZoom] = useState(false);
  const [actualSizeOn, setActualSizeOnState] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const thenEnableRef = useRef(false);

  // The value consumers use: the shopper's own scale wins, else the estimate.
  const pxPerMm = calibratedPxPerMm ?? estimatePxPerMmVal;
  const source: ScaleSource = calibratedPxPerMm != null
    ? calibSource === 'manual'
      ? 'manual'
      : 'calibration'
    : estimatePxPerMmVal != null
      ? 'estimate'
      : null;

  // On mount: derive an auto-estimate so actual-size works with no calibration,
  // then layer any stored user scale on top.
  useEffect(() => {
    const est = estimatePxPerMm();
    if (est) {
      setEstimatePxPerMmVal(est.pxPerMm);
      setEstimateConfidence(est.confidence);
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Stored;
        if (parsed && typeof parsed.pxPerMm === 'number' && parsed.pxPerMm > 0) {
          setCalibratedPxPerMm(parsed.pxPerMm);
          setCalibSource(parsed.source === 'manual' ? 'manual' : 'card');
          setDpr(typeof parsed.dpr === 'number' ? parsed.dpr : null);
        }
      }
      // Restore the on/off preference — once on, stays on across pages/visits.
      // No longer gated on a stored calibration, since the estimate alone is
      // enough to render at (close to) true size.
      if (localStorage.getItem(PREF_KEY) === '1') setActualSizeOnState(true);
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

  // Persist a user-set scale (from the card overlay or a nudge) and record how
  // it was set, so copy can stay honest about it.
  const persistScale = useCallback((value: number, src: CalibSource) => {
    const d = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    setCalibratedPxPerMm(value);
    setCalibSource(src);
    setDpr(d);
    setStaleZoom(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({pxPerMm: value, dpr: d, source: src}));
    } catch {}
  }, []);

  const setCalibration = useCallback(
    (value: number) => {
      persistScale(value, 'card');
      setIsOpen(false);
      if (thenEnableRef.current) {
        applyActualSizeOn(true);
        thenEnableRef.current = false;
      }
    },
    [persistScale, applyActualSizeOn],
  );

  // Eyeball fine-tune: scale the CURRENT effective value by ±NUDGE_STEP per step
  // and persist it as a manual adjustment. Works whether they're starting from
  // the auto-estimate or a prior card/nudge value.
  const adjustScale = useCallback(
    (steps: number) => {
      const base = calibratedPxPerMm ?? estimatePxPerMmVal;
      if (base == null || steps === 0) return;
      const next = base * (1 + NUDGE_STEP * steps);
      // Keep it sane: never below ~1 px/mm or above ~30.
      persistScale(Math.max(1, Math.min(30, next)), 'manual');
    },
    [calibratedPxPerMm, estimatePxPerMmVal, persistScale],
  );

  // Drop any user-set scale and fall back to the auto-estimate (not off).
  const clearCalibration = useCallback(() => {
    setCalibratedPxPerMm(null);
    setCalibSource(null);
    setDpr(null);
    setStaleZoom(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const openCalibration = useCallback((opts?: {thenEnable?: boolean}) => {
    thenEnableRef.current = !!opts?.thenEnable;
    setIsOpen(true);
  }, []);

  const closeCalibration = useCallback(() => {
    thenEnableRef.current = false;
    setIsOpen(false);
  }, []);

  // Flipping actual-size on just works: we (almost) always have an estimate, so
  // there's no forced calibration step. Only if we somehow have no scale at all
  // (no estimate AND no calibration) do we fall back to opening the card overlay.
  const setActualSizeOn = useCallback(
    (on: boolean) => {
      if (on && pxPerMm == null) {
        const est = estimatePxPerMm();
        if (est) {
          setEstimatePxPerMmVal(est.pxPerMm);
          setEstimateConfidence(est.confidence);
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

  const value = useMemo(
    () => ({
      pxPerMm,
      isCalibrated: calibSource === 'card',
      source,
      estimateConfidence: calibratedPxPerMm != null ? null : estimateConfidence,
      staleZoom,
      actualSizeOn,
      setActualSizeOn,
      openCalibration,
      closeCalibration,
      isOpen,
      setCalibration,
      adjustScale,
      clearCalibration,
    }),
    [
      pxPerMm,
      calibratedPxPerMm,
      calibSource,
      source,
      estimateConfidence,
      staleZoom,
      actualSizeOn,
      setActualSizeOn,
      openCalibration,
      closeCalibration,
      isOpen,
      setCalibration,
      adjustScale,
      clearCalibration,
    ],
  );

  return (
    <ScaleCalibrationContext.Provider value={value}>
      {children}
    </ScaleCalibrationContext.Provider>
  );
}

export function useScaleCalibration() {
  return useContext(ScaleCalibrationContext);
}
