'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { AdminAdvisor, AdvisorConnectedStudent, UnassignedStudent } from '@/lib/types';
import { formatConnectionDuration, toPersianDigits } from '@/lib/persian-date';
import {
  Users,
  Search,
  Shield,
  UserPlus,
  UserMinus,
  Clock,
  Sparkles,
  ChevronLeft,
  Activity,
  Phone,
  GraduationCap,
  RefreshCcw,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  return date.toISOString().split('T')[0];
}

export function AdvisorsManagement() {
  const {
    adminAdvisors,
    unassignedStudents,
    adminAdvisorsLoading,
    loadAdminAdvisors,
    assignStudentToAdminAdvisor,
    removeStudentFromAdminAdvisor,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);
  const [studentToAssign, setStudentToAssign] = useState<string>('');
  const [assignSearch, setAssignSearch] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAdminAdvisors().catch((err) =>
      toast.error(err instanceof Error ? err.message : 'خطا در بارگذاری مشاوران'),
    );
  }, [loadAdminAdvisors]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAdminAdvisors();
      toast.success('لیست مشاوران به‌روزرسانی شد');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'به‌روزرسانی ناموفق بود');
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  };

  // Find currently selected advisor
  const selectedAdvisor = useMemo(
    () => adminAdvisors.find((a) => a.id === selectedAdvisorId) || null,
    [adminAdvisors, selectedAdvisorId],
  );

  // Filter advisors by name or phone
  const filteredAdvisors = useMemo(() => {
    let result = [...adminAdvisors];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.phone.includes(q) ||
          (a.publicCode && a.publicCode.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [adminAdvisors, searchQuery]);

  // Filter unassigned students in sheet
  const filteredUnassignedStudents = useMemo(() => {
    let result = [...unassignedStudents];
    if (assignSearch.trim()) {
      const q = assignSearch.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          (s.grade && s.grade.toLowerCase().includes(q)) ||
          (s.major && s.major.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [unassignedStudents, assignSearch]);

  // Handle Remove Connection
  const handleRemoveConnection = async (studentId: string, studentName: string) => {
    if (!selectedAdvisorId) return;
    if (!window.confirm(`آیا از حذف ارتباط دانش‌آموز «${studentName}» با این مشاور اطمینان دارید؟`)) {
      return;
    }

    try {
      setSubmittingAction(true);
      await removeStudentFromAdminAdvisor(selectedAdvisorId, studentId);
      toast.success(`ارتباط دانش‌آموز «${studentName}» با مشاور حذف شد`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در حذف ارتباط');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Assign Student
  const handleAssignStudent = async () => {
    if (!selectedAdvisorId || !studentToAssign) {
      toast.error('لطفاً یک دانش‌آموز انتخاب کنید');
      return;
    }

    try {
      setSubmittingAction(true);
      await assignStudentToAdminAdvisor(selectedAdvisorId, studentToAssign);
      toast.success('دانش‌آموز با موفقیت به مشاور تخصیص یافت');
      setStudentToAssign('');
      setAssignSearch('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در تخصیص دانش‌آموز');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Search and Action Bar */}
      <div className="surface-1 rounded-[14px] p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="جستجوی مشاور بر اساس نام، شماره موبایل یا کد اختصاصی..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] pr-10 pl-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing || adminAdvisorsLoading}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] text-muted-foreground hover:text-foreground hover:border-gold/40 disabled:opacity-50 transition-colors"
            title="به‌روزرسانی لیست مشاوران"
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="text-xs text-muted-foreground">
            <span>{toPersianDigits(filteredAdvisors.length)} مشاور</span>
          </div>
        </div>
      </div>

      {/* Advisors Table */}
      <div className="surface-1 rounded-[16px] overflow-hidden border border-[var(--border)]">
        {/* Table Header */}
        <div className="grid grid-cols-[3fr_2fr_2fr_2fr_1.5fr] gap-3 px-4 py-3.5 text-xs text-muted-foreground font-bold uppercase tracking-wide border-b border-[var(--border)] bg-[var(--bg-base)]/50">
          <div>نام مشاور</div>
          <div className="text-center">دانش‌آموزان تحت پوشش</div>
          <div className="text-center">میانگین استمرار دانش‌آموزان</div>
          <div className="text-center">آخرین فعالیت</div>
          <div className="text-left">عملیات</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--border)] max-h-[640px] overflow-y-auto">
          {adminAdvisorsLoading && adminAdvisors.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-gold" />
              <span>در حال بارگذاری اطلاعات مشاوران...</span>
            </div>
          ) : filteredAdvisors.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              مشاوری با این مشخصات یافت نشد
            </div>
          ) : (
            filteredAdvisors.map((advisor) => {
              const lastActiveText = formatRelativeTime(advisor.lastActive);
              const consistency = advisor.averageStudentConsistency;

              return (
                <div
                  key={advisor.id}
                  className="grid grid-cols-[3fr_2fr_2fr_2fr_1.5fr] gap-3 px-4 py-3.5 items-center hover:bg-white/[0.02] transition-colors"
                >
                  {/* Advisor Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center text-xl shrink-0 shadow-inner">
                      {advisor.avatar || <Shield className="w-5 h-5 text-gold" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground truncate">{advisor.name}</span>
                        <Badge variant="outline" className="text-[10px] bg-gold/10 text-gold border-gold/30">
                          مشاور
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                        {advisor.phone}
                      </span>
                    </div>
                  </div>

                  {/* Total Students Assigned */}
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                      <Users className="w-3.5 h-3.5" />
                      <span>{toPersianDigits(advisor.totalStudentsAssigned)} دانش‌آموز</span>
                    </span>
                  </div>

                  {/* Average Consistency */}
                  <div className="flex flex-col items-center justify-center gap-1 px-4">
                    <div className="flex items-center justify-between w-full max-w-[120px] text-xs">
                      <span className="text-muted-foreground text-[11px]">میانگین:</span>
                      <span className="font-bold text-foreground">{toPersianDigits(consistency)}٪</span>
                    </div>
                    <div className="w-full max-w-[120px] h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          consistency >= 70
                            ? 'bg-emerald-500'
                            : consistency >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                        }`}
                        style={{ width: `${consistency}%` }}
                      />
                    </div>
                  </div>

                  {/* Last Active */}
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground">{lastActiveText}</span>
                  </div>

                  {/* Actions */}
                  <div className="text-left">
                    <Button
                      size="sm"
                      onClick={() => setSelectedAdvisorId(advisor.id)}
                      className="h-8 px-3 text-xs bg-gold/15 hover:bg-gold/25 text-gold border border-gold/30 rounded-lg inline-flex items-center gap-1.5 font-bold"
                    >
                      <span>مدیریت ارتباطات</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Advisor Details Slide-out Sheet */}
      <Sheet open={Boolean(selectedAdvisor)} onOpenChange={(open) => !open && setSelectedAdvisorId(null)}>
        <SheetContent
          side="left"
          className="w-full sm:max-w-xl bg-zinc-950 border-zinc-800 text-zinc-100 overflow-y-auto p-0 flex flex-col"
          dir="rtl"
        >
          {selectedAdvisor && (
            <>
              {/* Sheet Top Header */}
              <div className="p-5 border-b border-zinc-800 bg-zinc-900/40">
                <SheetHeader className="text-right space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-2xl">
                        {selectedAdvisor.avatar || <Shield className="w-6 h-6 text-gold" />}
                      </div>
                      <div>
                        <SheetTitle className="text-lg font-bold text-zinc-100">
                          {selectedAdvisor.name}
                        </SheetTitle>
                        <SheetDescription className="text-xs text-zinc-400 font-mono" dir="ltr">
                          {selectedAdvisor.phone}
                        </SheetDescription>
                      </div>
                    </div>

                    <Badge className="bg-gold/15 text-gold border border-gold/30 text-xs px-2.5 py-1">
                      مشاور تحصیلی
                    </Badge>
                  </div>
                </SheetHeader>

                {/* Quick Metrics Bar */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                    <span className="text-[11px] text-zinc-400">دانش‌آموزان متصل</span>
                    <p className="text-lg font-black text-emerald-400 mt-0.5">
                      {toPersianDigits(selectedAdvisor.connectedStudents.length)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                    <span className="text-[11px] text-zinc-400">میانگین استمرار دانش‌آموزان</span>
                    <p className="text-lg font-black text-gold mt-0.5">
                      {toPersianDigits(selectedAdvisor.averageStudentConsistency)}٪
                    </p>
                  </div>
                </div>
              </div>

              {/* Sheet Body */}
              <div className="p-5 space-y-6 flex-1 overflow-y-auto">
                {/* 1. Assign New Student Section */}
                <div className="rounded-2xl border border-gold/25 bg-gold/[0.03] p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-gold">
                    <UserPlus className="w-4 h-4" />
                    <span>اتصال دانش‌آموز جدید به این مشاور</span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    می‌توانید دانش‌آموزان بدون مشاور را جستجو کرده و مستقیماً به این مشاور تخصیص دهید.
                  </p>

                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="فیلتر دانش‌آموزان بدون مشاور..."
                        value={assignSearch}
                        onChange={(e) => setAssignSearch(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-gold/50"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Select value={studentToAssign} onValueChange={setStudentToAssign}>
                        <SelectTrigger className="flex-1 bg-zinc-900 border-zinc-800 text-zinc-200 text-xs h-9">
                          <SelectValue placeholder="انتخاب دانش‌آموز بدون مشاور..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-h-56">
                          {filteredUnassignedStudents.length === 0 ? (
                            <div className="p-2 text-xs text-zinc-500 text-center">
                              دانش‌آموز بدون مشاوری یافت نشد
                            </div>
                          ) : (
                            filteredUnassignedStudents.map((st) => (
                              <SelectItem key={st.id} value={st.id} className="text-xs focus:bg-zinc-800">
                                {st.name} ({st.grade || 'پایه نامشخص'} - {st.major || 'رشته نامشخص'})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        disabled={!studentToAssign || submittingAction}
                        onClick={handleAssignStudent}
                        className="h-9 px-4 bg-gold hover:bg-gold/90 text-[var(--bg-deep)] font-bold text-xs rounded-lg shrink-0"
                      >
                        {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5 ml-1" />}
                        <span>اتصال</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 2. Connected Students List Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-zinc-200">دانش‌آموزان متصل</h4>
                    </div>
                    <Badge variant="outline" className="text-xs border-zinc-800 text-zinc-400">
                      {toPersianDigits(selectedAdvisor.connectedStudents.length)} دانش‌آموز
                    </Badge>
                  </div>

                  {selectedAdvisor.connectedStudents.length === 0 ? (
                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-8 text-center text-xs text-zinc-500">
                      هنوز هیچ دانش‌آموزی به این مشاور اختصاص داده نشده است.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedAdvisor.connectedStudents.map((student) => {
                        const durationText = formatConnectionDuration(student.connectedAt);

                        return (
                          <div
                            key={student.id}
                            className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-3.5 space-y-2.5 hover:border-zinc-700/80 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-lg shrink-0">
                                  {student.avatar || '🎓'}
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-zinc-100">{student.name}</h5>
                                  <p className="text-[11px] text-zinc-400 mt-0.5">
                                    {student.grade || 'پایه نامشخص'} · {student.major || 'رشته نامشخص'}
                                  </p>
                                </div>
                              </div>

                              {/* Remove Connection Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={submittingAction}
                                onClick={() => handleRemoveConnection(student.id, student.name)}
                                className="h-7 px-2.5 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg inline-flex items-center gap-1 font-semibold"
                                title="حذف ارتباط با مشاور"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                <span>حذف ارتباط</span>
                              </Button>
                            </div>

                            {/* Connection Duration & Metrics */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 text-[11px]">
                              <div className="flex items-center gap-1.5 text-zinc-400">
                                <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                <span>{durationText}</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-500 text-[10px]">استمرار:</span>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold ${
                                    student.consistencyRate >= 70
                                      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                      : student.consistencyRate >= 40
                                        ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                                        : 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                                  }`}
                                >
                                  {toPersianDigits(student.consistencyRate)}٪
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
