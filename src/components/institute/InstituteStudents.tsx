'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { InstituteStudent, Grade, Major, StudentStatus } from '@/lib/types';
import {
  GraduationCap,
  Plus,
  Phone,
  Search,
  X,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Users,
  UserPlus,
} from 'lucide-react';

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().split('').map((d) => persianDigits[parseInt(d)] ?? d).join('');
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  excellent: { label: 'عالی', color: 'text-mint', bg: 'bg-mint/15', dot: 'bg-mint' },
  good: { label: 'خوب', color: 'text-sky-400', bg: 'bg-sky-500/15', dot: 'bg-sky-500' },
  fair: { label: 'متوسط', color: 'text-amber-400', bg: 'bg-amber-500/15', dot: 'bg-amber-500' },
  'at-risk': { label: 'در خطر', color: 'text-orange-400', bg: 'bg-orange-500/15', dot: 'bg-orange-500' },
  critical: { label: 'بحرانی', color: 'text-red-400', bg: 'bg-red-500/15', dot: 'bg-red-500' },
};

const GRADES: Grade[] = ['دهم', 'یازدهم', 'دوازدهم', 'پشت کنکوری'];
const MAJORS: Major[] = ['تجربی', 'ریاضی', 'انسانی', 'معارف'];

export default function InstituteStudents() {
  const {
    instituteStudents,
    instituteAdvisors,
    addInstituteStudent,
    assignStudentToAdvisor,
    instituteProfile,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningStudentId, setAssigningStudentId] = useState<string | null>(null);

  // Add student form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGrade, setNewGrade] = useState<Grade>('دوازدهم');
  const [newMajor, setNewMajor] = useState<Major>('تجربی');

  const activeAdvisors = instituteAdvisors.filter((a) => a.isActive);

  const filteredStudents = instituteStudents.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.trim().toLowerCase();
    return s.name.includes(q) || s.phone.includes(q);
  });

  const handleAddStudent = () => {
    if (!newName.trim() || !newPhone.trim()) return;

    const student: InstituteStudent = {
      id: `ist_${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      avatar: '🧑‍🎓',
      grade: newGrade,
      major: newMajor,
      assignedAdvisorId: null,
      weeklyCompletionRate: 0,
      totalStudyHours: 0,
      mockExamScore: 0,
      status: 'fair' as StudentStatus,
      joinDate: new Date().toISOString().split('T')[0],
    };

    addInstituteStudent(student);
    setNewName('');
    setNewPhone('');
    setNewGrade('دوازدهم');
    setNewMajor('تجربی');
    setShowAddModal(false);
  };

  const handleAssign = (advisorId: string) => {
    if (assigningStudentId) {
      assignStudentToAdvisor(assigningStudentId, advisorId);
    }
    setShowAssignModal(false);
    setAssigningStudentId(null);
  };

  const handleRemoveAssignment = (studentId: string) => {
    assignStudentToAdvisor(studentId, null);
  };

  const openAssignModal = (studentId: string) => {
    setAssigningStudentId(studentId);
    setShowAssignModal(true);
  };

  const getAdvisorName = (advisorId: string | null) => {
    if (!advisorId) return null;
    const advisor = instituteAdvisors.find((a) => a.id === advisorId);
    return advisor ? advisor.name : null;
  };

  const assignedCount = instituteStudents.filter((s) => s.assignedAdvisorId !== null).length;
  const unassignedCount = instituteStudents.filter((s) => s.assignedAdvisorId === null).length;

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in-up">
      {/* ============ Page Header ============ */}
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-[14px] bg-mint/15 border border-mint/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-mint" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">دانش‌آموزان</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              {toPersianDigits(instituteStudents.length)} دانش‌آموز در {instituteProfile.name}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-hover glow-hover flex items-center gap-2 bg-mint text-[var(--bg-deep)] px-4 py-2.5 rounded-[10px] text-sm font-bold shrink-0"
        >
          <Plus className="w-4 h-4" />
          افزودن دانش‌آموز
        </button>
      </header>

      {/* ============ Quick Stats ============ */}
      <div className="grid grid-cols-3 gap-3">
        <div className="surface-1 rounded-[12px] p-3 md:p-4 text-center card-hover">
          <p className="text-[10px] md:text-xs text-muted-foreground mb-1">کل</p>
          <p className="text-base md:text-xl font-bold text-foreground tabular-nums">{toPersianDigits(instituteStudents.length)}</p>
        </div>
        <div className="surface-1 rounded-[12px] p-3 md:p-4 text-center card-hover">
          <p className="text-[10px] md:text-xs text-muted-foreground mb-1">تخصیص‌یافته</p>
          <p className="text-base md:text-xl font-bold text-mint tabular-nums">{toPersianDigits(assignedCount)}</p>
        </div>
        <div className="surface-1 rounded-[12px] p-3 md:p-4 text-center card-hover">
          <p className="text-[10px] md:text-xs text-muted-foreground mb-1">بدون مشاور</p>
          <p className="text-base md:text-xl font-bold text-amber-400 tabular-nums">{toPersianDigits(unassignedCount)}</p>
        </div>
      </div>

      {/* ============ Search (sticky on mobile) ============ */}
      <div className="sticky top-2 z-10">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="جستجوی نام یا شماره..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full surface-1 rounded-[12px] pr-10 pl-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-mint/50 transition-colors"
          />
        </div>
      </div>

      {/* ============ 2-col Grid: Student Cards + Assignment Panel ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* ----- Student Cards Grid ----- */}
        <section className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <AnimatePresence>
              {filteredStudents.map((student, idx) => {
                const statusCfg = STATUS_CONFIG[student.status];
                const advisorName = getAdvisorName(student.assignedAdvisorId);

                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: idx * 0.03, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="card-hover surface-1 edge-highlight rounded-[14px] p-4 flex flex-col"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-[11px] bg-mint/15 border border-mint/20 flex items-center justify-center text-xl shrink-0">
                          {student.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
                          <p className="text-[11px] text-muted-foreground/80 mt-0.5">{student.grade} • {student.major}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color} font-medium shrink-0`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-1.5 mt-3">
                      <Phone className="w-3 h-3 text-muted-foreground/60" />
                      <span className="text-[11px] text-muted-foreground tabular-nums" dir="ltr">{student.phone}</span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground/70 mb-0.5">نمره</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">{toPersianDigits(student.mockExamScore)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground/70 mb-0.5">تکمیل</p>
                        <p className="text-sm font-bold text-amber-400 tabular-nums">{toPersianDigits(student.weeklyCompletionRate)}٪</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground/70 mb-0.5">ساعت</p>
                        <p className="text-sm font-bold text-sky-400 tabular-nums">{toPersianDigits(student.totalStudyHours)}</p>
                      </div>
                    </div>

                    {/* Advisor assignment */}
                    <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {advisorName ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-mint shrink-0" />
                            <span className="text-[11px] text-muted-foreground truncate">
                              <span className="text-mint font-medium">{advisorName}</span>
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-[11px] text-amber-400">بدون مشاور</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openAssignModal(student.id)}
                          className="btn-hover text-[11px] px-2.5 py-1.5 rounded-[8px] bg-mint/10 text-mint hover:bg-mint/20 font-medium"
                        >
                          تخصیص
                        </button>
                        {advisorName && (
                          <button
                            onClick={() => handleRemoveAssignment(student.id)}
                            className="btn-hover text-[11px] px-2 py-1.5 rounded-[8px] bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filteredStudents.length === 0 && (
              <div className="col-span-full surface-1 rounded-[14px] p-10 text-center text-sm text-muted-foreground">
                دانش‌آموزی یافت نشد
              </div>
            )}
          </div>
        </section>

        {/* ----- Assignment Side Panel ----- */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="surface-1 rounded-[14px] p-4 md:p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-mint" />
              وضعیت تخصیص
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-[10px] bg-mint/10 border border-mint/15">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-mint" />
                  <span className="text-xs text-foreground">تخصیص‌یافته</span>
                </div>
                <span className="text-sm font-bold text-mint tabular-nums">{toPersianDigits(assignedCount)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-[10px] bg-amber-500/10 border border-amber-500/15">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-foreground">بدون مشاور</span>
                </div>
                <span className="text-sm font-bold text-amber-400 tabular-nums">{toPersianDigits(unassignedCount)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                با تخصیص مشاور به هر دانش‌آموز، امکان پیگیری عملکرد و گزارش‌گیری دقیق‌تر فراهم می‌شود.
              </p>
            </div>
          </div>

          {/* Quick CTA */}
          <button
            onClick={() => setShowAddModal(true)}
            className="card-hover w-full surface-1 rounded-[14px] p-5 text-right"
            style={{ borderStyle: 'dashed' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[12px] bg-mint/15 border border-mint/20 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-mint" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">افزودن دانش‌آموز</p>
                <p className="text-xs text-muted-foreground mt-0.5">ثبت دانش‌آموز جدید در آموزشگاه</p>
              </div>
            </div>
          </button>
        </aside>
      </div>

      {/* ============ Add Student Modal ============ */}
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
                  <div className="w-9 h-9 rounded-[10px] bg-mint/15 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-mint" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">افزودن دانش‌آموز جدید</h2>
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
                    placeholder="مثلاً: سارا محمدی"
                    className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-mint/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">شماره تلفن *</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="09131234567"
                    dir="ltr"
                    className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-mint/50 text-left transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">پایه</label>
                    <select
                      value={newGrade}
                      onChange={(e) => setNewGrade(e.target.value as Grade)}
                      className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-mint/50 transition-colors"
                    >
                      {GRADES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">رشته</label>
                    <select
                      value={newMajor}
                      onChange={(e) => setNewMajor(e.target.value as Major)}
                      className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-mint/50 transition-colors"
                    >
                      {MAJORS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
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
                  onClick={handleAddStudent}
                  disabled={!newName.trim() || !newPhone.trim()}
                  className="btn-hover glow-hover flex-1 py-2.5 rounded-[10px] bg-mint text-[var(--bg-deep)] text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  افزودن دانش‌آموز
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Assign Advisor Modal ============ */}
      <AnimatePresence>
        {showAssignModal && assigningStudentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => { setShowAssignModal(false); setAssigningStudentId(null); }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.22 }}
              className="surface-2 edge-highlight rounded-[20px] p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-[10px] bg-mint/15 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-mint" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">تخصیص مشاور</h2>
                </div>
                <button
                  onClick={() => { setShowAssignModal(false); setAssigningStudentId(null); }}
                  className="icon-btn p-2 rounded-[8px] text-muted-foreground border border-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                انتخاب مشاور برای <span className="text-foreground font-semibold">{instituteStudents.find((s) => s.id === assigningStudentId)?.name}</span>
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {activeAdvisors.map((advisor) => {
                  const isCurrentAssignment = instituteStudents.find((s) => s.id === assigningStudentId)?.assignedAdvisorId === advisor.id;
                  const studentCount = instituteStudents.filter((s) => s.assignedAdvisorId === advisor.id).length;

                  return (
                    <button
                      key={advisor.id}
                      onClick={() => handleAssign(advisor.id)}
                      className={`nav-item-hover w-full flex items-center gap-3 p-3 rounded-[12px] border transition-all ${
                        isCurrentAssignment
                          ? 'bg-mint/10 border-mint/30'
                          : 'bg-[var(--bg-overlay)] border-[var(--border)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-[10px] bg-mint/15 flex items-center justify-center text-xl shrink-0">
                        {advisor.avatar}
                      </div>
                      <div className="flex-1 text-right min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{advisor.name}</p>
                        <p className="text-[11px] text-muted-foreground/80 truncate">{advisor.specialty} • {toPersianDigits(studentCount)} دانش‌آموز</p>
                      </div>
                      {isCurrentAssignment && (
                        <CheckCircle2 className="w-5 h-5 text-mint shrink-0" />
                      )}
                    </button>
                  );
                })}
                {activeAdvisors.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    مشاور فعالی وجود ندارد
                  </div>
                )}
              </div>

              {instituteStudents.find((s) => s.id === assigningStudentId)?.assignedAdvisorId && (
                <button
                  onClick={() => {
                    handleRemoveAssignment(assigningStudentId);
                    setShowAssignModal(false);
                    setAssigningStudentId(null);
                  }}
                  className="btn-hover w-full mt-4 py-2.5 rounded-[10px] border border-red-500/20 text-sm text-red-400 hover:bg-red-500/10"
                >
                  حذف مشاور اختصاص‌یافته
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
