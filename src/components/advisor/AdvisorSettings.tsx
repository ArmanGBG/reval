'use client';

import { useAppStore } from '@/lib/store';
import {
  Shield,
  Activity,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Card, SectionHeader } from './advisor-ui';
import { toPersianDigits, computeStudentStatus } from './advisor-helpers';
import { useEffect } from 'react';

// ===== Advisor Settings =====
export function AdvisorSettings() {
  const { hapticFeedback, notificationReminders, setHapticFeedback, setNotificationReminders, advisorStudents, advisorStudentsLoading, user, loadAdvisorStudents } = useAppStore();

  const realStudents = advisorStudents;

  useEffect(() => {
    if (user?.id && realStudents.length === 0 && !advisorStudentsLoading) {
      loadAdvisorStudents(user.id).catch(() => {});
    }
  }, [user?.id, realStudents.length, advisorStudentsLoading, loadAdvisorStudents]);

  return (
    <div className="space-y-4 md:space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2">
        <span className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
          <Shield className="w-4.5 h-4.5 text-[var(--accent)]" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">تنظیمات مشاور</h2>
          <p className="text-[11px] text-[var(--foreground-muted)]">پیکربندی پنل شخصی</p>
        </div>
      </div>

      {/* Two-column layout on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* App Settings */}
        <Card className="md:col-span-1">
          <SectionHeader icon={<Activity className="w-4 h-4" />} title="تنظیمات اپلیکیشن" />
          <div className="space-y-2">
            <div className="flex items-center justify-between min-h-[52px] py-2 border-b border-[var(--border)] last:border-0">
              <div>
                <p className="text-[var(--foreground)] text-sm font-medium">بازخورد لرزشی</p>
                <p className="text-[var(--foreground-muted)] text-[11px] mt-0.5">لرزش هنگام تعامل</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hapticFeedback}
                  onChange={(e) => setHapticFeedback(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--bg-overlay)] border border-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)] peer-checked:border-[var(--accent)]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between min-h-[52px] py-2 border-b border-[var(--border)] last:border-0">
              <div>
                <p className="text-[var(--foreground)] text-sm font-medium">یادآوری اعلان‌ها</p>
                <p className="text-[var(--foreground-muted)] text-[11px] mt-0.5">اعلان برای برنامه مطالعه</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationReminders}
                  onChange={(e) => setNotificationReminders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--bg-overlay)] border border-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)] peer-checked:border-[var(--accent)]"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Quick stats card */}
        <Card className="md:col-span-1">
          <SectionHeader icon={<Sparkles className="w-4 h-4" />} title="خلاصه فعالیت" />
          <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--bg-overlay)]/60 rounded-lg p-3 border border-[var(--border)]">
                <p className="text-2xl font-black text-[var(--accent)] tabular-nums">{toPersianDigits(realStudents.length)}</p>
                <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">دانش‌آموز فعال</p>
              </div>
              <div className="bg-[var(--bg-overlay)]/60 rounded-lg p-3 border border-[var(--border)]">
                <p className="text-2xl font-black text-[var(--warning)] tabular-nums">
                  {toPersianDigits(realStudents.filter(s => {
                    const st = computeStudentStatus(s);
                    return st === 'at-risk' || st === 'critical';
                  }).length)}
                </p>
                <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">نیازمند مداخله</p>
              </div>
              <div className="bg-[var(--bg-overlay)]/60 rounded-lg p-3 border border-[var(--border)]">
                <p className="text-2xl font-black text-[var(--accent)] tabular-nums">
                  {toPersianDigits(Math.round(realStudents.reduce((a, s) => a + (s.studyHoursPerWeek || 0), 0) / (realStudents.length || 1)))}
                </p>
                <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">میانگین ساعت</p>
              </div>
          </div>
        </Card>
      </div>

      {/* About */}
      <Card>
        <SectionHeader icon={<FileText className="w-4 h-4" />} title="درباره پنل مشاور" accent="var(--accent)" />
        <p className="text-[13px] text-[var(--foreground)] leading-relaxed">
          این پنل به مشاوران تحصیلی امکان مدیریت و تحلیل وضعیت دانش‌آموزان را می‌دهد. از اینجا می‌توانید پروفایل دانش‌آموزان را مشاهده، ارزیابی روانشناختی انجام و برنامه مداخله‌ای تعریف کنید.
        </p>
      </Card>

      {/* Version */}
      <div className="text-center space-y-1 pb-4 pt-2">
        <p className="text-[var(--foreground-muted)] text-sm font-medium">روال نسخه ۱.۰.۰ — پنل مشاور</p>
        <p className="text-[var(--foreground-subtle)] text-xs">ساخته شده برای مشاوران تحصیلی</p>
      </div>
    </div>
  );
}
