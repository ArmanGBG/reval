'use client';

import { useMemo, useState } from 'react';
import { School, Clock, Plus, Pencil } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { isGraduate, Task } from '@/lib/types';
import { formatSchoolPresenceSummary } from '@/lib/school-presence';
import TaskCard, { TaskCardCapabilities } from '@/components/plan/TaskCard';
import SchoolPresenceModal from '@/components/plan/SchoolPresenceModal';

export interface SchoolDayContainerProps {
  selectedDate: string;
  studentId: string;
  grade?: string | null;
  schoolTasks: Task[];
  onAddSchoolTask: () => void;
  onCompleteTask: (id: string) => void;
  onSkipTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onActionTask: (id: string) => void;
  onSettingsTask: (id: string) => void;
  onResetTask: (id: string) => void;
  onEditTask?: (id: string) => void;
  onHomeworkTask?: (id: string) => void;
  getCapabilities?: (task: Task) => TaskCardCapabilities;
}

export default function SchoolDayContainer({
  selectedDate,
  studentId,
  grade,
  schoolTasks,
  onAddSchoolTask,
  onCompleteTask,
  onSkipTask,
  onDeleteTask,
  onActionTask,
  onSettingsTask,
  onResetTask,
  onEditTask,
  onHomeworkTask,
  getCapabilities,
}: SchoolDayContainerProps) {
  const [presenceModalOpen, setPresenceModalOpen] = useState(false);
  const { schoolPresences, user } = useAppStore();

  const effectiveGrade = grade ?? user?.grade;

  // 1. Conditional Rendering: Completely hide for graduated users
  if (isGraduate(effectiveGrade)) {
    return null;
  }

  // Find school presence record for this student and date
  const currentPresence = schoolPresences.find(
    (p) => p.date === selectedDate && (!p.userId || p.userId === studentId),
  );

  return (
    <>
      <div
        className="rounded-2xl border border-blue-900/50 bg-zinc-900/50 p-4 md:p-5 backdrop-blur-sm shadow-sm transition-all"
        dir="rtl"
      >
        {!currentPresence ? (
          /* State 1 (Empty): Prominent CTA to log school hours */
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10 text-blue-400">
                <School className="size-5" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold text-zinc-100">
                  حضور و مطالعه در مدرسه
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  ثبت ساعت ورود و خروج برای محاسبه ساعات حضور و ثبت مطالعه مفید در مدرسه
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPresenceModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600/20 px-4 py-2.5 text-xs md:text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-600/30 shrink-0"
            >
              <Clock className="size-4" />
              <span>ثبت ساعت مدرسه</span>
            </button>
          </div>
        ) : (
          /* State 2 (Filled): Display total presence time + add school task button */
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-blue-900/40">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-400">
                  <School className="size-4.5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm md:text-base font-bold text-blue-100">
                    {formatSchoolPresenceSummary(
                      currentPresence.startTime,
                      currentPresence.endTime,
                      currentPresence.durationMinutes,
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPresenceModalOpen(true)}
                    className="p-1 rounded-md text-zinc-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                    title="ویرایش ساعت مدرسه"
                    aria-label="ویرایش ساعت مدرسه"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onAddSchoolTask}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 text-xs md:text-sm font-semibold shadow-sm transition-all shrink-0"
              >
                <Plus className="size-4" />
                <span>افزودن مطالعه مفید در مدرسه</span>
              </button>
            </div>

            {/* School Tasks List */}
            {schoolTasks.length === 0 ? (
              <div className="mt-3.5 rounded-xl border border-dashed border-blue-900/40 bg-blue-950/20 p-4 text-center">
                <p className="text-xs text-blue-300/80 font-medium">
                  هنوز مطالعه مفیدی برای این روز در مدرسه ثبت نشده است.
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  تسک‌های مطالعه شده در زنگ‌های تفریح یا کلاس را با دکمه «افزودن مطالعه مفید در مدرسه» ثبت کنید.
                </p>
              </div>
            ) : (
              <div className="mt-3.5 space-y-3">
                <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium px-1">
                  <span>مطالعه‌های ثبت‌شده در مدرسه:</span>
                  <span className="text-[11px] text-zinc-400">
                    {schoolTasks.length} تسک
                  </span>
                </div>
                {schoolTasks.map((task, idx) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={idx}
                    onComplete={onCompleteTask}
                    onSkip={onSkipTask}
                    onDelete={onDeleteTask}
                    onAction={onActionTask}
                    onSettings={onSettingsTask}
                    onReset={onResetTask}
                    onEdit={onEditTask}
                    onHomework={onHomeworkTask}
                    capabilities={getCapabilities?.(task)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <SchoolPresenceModal
        open={presenceModalOpen}
        onOpenChange={setPresenceModalOpen}
        selectedDate={selectedDate}
        studentId={studentId}
        existingRecord={currentPresence}
      />
    </>
  );
}
