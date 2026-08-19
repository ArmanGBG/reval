import type { ActivityType } from '@/lib/types';

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  'مطالعه': '#4DA3FF',
  'مرور': '#B07CFF',
  'تست آموزشی': '#F2B84B',
  'تست سنجشی': '#F06464',
  'کلاس/ویدیو': '#35C49A',
};

export const ACTIVITY_SELECTED_STYLES: Record<ActivityType, string> = {
  'مطالعه': 'bg-[#4DA3FF]/15 text-[#79BDFF] border-[#4DA3FF]/40',
  'مرور': 'bg-[#B07CFF]/15 text-[#C39DFF] border-[#B07CFF]/40',
  'تست آموزشی': 'bg-[#F2B84B]/15 text-[#FFD27A] border-[#F2B84B]/40',
  'تست سنجشی': 'bg-[#F06464]/15 text-[#FF9292] border-[#F06464]/40',
  'کلاس/ویدیو': 'bg-[#35C49A]/15 text-[#72E0BF] border-[#35C49A]/40',
};

export function activitySelectedStyle(activity: ActivityType): string {
  return ACTIVITY_SELECTED_STYLES[activity];
}
