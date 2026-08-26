import type { ActivityType } from '@/lib/types';

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  'مطالعه': '#4DA3FF',
  'مرور': '#B07CFF',
  'تست آموزشی': '#F59E4F',
  'تست سنجشی': '#F06464',
  'کلاس/ویدیو': '#35C49A',
};

export const ACTIVITY_SELECTED_STYLES: Record<ActivityType, string> = {
  'مطالعه': 'bg-[#4DA3FF]/15 text-[#79BDFF] border-[#4DA3FF]/40',
  'مرور': 'bg-[#B07CFF]/15 text-[#C39DFF] border-[#B07CFF]/40',
  'تست آموزشی': 'bg-[#F59E4F]/15 text-[#F9C784] border-[#F59E4F]/40',
  'تست سنجشی': 'bg-[#F06464]/15 text-[#FF9292] border-[#F06464]/40',
  'کلاس/ویدیو': 'bg-[#35C49A]/15 text-[#72E0BF] border-[#35C49A]/40',
};

export function activitySelectedStyle(activity: ActivityType): string {
  return ACTIVITY_SELECTED_STYLES[activity];
}
