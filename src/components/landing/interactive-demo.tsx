"use client";

import * as React from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import TaskCard from "@/components/plan/TaskCard";
import { TaskActionDialog } from "@/components/plan/TaskActionDialog";
import MinimalAnalyticsView from "@/components/analytics/MinimalAnalyticsView";
import { getRandomFailureMessage } from "@/lib/constants/feedbackMessages";
import { toISODate } from "@/lib/persian-date";
import type { Task } from "@/lib/types";
import styles from "./interactive-demo.module.css";

// Keep the demo task on the same local calendar day used by the analytics
// helpers; UTC serialization can move it to yesterday in Tehran.
const DEMO_DATE = toISODate(new Date());

const INITIAL_TASKS: Task[] = [
  {
    id: "landing-biology",
    studentId: "landing-demo",
    subjectId: "landing-biology-subject",
    subject: "زیست‌شناسی ۳",
    subjectColor: "#3EBA8C",
    topic: "فصل ۱: مولکول‌های اطلاعاتی",
    fieldType: "کنکور",
    activityTypes: ["تست آموزشی"],
    targetTimeMinutes: 45,
    actualTimeMinutes: null,
    targetTestCount: 30,
    actualTestCount: null,
    status: "PENDING",
    completed: null,
    date: DEMO_DATE,
    order: 0,
    createdBy: "student",
    bookName: "زیست جامع",
    testDescription: "تست‌های ۱ تا ۳۰",
    detailsCompleted: true,
  },
  {
    id: "landing-physics",
    studentId: "landing-demo",
    subjectId: "landing-physics-subject",
    subject: "فیزیک ۳",
    subjectColor: "#C9A24D",
    topic: "فصل ۲: دینامیک",
    fieldType: "کنکور",
    activityTypes: ["کلاس/ویدیو"],
    targetTimeMinutes: 60,
    actualTimeMinutes: null,
    targetTestCount: 0,
    actualTestCount: null,
    status: "PENDING",
    completed: null,
    date: DEMO_DATE,
    order: 1,
    createdBy: "student",
    teacherClassName: "استاد رضایی",
    sessionNumber: "جلسه ۱۲",
    detailsCompleted: true,
  },
  {
    id: "landing-chemistry",
    studentId: "landing-demo",
    subjectId: "landing-chemistry-subject",
    subject: "شیمی ۳",
    subjectColor: "#7DC499",
    topic: "فصل ۱: مولکول‌ها در خدمت تندرستی",
    fieldType: "کنکور",
    activityTypes: ["مرور"],
    targetTimeMinutes: 30,
    actualTimeMinutes: null,
    targetTestCount: 0,
    actualTestCount: null,
    status: "PENDING",
    completed: null,
    date: DEMO_DATE,
    order: 2,
    createdBy: "student",
    bookName: "کتاب درسی شیمی ۳",
    pageStart: 18,
    pageEnd: 29,
    detailsCompleted: true,
  },
];

