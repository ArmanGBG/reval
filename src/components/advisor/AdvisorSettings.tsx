'use client';

import { useAppStore } from '@/lib/store';
import {
  Shield,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Card, SectionHeader } from './advisor-ui';
import { toPersianDigits, computeStudentStatus } from './advisor-helpers';
import { useEffect } from 'react';

// ===== Advisor Settings =====
export function AdvisorSettings() {
  const { advisorStudents, advisorStudentsLoading, user, loadAdvisorStudents } = useAppStore();

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

      <div>
        <Card>
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
