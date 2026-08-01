interface BarsLogoProps {
  /** Width and height of the (square) logo, in pixels. */
  size: number;
  /** Fill colors for the three bars, shortest to tallest. */
  barColors: string[];
  /**
   * Bar corner radius in viewBox units. Defaults to 8 (soft). Use a smaller
   * value (e.g. 3) for a more angular mark that pairs with angular wordmarks.
   */
  cornerRadius?: number;
}

// Bar geometry within a 100x100 viewBox. Each bar is bottom-aligned and grows
// taller left-to-right; the whole group is rotated so they cascade diagonally,
// matching the app icon.
const BARS = [
  { x: 20, height: 34 },
  { x: 40, height: 56 },
  { x: 60, height: 78 },
];

const BAR_WIDTH = 18;
const BAR_BOTTOM = 84;

export default function BarsLogo({
  size,
  barColors,
  cornerRadius = 8,
}: BarsLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="rotate(-20 50 50)">
        {BARS.map((bar, i) => (
          <rect
            key={bar.x}
            x={bar.x}
            y={BAR_BOTTOM - bar.height}
            width={BAR_WIDTH}
            height={bar.height}
            rx={cornerRadius}
            ry={cornerRadius}
            fill={barColors[i] ?? 'currentColor'}
          />
        ))}
      </g>
    </svg>
  );
}
