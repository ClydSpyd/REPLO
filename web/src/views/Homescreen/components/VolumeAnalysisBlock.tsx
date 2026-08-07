import { useEffect, useRef, useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import type { VolumeTrend } from '@replo/shared';
import { useUserVolumeTrend } from '../../../queries/userMetrics';

/** Animate a number from its previous value to `value` (easeOutCubic). */
function useCountUp(value: number, duration = 500): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = to;
    };
  }, [value, duration]);

  return display;
}

type Mode = 'weekly' | 'daily';

/** A single bar, shared by the weekly and daily views. */
interface Bar {
  key: string;
  /** Axis label under the bar. */
  label: string;
  volume: number;
  /** Popover heading (date or range). */
  topLabel: string;
  /** Highlighted as the current period. */
  isCurrent: boolean;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const sumVolume = (days: VolumeTrend['days']) =>
  days.reduce((total, day) => total + day.volume, 0);

/** Headline label + total + delta for the active mode. */
function headlineFor(
  data: VolumeTrend,
  mode: Mode,
): { label: string; totalVolume: number; deltaPct: number | null } {
  if (mode === 'daily') {
    const last7 = data.days.slice(-7);
    const prev7 = data.days.slice(-14, -7);
    const total = sumVolume(last7);
    const prev = sumVolume(prev7);
    return {
      label: 'LAST 7 DAYS',
      totalVolume: total,
      deltaPct: prev > 0 ? round1(((total - prev) / prev) * 100) : null,
    };
  }
  return {
    label: 'LAST 8 WEEKS',
    totalVolume: data.totalVolume,
    deltaPct: data.deltaPct,
  };
}

/** Build the bar list for the active mode from the trend payload. */
function buildBars(data: VolumeTrend, mode: Mode): Bar[] {
  if (mode === 'daily') {
    const last7 = data.days.slice(-7);
    return last7.map((day, i) => ({
      key: day.date,
      label: format(new Date(day.date), 'EEE'),
      volume: day.volume,
      topLabel: format(new Date(day.date), 'EEE MMM d'),
      isCurrent: i === last7.length - 1,
    }));
  }

  return data.weeks.map((week, i) => ({
    key: week.label,
    label: week.label,
    volume: week.volume,
    topLabel: `${format(new Date(week.start), 'MMM d')} – ${format(
      new Date(week.end),
      'MMM d',
    )}`,
    isCurrent: i === data.weeks.length - 1,
  }));
}

/** Weekly volume bars (last 8 weeks) + a daily activity strip (last 4 weeks). */
export default function VolumeAnalysisBlock() {
  const { data, isLoading, error } = useUserVolumeTrend();
  const [mode, setMode] = useState<Mode>('weekly');

  // Computed before the early returns so the count-up hook runs every render.
  const headline = data ? headlineFor(data, mode) : null;
  const animatedTonnes = useCountUp(
    headline ? headline.totalVolume / 1000 : 0,
  );

  if (isLoading) return <Frame>{<Placeholder text="Loading…" />}</Frame>;
  if (error)
    return <Frame>{<Placeholder text="Couldn't load volume" />}</Frame>;
  if (!data || !headline)
    return <Frame>{<Placeholder text="No volume yet" />}</Frame>;

  const { days } = data;
  const totalTonnes = animatedTonnes.toFixed(1);
  const bars = buildBars(data, mode);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Weekly volume */}
      <section className="rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] px-8 py-6 text-[var(--text-strong)]">
        <div className="flex items-start justify-between gap-3">
          <p className="space-mono text-xs text-[var(--accent-primary)]">
            {headline.label}
          </p>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>

        <div className="mt-1 flex items-center gap-3">
          <h2 className="heading-two leading-none tabular-nums">
            {totalTonnes}
            <span className="ml-1 text-4xl lowercase">t</span>
          </h2>
          <Delta deltaPct={headline.deltaPct} />
        </div>
        <p className="mt-2 space-mono text-xs text-[var(--contrast-three)]!">
          TOTAL VOLUME LIFTED
        </p>

        <div className="mt-6 w-full border-b border-[var(--contrast-one)]" />

        <p className="mt-6 space-mono text-xs text-[var(--contrast-three)]">
          {mode === 'weekly' ? 'WEEKLY VOLUME' : 'DAILY VOLUME'}
        </p>
        <VolumeBars bars={bars} mode={mode} />
      </section>

