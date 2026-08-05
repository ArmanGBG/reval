'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { MOCK_STUDENTS } from '@/lib/constants/mockData';
import {
  Search,
  GraduationCap,
  ChevronLeft,
} from 'lucide-react';
import { GroupExamModal } from './GroupExamModal';
import { toPersianDigits, computeStudentStatus, STATUS_CONFIG, TREND_CONFIG } from './advisor-helpers';

// ===== ADVISOR VIEW 2: Students List =====
export function AdvisorStudentsList() {
  const { setCurrentView, setSelectedStudentId } = useAppStore();
  const students = MOCK_STUDENTS;
  const [searchQuery, setSearchQuery] = useState('');
  const [groupExamOpen, setGroupExamOpen] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    return students.filter(s => s.name.includes(searchQuery) || s.grade.includes(searchQuery) || s.major.includes(searchQuery));
  }, [students, searchQuery]);

  const handleStudentClick = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentView('advisor-student-detail');
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: search + group exam button */}
      <div className="flex gap-2 items-stretch">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-subtle)] pointer-events-none" />
          <input
            type="text"
            placeholder="جستجوی دانش‌آموز..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl pr-10 pl-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)]/40 focus:bg-[var(--bg-overlay)] transition-colors"
          />
        </div>
        <button
          onClick={() => setGroupExamOpen(true)}
          className="flex items-center gap-2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-[#8B5CF6] rounded-xl px-4 py-3 text-sm font-medium btn-hover shrink-0"
        >
          <GraduationCap className="w-4 h-4" />
          <span className="hidden sm:inline">آزمون جدید</span>
        </button>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] text-[var(--foreground-muted)]">
          <span className="text-[var(--foreground)] font-bold tabular-nums">{toPersianDigits(filteredStudents.length)}</span> دانش‌آموز
        </p>
      </div>

      {/* ===== Mobile: vertical list of student cards ===== */}
      <div className="md:hidden space-y-3">
        {filteredStudents.map((student, index) => {
          const status = computeStudentStatus(student);
          const config = STATUS_CONFIG[status];
          const trend = TREND_CONFIG[student.studyHoursTrend];
          const scoreDiff = student.mockExamScore - student.previousMockScore;

          return (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.3 }}
              onClick={() => handleStudentClick(student.id)}
              className="surface-1 card-hover rounded-2xl p-4 cursor-pointer edge-highlight"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-11 h-11 rounded-xl bg-[var(--bg-overlay)] flex items-center justify-center text-xl shrink-0">{student.avatar}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--foreground)] truncate">{student.name}</p>
                    <p className="text-[11px] text-[var(--foreground-muted)] truncate">{student.grade} - {student.major} | {student.goal}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${config.bg} ${config.color} ring-1 ${config.ring} shrink-0`}>
                  {config.icon} {config.label}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[var(--border)]">
                <div className="text-center">
                  <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">نمره</p>
                  <p className="text-sm font-bold text-[var(--foreground)] tabular-nums">{toPersianDigits(student.mockExamScore)}</p>
                  <p className={`text-[9px] tabular-nums ${scoreDiff >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>{scoreDiff >= 0 ? '+' : ''}{toPersianDigits(scoreDiff)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">ساعت/هفته</p>
                  <p className="text-sm font-bold text-[var(--foreground)] tabular-nums">{toPersianDigits(student.studyHoursPerWeek)}</p>
                  <p className="text-[9px] text-[var(--foreground-subtle)]">از {toPersianDigits(student.studyHoursTarget)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">تکمیل</p>
                  <p className="text-sm font-bold text-[var(--foreground)] tabular-nums">{toPersianDigits(student.taskCompletionRate)}٪</p>
                  <p className="text-[9px] text-[var(--foreground-subtle)]">وظایف</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[var(--foreground-muted)] mb-0.5">روند</p>
                  <span className={`inline-flex items-center justify-center ${trend.color}`}>{trend.icon}</span>
                  <p className="text-[9px] text-[var(--foreground-subtle)]">مطالعه</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ===== Desktop: dense data table ===== */}
      <div className="hidden md:block surface-1 rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-3 px-5 py-3 text-[11px] font-semibold text-[var(--foreground-muted)] border-b border-[var(--border)] bg-[var(--bg-overlay)]/40 uppercase tracking-wide">
          <div className="col-span-4">دانش‌آموز</div>
          <div className="col-span-1 text-center">نمره</div>
          <div className="col-span-2 text-center">وضعیت</div>
          <div className="col-span-1 text-center">تکمیل</div>
          <div className="col-span-2 text-center">ساعت مطالعه</div>
          <div className="col-span-1 text-center">روند</div>
          <div className="col-span-1 text-center">عملیات</div>
        </div>
        {/* Data rows */}
        <div>
          {filteredStudents.map((student, index) => {
            const status = computeStudentStatus(student);
            const config = STATUS_CONFIG[status];
            const trend = TREND_CONFIG[student.studyHoursTrend];
            const scoreDiff = student.mockExamScore - student.previousMockScore;

            return (
              <motion.button
                key={student.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(index * 0.03, 0.25) }}
                onClick={() => handleStudentClick(student.id)}
                className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center text-sm w-full text-right nav-item-hover border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-overlay)]/40"
              >
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-xl bg-[var(--bg-overlay)] flex items-center justify-center text-lg shrink-0">{student.avatar}</span>
                  <div className="min-w-0 text-right">
                    <p className="font-bold text-[var(--foreground)] truncate">{student.name}</p>
                    <p className="text-[11px] text-[var(--foreground-muted)] truncate">{student.grade} - {student.major} · {student.goal}</p>
                  </div>
                </div>
                <div className="col-span-1 text-center">
                  <p className="font-bold text-[var(--foreground)] tabular-nums">{toPersianDigits(student.mockExamScore)}</p>
                  <p className={`text-[10px] tabular-nums ${scoreDiff >= 0 ? 'text-[var(--accent)]' : 'text-[var(--danger)]'}`}>{scoreDiff >= 0 ? '▲' : '▼'} {toPersianDigits(Math.abs(scoreDiff))}</p>
                </div>
                <div className="col-span-2 flex justify-center">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${config.bg} ${config.color} ring-1 ${config.ring}`}>
                    {config.icon} {config.label}
                  </span>
                </div>
                <div className="col-span-1 text-center">
                  <p className="font-bold text-[var(--foreground)] tabular-nums">{toPersianDigits(student.taskCompletionRate)}٪</p>
                </div>
                <div className="col-span-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex-1 max-w-[60px] h-1.5 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((student.studyHoursPerWeek / student.studyHoursTarget) * 100, 100)}%`,
                          backgroundColor: student.studyHoursPerWeek >= student.studyHoursTarget ? 'var(--accent)' : student.studyHoursPerWeek >= student.studyHoursTarget * 0.7 ? 'var(--warning)' : 'var(--danger)',
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-[var(--foreground)] tabular-nums">{toPersianDigits(student.studyHoursPerWeek)}/{toPersianDigits(student.studyHoursTarget)}</span>
                  </div>
                </div>
                <div className="col-span-1 text-center">
                  <span className={`inline-flex items-center justify-center ${trend.color}`}>{trend.icon}</span>
                </div>
                <div className="col-span-1 flex justify-center">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--foreground-subtle)] icon-btn border border-[var(--border)]">
                    <ChevronLeft className="w-3.5 h-3.5 flip-rtl" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Group Exam Modal */}
      <GroupExamModal open={groupExamOpen} onOpenChange={setGroupExamOpen} />
    </div>
  );
}
