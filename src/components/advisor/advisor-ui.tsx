'use client';

import { motion } from 'framer-motion';
import { toPersianDigits } from './advisor-helpers';

// ===== MetricBar =====
export function MetricBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-[var(--foreground-muted)] w-16 text-right shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[11px] text-[var(--foreground)] w-8 text-left shrink-0 font-medium tabular-nums">{toPersianDigits(value)}</span>
    </div>
  );
}

// ===== MiniRadar =====
export function MiniRadar({ grades, size = 140 }: { grades: Record<string, number>; size?: number }) {
  const entries = Object.entries(grades);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 18;
  const points = entries.map(([_, val], i) => {
    const angle = (Math.PI * 2 * i) / entries.length - Math.PI / 2;
    return { x: cx + r * (val / 20) * Math.cos(angle), y: cy + r * (val / 20) * Math.sin(angle) };
  });
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto block">
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.08" />
        </radialGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <circle key={s} cx={cx} cy={cy} r={r * s} fill="none" stroke="var(--border)" strokeWidth={1} />
      ))}
      {entries.map(([_, _v], i) => {
        const a = (Math.PI * 2 * i) / entries.length - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="var(--border)" strokeWidth={1} />;
      })}
      <path d={pathData} fill="url(#radarFill)" stroke="var(--accent)" strokeWidth={1.5} strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--accent)" stroke="var(--bg-elevated)" strokeWidth={1.5} />
      ))}
      {entries.map(([name], i) => {
        const a = (Math.PI * 2 * i) / entries.length - Math.PI / 2;
        return (
          <text
            key={i}
            x={cx + (r + 12) * Math.cos(a)}
            y={cy + (r + 12) * Math.sin(a)}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-[var(--foreground-muted)]"
            style={{ fontSize: size < 150 ? '8px' : '10px', fontFamily: 'var(--font-vazirmatn)' }}
          >
            {name}
          </text>
        );
      })}
    </svg>
  );
}

// ===== ModalInput =====
export function ModalInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block font-medium">{label}</label>
      <input
        {...props}
        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)]/40 focus:bg-[var(--bg-overlay)] transition-colors"
      />
    </div>
  );
}

// ===== ModalSelect =====
export function ModalSelect({ label, children, ...props }: { label: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="text-[11px] text-[var(--foreground-muted)] mb-1.5 block font-medium">{label}</label>
      <select
        {...props}
        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40 focus:bg-[var(--bg-overlay)] transition-colors"
      >
        {children}
      </select>
    </div>
  );
}

// ===== SectionHeader (reusable) =====
export function SectionHeader({ icon, title, accent = 'var(--accent)', action }: { icon: React.ReactNode; title: string; accent?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center ring-1 ring-inset ring-white/5"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
            color: accent,
            boxShadow: `0 0 16px -4px color-mix(in srgb, ${accent} 25%, transparent)`,
          }}
        >
          {icon}
        </span>
        <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
      </div>
      {action}
    </div>
  );
}

// ===== Card wrapper (reusable) =====
export function Card({ className = '', children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`surface-1 rounded-xl md:rounded-2xl p-4 md:p-5 edge-highlight ${className}`} {...rest}>
      {children}
    </div>
  );
}
