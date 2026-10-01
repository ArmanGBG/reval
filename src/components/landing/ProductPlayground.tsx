'use client';

import * as React from 'react';
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
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
  badgeText: string;
}

const FEATURE_CONFIGS: FeatureConfig[] = [
  {
    id: 'planning',
    title: 'بودجه‌بندی و برنامه‌ریزی هوشمند',
    label: 'برنامه‌ریزی',
    tagline: 'چینش دقیق مباحث در باکس‌های مطالعاتی متناسب با توان ذهنی و کنکور',
    icon: CalendarCheck,
    badgeText: 'تقویم هوشمند',
  },
  {
    id: 'analytics',
    title: 'آنالیز دقیق ساعت و تست',
    label: 'آنالیز پیشرفته',
    tagline: 'رسم خودکار نمودارهای پیشرفت، ساعت مطالعه و بازدهی تستی بدون دفتر کاغذی',
    icon: BarChart3,
    badgeText: 'تحلیل لحظه‌ای',
  },
  {
    id: 'sleep',
    title: 'پایش الگوی خواب و سبک زندگی',
    label: 'پایش خواب',
    tagline: 'ثبت منظم خواب شبانه و کشف همبستگی کیفیت استراحت با تمرکز روزانه',
    icon: Moon,
    badgeText: 'سلامت ذهن',
  },
  {
    id: 'advisor',
    title: 'ارتباط زنده و شفاف با مشاور',
    label: 'پنل مشاور',
    tagline: 'ارسال بلادرنگ گزارش‌کار و تبدیل جلسات به گفت‌وگوهای راهبردی و موثر',
    icon: Users,
    badgeText: 'نظارت دوطرفه',
  },
];

// ==========================================
// Mock UI Components
// ==========================================

