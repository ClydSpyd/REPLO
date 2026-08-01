import { useElapsedTime, type Timestamp } from '../../hooks/useElapsedTime';

interface ElapsedTimerProps {
  /** When to count from. Accepts a Date, ISO string, or epoch ms. */
  from: Timestamp;
  /** Freeze the timer here instead of counting to now (e.g. a session's end). */
  until?: Timestamp;
  /** Small label above the value. Pass an empty string to hide it. */
  label?: string;
  /** Extra classes for the wrapper. */
  className?: string;
}

/**
 * Live "time since" readout. Counts up once a second from `from`, showing
 * `MM:SS` under an hour, `HH:MM:SS` under a day, and `1 day+` beyond that.
 */
export default function ElapsedTimer({
  from,
  until,
  label = 'ELAPSED',
  className = '',
}: ElapsedTimerProps) {
  const elapsed = useElapsedTime({ from, until, formatted: true }) as string;

  return (
    <div className={`flex flex-col items-end ${className}`}>
      {label && (
        <p className="text-[var(--contrast-three)]! text-xs! font-[700] pr-1">
          {label}
        </p>
      )}
      <div
        role="timer"
        aria-label={`${label || 'Elapsed'}: ${elapsed}`}
        className="anotation text-7xl! font-bold text-white/80! mb-2 tabular-nums whitespace-nowrap"
      >
        {elapsed}
      </div>
    </div>
  );
}
