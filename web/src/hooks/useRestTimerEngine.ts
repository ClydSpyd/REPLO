import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type RestTimerMode = 'timer' | 'stopwatch';

const PRESETS_KEY = 'replo:rest-timer-presets';
const DEFAULT_PRESETS = [90, 120];
const DEFAULT_DURATION_SEC = 90;
const PRESET_STEP_SEC = 15;
const PRESET_MIN_SEC = 15;
const PRESET_MAX_SEC = 3600;
const TICK_MS = 200;

const clamp = (value: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, value));

/** Load the user's saved quick presets, falling back to defaults if absent or malformed. */
function loadPresets(): number[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        Array.isArray(parsed) &&
        parsed.length === DEFAULT_PRESETS.length &&
        parsed.every((n) => typeof n === 'number' && Number.isFinite(n))
      ) {
        return parsed.map((n) =>
          clamp(Math.round(n), PRESET_MIN_SEC, PRESET_MAX_SEC),
        );
      }
    }
  } catch {
    /* fall through to defaults */
  }
  return [...DEFAULT_PRESETS];
}

export interface RestTimerEngine {
  mode: RestTimerMode;
  setMode: (mode: RestTimerMode) => void;
  isRunning: boolean;
  /** Remaining (timer) or elapsed (stopwatch) milliseconds. */
  displayMs: number;
  /** Selected countdown duration in ms (timer mode). */
  targetMs: number;
  /** 0–1 remaining fraction for the progress bar (timer mode). */
  progress: number;
  /** The user's three quick presets, in seconds. */
  presets: number[];
  /** Index of the preset matching the current target, or -1. */
  selectedPresetIndex: number;
  selectPreset: (seconds: number) => void;
  adjustPreset: (index: number, deltaSteps: number) => void;
  /** Set the countdown duration directly (seconds), clamped to the allowed range. */
  setDuration: (seconds: number) => void;
  /** Nudge the countdown duration by whole preset steps (±15s), clamped. */
  adjustDuration: (deltaSteps: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

/**
 * Rest-timer state machine backing the modal. Two modes — a countdown `timer`
 * and a count-up `stopwatch` — both derived from a clock anchor (a timestamp)
 * rather than an incremented counter, so they stay accurate through throttled
 * tabs and machine sleep. Kept above the modal (in the provider) so a running
 * timer survives the modal closing. Presets persist to localStorage.
 */
export function useRestTimerEngine({
  onComplete,
}: { onComplete?: () => void } = {}): RestTimerEngine {
  const [mode, setModeState] = useState<RestTimerMode>('timer');
  const [presets, setPresets] = useState<number[]>(loadPresets);
  const [targetMs, setTargetMs] = useState(DEFAULT_DURATION_SEC * 1000);
  const [isRunning, setIsRunning] = useState(false);
  const [displayMs, setDisplayMs] = useState(DEFAULT_DURATION_SEC * 1000);

  // Anchor: stopwatch → the start instant (elapsed = now − anchor);
  //         timer     → the target end instant (remaining = anchor − now).
  const anchorRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Latest displayed value, for adjustDuration to nudge off what the user sees.
  const displayMsRef = useRef(displayMs);
  displayMsRef.current = displayMs;

  // Persist preset edits.
  useEffect(() => {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    } catch {
      /* ignore write failures (private mode, quota) */
    }
  }, [presets]);

  // Tick from the clock while running. Mode can't change mid-run (setMode stops
  // the timer first), so the closure's `mode` is correct for the run.
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      const now = Date.now();
      const anchor = anchorRef.current;
      if (anchor === null) return;

      if (mode === 'stopwatch') {
        setDisplayMs(now - anchor);
      } else {
        const remaining = anchor - now;
        if (remaining <= 0) {
          setDisplayMs(0);
          setIsRunning(false);
          anchorRef.current = null;
          onCompleteRef.current?.();
        } else {
          setDisplayMs(remaining);
        }
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [isRunning, mode]);

  const start = useCallback(() => {
    if (isRunning) return;
    const now = Date.now();
    if (mode === 'stopwatch') {
      anchorRef.current = now - displayMs;
    } else {
      if (displayMs <= 0) return;
      anchorRef.current = now + displayMs;
    }
    setIsRunning(true);
  }, [isRunning, mode, displayMs]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    const now = Date.now();
    const anchor = anchorRef.current;
    if (anchor !== null) {
      setDisplayMs(
        mode === 'stopwatch' ? now - anchor : Math.max(0, anchor - now),
      );
    }
    anchorRef.current = null;
    setIsRunning(false);
  }, [isRunning, mode]);

  const reset = useCallback(() => {
    anchorRef.current = null;
    setIsRunning(false);
    setDisplayMs(mode === 'stopwatch' ? 0 : targetMs);
  }, [mode, targetMs]);

  const setMode = useCallback(
    (next: RestTimerMode) => {
      anchorRef.current = null;
      setIsRunning(false);
      setModeState(next);
      setDisplayMs(next === 'stopwatch' ? 0 : targetMs);
    },
    [targetMs],
  );

  const selectPreset = useCallback((seconds: number) => {
    anchorRef.current = null;
    setIsRunning(false);
    setTargetMs(seconds * 1000);
    setDisplayMs(seconds * 1000);
  }, []);

  // Set/adjust the countdown duration directly (the editable hero). Both stop
  // the timer and sync display to the new duration, so progress reads full.
  const setDuration = useCallback((seconds: number) => {
    const ms =
      clamp(Math.round(seconds), PRESET_MIN_SEC, PRESET_MAX_SEC) * 1000;
    anchorRef.current = null;
    setIsRunning(false);
    setTargetMs(ms);
    setDisplayMs(ms);
  }, []);

  const adjustDuration = useCallback(
    (deltaSteps: number) => {
      const base = Math.round(displayMsRef.current / 1000);
      setDuration(base + deltaSteps * PRESET_STEP_SEC);
    },
    [setDuration],
  );

  const adjustPreset = useCallback((index: number, deltaSteps: number) => {
    setPresets((prev) =>
      prev.map((sec, i) =>
        i === index
          ? clamp(
              sec + deltaSteps * PRESET_STEP_SEC,
              PRESET_MIN_SEC,
              PRESET_MAX_SEC,
            )
          : sec,
      ),
    );
  }, []);

  const selectedPresetIndex = useMemo(
    () => presets.findIndex((sec) => sec * 1000 === targetMs),
    [presets, targetMs],
  );

  const progress = targetMs > 0 ? clamp(displayMs / targetMs, 0, 1) : 0;

  return {
    mode,
    setMode,
    isRunning,
    displayMs,
    targetMs,
    progress,
    presets,
    selectedPresetIndex,
    selectPreset,
    adjustPreset,
    setDuration,
    adjustDuration,
    start,
    pause,
    reset,
  };
}
