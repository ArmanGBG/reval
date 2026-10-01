'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  CalendarCheck, 
  BarChart3, 
  Moon, 
  Users, 
  Check, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ArrowLeft,
  Flame,
  Trophy,
  Activity,
  MessageSquare
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

// ==========================================
// Types & Mock Data
// ==========================================

export type FeatureTabId = 'planning' | 'analytics' | 'sleep' | 'advisor';

export interface MockTask {
  id: string;
  featureId: FeatureTabId;
  subject: string;
  topic: string;
  targetMinutes: number;
  testCount: number;
  subjectColor: string;
  badge: string;
}

const MOCK_TASKS: MockTask[] = [
  {
    id: 'task-bio',
    featureId: 'planning',
    subject: 'زیست‌شناسی ۳',
    topic: 'گفتار ۲: تنظیم بیان ژن و پروتئین‌سازی',
    targetMinutes: 45,
    testCount: 30,
    subjectColor: '#10b981', // emerald
    badge: 'تست آموزشی',
  },
  {
    id: 'task-chem',
    featureId: 'planning',
    subject: 'شیمی دوازدهم',
    topic: 'فصل اول: اسیدها و بازها و ثابت تعادل',
    targetMinutes: 60,
    testCount: 25,
    subjectColor: '#06b6d4', // cyan
    badge: 'مرور و جمع‌بندی',
  },
  {
    id: 'task-phys',
    featureId: 'analytics',
    subject: 'فیزیک ۳',
    topic: 'دینامیک پیشرفته: تکانه و قوانین نیوتون',
    targetMinutes: 90,
    testCount: 40,
    subjectColor: '#f59e0b', // amber
    badge: 'تست زمان‌دار',
  },
  {
    id: 'task-math',
    featureId: 'analytics',
    subject: 'ریاضیات تجربی',
    topic: 'کاربرد مشتق: نقاط بحرانی و اکسترمم‌های نسبی',
    targetMinutes: 60,
    testCount: 20,
    subjectColor: '#a855f7', // purple
    badge: 'تحلیل تیپ‌تست',
  },
  {
    id: 'task-sleep',
    featureId: 'sleep',
    subject: 'پایش ریتم خواب',
    topic: 'خواب شبانه ۲۳:۳۰ الی ۰۷:۰۰ (۷.۵ ساعت خواب مفید)',
    targetMinutes: 450, // 7.5 hrs
    testCount: 0,
    subjectColor: '#6366f1', // indigo
    badge: 'نظم شبانه‌روزی',
  },
  {
    id: 'task-advisor',
    featureId: 'advisor',
    subject: 'ارتباط با مشاور',
    topic: 'ارسال خودکار گزارش‌کار روزانه و دریافت فیدبک تحلیلی',
    targetMinutes: 15,
    testCount: 0,
    subjectColor: '#ec4899', // pink
    badge: 'بازخورد آنلاین',
  },
];

interface FeatureConfig {
  id: FeatureTabId;
  title: string;
  label: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
  badgeText: string;
}

const FEATURE_CONFIGS: FeatureConfig[] = [
  {
    id: 'planning',
    title: 'بودجه‌بندی و برنامه‌ریزی هوشمند',
    label: 'برنامه‌ریزی',
    tagline: 'چینش دقیق مباحث در باکس‌های مطالعاتی متناسب با توان ذهنی و کنکور',
    icon: CalendarCheck,
    image: '/images/preview/dark/study-plan.webp',
    badgeText: 'تقویم هوشمند',
  },
  {
    id: 'analytics',
    title: 'آنالیز دقیق ساعت و تست',
    label: 'آنالیز پیشرفته',
    tagline: 'رسم خودکار نمودارهای پیشرفت، ساعت مطالعه و بازدهی تستی بدون دفتر کاغذی',
    icon: BarChart3,
    image: '/images/preview/dark/subject-analysis1.webp',
    badgeText: 'تحلیل لحظه‌ای',
  },
  {
    id: 'sleep',
    title: 'پایش الگوی خواب و سبک زندگی',
    label: 'پایش خواب',
    tagline: 'ثبت منظم خواب شبانه و کشف همبستگی کیفیت استراحت با تمرکز روزانه',
    icon: Moon,
    image: '/images/preview/dark/sleep-tracker.webp',
    badgeText: 'سلامت ذهن',
  },
  {
    id: 'advisor',
    title: 'ارتباط زنده و شفاف با مشاور',
    label: 'پنل مشاور',
    tagline: 'ارسال بلادرنگ گزارش‌کار و تبدیل جلسات به گفت‌وگوهای راهبردی و موثر',
    icon: Users,
    image: '/landing-shots/feature-advisor.webp',
    badgeText: 'نظارت دوطرفه',
  },
];

