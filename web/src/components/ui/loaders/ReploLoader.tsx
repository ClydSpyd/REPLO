import { useTheme } from '../../../hooks/useTheme';

interface ReploLoaderProps {
  size?: number;
  speed?: 'slow' | 'medium' | 'fast';
  /** Base colors for the three bars, shortest to tallest. */
  barColors?: [string, string, string];
  /** Color each bar pulses toward at the peak of its cycle. */
  highlightColor?: string;
}

// Full pulse cycle (seconds) per speed.
const SPEED_DURATION: Record<NonNullable<ReploLoaderProps['speed']>, number> = {
  slow: 1.4,
  medium: 1,
  fast: 0.7,
};

// Bar geometry within the 100x100 viewBox. `peak` is the tallest height each
// bar reaches; they ascend left-to-right like the REPLO logo.
const BARS = [
  { x: 14, peak: 40 },
  { x: 41, peak: 62 },
  { x: 68, peak: 84 },
];
const BAR_WIDTH = 18;
const BAR_BOTTOM = 90; // baseline all bars sit on
const MIN_HEIGHT = 20; // shortest height in the pulse
const CORNER_RADIUS = 4;

const LIGHT_MODE_COLORS: [string, string, string] = [
  '#E8A33D',
  '#E8821E',
  '#D2570D',
];

const DARK_MODE_COLORS: [string, string, string] = [
  '#CDFF57',
  '#A8E80C',
  '#6F9E06',
];

export default function ReploLoader({
  size = 200,
  speed = 'medium',
  barColors,
  highlightColor,
}: ReploLoaderProps) {
  const duration = SPEED_DURATION[speed];
  const { theme } = useTheme();

  const finalColors =
    barColors ?? (theme === 'dark' ? DARK_MODE_COLORS : LIGHT_MODE_COLORS);
  
    const finalHighlightColor =
      highlightColor ?? (theme === 'dark' ? '#CDFF57' : '#FFB700');

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
      width={size}
      height={size}
      style={{ display: 'block' }}
    >
      {BARS.map((bar, i) => {
        // Stagger each bar so the pulse rolls across them rhythmically.
        const begin = -((i * duration) / BARS.length);
        const anim = {
          repeatCount: 'indefinite',
          dur: `${duration}s`,
          keyTimes: '0;0.5;1',
          begin: `${begin}s`,
          calcMode: 'spline',
          // Ease in/out on both legs for a smooth breathing motion.
          keySplines: '0.4 0 0.2 1;0.4 0 0.2 1',
        };

        return (
          <rect
            key={bar.x}
            x={bar.x}
            y={BAR_BOTTOM - bar.peak}
            width={BAR_WIDTH}
            height={bar.peak}
            rx={CORNER_RADIUS}
            ry={CORNER_RADIUS}
            fill={finalColors[i]}
          >
            {/* Height + y animate together to keep bars pinned to the baseline. */}
            <animate
              attributeName="height"
              values={`${MIN_HEIGHT};${bar.peak};${MIN_HEIGHT}`}
              {...anim}
            />
            <animate
              attributeName="y"
              values={`${BAR_BOTTOM - MIN_HEIGHT};${BAR_BOTTOM - bar.peak};${BAR_BOTTOM - MIN_HEIGHT}`}
              {...anim}
            />
            <animate
              attributeName="fill"
              values={`${finalColors[i]};${finalHighlightColor};${finalColors[i]}`}
              {...anim}
            />
          </rect>
        );
      })}
    </svg>
  );
}