      {/* Last 4 weeks activity strip */}
      <section className="flex items-center gap-6 rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] px-8 py-5 text-[var(--text-strong)]">
        <p className="space-mono whitespace-nowrap text-xs text-[var(--contrast-three)]">
          LAST 4 WEEKS
        </p>
        <ActivityStrip days={days} />
      </section>
    </div>
  );
}

function VolumeBars({ bars, mode }: { bars: Bar[]; mode: Mode }) {
  const max = Math.max(...bars.map((b) => b.volume), 1);

  return (
    // Keyed by mode so switching views remounts the bars and replays the grow-in.
    <div key={mode} className="mt-3 flex h-48 items-end gap-3">
      {bars.map((bar, i) => {
        // Non-zero periods keep a visible stub even when tiny.
        const heightPct =
          bar.volume > 0 ? Math.max(4, (bar.volume / max) * 100) : 2;

        return (
          <div
            key={bar.key}
            className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <div
              className="w-full origin-bottom rounded-t-md transition-colors [animation:bar-grow_0.45s_ease-out_both]"
              style={{
                height: `${heightPct}%`,
                animationDelay: `${i * 30}ms`,
                backgroundColor: bar.isCurrent
                  ? 'var(--accent-primary)'
                  : 'var(--dark-three)',
              }}
            />
            <span className="space-mono text-[10px] text-[var(--contrast-two)]!">
              {bar.label}
            </span>

            <Popover>
              <p className="space-mono text-[10px] uppercase tracking-wide text-[var(--contrast-three)]">
                {bar.topLabel}
              </p>
              <p className="anton mt-1 text-sm text-[var(--text-strong)]">
                {(bar.volume / 1000).toFixed(1)}t
                <span className="space-mono ml-1.5 text-[10px] text-[var(--contrast-three)]!">
                  {bar.volume.toLocaleString()} kg
                </span>
              </p>
            </Popover>
          </div>
        );
      })}
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <div className="flex rounded-lg border border-[var(--contrast-one)] p-0.5">
      {(['weekly', 'daily'] as const).map((option) => {
        const active = mode === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`space-mono rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
              active
                ? 'bg-[var(--accent-primary)] text-[var(--text-contrast)]!'
                : 'text-[var(--contrast-three)] hover:text-[var(--text-strong)]'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function ActivityStrip({ days }: { days: VolumeTrend['days'] }) {
  const max = Math.max(...days.map((d) => d.volume), 1);

  return (
    <div className="flex flex-wrap gap-1.5">
      {days.map((day) => {
        const ratio = day.volume > 0 ? day.volume / max : 0;
        return (
          <div key={day.date} className="group relative">
            <div
              className="h-5 w-5 rounded"
              style={
                ratio > 0
                  ? {
                      backgroundColor: 'var(--accent-primary)',
                      opacity: 0.35 + ratio * 0.65,
                    }
                  : { backgroundColor: 'var(--dark-three)' }
              }
            />
            <Popover>
              <p className="space-mono text-[10px] uppercase tracking-wide text-[var(--contrast-three)]">
                {format(new Date(day.date), 'EEE MMM d')}
              </p>
              <p className="anton mt-1 text-sm text-[var(--text-strong)]">
                {day.volume > 0 ? (
                  <>
                    {day.volume.toLocaleString()}
                    <span className="space-mono ml-1 text-[10px] text-[var(--contrast-three)]!">
                      kg
                    </span>
                  </>
                ) : (
                  <span className="space-mono text-[11px] text-[var(--contrast-three)]!">
                    Rest day
                  </span>
                )}
              </p>
            </Popover>
          </div>
        );
      })}
    </div>
  );
}

/** Hover popover anchored above its `group` parent. */
function Popover({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-two)] px-3 py-2 text-left shadow-lg group-hover:block">
      {children}
    </div>
  );
}

function Delta({ deltaPct }: { deltaPct: number | null }) {
  if (deltaPct === null || deltaPct === 0) return null;
  const up = deltaPct > 0;
  return (
    <span
      className={`space-mono flex items-center gap-1 text-sm font-bold ${
        up ? 'text-emerald-400' : 'text-red-400'
      }`}
    >
      <span className="text-xs">{up ? '▲' : '▼'}</span>
      {Math.abs(deltaPct)}%
    </span>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-4">
      <section className="flex-1 rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] px-8 py-6">
        <p className="space-mono text-xs text-[var(--accent-primary)]">
          LAST 8 WEEKS
        </p>
        {children}
      </section>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <p className="space-mono py-10 text-center text-xs uppercase tracking-wide text-[var(--contrast-two)]!">
      {text}
    </p>
  );
}
