'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { PlatformInstitute, SubscriptionPlan, InstituteStatus } from '@/lib/types';
import {
  Building2,
  Plus,
  Search,
  X,
  Eye,
  Users,
  GraduationCap,
  Crown,
  Zap,
  Phone,
  CheckCircle2,
  Ban,
  Filter,
} from 'lucide-react';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().split('').map((d) => persianDigits[parseInt(d)] ?? d).join('');
}

const SUB_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: 'رایگان', color: 'text-muted-foreground', bg: 'bg-zinc-500/15' },
  basic: { label: 'پایه', color: 'text-muted-foreground', bg: 'bg-white/5' },
  pro: { label: 'حرفه‌ای', color: 'text-gold', bg: 'bg-gold/15' },
  enterprise: { label: 'سازمانی', color: 'text-gold', bg: 'bg-gold/15' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: 'فعال', color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/15', dot: 'bg-[var(--success)]' },
  suspended: { label: 'معلق', color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/15', dot: 'bg-[var(--danger)]' },
  trial: { label: 'آزمایشی', color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/15', dot: 'bg-[var(--warning)]' },
};

export default function SuperAdminInstitutes() {
  const { platformInstitutes, addPlatformInstitute, updatePlatformInstitute, setCurrentView, setSelectedInstituteId } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | InstituteStatus>('all');
  const [filterPlan, setFilterPlan] = useState<'all' | SubscriptionPlan>('all');

  // Add institute form
  const [newName, setNewName] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerPhone, setNewManagerPhone] = useState('');
  const [newPlan, setNewPlan] = useState<SubscriptionPlan>('basic');

  const filteredInstitutes = useMemo(() => {
    let result = [...platformInstitutes];
    if (searchQuery) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((i) => i.name.includes(q) || i.managerName.includes(q) || i.managerPhone.includes(q));
    }
    if (filterStatus !== 'all') {
      result = result.filter((i) => i.status === filterStatus);
    }
    if (filterPlan !== 'all') {
      result = result.filter((i) => i.subscriptionPlan === filterPlan);
    }
    return result;
  }, [platformInstitutes, searchQuery, filterStatus, filterPlan]);

  const handleAddInstitute = () => {
    if (!newName.trim() || !newManagerName.trim()) return;

    const institute: PlatformInstitute = {
      id: `inst_${Date.now()}`,
      name: newName.trim(),
      logoUrl: null,
      managerName: newManagerName.trim(),
      managerPhone: newManagerPhone.trim(),
      subscriptionPlan: newPlan,
      status: 'trial',
      studentCount: 0,
      advisorCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      avgCompletionRate: 0,
    };

    addPlatformInstitute(institute);
    setNewName('');
    setNewManagerName('');
    setNewManagerPhone('');
    setNewPlan('basic');
    setShowAddModal(false);
  };

  const toggleInstituteStatus = (id: string, currentStatus: InstituteStatus) => {
    const newStatus: InstituteStatus = currentStatus === 'active' ? 'suspended' : 'active';
    updatePlatformInstitute(id, { status: newStatus });
  };

  const handleGodView = (id: string) => {
    setSelectedInstituteId(id);
    setCurrentView('sa-institute-detail');
  };

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in-up">
      {/* ============ Page Header ============ */}
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-[14px] bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 md:w-6 md:h-6 text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">موسسات</h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                <Crown className="w-3 h-3" />
                GOD
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              {toPersianDigits(platformInstitutes.length)} آموزشگاه در پلتفرم
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-hover glow-hover glow-hover-gold flex items-center gap-2 bg-gold text-white px-4 py-2.5 rounded-[10px] text-sm font-bold shrink-0"
        >
          <Plus className="w-4 h-4" />
          افزودن آموزشگاه
        </button>
      </header>

      {/* ============ Filter Bar (sticky) ============ */}
      <div className="sticky top-2 z-10 surface-1 rounded-[14px] p-3 md:p-4">
        <div className="flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="جستجوی نام آموزشگاه یا مدیر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] pr-10 pl-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | InstituteStatus)}
              className="flex-1 md:flex-none bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-xs text-foreground/90 focus:outline-none focus:border-gold/50 transition-colors"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="trial">آزمایشی</option>
              <option value="suspended">معلق</option>
            </select>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value as 'all' | SubscriptionPlan)}
              className="flex-1 md:flex-none bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-xs text-foreground/90 focus:outline-none focus:border-gold/50 transition-colors"
            >
              <option value="all">همه طرح‌ها</option>
              <option value="free">رایگان</option>
              <option value="basic">پایه</option>
              <option value="pro">حرفه‌ای</option>
              <option value="enterprise">سازمانی</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============ Results count ============ */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Filter className="w-3.5 h-3.5" />
        <span>{toPersianDigits(filteredInstitutes.length)} نتیجه</span>
      </div>

      {/* ============ Dense Table (Desktop) ============ */}
      <div className="hidden lg:block surface-1 rounded-[16px] overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-5 py-3 text-[11px] text-muted-foreground/70 font-semibold uppercase tracking-wide border-b border-[var(--border)] bg-[var(--bg-base)]/40">
          <div className="col-span-3">نام آموزشگاه</div>
          <div className="col-span-2">مدیر</div>
          <div className="col-span-2">طرح اشتراک</div>
          <div className="col-span-1">وضعیت</div>
          <div className="col-span-1 text-center">دانش‌آموز</div>
          <div className="col-span-1 text-center">مشاور</div>
          <div className="col-span-2 text-right">عملیات</div>
        </div>

        {/* Rows */}
        <div className="max-h-[640px] overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {filteredInstitutes.map((institute, idx) => {
              const subCfg = SUB_CONFIG[institute.subscriptionPlan];
              const statusCfg = STATUS_CONFIG[institute.status];
              return (
                <motion.div
                  key={institute.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  className="nav-item-hover grid grid-cols-12 gap-3 px-5 py-3.5 border-b border-[var(--border)] last:border-0 items-center"
                >
                  {/* Name */}
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[10px] bg-gold/15 border border-gold/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-gold" />
                    </div>
                    <span className="text-sm font-semibold text-foreground truncate">{institute.name}</span>
                  </div>
                  {/* Manager */}
                  <div className="col-span-2 min-w-0">
                    <p className="text-sm text-foreground truncate">{institute.managerName}</p>
                    <p className="text-[11px] text-muted-foreground/70 tabular-nums" dir="ltr">{institute.managerPhone || '—'}</p>
                  </div>
                  {/* Plan */}
                  <div className="col-span-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${subCfg.bg} ${subCfg.color} font-medium`}>
                      {subCfg.label}
                    </span>
                  </div>
                  {/* Status */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      <span className={`text-[11px] ${statusCfg.color}`}>{statusCfg.label}</span>
                    </div>
                  </div>
                  {/* Students */}
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-semibold text-foreground tabular-nums">{toPersianDigits(institute.studentCount)}</span>
                  </div>
                  {/* Advisors */}
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-semibold text-foreground tabular-nums">{toPersianDigits(institute.advisorCount)}</span>
                  </div>
                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleGodView(institute.id)}
                      className="icon-btn p-2 rounded-[8px] bg-gold/10 text-gold hover:bg-gold/20 border border-transparent"
                      title="God View"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleInstituteStatus(institute.id, institute.status)}
                      className={`icon-btn p-2 rounded-[8px] border border-transparent ${
                        institute.status === 'active'
                          ? 'bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20'
                          : 'bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20'
                      }`}
                      title={institute.status === 'active' ? 'تعلیق' : 'فعال‌سازی'}
                    >
                      {institute.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleGodView(institute.id)}
                      className="btn-hover text-[11px] px-3 py-1.5 rounded-[8px] bg-gold/10 text-gold hover:bg-gold/20 font-medium"
                    >
                      مشاهده
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filteredInstitutes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">موسسه‌ای یافت نشد</div>
          )}
        </div>
      </div>

      {/* ============ Card List (Mobile/Tablet) ============ */}
      <div className="lg:hidden space-y-3">
        <AnimatePresence>
          {filteredInstitutes.map((institute, idx) => {
            const subCfg = SUB_CONFIG[institute.subscriptionPlan];
            const statusCfg = STATUS_CONFIG[institute.status];
            return (
              <motion.div
                key={institute.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: idx * 0.04, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="card-hover surface-1 edge-highlight rounded-[14px] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-[11px] bg-gold/15 border border-gold/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-gold" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{institute.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${subCfg.bg} ${subCfg.color} font-medium`}>
                          {subCfg.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color} font-medium`}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGodView(institute.id)}
                    className="icon-btn p-2 rounded-[8px] bg-gold/10 text-gold hover:bg-gold/20 border border-transparent shrink-0"
                    title="God View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[var(--border)] text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-muted-foreground/60" />
                    <span className="text-muted-foreground truncate">{institute.managerName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3 h-3 text-mint" />
                    <span className="text-muted-foreground tabular-nums">{toPersianDigits(institute.studentCount)} دانش‌آموز</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground tabular-nums">{toPersianDigits(institute.advisorCount)} مشاور</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-gold" />
                    <span className="text-muted-foreground tabular-nums">{toPersianDigits(institute.avgCompletionRate)}٪ تکمیل</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                  <button
                    onClick={() => handleGodView(institute.id)}
                    className="btn-hover flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-[10px] bg-gold/10 text-gold hover:bg-gold/20 font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    God View
                  </button>
                  <button
                    onClick={() => toggleInstituteStatus(institute.id, institute.status)}
                    className={`btn-hover flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-[10px] font-medium ${
                      institute.status === 'active'
                        ? 'bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20'
                        : 'bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20'
                    }`}
                  >
                    {institute.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {institute.status === 'active' ? 'تعلیق' : 'فعال‌سازی'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredInstitutes.length === 0 && (
          <div className="surface-1 rounded-[14px] p-8 text-center text-muted-foreground text-sm">
            موسسه‌ای یافت نشد
          </div>
        )}
      </div>

      {/* ============ Add Institute Modal ============ */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.22 }}
              className="surface-2 edge-highlight rounded-[20px] p-6 w-full max-w-md border-gold/25"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-[10px] bg-gold/15 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-gold" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">افزودن آموزشگاه جدید</h2>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="icon-btn p-2 rounded-[8px] text-muted-foreground border border-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">نام آموزشگاه *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثلاً: آموزشگاه هدف"
                    className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">نام مدیر *</label>
                  <input
                    type="text"
                    value={newManagerName}
                    onChange={(e) => setNewManagerName(e.target.value)}
                    placeholder="مثلاً: آقای احمدی"
                    className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">شماره تلفن مدیر</label>
                  <input
                    type="tel"
                    value={newManagerPhone}
                    onChange={(e) => setNewManagerPhone(e.target.value)}
                    placeholder="09121234567"
                    dir="ltr"
                    className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 text-left transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">طرح اشتراک</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as SubscriptionPlan)}
                    className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-gold/50 transition-colors"
                  >
                    <option value="free">رایگان</option>
                    <option value="basic">پایه</option>
                    <option value="pro">حرفه‌ای</option>
                    <option value="enterprise">سازمانی</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-hover flex-1 py-2.5 rounded-[10px] border border-[var(--border)] text-sm text-muted-foreground hover:bg-[var(--bg-overlay)]"
                >
                  انصراف
                </button>
                <button
                  onClick={handleAddInstitute}
                  disabled={!newName.trim() || !newManagerName.trim()}
                  className="btn-hover glow-hover glow-hover-gold flex-1 py-2.5 rounded-[10px] bg-gold text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  افزودن آموزشگاه
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
