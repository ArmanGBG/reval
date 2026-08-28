import type { FieldType } from '@/lib/types';

// Single source of truth for field-type (کنکور/نهایی) colors across the app:
// کنکور = purple, نهایی = blue. Every badge, chip, and toggle must use these
// styles so the two field types stay visually consistent everywhere.
export const FIELD_TYPE_STYLES: Record<FieldType, { badge: string; selected: string; marker: string; segment: string }> = {
  'کنکور': {
    badge: 'border-[#B07CFF]/35 bg-[#B07CFF]/10 text-[#C39DFF]',
    selected: 'border-[#B07CFF]/60 bg-[#B07CFF]/20 text-[#C39DFF]',
    marker: 'bg-[#B07CFF]',
    segment: 'bg-[#B07CFF]/10 text-[#C39DFF] hover:bg-[#B07CFF]/20',
  },
  'نهایی': {
    badge: 'border-[#4DA3FF]/35 bg-[#4DA3FF]/10 text-[#79BDFF]',
    selected: 'border-[#4DA3FF]/60 bg-[#4DA3FF]/20 text-[#79BDFF]',
    marker: 'bg-[#4DA3FF]',
    segment: 'bg-[#4DA3FF]/10 text-[#79BDFF] hover:bg-[#4DA3FF]/20',
  },
};

export function FieldTypeBadge({ value, className = '' }: { value: FieldType; className?: string }) {
  const style = FIELD_TYPE_STYLES[value];
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${style.badge} ${className}`}>
    <span className={`size-1.5 rounded-full ${style.marker}`} />
    {value}
  </span>;
}
