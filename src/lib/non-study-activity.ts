// ===== Non-Study Activities =====
// Shared category registry + helpers used by the entry modal, the day plan,
// the activities tab, and the analytics overview. Categories are stored in
// the DB by their stable English key; labels/icons live only here.

export const NON_STUDY_CATEGORIES = [
  { key: 'MEDIA', label: 'رسانه و فضای مجازی', icon: '📱' },
  { key: 'GAMES', label: 'بازی و سرگرمی', icon: '🎮' },
  { key: 'SOCIAL', label: 'گردش و تعاملات', icon: '☕' },
  { key: 'HEALTH', label: 'سلامت و ورزش', icon: '🏃‍♂️' },
  { key: 'LANGUAGE', label: 'کلاس زبان', icon: '🗣️' },
  { key: 'MUSIC', label: 'کلاس موسیقی', icon: '🎵' },
] as const;

export type NonStudyCategoryKey = (typeof NON_STUDY_CATEGORIES)[number]['key'];

export function isNonStudyCategoryKey(value: unknown): value is NonStudyCategoryKey {
  return typeof value === 'string' && NON_STUDY_CATEGORIES.some((category) => category.key === value);
}

// Legacy key mapping — 'SKILL' (مهارت‌های فردی) was replaced by the more
// specific LANGUAGE/MUSIC categories; old records map to کلاس زبان.
const LEGACY_CATEGORY_KEYS: Record<string, string> = { SKILL: 'LANGUAGE' };

export function nonStudyCategory(key: string): { key: string; label: string; icon: string } {
  const resolved = LEGACY_CATEGORY_KEYS[key] ?? key;
  return NON_STUDY_CATEGORIES.find((category) => category.key === resolved)
    ?? { key: resolved, label: 'سایر', icon: '✨' };
}

/** Soft, category-agnostic tint used by entry buttons and cards (works on dark + light themes). */
export const NON_STUDY_STYLE = {
  text: 'text-[#7EB8FF]',
  softBg: 'bg-[#4DA3FF]/10',
  border: 'border-[#4DA3FF]/30',
  dot: '#4DA3FF',
};

/** Aggregated total per category for a set of activities. */
export interface NonStudyCategoryTotal {
  key: string;
  label: string;
  icon: string;
  minutes: number;
  count: number;
}

export function sumNonStudyMinutesByCategory(
  activities: Array<{ category: string; durationMinutes: number | null }>,
): NonStudyCategoryTotal[] {
  const totals = new Map<string, NonStudyCategoryTotal>();
  for (const activity of activities) {
    const meta = nonStudyCategory(activity.category);
    const entry = totals.get(meta.key) ?? { key: meta.key, label: meta.label, icon: meta.icon, minutes: 0, count: 0 };
    entry.minutes += activity.durationMinutes ?? 0;
    entry.count += 1;
    totals.set(meta.key, entry);
  }
  return NON_STUDY_CATEGORIES
    .map((category) => totals.get(category.key))
    .filter((entry): entry is NonStudyCategoryTotal => Boolean(entry && (entry.count > 0 || entry.minutes > 0)));
}

/** Total minutes across every category. */
export function sumNonStudyMinutes(activities: Array<{ durationMinutes: number | null }>): number {
  return activities.reduce((sum, activity) => sum + (activity.durationMinutes ?? 0), 0);
}
