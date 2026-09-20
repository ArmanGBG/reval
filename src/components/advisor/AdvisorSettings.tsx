'use client';

import { useAppStore } from '@/lib/store';
import {
  Shield,
  Sparkles,
  FileText,
  User,
  Loader2,
} from 'lucide-react';
import { Card, SectionHeader } from './advisor-ui';
import { toPersianDigits, computeStudentStatus } from './advisor-helpers';
import { useEffect, useState } from 'react';
import { AppearanceSection } from '@/components/settings/AppearanceSection';
import { ProvinceCityPicker } from '@/components/shared/ProvinceCityPicker';
import { AVATARS } from '@/lib/constants/avatars';
import { toast } from 'sonner';

// ===== Advisor Settings =====
export function AdvisorSettings() {
  const { advisorStudents, advisorStudentsLoading, user, loadAdvisorStudents, saveProfile } = useAppStore();

  const realStudents = advisorStudents;

  useEffect(() => {
    if (user?.id && realStudents.length === 0 && !advisorStudentsLoading) {
      loadAdvisorStudents(user.id).catch(() => {});
    }
  }, [user?.id, realStudents.length, advisorStudentsLoading, loadAdvisorStudents]);

  // ===== Profile edit state =====
  // Initialize from the persisted user record. For legacy advisors whose
  // province/city are null, these start as null and the picker shows the
  // "select" placeholder — they can fill in their location optionally.
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '🦊');
  const [province, setProvince] = useState<string | null>(user?.province ?? null);
  const [city, setCity] = useState<string | null>(user?.city ?? null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync local edit state if the persisted user changes (e.g. after a fresh
  // load from /api/auth/me). This keeps the form fields in sync without
  // discarding in-flight edits.
  useEffect(() => {
    if (!user) return;
    setFirstName((prev) => prev || user.firstName || '');
    setLastName((prev) => prev || user.lastName || '');
    setSelectedAvatar((prev) => prev || user.avatar || '🦊');
    setProvince((prev) => prev ?? user.province ?? null);
    setCity((prev) => prev ?? user.city ?? null);
  }, [user?.id, user?.firstName, user?.lastName, user?.avatar, user?.province, user?.city]);

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      toast.error('نام نمی‌تواند خالی باشد');
      return;
    }
    setSavingProfile(true);
    try {
      await saveProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        avatar: selectedAvatar,
        province,
        city,
      });
      toast.success('تغییرات ذخیره شد');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در ذخیره تغییرات');
    } finally {
      setSavingProfile(false);
    }
  };

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

      {/* ===== Profile Edit Section ===== */}
      <Card>
        <SectionHeader icon={<User className="w-4 h-4" />} title="پروفایل و هویت" />
        <div className="space-y-4">
          {/* Avatar grid */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-[var(--bg-overlay)] flex items-center justify-center text-4xl border-2 border-[var(--border-strong)]">
              {selectedAvatar}
            </div>
            <div className="grid grid-cols-6 gap-2 w-full">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`btn-hover w-12 h-12 rounded-[var(--radius)] flex items-center justify-center text-2xl transition-all min-h-[44px] border ${
                    selectedAvatar === avatar
                      ? 'bg-[var(--accent-soft)] border-2 border-[var(--accent)]'
                      : 'surface-1 border-[var(--border)] hover:border-[var(--border-strong)]'
                  }`}
                  aria-label={`انتخاب آواتار ${avatar}`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* First name + Last name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--foreground-muted)]" htmlFor="advisor-firstName">نام</label>
              <input
                id="advisor-firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="نام"
                maxLength={30}
                className="w-full h-11 rounded-lg bg-[var(--bg-overlay)] border border-[var(--border)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--foreground-muted)]" htmlFor="advisor-lastName">نام خانوادگی</label>
              <input
                id="advisor-lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="نام خانوادگی (اختیاری)"
                maxLength={50}
                className="w-full h-11 rounded-lg bg-[var(--bg-overlay)] border border-[var(--border)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/50 transition-all"
              />
            </div>
          </div>

          {/* Province + City picker (optional for legacy advisors) */}
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--foreground-muted)]">استان و شهر</label>
            <ProvinceCityPicker
              province={province}
              city={city}
              onProvinceChange={(p) => {
                setProvince(p);
                // Province change resets the city — the city list is now different.
                setCity(null);
              }}
              onCityChange={setCity}
            />
            <p className="text-[10px] text-[var(--foreground-subtle)] leading-relaxed">
              این اطلاعات اختیاری است و به دانش‌آموزان کمک می‌کند موقعیت جغرافیایی شما را بدانند.
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile || !firstName.trim()}
            className="btn-hover glow-hover w-full bg-[var(--accent)] text-[var(--bg-deep)] font-bold py-3 rounded-[var(--radius)] min-h-[44px] hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {savingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              'ذخیره تغییرات'
            )}
          </button>
        </div>
      </Card>

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

      <AppearanceSection theme={useAppStore.getState().theme} setTheme={(t) => useAppStore.getState().setTheme(t)} />

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
