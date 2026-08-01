import { useEffect, useState } from 'react';

interface ProgressWheelProps {
  total: number;
  current: number;
  /** Thickness of the ring, in SVG user units (viewBox is 100x100). */
  trackWidth?: number;
  progressColor?: string;
  trackColor?: string;
}

export default function ProgressWheel({
  total,
  current,
  trackWidth = 10,
  progressColor = 'var(--accent-primary)',
  trackColor = 'var(--contrast-one)',
}: ProgressWheelProps) {
  const target = total > 0 ? Math.min(Math.max(current / total, 0), 1) : 0;

  // Animated fraction (0..1) that eases toward `target` whenever props change.
  const [fraction, setFraction] = useState(target);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFraction(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const percent = Math.round(fraction * 100);

  // Geometry: a 100x100 viewBox keeps the wheel resolution-independent so it
  // scales to fill whatever space the parent gives it.
  const radius = 50 - trackWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* preserveAspectRatio="xMidYMid meet" (the SVG default) scales the
          100x100 viewBox to fit the smaller dimension and centers it, so a
          non-square container never distorts or overflows the wheel. */}
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={trackWidth}
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={trackWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{percent}%</span>
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--contrast-three)]">
          Complete
        </span>
      </div>
    </div>
  );
}