export function InteractiveDemo() {
  const reduceMotion = useReducedMotion();
  const [tasks, setTasks] = React.useState<Task[]>(INITIAL_TASKS);
  const [actionTaskId, setActionTaskId] = React.useState<string | null>(null);
  const hasCompletedTask = tasks.some((task) => task.status === "COMPLETED");
  const analyticsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = analyticsRef.current;
    if (!hasCompletedTask || !root) return;
    const hideRangeFilters = () => {
      const labels = new Set(["روزانه", "هفته جاری", "ماهانه", "بازه دلخواه"]);
      const buttons = Array.from(root.querySelectorAll("button"))
        .filter((button) => labels.has(button.textContent?.trim() ?? ""));
      if (buttons.length === 4 && buttons[0].parentElement) {
        buttons[0].parentElement.style.setProperty("display", "none", "important");
      }
    };
    hideRangeFilters();
    const observer = new MutationObserver(hideRangeFilters);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [hasCompletedTask]);

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...updates } : task));
  };
  const completeTask = (id: string) => {
    const task = tasks.find((item) => item.id === id);
    updateTask(id, {
      status: "COMPLETED",
      completed: true,
      actualTimeMinutes: task?.targetTimeMinutes ?? 0,
      actualTestCount: task?.targetTestCount ?? 0,
    });
  };
  const skipTask = (id: string) => updateTask(id, { status: "SKIPPED", completed: false });
  const resetTask = (id: string) => updateTask(id, { status: "PENDING", completed: null, actualTimeMinutes: null, actualTestCount: null });
  const taskCountByDate = tasks.reduce<Record<string, number>>((counts, task) => {
    counts[task.date] = (counts[task.date] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <section id="features" className="relative scroll-mt-16 overflow-hidden border-b border-border/50 py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.1]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-black leading-tight text-foreground sm:text-5xl">بخشی از محیط اپ این شکلیه...</h2>
          <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground sm:text-base">رایگان ثبت‌نام کن و از تمام قابلیت‌هامون استفاده کن!</p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <div className="text-right"><p className="text-xs text-muted-foreground">برنامه امروز</p><h3 className="mt-1 text-xl font-black text-foreground">تسک‌های من</h3></div>
          </div>
          <div className={`${styles.taskDemo} space-y-3`}>
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onComplete={completeTask}
                onSkip={skipTask}
                onDelete={(id) => setTasks((current) => current.filter((item) => item.id !== id))}
                onAction={setActionTaskId}
                onSettings={(id) => {
                  const task = tasks.find((item) => item.id === id);
                  updateTask(id, {
                    status: "COMPLETED",
                    completed: true,
                    actualTimeMinutes: Math.round((task?.targetTimeMinutes ?? 0) / 2),
                    actualTestCount: Math.round((task?.targetTestCount ?? 0) / 2),
                  });
                }}
                onReset={resetTask}
              />
            ))}
          </div>

          <div className="mx-auto flex h-32 w-px items-center justify-center bg-gradient-to-b from-mint/60 via-mint/20 to-transparent" aria-hidden="true">
            <motion.span animate={reduceMotion ? undefined : { y: [-28, 28, -28] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} className="size-2 shrink-0 rounded-full bg-mint" />
          </div>

          <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <div className="text-right"><p className="text-xs text-muted-foreground">متصل به تسک‌های بالا</p><h3 className="mt-1 text-xl font-black text-foreground">گزارش مطالعه</h3></div>
          </div>
          {hasCompletedTask ? (
            <div ref={analyticsRef} className={`${styles.analyticsDemo} landingAnalyticsDemo`}>
              <MinimalAnalyticsView tasksOverride={tasks} embedded initialTimeFilter="روزانه" initialReportView="روش مطالعه روزانه" />
            </div>
          ) : (
            <div className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-border bg-background/35 px-6 text-center">
              <p className="max-w-sm text-sm font-semibold leading-7 text-muted-foreground">بالا تسک‌ها رو تیک بزن تا آنالیزت رو اینجا ببینی</p>
            </div>
          )}
        </div>

        <div className="mx-auto mt-14 max-w-2xl text-center">
          <p className="text-lg font-bold leading-8 text-foreground">می‌خوای تک‌تک تسک‌هاتو خودت اضافه کنی و این آنالیز دقیق رو برای خودت داشته باشی؟</p>
          <Link href="#signup" className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-mint px-6 text-sm font-semibold text-[#06120c] shadow-[0_14px_42px_-12px_var(--mint)] transition-all hover:brightness-110 focus-ring-mint"><LogIn className="size-4" aria-hidden="true" />ورود/ثبت‌نام</Link>
        </div>
      </div>
      <TaskActionDialog
        task={tasks.find((task) => task.id === actionTaskId) ?? null}
        open={actionTaskId !== null}
        onOpenChange={(open) => { if (!open) setActionTaskId(null); }}
        taskCountByDate={taskCountByDate}
        onMoveDate={async (id, date) => { updateTask(id, { date, status: "PENDING", completed: null }); }}
        onMoveToIncomplete={async (id) => {
          updateTask(id, { status: "INCOMPLETE", completed: null });
          toast(getRandomFailureMessage());
        }}
        onDelete={async (id) => { setTasks((current) => current.filter((task) => task.id !== id)); }}
      />
    </section>
  );
}
