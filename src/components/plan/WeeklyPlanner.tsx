'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, Calendar, ChevronDown, ChevronLeft, Loader2, Trash2, Clock, Target } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { Task, ActivityType, FieldType } from '@/lib/types';
import { Subject, TopicSelection } from '@/lib/subjects-types';
import { SubjectTopicPicker } from '@/components/shared/SubjectTopicPicker';

// ===== Persian Helpers =====
function toPersianNum(n: number): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

// Week starts on Saturday in Iran
const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'] as const;
type Weekday = typeof WEEKDAYS[number];

// Calculate the Saturday of the current week and return dates for all 7 days
function getWeekDates(startFromNext = false): Record<Weekday, string> {
  const today = new Date();
  const jsDay = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Convert to Iran week: Saturday=0, Sunday=1, ..., Friday=6
  const iranDay = jsDay === 6 ? 0 : jsDay + 1;
  // Find Saturday of current week
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - iranDay);
  if (startFromNext) {
    saturday.setDate(saturday.getDate() + 7);
  }

  const dates: Record<Weekday, string> = {} as Record<Weekday, string>;
  WEEKDAYS.forEach((day, i) => {
    const d = new Date(saturday);
    d.setDate(saturday.getDate() + i);
    dates[day] = d.toISOString().split('T')[0];
  });
  return dates;
}

// ===== Types =====
interface DaySubject {
  tempId: string;
  subject: Subject;
  fieldType: FieldType;
  topicSelection: TopicSelection | null;
  activities: ActivityType[];
  duration: number;
  testCount: number;
}

type WeekPlan = Record<Weekday, DaySubject[]>;

// ===== Activity types =====
const ACTIVITY_TYPES: ActivityType[] = ['مطالعه', 'مرور', 'تست آموزشی', 'تست سنجشی'];

// ============================================================
// Main Component
// ============================================================
interface WeeklyPlannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WeeklyPlanner({ open, onOpenChange }: WeeklyPlannerProps) {
  const { user, addTask, addTasks, tasks } = useAppStore();

  // Field type for the whole week (controls which subjects are available)
  const [fieldType, setFieldType] = useState<FieldType>('کنکور');

  // Available subjects (fetched from API)
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Week plan state
  const [weekPlan, setWeekPlan] = useState<WeekPlan>(() => {
    const empty: WeekPlan = {} as WeekPlan;
    WEEKDAYS.forEach((d) => (empty[d] = []));
    return empty;
  });

  // Which day's "add subject" picker is open
  const [addingToDay, setAddingToDay] = useState<Weekday | null>(null);

  // Which subject is being edited (for details)
  const [editingSubject, setEditingSubject] = useState<{ day: Weekday; tempId: string } | null>(null);

  // Week dates
  const [weekDates, setWeekDates] = useState<Record<Weekday, string>>(getWeekDates);
  const [useNextWeek, setUseNextWeek] = useState(false);

