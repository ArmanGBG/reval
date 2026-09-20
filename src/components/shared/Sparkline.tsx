'use client';

// ============================================================
// Sparkline
// A tiny inline SVG line+area chart for rendering a user's daily activity
// trend inside a table cell. No external chart library — just an SVG
// polyline + polygon, sized to fit any container width.
//
// Usage:
//   <Sparkline data={[5,0,3,8,2,6,4]} width={80} height={24} />
//
// The `data` prop is an array of non-negative numbers (e.g. daily task counts).
// Zero values create visible dips in the line, making gaps in engagement
// immediately obvious.
// ============================================================

interface SparklineProps {
  /** Non-negative numbers, oldest → newest */
  data: number[];
  width?: number;
  height?: number;
  /** Stroke color (CSS var or hex). Defaults to accent green. */
  color?: string;
  /** Fill color for the area under the line. Defaults to a soft accent. */
  fillColor?: string;
  /** Show a tiny dot on the last point to indicate "now". */
  showLastDot?: boolean;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = 'var(--accent)',
  fillColor = 'color-mix(in srgb, var(--accent) 15%, transparent)',
  showLastDot = true,
}: SparklineProps) {
  if (data.length === 0) {
    return <div style={{ width, height }} className="inline-block" />;
  }

  // If all values are zero, draw a flat baseline so the cell isn't empty.
  const max = Math.max(...data, 1); // avoid divide-by-zero
  const min = Math.min(...data);
  const range = max - min || 1;

  // Padding so the line doesn't touch the edges.
  const padX = 2;
  const padY = 3;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = data.map((value, i) => {
    const x = padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    // Normalize: 0 → bottom, max → top
    const normalized = (value - min) / range;
    const y = padY + (1 - normalized) * innerH;
    return { x, y };
  });

  // Build the polyline points string.
  const linePath = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  // Build the area polygon: line + close to bottom.
  const areaPath = `${padX},${height - padY} ${linePath} ${width - padX},${height - padY}`;

  const lastPoint = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block"
      aria-hidden="true"
    >
      {/* Area fill */}
      <polygon points={areaPath} fill={fillColor} stroke="none" />
      {/* Line */}
      <polyline
        points={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Last-point dot */}
      {showLastDot && lastPoint && (
        <circle cx={lastPoint.x} cy={lastPoint.y} r="1.8" fill={color} />
      )}
    </svg>
  );
}
