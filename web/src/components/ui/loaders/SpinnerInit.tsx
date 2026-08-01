interface SpinnerProps {
  color?: string;
  size?: number;
  speed?: 'slow' | 'medium' | 'fast';
}

// Full animation cycle (seconds) per speed.
const SPEED_DURATION: Record<NonNullable<SpinnerProps['speed']>, number> = {
  slow: 1,
  medium: 0.7,
  fast: 0.5,
};

const DOT_COUNT = 8;
const ORBIT_RADIUS = 30; // distance of each dot from center in the 100x100 viewBox
const DOT_RADIUS = 6;

export default function Spinner({
  color = '#ffffff',
  size = 200,
  speed = 'medium',
}: SpinnerProps) {
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
      {Array.from({ length: DOT_COUNT }).map((_, i) => {
        const angle = (i * (360 / DOT_COUNT) * Math.PI) / 180;
        const x = 50 + ORBIT_RADIUS * Math.cos(angle);
        const y = 50 + ORBIT_RADIUS * Math.sin(angle);
        // Stagger each dot by one slice of the cycle so the pulse travels round.
        const begin = -((DOT_COUNT - 1 - i) * duration) / DOT_COUNT;

        return (
          <g key={i} transform={`translate(${x},${y})`}>
            <circle
              cx={0}
              cy={0}
              r={DOT_RADIUS}
              fill={color}
              fillOpacity={(DOT_COUNT - i) / DOT_COUNT}
            >
              <animateTransform
                attributeName="transform"
                type="scale"
                repeatCount="indefinite"
                dur={`${duration}s`}
                keyTimes="0;1"
                values="1.5 1.5;1 1"
                begin={`${begin}s`}
              />
              <animate
                attributeName="fill-opacity"
                repeatCount="indefinite"
                dur={`${duration}s`}
                keyTimes="0;1"
                values="1;0"
                begin={`${begin}s`}
              />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}
