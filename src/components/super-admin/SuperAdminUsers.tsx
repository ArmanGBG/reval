'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { GlobalUserRole, UserAccountStatus } from '@/lib/types';
import { exportCsv } from '@/lib/csv';
import { trendSummary } from '@/lib/user-engagement';
import { Sparkline } from '@/components/shared/Sparkline';
import {
  Users,
  Search,
  Eye,
  Filter,
  Crown,
  Building2,
  GraduationCap,
  Shield,
  UserCheck,
  Plus,
  X,
  Trash2,
  Download,
  Loader2,
  Ban,
  CheckCircle2,
  ListChecks,
  RefreshCcw,
  type LucideIcon,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().split('').map((d) => persianDigits[parseInt(d)] ?? d).join('');
}

// Format an ISO datetime as a short relative time in Persian.
// Examples: "همین الان", "۵ دقیقه پیش", "۳ ساعت پیش", "۲ روز پیش", "۱۴۰۵/۰۶/۳۱"
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'همین الان';
  if (diffMin < 60) return `${toPersianDigits(diffMin)} دقیقه پیش`;
  if (diffHr < 24) return `${toPersianDigits(diffHr)} ساعت پیش`;
  if (diffDay < 7) return `${toPersianDigits(diffDay)} روز پیش`;
  // Older than a week — show the ISO date.
  return date.toISOString().split('T')[0];
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: LucideIcon }> = {
  student: { label: 'دانش‌آموز', color: 'text-mint', bg: 'bg-mint/15', icon: GraduationCap },
  advisor: { label: 'مشاور', color: 'text-muted-foreground', bg: 'bg-white/5', icon: Shield },
  institute_manager: { label: 'مدیر آموزشگاه', color: 'text-gold', bg: 'bg-gold/15', icon: UserCheck },
};

