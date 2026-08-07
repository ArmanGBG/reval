'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { InstituteAdvisor } from '@/lib/types';
import {
  Users,
  Plus,
  Phone,
  GraduationCap,
  Search,
  X,
  UserCheck,
  UserX,
  Award,
  Calendar,
  Sparkles,
} from 'lucide-react';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().split('').map((d) => persianDigits[parseInt(d)] ?? d).join('');
}

export default function InstituteAdvisors() {
  const { instituteAdvisors, addInstituteAdvisor, updateInstituteAdvisor, instituteStudents, instituteProfile } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');

  // Get student count per advisor dynamically
  const getStudentCount = (advisorId: string) => {
    return instituteStudents.filter((s) => s.assignedAdvisorId === advisorId).length;
  };

  const filteredAdvisors = instituteAdvisors.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.trim().toLowerCase();
    return a.name.includes(q) || a.phone.includes(q) || a.specialty.includes(q);
  });

  const activeAdvisors = filteredAdvisors.filter((a) => a.isActive);
  const inactiveAdvisors = filteredAdvisors.filter((a) => !a.isActive);

  const handleAddAdvisor = () => {
    if (!newName.trim() || !newPhone.trim()) return;

    const advisor: InstituteAdvisor = {
      id: `adv_${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      avatar: '🧑‍🏫',
      specialty: newSpecialty.trim() || 'عمومی',
      studentCount: 0,
      isActive: true,
      joinDate: new Date().toISOString().split('T')[0],
    };

    addInstituteAdvisor(advisor);
    setNewName('');
    setNewPhone('');
    setNewSpecialty('');
    setShowAddModal(false);
  };

  const toggleAdvisorStatus = (id: string, currentStatus: boolean) => {
    updateInstituteAdvisor(id, { isActive: !currentStatus });
  };

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in-up">
      {/* ============ Page Header ============ */}
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-[14px] bg-[var(--accent-soft)] border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">مشاوران</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              {toPersianDigits(instituteAdvisors.length)} مشاور در {instituteProfile.name}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-hover glow-hover flex items-center gap-2 bg-[var(--accent)] text-[var(--bg-deep)] px-4 py-2.5 rounded-[10px] text-sm font-bold shrink-0"
        >
          <Plus className="w-4 h-4" />
          افزودن مشاور
        </button>
      </header>

      {/* ============ Search Bar (sticky on mobile) ============ */}
      <div className="sticky top-2 z-10">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="جستجوی نام، شماره یا تخصص..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full surface-1 rounded-[12px] pr-10 pl-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
          />
        </div>
      </div>

      {/* ============ 2-col Grid: List + Side Panel ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* ----- Active Advisors List ----- */}
        <section className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              مشاوران فعال
              <span className="text-xs text-muted-foreground font-normal">({toPersianDigits(activeAdvisors.length)})</span>
            </h3>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {activeAdvisors.map((advisor, idx) => (
                <motion.div
                  key={advisor.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: idx * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="card-hover surface-1 edge-highlight rounded-[14px] p-4 md:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-[12px] bg-[var(--accent-soft)] border border-[var(--accent)]/20 flex items-center justify-center text-2xl shrink-0">
                        {advisor.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm md:text-base font-semibold text-foreground truncate">{advisor.name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="w-3 h-3 text-muted-foreground/60" />
                          <span className="text-xs text-muted-foreground tabular-nums" dir="ltr">{advisor.phone}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAdvisorStatus(advisor.id, advisor.isActive)}
                      className="icon-btn p-2 rounded-[8px] bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 border border-transparent shrink-0"
                      title="غیرفعال کردن"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Award className="w-3.5 h-3.5 text-[var(--warning)] shrink-0" />
                      <span className="text-[11px] md:text-xs text-muted-foreground truncate">{advisor.specialty}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <GraduationCap className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      <span className="text-[11px] md:text-xs text-muted-foreground">{toPersianDigits(getStudentCount(advisor.id))} دانش‌آموز</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="text-[11px] md:text-xs text-muted-foreground tabular-nums">{toPersianDigits(advisor.joinDate)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {activeAdvisors.length === 0 && (
              <div className="surface-1 rounded-[14px] p-8 text-center text-sm text-muted-foreground">
                مشاور فعالی با این فیلتر یافت نشد
              </div>
            )}
          </div>

          {/* Inactive Advisors */}
          {inactiveAdvisors.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm md:text-base font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                غیرفعال
                <span className="text-xs text-muted-foreground font-normal">({toPersianDigits(inactiveAdvisors.length)})</span>
              </h3>
              <div className="space-y-2">
                {inactiveAdvisors.map((advisor) => (
                  <div
                    key={advisor.id}
                    className="card-hover surface-1 rounded-[12px] p-3 md:p-4 opacity-60 hover:opacity-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-[10px] bg-[var(--bg-overlay)] flex items-center justify-center text-xl shrink-0">
                          {advisor.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{advisor.name}</p>
                          <span className="text-[11px] text-muted-foreground tabular-nums" dir="ltr">{advisor.phone}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAdvisorStatus(advisor.id, advisor.isActive)}
                        className="icon-btn p-2 rounded-[8px] bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)]/20 border border-transparent shrink-0"
                        title="فعال کردن"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ----- Side Panel: Summary + Quick Add CTA ----- */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Summary card */}
          <div className="surface-1 rounded-[14px] p-4 md:p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              خلاصه تیم
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">کل مشاوران</span>
                <span className="text-sm font-bold text-foreground tabular-nums">{toPersianDigits(instituteAdvisors.length)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">فعال</span>
                <span className="text-sm font-bold text-[var(--accent)] tabular-nums">{toPersianDigits(activeAdvisors.length)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">غیرفعال</span>
                <span className="text-sm font-bold text-muted-foreground tabular-nums">{toPersianDigits(inactiveAdvisors.length)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <span className="text-xs text-muted-foreground">تعداد دانش‌آموز/مشاور</span>
                <span className="text-sm font-bold text-[var(--warning)] tabular-nums">
                  {toPersianDigits(activeAdvisors.length > 0 ? Math.round(instituteStudents.length / activeAdvisors.length) : 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick CTA card */}
          <button
            onClick={() => setShowAddModal(true)}
            className="card-hover w-full surface-1 rounded-[14px] p-5 text-right border-dashed"
            style={{ borderStyle: 'dashed' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[12px] bg-[var(--accent-soft)] border border-[var(--accent)]/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">افزودن مشاور جدید</p>
                <p className="text-xs text-muted-foreground mt-0.5">برای گسترش تیم آموزشی</p>
              </div>
            </div>
          </button>
        </aside>
      </div>

      {/* ============ Add Advisor Modal ============ */}
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
              className="surface-2 edge-highlight rounded-[20px] p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-[10px] bg-[var(--accent-soft)] flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">افزودن مشاور جدید</h2>
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
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثلاً: سرکار خانم احمدی"
                    className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">شماره تلفن *</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="09121234567"
                    dir="ltr"
                    className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[var(--accent)]/50 text-left transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">تخصص</label>
                  <input
                    type="text"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="مثلاً: ریاضی و فیزیک"
                    className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
                  />
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
                  onClick={handleAddAdvisor}
                  disabled={!newName.trim() || !newPhone.trim()}
                  className="btn-hover glow-hover flex-1 py-2.5 rounded-[10px] bg-[var(--accent)] text-[var(--bg-deep)] text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  افزودن مشاور
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
