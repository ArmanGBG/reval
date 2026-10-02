'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  ClipboardList,
  BarChart3,
  Send,
  History,
  Wrench,
  User,
  CalendarDays,
  ClipboardCheck,
  Activity,
  Moon,
  FileText,
  AlertCircle,
  Clock,
  Check,
  FileText as FileTextIcon,
  MessageSquareText,
  UserRound,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export type TabId = 'dashboard' | 'plan' | 'analytics' | 'sleep' | 'advisor';

const TABS: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'داشبورد روزانه' },
  { id: 'plan', label: 'برنامه‌ریزی مطالعاتی' },
  { id: 'analytics', label: 'آنالیز پیشرفته دروس' },
  { id: 'sleep', label: 'پایش الگوی خواب' },
  { id: 'advisor', label: 'پنل اختصاصی مشاور' },
];

// ==========================================
// Mock UI Components (Dark Mode Fixed)
// ==========================================

function MockSidebar({ activeTab }: { activeTab: TabId }) {
  const navItems = [
    { id: 'dashboard', label: 'خانه', icon: Home },
    { id: 'plan', label: 'برنامه من', icon: ClipboardList },
    { id: 'advisor', label: 'ارتباط با مشاور', icon: Send },
    { id: 'history', label: 'سوابق آزمون‌ها', icon: History },
    { id: 'tools', label: 'ابزارها', icon: Wrench },
    { id: 'analytics', label: 'تحلیل', icon: BarChart3 },
    { id: 'settings', label: 'تنظیمات', icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 border-l border-border/80 bg-background shrink-0 select-none font-yekan" dir="rtl">
      <div className="h-16 flex items-center justify-center px-5 border-b border-border/80">
        <div className="relative h-11 w-full rounded-lg bg-emerald-500 flex items-center justify-center overflow-hidden">
          <span className="text-zinc-950 font-black text-lg">روال</span>
          <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20" />
        </div>
      </div>

      <div className="px-3 pt-4">
        <div className="rounded-xl border border-border/80 bg-card p-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-foreground">دانش‌آموز</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <div className={`relative w-full flex items-center gap-3 rounded-xl px-3 h-11 transition-colors ${isActive ? 'text-emerald-500 font-semibold' : 'text-muted-foreground'}`}>
                  {isActive && (
                    <motion.span layoutId="sidebar-pill" className="absolute inset-0 rounded-xl bg-emerald-500/10" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                  )}
                  {isActive && (
                    <motion.span layoutId="sidebar-active" className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full bg-emerald-500" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                  )}
                  <Icon className={`relative w-5 h-5 shrink-0 ${isActive ? '' : 'opacity-80'}`} />
                  <span className="relative text-sm">{item.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

function MockTaskCard({ subject, title, color, time, completed = false }: { subject: string; title: string; color: string; time: string; completed?: boolean }) {
  return (
    <div className={`group relative overflow-hidden rounded-xl p-4 md:p-5 border border-border/80 bg-card/50 ${completed ? 'opacity-60' : ''}`}>
      <div className="relative z-10 flex flex-col justify-between gap-4 h-full">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className={`text-[11px] font-bold tracking-tight ${completed ? 'text-muted-foreground/50' : 'text-muted-foreground/80'}`}>{subject}</span>
            </div>
            <h3 className={`text-sm font-bold leading-tight ${completed ? 'text-muted-foreground/50 line-through' : 'text-foreground'}`}>{title}</h3>
          </div>
          <div className={`flex items-center justify-center w-6 h-6 rounded-md border ${completed ? 'bg-emerald-500 border-emerald-500 text-zinc-950' : 'border-border text-transparent'}`}>
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">{time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockDashboard() {
  const PLAN_SECTION_CARDS = [
    { label: 'برنامه روز', icon: CalendarDays },
    { label: 'آزمون‌ها', icon: ClipboardCheck },
    { label: 'کارهای متفرقه', icon: Activity },
    { label: 'خواب', icon: Moon },
    { label: 'یادداشت‌ها', icon: FileText },
    { label: 'تکمیل‌نشده', icon: AlertCircle },
  ];

  return (
    <div className="flex-1  p-6 lg:p-8 bg-background flex flex-col min-h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground mb-1">سلام آرمان 👋</h1>
        <p className="text-sm text-muted-foreground">امروز پنجشنبه، ۱۲ مهر. بریم سراغ تسک‌ها!</p>
      </div>

      <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {PLAN_SECTION_CARDS.map(({ label, icon: Icon }) => (
          <div key={label} className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card/40 p-3 text-center h-20 sm:h-24">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Icon className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/80">{label}</span>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-emerald-500" />
          تسک‌های امروز
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MockTaskCard subject="زیست‌شناسی ۳" title="گفتار ۲: تنظیم بیان ژن" color="#10b981" time="45 دقیقه" completed />
          <MockTaskCard subject="شیمی دوازدهم" title="فصل اول: اسیدها و بازها" color="#06b6d4" time="60 دقیقه" />
          <MockTaskCard subject="فیزیک ۳" title="تکانه و قوانین نیوتون" color="#f59e0b" time="90 دقیقه" />
        </div>
      </div>
    </div>
  );
}

function MockPlan() {
  return (
    <div className="flex-1 p-4 sm:p-7 pt-4 bg-background flex flex-col min-h-full font-yekan w-full" dir="rtl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">برنامه من</h1>
        <div className="px-3 py-1 rounded-full bg-card border border-border/80 text-xs font-medium text-muted-foreground/80">
          هفته دوم مهر
        </div>
      </div>
      
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'].map((day, i) => (
          <div key={day} className={`flex-col items-center justify-center shrink-0 w-16 h-20 rounded-2xl border flex ${i === 5 ? 'bg-emerald-500 border-emerald-500 text-zinc-950' : 'bg-card border-border/80 text-muted-foreground'}`}>
            <span className="text-[10px] font-bold">{day}</span>
            <span className={`text-lg font-black mt-1 ${i === 5 ? 'text-zinc-950' : 'text-foreground'}`}>{i + 7}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <MockTaskCard subject="ریاضیات تجربی" title="کاربرد مشتق: اکسترمم‌های نسبی" color="#a855f7" time="60 دقیقه" />
        <MockTaskCard subject="زبان انگلیسی" title="واژگان درس اول" color="#3b82f6" time="30 دقیقه" />
        <MockTaskCard subject="زیست‌شناسی ۳" title="مرور گفتار ۱" color="#10b981" time="45 دقیقه" />
      </div>
    </div>
  );
}

function MockAnalytics() {
  const data = [
    { name: 'شنبه', hours: 2.5 },
    { name: 'یکشنبه', hours: 3.2 },
    { name: 'دوشنبه', hours: 2.8 },
    { name: 'سه‌شنبه', hours: 3.5 },
    { name: 'چهارشنبه', hours: 4.1 },
    { name: 'پنجشنبه', hours: 3.0 },
    { name: 'جمعه', hours: 2.0 },
  ];

  return (
    <div className="flex-1 w-full p-4 sm:p-7 bg-background flex flex-col min-h-full font-yekan" dir="rtl">
      <div className="mb-4 sm:mb-6 flex flex-col items-start pt-1">
        <h1 className="text-xl font-bold text-foreground mb-1">نمای تحلیلی</h1>
        <p className="text-[13px] text-muted-foreground">زمان واقعی تسک‌های تکمیل‌شده در بازه انتخابی</p>
      </div>

      <div className="bg-card/60 border border-border/80 rounded-2xl p-4 sm:p-6 pt-4 flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex items-center justify-start sm:justify-end gap-1 bg-muted/60 rounded-xl p-1 mb-6 max-w-2xl w-full">
          {['روش مطالعه روزانه', 'تفکیک دروس', 'روند مطالعه'].map((tab, i) => (
            <button key={tab} className={`flex-1 py-2 rounded-lg text-sm transition-colors ${i === 2 ? 'bg-background text-foreground shadow-sm border border-border/60 font-bold' : 'text-muted-foreground hover:text-foreground/90'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="w-full min-h-[300px] h-[300px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'inherit' }} axisLine={false} tickLine={false} tickMargin={15} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'inherit' }} axisLine={false} tickLine={false} domain={[0, 4]} tickCount={5} />
              <Tooltip 
                cursor={{ fill: 'var(--muted)' }} 
                contentStyle={{ 
                  backgroundColor: 'var(--card, #18181b)', 
                  borderColor: 'var(--border, #27272a)', 
                  borderRadius: '12px', 
                  color: 'var(--foreground, #f4f4f5)', 
                  textAlign: 'right',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.15)'
                }} 
                formatter={(value: number) => [`${value} ساعت`, 'مطالعه']}
              />
              <Bar dataKey="hours" fill="#2563eb" radius={[4, 4, 0, 0]} animationDuration={1000} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MockSleep() {
  const data = [
    { name: 'شنبه', night: 6.5, nap: 1.0 },
    { name: 'یکشنبه', night: 7.0, nap: 0 },
    { name: 'دوشنبه', night: 5.5, nap: 1.5 },
    { name: 'سه‌شنبه', night: 7.5, nap: 0 },
    { name: 'چهارشنبه', night: 6.0, nap: 0.5 },
    { name: 'پنجشنبه', night: 8.0, nap: 0 },
    { name: 'جمعه', night: 6.5, nap: 1.0 },
  ];

  return (
    <div className="flex-1 p-5 sm:p-7 bg-background flex flex-col min-h-full font-yekan" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-xl text-sm transition-colors font-medium">
          <Moon className="w-4 h-4" />
          ثبت خواب
        </button>

        <div className="flex items-center gap-2">
          {['روزانه', 'هفته جاری', 'ماهانه', 'بازه دلخواه'].map((tab, i) => (
            <button key={tab} className={`px-4 py-1.5 rounded-full text-[13px] border transition-colors ${i === 1 ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-bold' : 'border-border/80 text-muted-foreground hover:text-foreground/90'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'میانگین ساعت بیداری', val: '۰۷:۱۵' },
          { label: 'میانگین ساعت خواب', val: '۲۳:۴۵' },
          { label: 'میانگین خواب شبانه', val: '۶.۷ ساعت' },
        ].map(stat => (
          <div key={stat.label} className="bg-card/60 border border-border/80 p-5 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground mb-2">{stat.val}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[300px] bg-card/60 border border-border/80 rounded-2xl p-6 flex flex-col">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-200" />
              <span className="text-xs text-muted-foreground">چرت</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-xs text-muted-foreground">شبانه</span>
            </div>
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-foreground">نمودار خواب</h3>
            <p className="text-xs text-muted-foreground mt-1">طول خواب شبانه و چرت هر روز (ساعت)</p>
          </div>
        </div>

        <div className="w-full min-h-[300px] h-[300px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'inherit' }} axisLine={false} tickLine={false} tickMargin={15} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'inherit' }} axisLine={false} tickLine={false} tickCount={6} />
              <Tooltip 
                cursor={{ fill: 'var(--muted)' }} 
                contentStyle={{ 
                  backgroundColor: 'var(--card, #18181b)', 
                  borderColor: 'var(--border, #27272a)', 
                  borderRadius: '12px', 
                  color: 'var(--foreground, #f4f4f5)', 
                  textAlign: 'right',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.15)'
                }} 
              />
              <Bar dataKey="night" stackId="a" fill="#818cf8" radius={[0, 0, 4, 4]} animationDuration={1000} barSize={16} />
              <Bar dataKey="nap" stackId="a" fill="#fde68a" radius={[4, 4, 0, 0]} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MockAdvisor() {
  return (
    <div className="flex-1 w-full bg-background flex flex-col min-h-full relative">
      <div className="h-16 border-b border-border/80 bg-card/40 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 font-bold">
            <UserRound className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm">دکتر محمدی (مشاور)</h4>
            <p className="text-xs text-emerald-500 font-medium flex items-center gap-1 mt-0.5"><span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> آنلاین</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-end gap-4 bg-[url('/noise.png')] bg-repeat opacity-90">
        <div className="self-center bg-card border border-border/80 rounded-full px-3 py-1 text-[10px] text-muted-foreground/50 mb-2">امروز</div>
        <div className="self-start bg-muted rounded-2xl rounded-tr-sm p-4 max-w-[80%] shadow-sm">
          <p className="text-sm text-foreground leading-relaxed">سلام خسته نباشی! گزارش کار امروزت عالی بود. فقط برای فیزیک سعی کن تست‌های زمان‌دار بیشتری بزنی.</p>
          <span className="text-[10px] text-muted-foreground mt-2 block">۱۴:۳۰</span>
        </div>
        
        <div className="self-end bg-emerald-600 rounded-2xl rounded-tl-sm p-4 max-w-[80%] shadow-md">
          <p className="text-sm text-white leading-relaxed">سلام استاد چشم! برای فیزیک فردا یه باکس ۴۵ دقیقه‌ای تست زمان‌دار اضافه کردم به برنامه.</p>
          <span className="text-[10px] text-emerald-200 mt-2 block text-right">۱۴:۳۵</span>
        </div>
      </div>
      
      <div className="p-4 bg-background border-t border-border/80">
        <div className="flex items-center gap-2 bg-card border border-border/80 rounded-xl px-4 py-2">
          <input type="text" placeholder="پیام خود را بنویسید..." className="bg-transparent flex-1 outline-none text-sm text-foreground h-8 placeholder:text-zinc-600" disabled />
          <button className="w-8 h-8 rounded-lg bg-emerald-500 text-zinc-950 flex items-center justify-center">
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function ProductPlayground() {
  const [activeTab, setActiveTab] = React.useState<TabId>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <MockDashboard />;
      case 'plan': return <MockPlan />;
      case 'analytics': return <MockAnalytics />;
      case 'sleep': return <MockSleep />;
      case 'advisor': return <MockAdvisor />;
    }
  };

  return (
    <section id="playground" className="scroll-mt-20 py-20 sm:py-28 relative border-t border-border/60 font-yekan" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        
        <div className="mb-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight text-balance">
            محیط اپلیکیشن روال
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-sm sm:text-base leading-relaxed">
            محیطی تمیز، سریع و بدون حواس‌پرتی که دقیقاً برای نیازهای یک دانش‌آموز حرفه‌ای طراحی شده است.
          </p>
        </div>

        {/* TOP TABS */}
        <div className="mb-8 flex justify-center w-full">
          <div className="flex w-full items-center justify-start sm:justify-center gap-1.5 overflow-x-auto flex-nowrap scrollbar-hide no-scrollbar rounded-2xl border border-border/80 bg-card/60 p-1.5 backdrop-blur-md shadow-sm max-w-4xl">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group whitespace-nowrap flex-shrink-0 py-2.5 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 outline-none ${
                    isActive
                      ? 'bg-emerald-500 text-zinc-950 shadow-md scale-[1.02]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN APP REPLICA WINDOW */}
        <div dir="rtl" className="w-full aspect-[4/3] md:aspect-[16/10] lg:aspect-[16/9] max-h-[800px] bg-background border border-border/80 rounded-3xl shadow-[0_30px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden flex flex-row">
          {/* Mock Sidebar (Desktop only) */}
          <div className="hidden md:block shrink-0">
            <MockSidebar activeTab={activeTab} />
          </div>
          
          {/* Mock Main Content */}
          <div className="flex-1 relative overflow-y-auto overflow-x-hidden bg-background scrollbar-hide">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.25, ease: [0.2, 1, 0.3, 1] }}
                className="w-full min-h-full relative"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
}

export default ProductPlayground;
