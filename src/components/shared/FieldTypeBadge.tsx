import type { FieldType } from '@/lib/types';

export const FIELD_TYPE_STYLES: Record<FieldType, { badge: string; selected: string; marker: string }> = {
  'کنکور': {
    badge: 'border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--accent)]',
    selected: 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-deep)]',
    marker: 'bg-[var(--accent)]',
  },
  'نهایی': {
    badge: 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]',
    selected: 'border-[var(--warning)] bg-[var(--warning)] text-[var(--bg-deep)]',
    marker: 'bg-[var(--warning)]',
  },
};

export function FieldTypeBadge({ value, className = '' }: { value: FieldType; className?: string }) {
  const style = FIELD_TYPE_STYLES[value];
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${style.badge} ${className}`}>
    <span className={`size-1.5 rounded-full ${style.marker}`} />
    {value}
  </span>;
}
