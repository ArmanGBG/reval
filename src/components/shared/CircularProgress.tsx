'use client';

import { motion } from 'framer-motion';
import { toPersianDigits } from '@/lib/persian-date';

// ===== Circular Progress Ring Component =====
// A reusable SVG circular progress indicator with animated stroke.

interface CircularProgressProps {
  /** Progress value from 0 to 100 */
  value: number;
  /** Overall size of the SVG in pixels */
  size?: number;
  /** Stroke width of the progress arc */
  strokeWidth?: number;
  /** Color of the progress arc (CSS value) */
  color?: string;
  /** Optional Persian label text shown below the value */
  label?: string;
  /** Whether to show the percentage value in the center */
  showValue?: boolean;
  /** Custom content to render in the center instead of value% */
  centerContent?: React.ReactNode;
  /** Animation delay in seconds */
  delay?: number;
}

export default function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
  color = 'var(--accent)',
  label,
  showValue = true,
  centerContent,
  delay = 0,
}: CircularProgressProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));

  // Geometry calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;

  // Center point
  const center = size / 2;

  return (
    <div
      className="relative inline-flex flex-col items-center"
      style={{ width: size, height: size }}
      dir="ltr"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={`پیشرفت ${toPersianDigits(Math.round(clampedValue))} درصد`}
      >
        {/* Background track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            type: 'spring',
            stiffness: 80,
            damping: 20,
            duration: 0.8,
            delay,
          }}
          style={{ filter: `drop-shadow(0 0 ${strokeWidth}px ${color === 'var(--accent)' ? 'var(--accent-glow)' : 'rgba(62,180,137,0.25)'})` }}
        />
      </svg>

      {/* Center text overlay */}
      {(showValue || centerContent || label) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerContent ? (
            centerContent
          ) : showValue ? (
            <>
              <span className="font-bold text-[var(--foreground)] tabular-nums leading-none" style={{ fontSize: size * 0.2 }}>
                {toPersianDigits(Math.round(clampedValue))}٪
              </span>
              {label && (
                <span className="text-[var(--foreground-muted)] mt-0.5 leading-tight text-center" style={{ fontSize: size * 0.09 }}>
                  {label}
                </span>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