function MockPlanningView({ completedTaskIds }: { completedTaskIds: string[] }) {
  const blocks = [
    { id: 'task-bio', time: '۰۸:۰۰ - ۰۹:۳۰', title: 'زیست‌شناسی ۳', type: 'تست آموزشی' },
    { id: 'task-chem', time: '۰۹:۴۵ - ۱۰:۴۵', title: 'شیمی دوازدهم', type: 'مرور و جمع‌بندی' },
    { id: 'task-phys', time: '۱۱:۰۰ - ۱۲:۳۰', title: 'فیزیک ۳', type: 'تست زمان‌دار' },
  ];

  return (
    <div className="w-full h-full p-6 bg-transparent flex flex-col justify-center gap-3">
      <h4 className="text-foreground font-bold mb-2">برنامه مطالعاتی امروز</h4>
      {blocks.map((b) => {
        const isDone = completedTaskIds.includes(b.id);
        return (
          <motion.div 
            key={b.id} 
            layout
            className={`flex items-stretch rounded-xl border overflow-hidden transition-all duration-300 ${isDone ? 'bg-emerald-500/10 border-emerald-500/20 shadow-sm' : 'bg-background border-border shadow-sm'}`}
          >
            <div className={`w-1.5 transition-colors ${isDone ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
            <div className="flex-1 p-3 flex items-center justify-between">
              <div>
                <p className={`text-sm font-bold transition-all ${isDone ? 'text-muted-foreground line-through opacity-70' : 'text-foreground'}`}>{b.title}</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{b.time}</p>
              </div>
              <Badge variant="outline" className={`transition-colors ${isDone ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-muted-foreground'}`}>
                {isDone ? 'تکمیل شده' : b.type}
              </Badge>
            </div>
          </motion.div>
        );
      })}
    </div>
  )
}

function MockAnalyticsView({ completedTaskIds }: { completedTaskIds: string[] }) {
  const bioCompleted = completedTaskIds.includes('task-bio');
  const physCompleted = completedTaskIds.includes('task-phys');
  const mathCompleted = completedTaskIds.includes('task-math');
  const chemCompleted = completedTaskIds.includes('task-chem');

  const data = [
    { name: 'زیست', hours: bioCompleted ? 2.5 : 0.5, fill: '#10b981' },
    { name: 'شیمی', hours: chemCompleted ? 1.5 : 0.5, fill: '#06b6d4' },
    { name: 'فیزیک', hours: physCompleted ? 2 : 0, fill: '#f59e0b' },
    { name: 'ریاضی', hours: mathCompleted ? 1.5 : 0, fill: '#a855f7' },
  ];

  return (
    <div className="w-full h-full p-6 bg-transparent flex flex-col justify-center">
      <h4 className="text-foreground font-bold mb-6">ساعت مطالعه دروس (امروز)</h4>
      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--muted))' }} 
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', textAlign: 'right' }} 
              formatter={(value: number) => [`${value} ساعت`, 'مطالعه']}
            />
            <Bar dataKey="hours" radius={[6, 6, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MockSleepTrackerView({ completedTaskIds }: { completedTaskIds: string[] }) {
  const isSleepLogged = completedTaskIds.includes('task-sleep');
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-transparent">
      <div className={`relative flex size-36 items-center justify-center rounded-full border-[8px] transition-all duration-1000 ${isSleepLogged ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'border-muted'}`}>
         <div className="text-center">
            <span className="text-4xl font-black text-foreground">{isSleepLogged ? '۷.۵' : '--'}</span>
            <span className="block text-xs text-muted-foreground mt-1">ساعت خواب</span>
         </div>
         <Moon className={`absolute -bottom-4 right-0 size-8 transition-colors duration-1000 drop-shadow-md ${isSleepLogged ? 'text-indigo-500' : 'text-muted'}`} />
      </div>
      <div className="mt-8 text-center max-w-[250px]">
         <h4 className="font-bold text-foreground mb-2">وضعیت انرژی روزانه</h4>
         <p className="text-muted-foreground text-sm">
           {isSleepLogged ? 'خواب شما در بازه طلایی قرار دارد. انرژی امروز: عالی ⚡' : 'هنوز خواب دیشب ثبت نشده است. برای پایش انرژی چک‌لیست را تیک بزنید.'}
         </p>
      </div>
    </div>
  )
}

function MockAdvisorView({ completedTaskIds }: { completedTaskIds: string[] }) {
  const advisorNotified = completedTaskIds.includes('task-advisor');

  return (
    <div className="w-full h-full flex flex-col p-6 bg-transparent overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border/60 pb-4">
         <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 font-bold text-lg">
            م
         </div>
         <div>
            <h4 className="font-bold text-foreground">دکتر محمدی (مشاور)</h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5"><span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> آنلاین</p>
         </div>
      </div>

      <div className="flex flex-col gap-4 flex-1 justify-end pt-4">
         <div className="self-start bg-muted rounded-2xl rounded-tr-sm p-3.5 max-w-[85%] text-sm text-foreground shadow-sm">
            سلام خسته نباشی! گزارش کار امروزت رو برام بفرست تا با هم تحلیلش کنیم.
         </div>
         
         <AnimatePresence>
            {advisorNotified && (
               <motion.div 
                 initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                 animate={{ opacity: 1, y: 0, scale: 1 }} 
                 className="self-end bg-emerald-600 text-white rounded-2xl rounded-tl-sm p-3.5 max-w-[85%] text-sm shadow-md"
               >
                 سلام استاد! تسک‌های امروزم شامل زیست، شیمی و فیزیک رو تیک زدم. روی نمودار هم پیشرفتم ثبت شد!
               </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function ProductPlayground() {
  const [completedTaskIds, setCompletedTaskIds] = React.useState<string[]>(['task-bio']);
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

    const clickedTask = MOCK_TASKS.find((t) => t.id === taskId);
    if (clickedTask && clickedTask.featureId !== activeFeatureTab) {
      setActiveFeatureTab(clickedTask.featureId);
    }
  };

  const totalTasks = MOCK_TASKS.length;
  const completedCount = completedTaskIds.length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  const completedTasks = MOCK_TASKS.filter((t) => completedTaskIds.includes(t.id));
  const completedStudyMinutes = completedTasks
    .filter((t) => t.featureId !== 'sleep')
    .reduce((acc, t) => acc + t.targetMinutes, 0);
  const completedStudyHours = (completedStudyMinutes / 60).toFixed(1);
  const completedTests = completedTasks.reduce((acc, t) => acc + t.testCount, 0);

  const activeFeature = FEATURE_CONFIGS.find((f) => f.id === activeFeatureTab) || FEATURE_CONFIGS[0];

  const renderActiveMockComponent = () => {
    switch (activeFeature.id) {
      case 'planning': return <MockPlanningView completedTaskIds={completedTaskIds} />;
      case 'analytics': return <MockAnalyticsView completedTaskIds={completedTaskIds} />;
      case 'sleep': return <MockSleepTrackerView completedTaskIds={completedTaskIds} />;
      case 'advisor': return <MockAdvisorView completedTaskIds={completedTaskIds} />;
    }
  };

  return (
    <section 
      id="playground" 
      className="scroll-mt-20 py-20 sm:py-28 relative overflow-hidden border-t border-border/60"
    >
      <div className="pointer-events-none absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-teal-500/5 blur-[120px]" />

      <div className="mx-auto max-w-6xl px-5 sm:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 backdrop-blur-md mb-4">
            <Sparkles className="size-3.5 animate-pulse" />
            <span>محیط اپ، قدم به قدم</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight text-balance">
            قبل از ثبت‌نام، حس خوب «روی روال بودن» رو تجربه کن
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-sm sm:text-base leading-relaxed text-balance">
            تسک‌های روزانه‌ی <span className="text-emerald-600 dark:text-emerald-400 font-bold">«دوست روالی من»</span> رو تیک بزن تا ثبت سریع، پر شدن نوار پیشرفت و نمودارهای لحظه‌ای رو لمس کنی.
          </p>
        </div>

        {/* ========================================================
            TOP DOPAMINE HOOK: User Info & Main Progress Bar
            ======================================================== */}
        <div className="mb-10 rounded-2xl border border-border bg-card/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-base shadow-inner">
                <span>روال</span>
                <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-500 border-2 border-background" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground text-base sm:text-lg">دوست روالی من</h3>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] py-0 px-2 font-medium">
                    کنکوری هدفمند
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  برنامه‌ی اختصاصی امروز • پنجشنبه، ۱۲ مهر
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6 self-start sm:self-auto">
              <div className="flex flex-col items-start sm:items-end">
                <span className="text-xs text-muted-foreground">ساعت ثبت‌شده</span>
                <span className="text-sm sm:text-base font-bold text-foreground">
                  {completedStudyHours} از ۴.۵ ساعت
                </span>
              </div>
              <div className="h-7 w-px bg-border" />
              <div className="flex flex-col items-start sm:items-end">
                <span className="text-xs text-muted-foreground">تست کارشده</span>
                <span className="text-sm sm:text-base font-bold text-foreground">
                  {completedTests} از ۱۱۵ تست
                </span>
              </div>
              <div className="h-7 w-px bg-border" />
              <div className="flex flex-col items-start sm:items-end">
                <span className="text-xs text-muted-foreground">پیشرفت کل</span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {progressPercent}٪
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                {progressPercent === 100 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Trophy className="size-3.5" />
                    فوق‌العاده است! تمام برنامه‌ی امروز روال شد!
                  </span>
                ) : progressPercent >= 50 ? (
                  <span className="text-teal-600 dark:text-teal-400 font-medium flex items-center gap-1">
                    <Flame className="size-3.5 text-amber-500" />
                    بیش از نیمی از مسیر امروز رو رفتی؛ ادامه بده!
                  </span>
                ) : (
                  <span>با زدن تیک هر تسک، بازدهی و نوار پیشرفتت رشد می‌کنه</span>
                )}
              </span>
              <span className="font-semibold text-foreground">
                {completedCount} از {totalTasks} تسک تکمیل شد
              </span>
            </div>

            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted border border-border/80 p-0.5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-l from-emerald-400 via-teal-400 to-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.5)]"
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: 'spring', stiffness: 90, damping: 18 }}
              />
            </div>
          </div>
        </div>

        {/* ========================================================
            PRIMARY CONTROLLER: Feature Tabs Bar (Moved to Top)
            ======================================================== */}
        <div className="mb-8 flex justify-center w-full">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-1.5 rounded-2xl border border-border/80 bg-card/60 p-1.5 backdrop-blur-md shadow-sm w-full max-w-3xl">
            {FEATURE_CONFIGS.map((feature) => {
              const Icon = feature.icon;
              const isActive = activeFeatureTab === feature.id;
              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => setActiveFeatureTab(feature.id)}
                  className={`group flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-sm font-bold transition-all duration-300 outline-none ${
                    isActive
                      ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-sm border border-border/60 scale-[1.02]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <Icon className={`size-4 transition-transform duration-300 ${isActive ? 'scale-110 text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                  <span className="truncate">{feature.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            TWO-COLUMN PLAYGROUND LAYOUT (RTL)
            Right: Interactive Checklist
            Left: Dynamic React UI Visualizer
            ======================================================== */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* RIGHT COLUMN: Interactive Checklist */}
          <div className="w-full lg:col-span-5 flex flex-col gap-5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors font-medium"
              >
                {completedTaskIds.length === totalTasks ? 'خالی کردن همه' : 'تیک زدن همه'}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {MOCK_TASKS.map((task) => {
                const isChecked = completedTaskIds.includes(task.id);
                const isBelongingToActiveTab = task.featureId === activeFeatureTab;

                return (
                  <motion.div
                    key={task.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveFeatureTab(task.featureId)}
                    className={`group relative flex items-start gap-3.5 rounded-xl border p-3.5 sm:p-4 transition-all duration-200 cursor-pointer ${
                      isBelongingToActiveTab
                        ? 'border-emerald-500/40 bg-card shadow-sm ring-1 ring-emerald-500/20'
                        : 'border-border/80 bg-card/50 hover:border-border hover:bg-card/70'
                    }`}
                  >
                    <div className="pt-0.5" onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}>
                      <motion.div
                        animate={isChecked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                        transition={{ duration: 0.25 }}
                        className={`flex size-5 items-center justify-center rounded-md border transition-all ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'border-muted-foreground/40 bg-background hover:border-emerald-500/50'
                        }`}
                      >
                        {isChecked && <Check className="size-3.5 stroke-[3]" />}
                      </motion.div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: task.subjectColor }} />
                          <h4 className={`text-sm font-bold truncate transition-all duration-300 ${isChecked ? 'line-through text-muted-foreground opacity-60' : 'text-foreground'}`}>
                            {task.subject}
                          </h4>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-[10px] py-0 px-2 font-normal bg-muted text-muted-foreground border-border/50">
                          {task.badge}
                        </Badge>
                      </div>

                      <p className={`mt-1 text-xs transition-all duration-300 ${isChecked ? 'line-through text-muted-foreground/80 opacity-60' : 'text-muted-foreground'}`}>
                        {task.topic}
                      </p>

                      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        {task.featureId !== 'sleep' && task.featureId !== 'advisor' ? (
                          <>
                            <span className="flex items-center gap-1"><Clock className="size-3" />{task.targetMinutes} دقیقه</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><CheckCircle2 className="size-3" />{task.testCount} تست</span>
                          </>
                        ) : task.featureId === 'sleep' ? (
                          <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400"><Moon className="size-3" />۷.۵ ساعت خواب ثبت‌شده</span>
                        ) : (
                          <span className="flex items-center gap-1 text-pink-500 dark:text-pink-400"><MessageSquare className="size-3" />بازخورد مشاور آماده است</span>
                        )}
                        {isChecked && (
                          <span className="mr-auto font-medium text-emerald-600 dark:text-emerald-400 text-[10px] flex items-center gap-1">
                            <Check className="size-3" /> انجام شد
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted-foreground px-2 leading-relaxed">
              💡 روی هر تسک کلیک کنی، نمای تخصصی اون در بالا بلافاصله باز می‌شه.
            </p>
          </div>

          {/* LEFT COLUMN: Dynamic React UI Visualizer */}
          <div className="w-full lg:col-span-7">
            <div className="rounded-2xl border border-border/80 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-full min-h-[450px]">
              
              <div className="border-b border-border/60 bg-background/40 px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-red-500/60" />
                  <div className="size-2.5 rounded-full bg-amber-500/60" />
                  <div className="size-2.5 rounded-full bg-emerald-500/60" />
                  <div className="mr-2 flex h-5.5 items-center rounded-md bg-muted/60 px-3 text-[11px] font-mono text-muted-foreground border border-border/40">
                    revaledu.ir/{activeFeatureTab}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] py-0.5">
                    {activeFeature.badgeText}
                  </Badge>
                </div>
              </div>

              <div className="p-5 sm:p-6 border-b border-border/50 bg-gradient-to-b from-background/30 to-transparent">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                      <activeFeature.icon className="size-5 text-emerald-600 dark:text-emerald-400" />
                      {activeFeature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                      {activeFeature.tagline}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Activity className="size-3" />
                      وضعیت: زنده
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative flex-1 w-full flex flex-col bg-transparent overflow-hidden p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature.id}
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full h-full flex flex-col rounded-xl border border-border/40 bg-card shadow-inner overflow-hidden"
                  >
                    {renderActiveMockComponent()}
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