export default function SuperAdminUsers() {
  const { globalUsers, deleteGlobalUser, createGlobalUser, loadGlobalUsers, platformInstitutes, loadPlatformInstitutes, navigateTo } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadGlobalUsers();
      toast.success('لیست کاربران به‌روزرسانی شد');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'به‌روزرسانی لیست ناموفق بود');
    } finally {
      // Tiny delay so the spin animation is visible even on a fast network —
      // otherwise the icon flashes for a single frame and feels broken.
      setTimeout(() => setRefreshing(false), 350);
    }
  };

  useEffect(() => {
    loadGlobalUsers().catch((error) => toast.error(error instanceof Error ? error.message : 'بارگذاری کاربران انجام نشد'));
    loadPlatformInstitutes().catch((error) => toast.error(error instanceof Error ? error.message : 'بارگذاری آموزشگاه‌ها انجام نشد'));
  }, [loadGlobalUsers, loadPlatformInstitutes]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | GlobalUserRole>('all');
  const [filterInstitute, setFilterInstitute] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | UserAccountStatus>('all');
  const [advisorName, setAdvisorName] = useState('');
  const [advisorPhone, setAdvisorPhone] = useState('');
  const [creatingAdvisor, setCreatingAdvisor] = useState(false);
  const [showAdvisorForm, setShowAdvisorForm] = useState(false);
  const [newRole, setNewRole] = useState<'student' | 'advisor'>('student');
  const [newInstituteId, setNewInstituteId] = useState<string>('');
  const [newGrade, setNewGrade] = useState('دوازدهم');
  const [newMajor, setNewMajor] = useState('تجربی');
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; name: string } | null>(null);

  // ===== Bulk selection state =====
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const createAdvisor = async () => {
    setCreatingAdvisor(true);
    try {
      await createGlobalUser({ name: advisorName, phone: advisorPhone, role: newRole, instituteId: newInstituteId || null, ...(newRole === 'student' ? { grade: newGrade, major: newMajor } : {}) });
      toast.success('حساب کاربر در دیتابیس ساخته شد');
      setAdvisorName(''); setAdvisorPhone(''); setShowAdvisorForm(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'ساخت مشاور انجام نشد'); }
    finally { setCreatingAdvisor(false); }
  };

  const filteredUsers = useMemo(() => {
    let result = [...globalUsers];

    if (searchQuery) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((u) => u.name.includes(q) || u.phone.includes(q) || u.instituteName.includes(q));
    }

    if (filterRole !== 'all') {
      result = result.filter((u) => u.role === filterRole);
    }

    if (filterInstitute !== 'all') {
      result = result.filter((u) => u.instituteId === filterInstitute);
    }

    if (filterStatus !== 'all') {
      result = result.filter((u) => u.status === filterStatus);
    }

    return result;
  }, [globalUsers, searchQuery, filterRole, filterInstitute, filterStatus]);

  const handleViewUser = (id: string) => {
    navigateTo({ view: 'sa-user-detail', selectedGlobalUserId: id });
  };

  // ===== CSV export (current filtered list) =====
  const handleExportCsv = () => {
    if (filteredUsers.length === 0) {
      toast.error('برای خروجی CSV حداقل یک کاربر لازم است');
      return;
    }
    const headers = [
      'نام', 'شماره', 'نقش', 'پایه', 'رشته', 'استان', 'شهر', 'وضعیت', 'آموزشگاه', 'تاریخ عضویت',
      // Engagement columns (new)
      'تعداد کل تسک‌ها', 'تسک‌های انجام‌شده', 'نرخ تکمیل (٪)', 'آخرین فعالیت', 'خلاصه روند',
    ];
    const rows = filteredUsers.map((u) => [
      u.name,
      u.phone,
      ROLE_CONFIG[u.role]?.label ?? u.role,
      u.grade ?? '',
      u.major ?? '',
      u.province ?? '',
      u.city ?? '',
      u.status === 'active' ? 'فعال' : 'معلق',
      u.instituteName,
      u.joinDate,
      // Engagement fields
      String(u.totalTasks ?? 0),
      String(u.completedTasks ?? 0),
      String(u.completionRate ?? 0),
      u.lastTaskInteraction ? new Date(u.lastTaskInteraction).toISOString().split('T')[0] : '',
      trendSummary(u.activityTrend ?? []),
    ]);
    try {
      exportCsv(`reval-users-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
      toast.success(`${toPersianDigits(filteredUsers.length)} کاربر به CSV خروجی گرفته شد`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خروجی CSV ناموفق بود');
    }
  };

  // ===== Bulk selection helpers =====
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.has(u.id));
  const someFilteredSelected = filteredUsers.some((u) => selectedIds.has(u.id)) && !allFilteredSelected;
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const u of filteredUsers) next.delete(u.id);
      } else {
        for (const u of filteredUsers) next.add(u.id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ===== Bulk status update (suspend or activate) =====
  const bulkUpdateStatus = async (status: UserAccountStatus) => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    const ids = Array.from(selectedIds);
    const label = status === 'suspended' ? 'تعلیق' : 'فعال‌سازی';
    let ok = 0;
    let failed = 0;
    try {
      await Promise.all(ids.map(async (id) => {
        try {
          const res = await fetch(`/api/users/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          });
          if (res.ok) ok += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }));
      if (failed === 0) {
        toast.success(`${toPersianDigits(ok)} کاربر ${status === 'suspended' ? 'معلق شد' : 'فعال شد'}`);
      } else if (ok === 0) {
        toast.error(`${label} کاربران ناموفق بود`);
      } else {
        toast.warning(`${toPersianDigits(ok)} کاربر تغییر کرد، ${toPersianDigits(failed)} ناموفق`);
      }
      clearSelection();
      await loadGlobalUsers().catch(() => {});
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in-up">
      {/* ============ Page Header ============ */}
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-[14px] bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">کاربران</h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                <Crown className="w-3 h-3" />
                GOD
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              {toPersianDigits(globalUsers.length)} کاربر در کل پلتفرم
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Refresh button — icon-only, with spin animation while loading.
              Calls loadGlobalUsers() (re-fetches from /api/users) without a
              full-page reload. */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] text-muted-foreground hover:text-foreground hover:border-gold/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="به‌روزرسانی لیست کاربران"
            aria-label="به‌روزرسانی لیست کاربران"
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCsv}
            disabled={globalUsers.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] text-muted-foreground hover:text-foreground hover:border-gold/40 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="خروجی CSV از کاربران فیلترشده"
          >
            <Download className="w-4 h-4" />
            خروجی CSV
          </button>
          <button onClick={() => setShowAdvisorForm((value) => !value)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gold/15 text-gold border border-gold/25 text-sm font-bold"><Plus className="w-4 h-4" />کاربر جدید</button>
        </div>
      </header>

      {showAdvisorForm && <div className="surface-1 rounded-2xl p-4 border border-gold/25 space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-bold">ایجاد کاربر در دیتابیس</h3><button onClick={() => setShowAdvisorForm(false)}><X className="w-4 h-4" /></button></div>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={advisorName} onChange={(e) => setAdvisorName(e.target.value)} placeholder="نام و نام خانوادگی" className="h-11 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] px-3" />
          <input value={advisorPhone} onChange={(e) => setAdvisorPhone(e.target.value)} placeholder="شماره موبایل" dir="ltr" className="h-11 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] px-3" />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'student' | 'advisor')} className="h-11 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] px-3"><option value="student">دانش‌آموز</option><option value="advisor">مشاور</option></select>
          <select value={newInstituteId} onChange={(e) => setNewInstituteId(e.target.value)} className="h-11 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] px-3"><option value="">بدون آموزشگاه</option>{platformInstitutes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          {newRole === 'student' && <><select value={newGrade} onChange={(e) => setNewGrade(e.target.value)} className="h-11 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] px-3"><option>دهم</option><option>یازدهم</option><option>دوازدهم</option><option>فارغ‌التحصیل</option></select><select value={newMajor} onChange={(e) => setNewMajor(e.target.value)} className="h-11 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] px-3"><option>تجربی</option><option>ریاضی</option><option>انسانی</option></select></>}
        </div>
        <button disabled={creatingAdvisor || !advisorName.trim() || !advisorPhone.trim()} onClick={createAdvisor} className="px-4 py-2 rounded-xl bg-gold text-[var(--bg-deep)] font-bold disabled:opacity-40">{creatingAdvisor ? 'در حال ساخت...' : 'ساخت حساب'}</button>
      </div>}

      {/* ============ Filter Bar (sticky) ============ */}
      <div className="sticky top-2 z-10 surface-1 rounded-[14px] p-3 md:p-4">
        <div className="flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="جستجوی نام، شماره یا آموزشگاه..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] pr-10 pl-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as 'all' | GlobalUserRole)}
              className="flex-1 md:flex-none bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-xs text-foreground/90 focus:outline-none focus:border-gold/50 transition-colors min-w-[110px]"
            >
              <option value="all">همه نقش‌ها</option>
              <option value="student">دانش‌آموز</option>
              <option value="advisor">مشاور</option>
              <option value="institute_manager">مدیر آموزشگاه</option>
            </select>
            <select
              value={filterInstitute}
              onChange={(e) => setFilterInstitute(e.target.value)}
              className="flex-1 md:flex-none bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-xs text-foreground/90 focus:outline-none focus:border-gold/50 transition-colors min-w-[110px] max-w-[200px]"
            >
              <option value="all">همه آموزشگاه‌ها</option>
              {platformInstitutes.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | UserAccountStatus)}
              className="flex-1 md:flex-none bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-xs text-foreground/90 focus:outline-none focus:border-gold/50 transition-colors min-w-[110px]"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="suspended">معلق</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============ Results count ============ */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Filter className="w-3.5 h-3.5" />
        <span>{toPersianDigits(filteredUsers.length)} نتیجه</span>
      </div>

      {/* ============ Bulk action bar (shown when 1+ users selected) ============ */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="sticky top-2 z-20"
          >
            <div className="surface-2 edge-highlight rounded-[14px] border border-gold/30 bg-[var(--gold-soft)] p-3 flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-gold">
                <ListChecks className="w-4 h-4" />
                <span className="tabular-nums">{toPersianDigits(selectedIds.size)}</span>
                <span className="text-muted-foreground font-normal">کاربر انتخاب شده</span>
              </div>
              <div className="flex-1" />
              <button
                onClick={() => void bulkUpdateStatus('suspended')}
                disabled={bulkActionLoading}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-[10px] bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30 hover:bg-[var(--danger)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
              >
                {bulkActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                تعلیق انتخاب‌شده‌ها
              </button>
              <button
                onClick={() => void bulkUpdateStatus('active')}
                disabled={bulkActionLoading}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-[10px] bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30 hover:bg-[var(--success)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
              >
                {bulkActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                فعال‌سازی انتخاب‌شده‌ها
              </button>
              <button
                onClick={toggleSelectAll}
                disabled={bulkActionLoading || filteredUsers.length === 0}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-[10px] bg-[var(--bg-overlay)] text-muted-foreground border border-[var(--border)] hover:text-foreground disabled:opacity-50 transition-colors"
              >
                {allFilteredSelected ? 'لغو انتخاب همه' : 'انتخاب همه'}
              </button>
              <button
                onClick={clearSelection}
                disabled={bulkActionLoading}
                className="inline-flex items-center gap-1 text-xs px-2 py-2 rounded-[10px] text-muted-foreground hover:text-foreground transition-colors"
                title="پاک کردن انتخاب"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Dense Table (Desktop) ============ */}
      <div className="hidden lg:block surface-1 rounded-[16px] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2.5fr_1.5fr_2fr_0.8fr_0.8fr_1fr_1.2fr_1.8fr_0.8fr_0.8fr] gap-2 px-4 py-3 text-[10px] text-muted-foreground/70 font-semibold uppercase tracking-wide border-b border-[var(--border)] bg-[var(--bg-base)]/40">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={filteredUsers.length > 0 ? allFilteredSelected ? true : someFilteredSelected ? 'indeterminate' : false : false}
              onCheckedChange={toggleSelectAll}
              disabled={filteredUsers.length === 0}
              aria-label="انتخاب همه کاربران"
              className="border-gold/40 data-[state=checked]:bg-gold data-[state=checked]:border-gold data-[state=indeterminate]:bg-gold/60"
            />
            <span>کاربر</span>
          </div>
          <div>نقش</div>
          <div>آموزشگاه</div>
          <div className="text-center">کل</div>
          <div className="text-center">انجام</div>
          <div className="text-center">نرخ</div>
          <div className="text-center">آخرین فعالیت</div>
          <div className="text-center">روند پایبندی</div>
          <div className="text-center">وضعیت</div>
          <div className="text-right">عملیات</div>
        </div>

        {/* Rows */}
        <div className="max-h-[680px] overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {filteredUsers.map((user, idx) => {
              const roleCfg = ROLE_CONFIG[user.role];
              const RoleIcon = roleCfg.icon;
              const isSelected = selectedIds.has(user.id);
              const trendCounts = (user.activityTrend ?? []).map(d => d.count);
              const lastActivity = user.lastTaskInteraction
                ? formatRelativeTime(user.lastTaskInteraction)
                : '—';
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                  className={`nav-item-hover grid grid-cols-[2.5fr_1.5fr_2fr_0.8fr_0.8fr_1fr_1.2fr_1.8fr_0.8fr_0.8fr] gap-2 px-4 py-3 border-b border-[var(--border)] last:border-0 items-center transition-colors ${isSelected ? 'bg-gold/[0.06]' : ''}`}
                >
                  {/* Checkbox + User */}
                  <div className="flex items-center gap-2 min-w-0">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(user.id)}
                      aria-label={`انتخاب ${user.name}`}
                      className="border-gold/40 data-[state=checked]:bg-gold data-[state=checked]:border-gold shrink-0"
                    />
                    <div className="w-8 h-8 rounded-[8px] bg-[var(--bg-overlay)] border border-[var(--border)] flex items-center justify-center text-base shrink-0">
                      {user.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground/70 tabular-nums" dir="ltr">{user.phone}</p>
                    </div>
                  </div>
                  {/* Role */}
                  <div>
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full ${roleCfg.bg} ${roleCfg.color} font-medium`}>
                      <RoleIcon className="w-3 h-3" />
                      {roleCfg.label}
                    </span>
                  </div>
                  {/* Institute */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">{user.instituteName}</span>
                    </div>
                  </div>
                  {/* Total tasks */}
                  <div className="text-center">
                    <span className="text-xs font-bold text-foreground tabular-nums">{toPersianDigits(user.totalTasks ?? 0)}</span>
                  </div>
                  {/* Completed */}
                  <div className="text-center">
                    <span className="text-xs font-bold text-[var(--accent)] tabular-nums">{toPersianDigits(user.completedTasks ?? 0)}</span>
                  </div>
                  {/* Completion rate (mini progress bar) */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden min-w-[24px]">
                      <div
                        className={`h-full rounded-full ${(user.completionRate ?? 0) >= 75 ? 'bg-[var(--success)]' : (user.completionRate ?? 0) >= 50 ? 'bg-[var(--warning)]' : 'bg-[var(--danger)]'}`}
                        style={{ width: `${user.completionRate ?? 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{toPersianDigits(user.completionRate ?? 0)}٪</span>
                  </div>
                  {/* Last activity (relative time) */}
                  <div className="text-center">
                    <span className="text-[10px] text-muted-foreground tabular-nums">{lastActivity}</span>
                  </div>
                  {/* Trend sparkline */}
                  <div className="flex items-center justify-center">
                    <Sparkline data={trendCounts} width={90} height={26} />
                  </div>
                  {/* Status */}
                  <div className="text-center">
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      user.status === 'active' ? 'bg-[var(--success)]/15 text-[var(--success)]' : 'bg-[var(--danger)]/15 text-[var(--danger)]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />
                      {user.status === 'active' ? 'فعال' : 'معلق'}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleViewUser(user.id)}
                      className="icon-btn p-2 rounded-[8px] bg-gold/10 text-gold hover:bg-gold/20 border border-transparent"
                      title="مشاهده"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteCandidate({ id: user.id, name: user.name })} className="icon-btn p-2 rounded-[8px] bg-[var(--danger)]/10 text-[var(--danger)]" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">کاربری با این فیلتر یافت نشد</div>
          )}
        </div>
      </div>

      {/* ============ Card List (Mobile/Tablet) ============ */}
      <div className="lg:hidden space-y-2">
        <AnimatePresence>
          {filteredUsers.map((user, idx) => {
            const roleCfg = ROLE_CONFIG[user.role];
            const RoleIcon = roleCfg.icon;
            const isSelected = selectedIds.has(user.id);
            const trendCounts = (user.activityTrend ?? []).map(d => d.count);
            const lastActivity = user.lastTaskInteraction
              ? formatRelativeTime(user.lastTaskInteraction)
              : '—';
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: idx * 0.02, duration: 0.2 }}
                className={`card-hover surface-1 rounded-[12px] p-3 transition-colors ${isSelected ? 'border border-gold/40 bg-gold/[0.06]' : 'border border-transparent'}`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(user.id)}
                    aria-label={`انتخاب ${user.name}`}
                    className="border-gold/40 data-[state=checked]:bg-gold data-[state=checked]:border-gold shrink-0"
                  />
                  <div className="w-10 h-10 rounded-[10px] bg-[var(--bg-overlay)] border border-[var(--border)] flex items-center justify-center text-xl shrink-0">
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${roleCfg.bg} ${roleCfg.color} font-medium`}>
                        <RoleIcon className="w-2.5 h-2.5" />
                        {roleCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="w-3 h-3 text-muted-foreground/60" />
                      <span className="text-[11px] text-muted-foreground truncate">{user.instituteName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleViewUser(user.id)}
                      className="icon-btn p-2 rounded-[8px] bg-gold/10 text-gold hover:bg-gold/20 border border-transparent"
                      title="مشاهده"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteCandidate({ id: user.id, name: user.name })} className="icon-btn p-2 rounded-[8px] bg-[var(--danger)]/10 text-[var(--danger)]" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {/* Engagement stats row (mobile) */}
                <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-[var(--border)]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">کل:</span>
                    <span className="text-xs font-bold text-foreground tabular-nums">{toPersianDigits(user.totalTasks ?? 0)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">انجام:</span>
                    <span className="text-xs font-bold text-[var(--accent)] tabular-nums">{toPersianDigits(user.completedTasks ?? 0)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">نرخ:</span>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: (user.completionRate ?? 0) >= 75 ? 'var(--success)' : (user.completionRate ?? 0) >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{toPersianDigits(user.completionRate ?? 0)}٪</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">آخرین:</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{lastActivity}</span>
                  </div>
                  <div className="flex-1" />
                  <Sparkline data={trendCounts} width={70} height={22} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredUsers.length === 0 && (
          <div className="surface-1 rounded-[14px] p-8 text-center text-muted-foreground text-sm">
            کاربری با این فیلتر یافت نشد
          </div>
        )}
      </div>
      <AlertDialog open={Boolean(deleteCandidate)} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف حساب کاربری</AlertDialogTitle>
            <AlertDialogDescription>
              حساب «{deleteCandidate?.name}» حذف نرم می‌شود. کاربر بعداً می‌تواند با همان شماره و تأیید پیامکی دوباره ثبت‌نام کند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteCandidate) return;
                try {
                  await deleteGlobalUser(deleteCandidate.id);
                  toast.success('کاربر حذف شد');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'حذف کاربر انجام نشد');
                } finally {
                  setDeleteCandidate(null);
                }
              }}
            >
              حذف حساب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
