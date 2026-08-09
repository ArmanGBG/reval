'use client';

import { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import {
  ChevronRight,
  Crown,
  GraduationCap,
  UserCheck,
  Building2,
  Phone,
  Calendar,
  Clock,
  Target,
  BarChart3,
  BookOpen,
  CheckCircle2,
  XCircle,
  Activity,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().split('').map((d) => persianDigits[parseInt(d)] ?? d).join('');
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: LucideIcon }> = {
  student: { label: 'دانش‌آموز', color: 'text-mint', bg: 'bg-mint/15', icon: GraduationCap },
  advisor: { label: 'مشاور', color: 'text-muted-foreground', bg: 'bg-white/5', icon: ShieldCheck },
  institute_manager: { label: 'مدیر آموزشگاه', color: 'text-gold', bg: 'bg-gold/15', icon: UserCheck },
};

export default function UserDetail() {
  const { selectedGlobalUserId, globalUsers, updateGlobalUser, loadGlobalUsers, setCurrentView } = useAppStore();
  useEffect(() => { if (globalUsers.length === 0) loadGlobalUsers().catch(() => {}); }, [globalUsers.length, loadGlobalUsers]);

  const user = useMemo(() =>
    globalUsers.find((u) => u.id === selectedGlobalUserId),
    [selectedGlobalUserId, globalUsers]
  );

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-in-up">
        <UserCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">کاربری انتخاب نشده</p>
        <button
          onClick={() => setCurrentView('sa-users')}
          className="btn-hover text-gold text-sm font-bold"
        >
          بازگشت به لیست کاربران
        </button>
      </div>
    );
  }

  const roleCfg = ROLE_CONFIG[user.role];
  const RoleIcon = roleCfg.icon;

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in-up">
      {/* ============ Back Header ============ */}
      <header className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrentView('sa-users')}
          className="nav-item-hover flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-[10px] -mr-3"
        >
          <ChevronRight className="w-4 h-4 flip-rtl" />
          بازگشت به کاربران
        </button>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gold/15 text-gold border border-gold/30">
          <Crown className="w-3 h-3" />
          GOD VIEW
        </span>
      </header>

      {/* ============ 2-col Grid: Profile+Activity Left, Metrics Right ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* ----- Left col-span-7: Profile + Activity Log ----- */}
        <div className="lg:col-span-7 space-y-4 md:space-y-6">
          {/* Profile Card */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative surface-1 edge-highlight rounded-[20px] p-5 md:p-6 overflow-hidden"
          >
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[16px] bg-gold/15 border border-gold/25 flex items-center justify-center text-3xl md:text-4xl shrink-0">
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg md:text-xl font-bold text-foreground">{user.name}</h1>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${roleCfg.bg} ${roleCfg.color} font-medium`}>
                      <RoleIcon className="w-3 h-3" />
                      {roleCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      user.status === 'active' ? 'bg-[var(--success)]/15 text-[var(--success)]' : 'bg-[var(--danger)]/15 text-[var(--danger)]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />
                      {user.status === 'active' ? 'فعال' : 'معلق'}
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums" dir="ltr">{user.phone}</span>
                  </div>
                </div>
                <button
                  onClick={() => updateGlobalUser(user.id, { status: user.status === 'active' ? 'suspended' : 'active' }).catch(() => {})}
                  className={`btn-hover p-3 rounded-[12px] font-bold text-xs border ${
                    user.status === 'active'
                      ? 'bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 border-[var(--danger)]/20'
                      : 'bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 border-[var(--success)]/20'
                  }`}
                  title={user.status === 'active' ? 'تعلیق کاربر' : 'فعال‌سازی کاربر'}
                >
                  {user.status === 'active' ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </button>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">{user.instituteName}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                  <span className="text-xs text-muted-foreground">عضویت: <span className="text-foreground/80 tabular-nums">{toPersianDigits(user.joinDate)}</span></span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                  <span className="text-xs text-muted-foreground tabular-nums" dir="ltr">{user.phone}</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Activity Log */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="surface-1 rounded-[16px] p-5 md:p-6"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold" />
              تاریخچه فعالیت
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-[var(--bg-overlay)] rounded-[10px] border border-[var(--border)]">
                <div className="w-2 h-2 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">تاریخ عضویت</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{toPersianDigits(user.joinDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[var(--bg-overlay)] rounded-[10px] border border-[var(--border)]">
                <div className="w-2 h-2 rounded-full bg-gold mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">آموزشگاه متعلق</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{user.instituteName}</p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* ----- Right col-span-5: Metrics ----- */}
        <aside className="lg:col-span-5 space-y-4 md:space-y-6">
          {/* Student metrics */}
          {user.role === 'student' && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="surface-1 rounded-[16px] p-5 md:p-6"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gold" />
                عملکرد تحصیلی
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-[10px] bg-gold/10 border border-gold/15 p-3 text-center">
                  <Target className="w-4 h-4 text-gold mx-auto mb-1" />
                  <p className="text-base md:text-lg font-bold text-foreground tabular-nums">{toPersianDigits(user.completionRate)}٪</p>
                  <p className="text-[10px] text-muted-foreground">تکمیل</p>
                </div>
                <div className="rounded-[10px] bg-[var(--accent-soft)] border border-[var(--accent)]/15 p-3 text-center">
                  <Clock className="w-4 h-4 text-[var(--accent)] mx-auto mb-1" />
                  <p className="text-base md:text-lg font-bold text-foreground tabular-nums">{toPersianDigits(user.studyHours)}</p>
                  <p className="text-[10px] text-muted-foreground">ساعت</p>
                </div>
              </div>

              {/* Completion Progress */}
              <div className="mt-5 pt-5 border-t border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">پیشرفت تکمیل وظایف</span>
                  <span className="text-xs text-gold font-bold tabular-nums">{toPersianDigits(user.completionRate)}٪</span>
                </div>
                <div className="h-2.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${user.completionRate}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-full ${user.completionRate >= 75 ? 'bg-[var(--success)]' : user.completionRate >= 50 ? 'bg-[var(--warning)]' : 'bg-[var(--danger)]'}`}
                  />
                </div>
              </div>
            </motion.section>
          )}

          {/* Advisor metrics */}
          {user.role === 'advisor' && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="surface-1 rounded-[16px] p-5 md:p-6"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-muted-foreground" />
                عملکرد مشاور
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[10px] bg-gold/10 border border-gold/15 p-4 text-center">
                  <Target className="w-4 h-4 text-gold mx-auto mb-2" />
                  <p className="text-xl font-bold text-foreground tabular-nums">{toPersianDigits(user.completionRate)}٪</p>
                  <p className="text-[11px] text-muted-foreground mt-1">نرخ تکمیل دانش‌آموزان</p>
                </div>
                <div className="rounded-[10px] bg-[var(--success)]/10 border border-[var(--success)]/15 p-4 text-center">
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)] mx-auto mb-2" />
                  <p className="text-sm font-bold text-foreground">{user.status === 'active' ? 'فعال' : 'معلق'}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">وضعیت حساب</p>
                </div>
              </div>
            </motion.section>
          )}

          {/* Institute Manager Info */}
          {user.role === 'institute_manager' && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="surface-1 rounded-[16px] p-5 md:p-6"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gold" />
                اطلاعات مدیر
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 bg-[var(--bg-overlay)] rounded-[10px]">
                  <span className="text-xs text-muted-foreground">آموزشگاه</span>
                  <span className="text-xs text-foreground font-medium">{user.instituteName}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[var(--bg-overlay)] rounded-[10px]">
                  <span className="text-xs text-muted-foreground">وضعیت</span>
                  <span className={`text-xs font-medium ${user.status === 'active' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {user.status === 'active' ? 'فعال' : 'معلق'}
                  </span>
                </div>
              </div>
            </motion.section>
          )}

          {/* Action panel */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="surface-1 rounded-[16px] p-5"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Crown className="w-4 h-4 text-gold" />
              اقدامات مدیریتی
            </h3>
            <button
              onClick={() => updateGlobalUser(user.id, { status: user.status === 'active' ? 'suspended' : 'active' }).catch(() => {})}
              className={`btn-hover w-full flex items-center justify-center gap-2 py-3 rounded-[12px] text-sm font-bold border ${
                user.status === 'active'
                  ? 'bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 border-[var(--danger)]/20'
                  : 'bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 border-[var(--success)]/20'
              }`}
            >
              {user.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {user.status === 'active' ? 'تعلیق کاربر' : 'فعال‌سازی کاربر'}
            </button>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