export function ProductPlayground() {
  const [completedTaskIds, setCompletedTaskIds] = React.useState<string[]>([
    'task-bio', // 1 task checked initially so user sees the progress bar active
  ]);
  const [activeFeatureTab, setActiveFeatureTab] = React.useState<FeatureTabId>('planning');
  const reduceMotion = useReducedMotion();

  const toggleTask = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const isAlready = prev.includes(taskId);
      if (isAlready) {
        return prev.filter((id) => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });

    // Automatically switch active tab to this task's feature if not already active
    const clickedTask = MOCK_TASKS.find((t) => t.id === taskId);
    if (clickedTask && clickedTask.featureId !== activeFeatureTab) {
      setActiveFeatureTab(clickedTask.featureId);
    }
  };

  const totalTasks = MOCK_TASKS.length;
  const completedCount = completedTaskIds.length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  // Compute stats from completed tasks
  const completedTasks = MOCK_TASKS.filter((t) => completedTaskIds.includes(t.id));
  const completedStudyMinutes = completedTasks
    .filter((t) => t.featureId !== 'sleep')
    .reduce((acc, t) => acc + t.targetMinutes, 0);
  const completedStudyHours = (completedStudyMinutes / 60).toFixed(1);
  const completedTests = completedTasks.reduce((acc, t) => acc + t.testCount, 0);

  const activeFeature = FEATURE_CONFIGS.find((f) => f.id === activeFeatureTab) || FEATURE_CONFIGS[0];

  return (
    <section 
      id="playground" 
      className="scroll-mt-20 py-20 sm:py-28 relative overflow-hidden border-t border-zinc-800/60"
    >
      {/* Background ambient light */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-teal-500/5 blur-[120px]" />

      <div className="mx-auto max-w-6xl px-5 sm:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-md mb-4">
            <Sparkles className="size-3.5 animate-pulse" />
            <span>پلی‌گراند تعاملی روال • Product Playground</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-100 tracking-tight text-balance">
            قبل از ثبت‌نام، حس خوب «روی روال بودن» رو تجربه کن
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400 text-sm sm:text-base leading-relaxed text-balance">
            تسک‌های روزانه‌ی <span className="text-emerald-400 font-bold">«دوست روالی من»</span> رو تیک بزن تا ثبت سریع، پر شدن نوار پیشرفت و نمودارهای لحظه‌ای رو لمس کنی.
          </p>
        </div>

        {/* ========================================================
            TOP DOPAMINE HOOK: User Info & Main Progress Bar
            ======================================================== */}
        <div className="mb-8 rounded-2xl border border-zinc-800/90 bg-zinc-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* User pill */}
            <div className="flex items-center gap-3">
              <div className="relative flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 font-black text-base shadow-inner">
                <span>روال</span>
                <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-500 border-2 border-zinc-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-zinc-100 text-base sm:text-lg">دوست روالی من</h3>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px] py-0 px-2 font-medium">
                    کنکوری هدفمند
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  برنامه‌ی اختصاصی امروز • پنجشنبه، ۱۲ مهر
                </p>
              </div>
            </div>

            {/* Score & Completed stats */}
            <div className="flex items-center gap-3 sm:gap-6 self-start sm:self-auto">
              <div className="flex flex-col items-start sm:items-end">
                <span className="text-xs text-zinc-400">ساعت ثبت‌شده</span>
                <span className="text-sm sm:text-base font-bold text-zinc-200">
                  {completedStudyHours} از ۴.۵ ساعت
                </span>
              </div>
              <div className="h-7 w-px bg-zinc-800" />
              <div className="flex flex-col items-start sm:items-end">
                <span className="text-xs text-zinc-400">تست کارشده</span>
                <span className="text-sm sm:text-base font-bold text-zinc-200">
                  {completedTests} از ۱۱۵ تست
                </span>
              </div>
              <div className="h-7 w-px bg-zinc-800" />
              <div className="flex flex-col items-start sm:items-end">
                <span className="text-xs text-zinc-400">پیشرفت کل</span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-400">
                  {progressPercent}٪
                </span>
              </div>
            </div>
          </div>

          {/* Glowing Animated Progress Bar */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 font-medium">
                {progressPercent === 100 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Trophy className="size-3.5" />
                    فوق‌العاده است! تمام برنامه‌ی امروز روال شد!
                  </span>
                ) : progressPercent >= 50 ? (
                  <span className="text-teal-400 font-medium flex items-center gap-1">
                    <Flame className="size-3.5 text-amber-400" />
                    بیش از نیمی از مسیر امروز رو رفتی؛ ادامه بده!
                  </span>
                ) : (
                  <span>با زدن تیک هر تسک، بازدهی و نوار پیشرفتت رشد می‌کنه</span>
                )}
              </span>
              <span className="font-semibold text-zinc-300">
                {completedCount} از {totalTasks} تسک تکمیل شد
              </span>
            </div>

            {/* Custom high-performance animated progress bar */}
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-950/80 border border-zinc-800/80 p-0.5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-l from-emerald-400 via-teal-400 to-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.7)]"
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: 'spring', stiffness: 90, damping: 18 }}
              />
            </div>
          </div>
        </div>

        {/* ========================================================
            TWO-COLUMN PLAYGROUND LAYOUT (RTL)
            Right: Interactive Checklist / Feature Controllers
            Left: Dynamic UI Visualizer
            ======================================================== */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ----------------------------------------------------
              RIGHT COLUMN: Interactive Checklist & Controllers
              (Order 1 on mobile, visual right in RTL on desktop)
              ---------------------------------------------------- */}
          <div className="w-full lg:col-span-5 flex flex-col gap-5">
            
            {/* Feature Tabs Bar */}
            <div className="flex items-center justify-between gap-1.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-1.5 backdrop-blur-md">
              {FEATURE_CONFIGS.map((feature) => {
                const Icon = feature.icon;
                const isActive = activeFeatureTab === feature.id;
                return (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => setActiveFeatureTab(feature.id)}
                    className={`group flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-semibold transition-all duration-200 outline-none ${
                      isActive
                        ? 'bg-zinc-800 text-emerald-400 shadow-md border border-zinc-700/60'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <Icon className={`size-3.5 transition-transform group-hover:scale-110 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <span className="truncate">{feature.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Checklist Header */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                چک‌لیست تسک‌های روزانه (کلیک کن تا تیک بخوره)
              </span>
              <button
                type="button"
                onClick={() => {
                  if (completedTaskIds.length === totalTasks) {
                    setCompletedTaskIds([]);
                  } else {
                    setCompletedTaskIds(MOCK_TASKS.map((t) => t.id));
                  }
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
              >
                {completedTaskIds.length === totalTasks ? 'خالی کردن همه' : 'تیک زدن همه'}
              </button>
            </div>

            {/* Tasks List */}
            <div className="flex flex-col gap-3">
              {MOCK_TASKS.map((task) => {
                const isChecked = completedTaskIds.includes(task.id);
                const isBelongingToActiveTab = task.featureId === activeFeatureTab;

                return (
                  <motion.div
                    key={task.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Clicking anywhere on the card sets its feature tab active
                      setActiveFeatureTab(task.featureId);
                    }}
                    className={`group relative flex items-start gap-3.5 rounded-xl border p-3.5 sm:p-4 transition-all duration-200 cursor-pointer ${
                      isBelongingToActiveTab
                        ? 'border-emerald-500/40 bg-zinc-900/90 shadow-md ring-1 ring-emerald-500/20'
                        : 'border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700/80 hover:bg-zinc-900/70'
                    }`}
                  >
                    {/* Checkbox Container */}
                    <div 
                      className="pt-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(task.id);
                      }}
                    >
                      <motion.div
                        animate={isChecked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                        transition={{ duration: 0.25 }}
                        className={`flex size-5 items-center justify-center rounded-md border transition-all ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-zinc-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                            : 'border-zinc-700 bg-zinc-950 hover:border-emerald-500/50'
                        }`}
                      >
                        {isChecked && <Check className="size-3.5 stroke-[3]" />}
                      </motion.div>
                    </div>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span 
                            className="size-2 rounded-full shrink-0" 
                            style={{ backgroundColor: task.subjectColor }}
                          />
                          <h4 
                            className={`text-sm font-bold truncate transition-all duration-300 ${
                              isChecked 
                                ? 'line-through text-zinc-500 opacity-60' 
                                : 'text-zinc-100'
                            }`}
                          >
                            {task.subject}
                          </h4>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="shrink-0 text-[10px] py-0 px-2 font-normal bg-zinc-800/60 text-zinc-300 border-zinc-700/50"
                        >
                          {task.badge}
                        </Badge>
                      </div>

                      <p 
                        className={`mt-1 text-xs transition-all duration-300 ${
                          isChecked 
                            ? 'line-through text-zinc-500/80 opacity-60' 
                            : 'text-zinc-400'
                        }`}
                      >
                        {task.topic}
                      </p>

                      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-zinc-500">
                        {task.featureId !== 'sleep' && task.featureId !== 'advisor' ? (
                          <>
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {task.targetMinutes} دقیقه
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="size-3" />
                              {task.testCount} تست
                            </span>
                          </>
                        ) : task.featureId === 'sleep' ? (
                          <span className="flex items-center gap-1 text-indigo-400">
                            <Moon className="size-3" />
                            ۷.۵ ساعت خواب ثبت‌شده
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-pink-400">
                            <MessageSquare className="size-3" />
                            بازخورد مشاور آماده است
                          </span>
                        )}

                        {isChecked && (
                          <span className="mr-auto font-medium text-emerald-400 text-[10px] flex items-center gap-1">
                            <Check className="size-3" />
                            انجام شد
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick helper tip */}
            <p className="text-center text-xs text-zinc-500 px-2 leading-relaxed">
              💡 روی هر تسک کلیک کنی، نمای تخصصی اون در ستون روبرو بلافاصله باز می‌شه.
            </p>
          </div>

          {/* ----------------------------------------------------
              LEFT COLUMN: Dynamic UI Visualizer
              (Dynamically reacts to checkbox clicks and tab switching)
              ---------------------------------------------------- */}
          <div className="w-full lg:col-span-7">
            <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/70 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
              
              {/* Window Chrome Header */}
              <div className="border-b border-zinc-800/80 bg-zinc-950/60 px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-red-500/60" />
                  <div className="size-2.5 rounded-full bg-amber-500/60" />
                  <div className="size-2.5 rounded-full bg-emerald-500/60" />
                  <div className="mr-2 flex h-5.5 items-center rounded-md bg-zinc-900 px-3 text-[11px] font-mono text-zinc-400 border border-zinc-800/60">
                    revaledu.ir/{activeFeatureTab}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px] py-0.5">
                    {activeFeature.badgeText}
                  </Badge>
                </div>
              </div>

              {/* Dynamic Feature Header & Realtime Stat Strip */}
              <div className="p-5 sm:p-6 border-b border-zinc-800/60 bg-gradient-to-b from-zinc-900/40 to-transparent">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
                      <activeFeature.icon className="size-5 text-emerald-400" />
                      {activeFeature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                      {activeFeature.tagline}
                    </p>
                  </div>

                  {/* Micro stats tag */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300 border border-zinc-700/40">
                      <Activity className="size-3 text-emerald-400" />
                      وضعیت: زنده
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Screen Viewport with Crossfade */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-zinc-950 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature.id}
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full h-full"
                  >
                    <Image
                      src={activeFeature.image}
                      alt={activeFeature.title}
                      fill
                      className="object-cover object-top"
                      unoptimized={activeFeature.image.includes('landing-shots')}
                      priority
                    />

                    {/* Interactive Realtime Overlay Card (Dopamine Trigger) */}
                    <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 rounded-xl border border-zinc-800/90 bg-zinc-950/85 backdrop-blur-md p-3.5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-200">
                            همگام‌سازی لحظه‌ای با چک‌لیست شما
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {completedCount === 0
                              ? 'یک تسک را تیک بزنید تا بازخورد سیستم را ببینید.'
                              : `${completedCount} تسک با موفقیت پردازش شد و آمار نمودارها به‌روزرسانی گردید.`}
                          </p>
                        </div>
                      </div>

                      <Link
                        href="#signup"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 text-xs font-bold text-zinc-950 transition-all shadow-md shrink-0 self-end sm:self-auto"
                      >
                        <span>ساخت این پنل برای خودم</span>
                        <ArrowLeft className="size-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
export default ProductPlayground;
