'use client';

import { useAppStore } from '@/lib/store';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Shield,
  Save,
  Check,
  Globe,
  Lock,
  Database,
  Palette,
  AlertTriangle,
  Server,
} from 'lucide-react';
import { AppearanceSection } from '@/components/settings/AppearanceSection';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().split('').map((d) => persianDigits[parseInt(d)] ?? d).join('');
}

export default function SuperAdminSettings() {
  const { theme, setTheme } = useAppStore();
  const [saved, setSaved] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowNewRegistrations, setAllowNewRegistrations] = useState(true);
  const [maxFreeStudents, setMaxFreeStudents] = useState('5');
  const [maxBasicStudents, setMaxBasicStudents] = useState('15');
  const [maxProStudents, setMaxProStudents] = useState('50');
  const [maxEnterpriseStudents, setMaxEnterpriseStudents] = useState('200');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Toggle switch (accent for super admin)
  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
        on ? 'bg-[var(--accent)]' : 'bg-[var(--bg-overlay)] border border-[var(--border-strong)]'
      }`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-0.5' : 'translate-x-6'}`} />
    </button>
  );

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in-up">
      {/* ============ Page Header ============ */}
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 md:w-12 md:h-12 rounded-[14px] bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5 md:w-6 md:h-6 text-gold" />
        </div>
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">تنظیمات سیستم</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">پیکربندی سطح پلتفرم روال</p>
        </div>
      </header>

      {/* ============ 2-col Grid Layout ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* ----- Platform Control ----- */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-hover edge-highlight rounded-[16px] p-5 md:p-6 bg-[var(--accent-soft)] border border-[var(--accent)]/25"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-[10px] bg-[var(--accent)]/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">کنترل پلتفرم</h3>
              <p className="text-[11px] text-muted-foreground">تنظیمات دسترسی و ثبت‌نام</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-3 bg-[var(--bg-overlay)] rounded-[12px] border border-[var(--border)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${maintenanceMode ? 'bg-[var(--danger)]/15' : 'bg-[var(--success)]/15'}`}>
                  <AlertTriangle className={`w-4 h-4 ${maintenanceMode ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground font-medium">حالت تعمیرات</p>
                  <p className="text-[11px] text-muted-foreground">غیرفعال کردن موقت دسترسی کاربران</p>
                </div>
              </div>
              <Toggle on={maintenanceMode} onClick={() => setMaintenanceMode(!maintenanceMode)} />
            </div>

            {/* Allow New Registrations */}
            <div className="flex items-center justify-between p-3 bg-[var(--bg-overlay)] rounded-[12px] border border-[var(--border)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${allowNewRegistrations ? 'bg-[var(--success)]/15' : 'bg-[var(--bg-overlay)]'}`}>
                  <Globe className={`w-4 h-4 ${allowNewRegistrations ? 'text-[var(--success)]' : 'text-muted-foreground'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground font-medium">ثبت‌نام جدید</p>
                  <p className="text-[11px] text-muted-foreground">اجازه ثبت‌نام آموزشگاه‌های جدید</p>
                </div>
              </div>
              <Toggle on={allowNewRegistrations} onClick={() => setAllowNewRegistrations(!allowNewRegistrations)} />
            </div>
          </div>
        </motion.section>

        {/* ----- Subscription Limits ----- */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-hover surface-1 edge-highlight rounded-[16px] p-5 md:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-[10px] bg-gold/15 flex items-center justify-center">
              <Lock className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">محدودیت اشتراک‌ها</h3>
              <p className="text-[11px] text-muted-foreground">حداکثر دانش‌آموز هر طرح</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'رایگان', value: maxFreeStudents, set: setMaxFreeStudents, tint: 'text-muted-foreground' },
              { label: 'پایه', value: maxBasicStudents, set: setMaxBasicStudents, tint: 'text-muted-foreground' },
              { label: 'حرفه‌ای', value: maxProStudents, set: setMaxProStudents, tint: 'text-gold' },
              { label: 'سازمانی', value: maxEnterpriseStudents, set: setMaxEnterpriseStudents, tint: 'text-gold' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3 p-2.5 bg-[var(--bg-overlay)] rounded-[10px] border border-[var(--border)]">
                <span className={`text-xs font-medium w-16 ${row.tint}`}>{row.label}</span>
                <input
                  type="number"
                  value={row.value}
                  onChange={(e) => row.set(e.target.value)}
                  className="flex-1 bg-transparent border-0 text-sm text-foreground text-center focus:outline-none tabular-nums"
                  dir="ltr"
                />
                <span className="text-[11px] text-muted-foreground">دانش‌آموز</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ----- System Info ----- */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-hover surface-1 edge-highlight rounded-[16px] p-5 md:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-[10px] bg-gold/15 flex items-center justify-center">
              <Database className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">اطلاعات سیستم</h3>
              <p className="text-[11px] text-muted-foreground">نسخه و وضعیت زیرساخت</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-[var(--bg-overlay)] rounded-[10px] border border-[var(--border)]">
              <span className="text-xs text-muted-foreground">نسخه پلتفرم</span>
              <span className="text-xs text-foreground font-bold tabular-nums" dir="ltr">v2.1.0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--bg-overlay)] rounded-[10px] border border-[var(--border)]">
              <span className="text-xs text-muted-foreground">آخرین بروزرسانی</span>
              <span className="text-xs text-foreground font-bold tabular-nums">{toPersianDigits('۱۴۰۳/۱۱/۰۱')}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--bg-overlay)] rounded-[10px] border border-[var(--border)]">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Server className="w-3 h-3" /> وضعیت سرور
              </span>
              <span className="text-xs text-[var(--success)] font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                سالم
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--bg-overlay)] rounded-[10px] border border-[var(--border)]">
              <span className="text-xs text-muted-foreground">پایگاه داده</span>
              <span className="text-xs text-foreground font-bold" dir="ltr">SQLite</span>
            </div>
          </div>
        </motion.section>

        {/* ----- Appearance / Branding placeholder ----- */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-hover surface-1 edge-highlight rounded-[16px] p-5 md:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-[10px] bg-gold/15 flex items-center justify-center">
              <Palette className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">ظاهر پلتفرم</h3>
              <p className="text-[11px] text-muted-foreground">تم و رنگ‌بندی</p>
            </div>
          </div>

          <div className="space-y-3">
            <AppearanceSection theme={theme} setTheme={setTheme} />
            <div className="flex items-center justify-between p-3 bg-[var(--bg-overlay)] rounded-[10px] border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-gold/15 flex items-center justify-center">
                  <span className="text-xs font-bold text-gold">ط</span>
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">رنگ طلایی سوپر ادمین</p>
                  <p className="text-[11px] text-muted-foreground">برای پنل GOD MODE</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-gold/15 text-gold font-medium">فعال</span>
            </div>
          </div>
        </motion.section>
      </div>

      {/* ============ Save Button (sticky bottom on mobile, fixed on desktop) ============ */}
      <div className="lg:sticky lg:bottom-4 lg:flex lg:justify-end">
        <button
          onClick={handleSave}
          className="btn-hover glow-hover glow-hover-gold w-full lg:w-auto flex items-center justify-center gap-2 bg-gold text-white px-6 py-3 rounded-[12px] text-sm font-bold shadow-lg shadow-black/20"
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.div
                key="saved"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>ذخیره شد!</span>
              </motion.div>
            ) : (
              <motion.div
                key="save"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره تنظیمات سیستم</span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}
