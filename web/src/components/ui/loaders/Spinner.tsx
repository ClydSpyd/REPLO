interface SpinnerAngularProps {
  color?: string;
  size?: number;
  speed?: 'slow' | 'medium' | 'fast';
}

// Full animation cycle (seconds) per speed. Mirrors Spinner.tsx.
const SPEED_DURATION: Record<
  NonNullable<SpinnerAngularProps['speed']>,
  number
> = {
  slow: 1,
  medium: 0.7,
  fast: 0.5,
};

const SEGMENT_COUNT = 12;
// Bar geometry within the 100x100 viewBox.
const BAR_WIDTH = 8;
const BAR_HEIGHT = 20;
const INNER_RADIUS = 22; // gap between center and the inner end of each bar
const CORNER_RADIUS = 1.5; // subtle, to match REPLO's angular bars

export default function Spinner({
  color = '#ffffff',
  size = 200,
  speed = 'medium',
}: SpinnerAngularProps) {
  const duration = SPEED_DURATION[speed];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
      width={size}
      height={size}
      style={{ display: 'block' }}
    >
      {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
        const angle = i * (360 / SEGMENT_COUNT);
        // Stagger each bar by one slice of the cycle so the highlight sweeps round.
        const begin = -((SEGMENT_COUNT - 1 - i) * duration) / SEGMENT_COUNT;

        return (
          <rect
            key={i}
            x={50 - BAR_WIDTH / 2}
            y={50 - INNER_RADIUS - BAR_HEIGHT}
            width={BAR_WIDTH}
            height={BAR_HEIGHT}
            rx={CORNER_RADIUS}
            ry={CORNER_RADIUS}
            fill={color}
            fillOpacity={(SEGMENT_COUNT - i) / SEGMENT_COUNT}
            transform={`rotate(${angle} 50 50)`}
          >
            <animate
              attributeName="fill-opacity"
              repeatCount="indefinite"
              dur={`${duration}s`}
              keyTimes="0;1"
              values="1;0"
              begin={`${begin}s`}
            />
          </rect>
        );
      })}
    </svg>
  );
}