  // ===== Fetch subjects when fieldType changes =====
  const fetchSubjects = useCallback(async (ft: FieldType) => {
    setSubjectsLoading(true);
    try {
      const grade = user?.grade || 'دوازدهم';
      const major = user?.major || 'تجربی';
      const res = await fetch(
        `/api/subjects/for-task?fieldType=${encodeURIComponent(ft)}&grade=${encodeURIComponent(grade)}&major=${encodeURIComponent(major)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubjects(data.subjects || []);
    } catch {
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open) fetchSubjects(fieldType);
  }, [open, fieldType, fetchSubjects]);

  // Update week dates when toggling next week
  useEffect(() => {
    setWeekDates(getWeekDates(useNextWeek));
  }, [useNextWeek]);

  // ===== Add subject to a day =====
  const addSubjectToDay = (day: Weekday, subject: Subject) => {
    const newEntry: DaySubject = {
      tempId: crypto.randomUUID(),
      subject,
      fieldType,
      topicSelection: null,
      activities: [],
      duration: 60,
      testCount: 0,
    };
    setWeekPlan((prev) => ({
      ...prev,
      [day]: [...prev[day], newEntry],
    }));
    setAddingToDay(null);
  };

  // ===== Remove subject from a day =====
  const removeSubjectFromDay = (day: Weekday, tempId: string) => {
    setWeekPlan((prev) => ({
      ...prev,
      [day]: prev[day].filter((s) => s.tempId !== tempId),
    }));
  };

  // ===== Update subject details =====
  const updateSubjectDetails = (day: Weekday, tempId: string, updates: Partial<DaySubject>) => {
    setWeekPlan((prev) => ({
      ...prev,
      [day]: prev[day].map((s) => (s.tempId === tempId ? { ...s, ...updates } : s)),
    }));
  };

  // ===== Toggle activity =====
  const toggleActivity = (day: Weekday, tempId: string, activity: ActivityType) => {
    setWeekPlan((prev) => ({
      ...prev,
      [day]: prev[day].map((s) => {
        if (s.tempId !== tempId) return s;
        const has = s.activities.includes(activity);
        return {
          ...s,
          activities: has ? s.activities.filter((a) => a !== activity) : [...s.activities, activity],
        };
      }),
    }));
  };

  // ===== Save: create tasks for all days =====
  const handleSave = useCallback(() => {
    const newTasks: Task[] = [];
    let order = tasks.length;

    WEEKDAYS.forEach((day) => {
      const dateStr = weekDates[day];
      for (const entry of weekPlan[day]) {
        const task: Task = {
          id: crypto.randomUUID(),
          studentId: user?.id || 's1',
          subject: entry.subject.name,
          subjectColor: entry.subject.color,
          topic: entry.topicSelection?.displayText || 'عمومی',
          fieldType: entry.fieldType,
          activityTypes: entry.activities.length > 0 ? entry.activities : ['مطالعه'],
          targetTimeMinutes: entry.duration,
          actualTimeMinutes: null,
          targetTestCount: entry.testCount,
          actualTestCount: null,
          completed: null,
          date: dateStr,
          order: order++,
          createdBy: 'student',
        };
        newTasks.push(task);
      }
    });

    if (newTasks.length === 0) {
      toast.error('حداقل یک درس اضافه کنید');
      return;
    }

    addTasks(newTasks);
    toast.success(`${toPersianNum(newTasks.length)} تسک برای هفته ایجاد شد`);
    onOpenChange(false);

    // Reset
    const empty: WeekPlan = {} as WeekPlan;
    WEEKDAYS.forEach((d) => (empty[d] = []));
    setWeekPlan(empty);
  }, [weekPlan, weekDates, tasks.length, user, addTasks, onOpenChange]);

  // ===== Stats =====
  const totalSubjects = WEEKDAYS.reduce((acc, day) => acc + weekPlan[day].length, 0);
  const totalDetailed = WEEKDAYS.reduce(
    (acc, day) => acc + weekPlan[day].filter((s) => s.topicSelection || s.activities.length > 0).length,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-2 border-[var(--border-strong)] text-[var(--foreground)] max-w-[calc(100%-1rem)] sm:max-w-4xl max-h-[92vh] overflow-hidden flex flex-col rounded-2xl p-0" dir="rtl">
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)]">برنامه هفتگی</h2>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                {toPersianNum(totalSubjects)} درس · {toPersianNum(totalDetailed)} با جزئیات
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Week toggle */}
            <button
              onClick={() => setUseNextWeek((v) => !v)}
              className="btn-hover h-8 px-3 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-xs font-medium"
            >
              {useNextWeek ? 'هفته بعد' : 'این هفته'}
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="icon-btn w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--foreground-muted)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ===== Field type selector ===== */}
        <div className="px-5 py-3 border-b border-[var(--border)] shrink-0">
          <div className="flex gap-1 bg-[var(--bg-overlay)] rounded-xl p-1 w-full max-w-xs">
            {(['کنکور', 'نهایی'] as FieldType[]).map((ft) => (
              <button
                key={ft}
                onClick={() => setFieldType(ft)}
                className={`btn-hover flex-1 h-8 rounded-lg text-xs font-semibold ${
                  fieldType === ft
                    ? 'bg-[var(--accent)] text-[var(--bg-deep)]'
                    : 'text-[var(--foreground-muted)]'
                }`}
              >
                {ft}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Days grid ===== */}
        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
          {/* Desktop: 7-col grid. Mobile: vertical stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {WEEKDAYS.map((day) => (
              <DayColumn
                key={day}
                day={day}
                date={weekDates[day]}
                subjects={weekPlan[day]}
                onAdd={() => setAddingToDay(day)}
                onRemove={(tempId) => removeSubjectFromDay(day, tempId)}
                onEdit={(tempId) => setEditingSubject({ day, tempId })}
              />
            ))}
          </div>
        </div>

        {/* ===== Footer ===== */}
        <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-[var(--foreground-muted)]">
            روی هر درس کلیک کنید تا جزئیاتش را وارد کنید
          </p>
          <button
            onClick={handleSave}
            disabled={totalSubjects === 0}
            className="btn-hover glow-hover h-10 px-6 rounded-xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-sm disabled:opacity-40 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            اعمال روی هفته
          </button>
        </div>

        {/* ===== Add Subject Picker Modal ===== */}
        {addingToDay && (
          <AddSubjectModal
            day={addingToDay}
            subjects={subjects}
            loading={subjectsLoading}
            onClose={() => setAddingToDay(null)}
            onSelect={(subject) => addSubjectToDay(addingToDay, subject)}
          />
        )}

        {/* ===== Edit Subject Details Modal ===== */}
        {editingSubject && (
          <EditSubjectModal
            day={editingSubject.day}
            entry={weekPlan[editingSubject.day].find((s) => s.tempId === editingSubject.tempId)!}
            onClose={() => setEditingSubject(null)}
            onUpdate={(updates) => updateSubjectDetails(editingSubject.day, editingSubject.tempId, updates)}
            onToggleActivity={(act) => toggleActivity(editingSubject.day, editingSubject.tempId, act)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Day Column
// ============================================================
function DayColumn({
  day,
  date,
  subjects,
  onAdd,
  onRemove,
  onEdit,
}: {
  day: Weekday;
  date: string;
  subjects: DaySubject[];
  onAdd: () => void;
  onRemove: (tempId: string) => void;
  onEdit: (tempId: string) => void;
}) {
  // Format date as Persian readable
  const dateObj = new Date(date);
  const dayNum = toPersianNum(dateObj.getDate());
  const monthNum = toPersianNum(dateObj.getMonth() + 1);

  // Check if this is today
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;

  return (
    <div className={`surface-1 rounded-xl overflow-hidden ${isToday ? 'ring-1 ring-[var(--accent)]/40' : ''}`}>
      {/* Day header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--foreground)]">{day}</span>
          {isToday && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              امروز
            </span>
          )}
        </div>
        <span className="text-[10px] text-[var(--foreground-subtle)]">
          {dayNum}/{monthNum}
        </span>
      </div>

      {/* Subjects list */}
      <div className="p-2 space-y-1.5 min-h-[60px]">
        {subjects.length === 0 ? (
          <p className="text-[10px] text-[var(--foreground-subtle)] text-center py-3">خالی</p>
        ) : (
          subjects.map((entry) => (
            <SubjectChip
              key={entry.tempId}
              entry={entry}
              onClick={() => onEdit(entry.tempId)}
              onRemove={() => onRemove(entry.tempId)}
            />
          ))
        )}
      </div>

      {/* Add button */}
      <button
        onClick={onAdd}
        className="btn-hover w-full flex items-center justify-center gap-1.5 py-2 border-t border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--accent)] text-[11px] font-medium"
      >
        <Plus className="w-3 h-3" />
        درس
      </button>
    </div>
  );
}

// ============================================================
// Subject Chip (clickable to edit)
// ============================================================
function SubjectChip({
  entry,
  onClick,
  onRemove,
}: {
  entry: DaySubject;
  onClick: () => void;
  onRemove: () => void;
}) {
  const hasDetails = entry.topicSelection || entry.activities.length > 0;

  return (
    <div className="group flex items-center gap-1.5">
      <button
        onClick={onClick}
        className={`btn-hover flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg border text-right ${
          hasDetails
            ? 'bg-[var(--accent-soft)] border-[var(--accent)]/20'
            : 'bg-[var(--bg-elevated)] border-[var(--border)]'
        }`}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: entry.subject.color }}
        />
        <span className="text-xs font-medium text-[var(--foreground)] truncate flex-1">
          {entry.subject.name}
        </span>
        {hasDetails ? (
          <Check className="w-3 h-3 text-[var(--accent)] shrink-0" />
        ) : (
          <ChevronDown className="w-3 h-3 text-[var(--foreground-subtle)] shrink-0" />
        )}
      </button>
      <button
        onClick={onRemove}
        className="icon-btn w-6 h-6 rounded flex items-center justify-center text-[var(--foreground-subtle)] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ============================================================
// Add Subject Modal (quick picker)
// ============================================================
function AddSubjectModal({
  day,
  subjects,
  loading,
  onClose,
  onSelect,
}: {
  day: Weekday;
  subjects: Subject[];
  loading: boolean;
  onClose: () => void;
  onSelect: (subject: Subject) => void;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="surface-2 border-[var(--border-strong)] text-[var(--foreground)] max-w-[calc(100%-2rem)] sm:max-w-sm rounded-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)] text-right text-sm">
            افزودن درس به {day}
          </DialogTitle>
          <DialogDescription className="text-[var(--foreground-muted)] text-right text-xs">
            درس مورد نظر را انتخاب کنید
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-[var(--foreground-muted)]">
            <Loader2 className="w-5 h-5 animate-spin ml-2" />
            <span className="text-xs">در حال بارگذاری...</span>
          </div>
        ) : subjects.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-[var(--foreground-muted)]">درسی یافت نشد</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className="btn-hover flex items-center gap-2 py-2.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--foreground)] hover:border-[var(--accent)]/30 text-sm"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Edit Subject Details Modal
// ============================================================
function EditSubjectModal({
  day,
  entry,
  onClose,
  onUpdate,
  onToggleActivity,
}: {
  day: Weekday;
  entry: DaySubject;
  onClose: () => void;
  onUpdate: (updates: Partial<DaySubject>) => void;
  onToggleActivity: (act: ActivityType) => void;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="surface-2 border-[var(--border-strong)] text-[var(--foreground)] max-w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)] text-right text-sm flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.subject.color }}
            />
            {entry.subject.name}
            <span className="text-[var(--foreground-muted)] font-normal">· {day}</span>
          </DialogTitle>
          <DialogDescription className="text-[var(--foreground-muted)] text-right text-xs">
            جزئیات این تسک را مشخص کنید (اختیاری)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Topic picker */}
          <div>
            <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 block">
              مبحث
            </label>
            <SubjectTopicPicker
              subject={entry.subject}
              defaultGrade="دوازدهم"
              value={entry.topicSelection}
              onChange={(sel) => onUpdate({ topicSelection: sel })}
            />
          </div>

          {/* Activity types */}
          <div>
            <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 block">
              نوع فعالیت
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITY_TYPES.map((act) => (
                <button
                  key={act}
                  onClick={() => onToggleActivity(act)}
                  className={`btn-hover px-3 py-2 rounded-lg text-xs font-medium border ${
                    entry.activities.includes(act)
                      ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--foreground-muted)]'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          {/* Duration & test count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 block flex items-center gap-1">
                <Clock className="w-3 h-3" />
                زمان (دقیقه)
              </label>
              <input
                type="number"
                value={entry.duration}
                onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 h-10 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
                dir="ltr"
              />
              <div className="flex gap-1 mt-1.5">
                {[30, 60, 90, 120].map((m) => (
                  <button
                    key={m}
                    onClick={() => onUpdate({ duration: m })}
                    className={`btn-hover flex-1 h-7 rounded text-[10px] font-medium border ${
                      entry.duration === m
                        ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {toPersianNum(m)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1.5 block flex items-center gap-1">
                <Target className="w-3 h-3" />
                تعداد تست
              </label>
              <input
                type="number"
                value={entry.testCount}
                onChange={(e) => onUpdate({ testCount: Number(e.target.value) })}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 h-10 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/40"
                dir="ltr"
              />
              <div className="flex gap-1 mt-1.5">
                {[0, 10, 20, 30].map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate({ testCount: t })}
                    className={`btn-hover flex-1 h-7 rounded text-[10px] font-medium border ${
                      entry.testCount === t
                        ? 'bg-[var(--accent-soft)] border-[var(--accent)]/30 text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {toPersianNum(t)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="btn-hover glow-hover flex-1 h-10 rounded-xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-sm"
          >
            تایید
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
