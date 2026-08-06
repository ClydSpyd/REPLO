import { useTheme } from "../../context/theme";

interface BarsLogoProps {
  /** Width and height of the (square) logo, in pixels. */
  size: number;
  /** Fill colors for the three bars, shortest to tallest. */
  barColors?: string[];
  /**
   * Bar corner radius in viewBox units. Defaults to 8 (soft). Use a smaller
   * value (e.g. 3) for a more angular mark that pairs with angular wordmarks.
   */
  cornerRadius?: number;
  className?: string;
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


export default function BarsLogo({
  size,
  cornerRadius = 8,
  className,
  barColors, // default to dark mode colors for the header and nav
  // barColors = ['#E8A33D', '#E8821E', '#D2570D'],
}: BarsLogoProps) {
  const { theme } = useTheme();

  const finalColors =
    barColors ?? (theme === 'dark' ? DARK_MODE_COLORS : LIGHT_MODE_COLORS);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className ?? ''}
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
            fill={finalColors[i] ?? 'currentColor'}
          />
        ))}
      </g>
    </svg>
  );
}
