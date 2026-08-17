'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { GlobalUserRole, UserAccountStatus } from '@/lib/types';
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

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().split('').map((d) => persianDigits[parseInt(d)] ?? d).join('');
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: LucideIcon }> = {
  student: { label: 'دانش‌آموز', color: 'text-mint', bg: 'bg-mint/15', icon: GraduationCap },
  advisor: { label: 'مشاور', color: 'text-muted-foreground', bg: 'bg-white/5', icon: Shield },
  institute_manager: { label: 'مدیر آموزشگاه', color: 'text-gold', bg: 'bg-gold/15', icon: UserCheck },
};

export default function SuperAdminUsers() {
  const { globalUsers, deleteGlobalUser, createGlobalUser, loadGlobalUsers, platformInstitutes, loadPlatformInstitutes, setCurrentView, setSelectedGlobalUserId } = useAppStore();
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
    setSelectedGlobalUserId(id);
    setCurrentView('sa-user-detail');
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
        <button onClick={() => setShowAdvisorForm((value) => !value)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gold/15 text-gold border border-gold/25 text-sm font-bold"><Plus className="w-4 h-4" />کاربر جدید</button>
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

      {/* ============ Dense Table (Desktop) ============ */}
      <div className="hidden lg:block surface-1 rounded-[16px] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-3 px-5 py-3 text-[11px] text-muted-foreground/70 font-semibold uppercase tracking-wide border-b border-[var(--border)] bg-[var(--bg-base)]/40">
          <div className="col-span-3">کاربر</div>
          <div className="col-span-2">نقش</div>
          <div className="col-span-3">آموزشگاه</div>
          <div className="col-span-2 text-center">عملکرد</div>
          <div className="col-span-1 text-center">وضعیت</div>
          <div className="col-span-1 text-right">عملیات</div>
        </div>

        {/* Rows */}
        <div className="max-h-[680px] overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {filteredUsers.map((user, idx) => {
              const roleCfg = ROLE_CONFIG[user.role];
              const RoleIcon = roleCfg.icon;
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                  className="nav-item-hover grid grid-cols-12 gap-3 px-5 py-3 border-b border-[var(--border)] last:border-0 items-center"
                >
                  {/* User */}
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[10px] bg-[var(--bg-overlay)] border border-[var(--border)] flex items-center justify-center text-lg shrink-0">
                      {user.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-[11px] text-muted-foreground/70 tabular-nums" dir="ltr">{user.phone}</p>
                    </div>
                  </div>
                  {/* Role */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full ${roleCfg.bg} ${roleCfg.color} font-medium`}>
                      <RoleIcon className="w-3 h-3" />
                      {roleCfg.label}
                    </span>
                  </div>
                  {/* Institute */}
                  <div className="col-span-3 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">{user.instituteName}</span>
                    </div>
                  </div>
                  {/* Performance */}
                  <div className="col-span-2 text-center">
                    <span className="text-xs font-bold text-foreground tabular-nums">{toPersianDigits(user.completionRate)}٪</span>
                    <span className="text-[10px] text-muted-foreground/60 mx-1">•</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{toPersianDigits(user.studyHours)}س</span>
                  </div>
                  {/* Status */}
                  <div className="col-span-1 text-center">
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      user.status === 'active' ? 'bg-[var(--success)]/15 text-[var(--success)]' : 'bg-[var(--danger)]/15 text-[var(--danger)]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />
                      {user.status === 'active' ? 'فعال' : 'معلق'}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1">
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
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: idx * 0.02, duration: 0.2 }}
                className="card-hover surface-1 rounded-[12px] p-3"
              >
                <div className="flex items-center gap-3">
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
