import { useEffect, useState } from 'react';

const HOUR_SECONDS = 3600;
const DAY_SECONDS = 86400;

/** A point in time, however it arrived — Date, ISO string, or epoch ms. */
export type Timestamp = Date | string | number | null | undefined;

/**
 * Format elapsed seconds:
 *  - under an hour   → `MM:SS`
 *  - under a day     → `HH:MM:SS`
 *  - a day or more   → `1 day+`
 */
export function formatElapsed(seconds: number): string {
  if (seconds >= DAY_SECONDS) return '1 day+';

  const hrs = Math.floor(seconds / HOUR_SECONDS);
  const mins = Math.floor((seconds % HOUR_SECONDS) / 60);
  const secs = seconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');

  return hrs > 0
    ? [hrs, mins, secs].map(pad).join(':')
    : [mins, secs].map(pad).join(':');
}

/** Normalise any accepted timestamp form to epoch ms (null if absent/invalid). */
function toMs(value: Timestamp): number | null {
  if (value === null || value === undefined) return null;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function secondsBetween(fromMs: number | null, untilMs: number | null): number {
  if (fromMs === null) return 0;
  const end = untilMs ?? Date.now();
  return Math.max(0, Math.floor((end - fromMs) / 1000));
}

/**
 * Count up in seconds from a timestamp.
 *
 * @param from - When to count from. Pass null/undefined to hold the timer at zero.
 * @param until - Freeze the elapsed time at this point instead of counting to
 *                now (e.g. a finished session's end time). Omit to keep ticking.
 * @param formatted - Return a formatted string (see {@link formatElapsed})
 *                    instead of a raw second count.
 */
export const useElapsedTime = ({
  from,
  until,
  formatted,
}: {
  from: Timestamp;
  until?: Timestamp;
  formatted?: boolean;
}) => {
  // Depend on primitives, so passing a fresh Date object each render doesn't
  // tear down and restart the interval.
  const fromMs = toMs(from);
  const untilMs = toMs(until);

  const [elapsed, setElapsed] = useState(() => secondsBetween(fromMs, untilMs));

  useEffect(() => {
    // Set immediately so the first render isn't stuck at zero for a second.
    setElapsed(secondsBetween(fromMs, untilMs));

    // Nothing to tick: no start point, or the range is already fixed.
    if (fromMs === null || untilMs !== null) return;

    // Recompute from the clock each tick rather than incrementing a counter, so
    // the timer stays accurate through throttled tabs and machine sleep.
    const intervalId = setInterval(
      () => setElapsed(secondsBetween(fromMs, null)),
      1000,
    );

    return () => clearInterval(intervalId);
  }, [fromMs, untilMs]);

  return formatted ? formatElapsed(elapsed) : elapsed;
};
