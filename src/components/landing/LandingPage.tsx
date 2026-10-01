'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useInView, useReducedMotion, MotionConfig } from 'framer-motion';
import { 
  CalendarCheck, BarChart3, Focus, Users, Moon, TrendingUp,
  Menu, X, Send, Instagram, ArrowLeft 
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Logo } from './logo';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvisorsPage } from './advisors-page';
import { TeamPage } from './team-page';

// ----------------------------------------------------------------------
// MAIN EXPORT
// ----------------------------------------------------------------------

export default function LandingPage() {
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const [isMobile, setIsMobile] = React.useState(true);
  const [landingView, setLandingView] = React.useState<'main' | 'advisors' | 'team'>('main');

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  React.useEffect(() => {
    const AUTH_HASHES: Record<string, 'login' | 'onboarding'> = {
      '#login': 'login',
      '#signup': 'onboarding',
    };

    const goTo = (view: 'login' | 'onboarding', hash: string) => {
      window.history.pushState({ revalView: view }, '', `${window.location.pathname}${hash}`);
      setCurrentView(view);
    };

    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (hash && hash in AUTH_HASHES) {
        e.preventDefault();
        e.stopPropagation();
        goTo(AUTH_HASHES[hash], hash);
      }
    };

    const handleHash = () => {
      const hash = window.location.hash;
      if (hash in AUTH_HASHES) {
        setCurrentView(AUTH_HASHES[hash]);
      }
    };

    handleHash();

    document.addEventListener('click', handleClick, true);
    window.addEventListener('hashchange', handleHash);
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('hashchange', handleHash);
    };
  }, [setCurrentView]);

  const handleAdvisorsClick = React.useCallback(() => {
    setLandingView('advisors');
    window.scrollTo(0, 0);
  }, []);

  const handleTeamClick = React.useCallback(() => {
    setLandingView('team');
    window.scrollTo(0, 0);
  }, []);

  const handleDemoClick = React.useCallback(() => {
    setLandingView('main');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }, []);
  
  const handleFeaturesClick = React.useCallback(() => {
    setLandingView('main');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }, []);

  const handleBackToMain = React.useCallback(() => {
    setLandingView('main');
    window.scrollTo(0, 0);
  }, []);

  if (landingView === 'advisors') {
    return (
      <MotionConfig reducedMotion={isMobile ? 'always' : 'user'}>
        <div className="landing-page relative isolate flex min-h-screen flex-col overflow-x-clip bg-zinc-950 font-yekan text-zinc-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
          <LandingHeader onAdvisorsClick={handleAdvisorsClick} onTeamClick={handleTeamClick} onFeaturesClick={handleFeaturesClick} onDemoClick={handleDemoClick} />
          <main className="relative z-10 flex-1 pt-20">
            <AdvisorsPage onBack={handleBackToMain} />
          </main>
          <LandingFooter onAdvisorsClick={handleAdvisorsClick} onTeamClick={handleTeamClick} onFeaturesClick={handleFeaturesClick} onDemoClick={handleDemoClick} />
        </div>
      </MotionConfig>
    );
  }

  if (landingView === 'team') {
    return (
      <MotionConfig reducedMotion={isMobile ? 'always' : 'user'}>
        <div className="landing-page relative isolate flex min-h-screen flex-col overflow-x-clip bg-zinc-950 font-yekan text-zinc-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
          <LandingHeader onAdvisorsClick={handleAdvisorsClick} onTeamClick={handleTeamClick} onFeaturesClick={handleFeaturesClick} onDemoClick={handleDemoClick} />
          <main className="relative z-10 flex-1 pt-20">
            <TeamPage onBack={handleBackToMain} />
          </main>
          <LandingFooter onAdvisorsClick={handleAdvisorsClick} onTeamClick={handleTeamClick} onFeaturesClick={handleFeaturesClick} onDemoClick={handleDemoClick} />
        </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion={isMobile ? 'always' : 'user'}>
      <div className="landing-page relative isolate flex min-h-screen flex-col overflow-x-clip bg-zinc-950 font-yekan text-zinc-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300" dir="rtl">
        {/* Global background effects */}
        <div className="pointer-events-none fixed inset-0 z-0 flex justify-center" aria-hidden="true">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a0f_1px,transparent_1px),linear-gradient(to_bottom,#27272a0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          {/* Top ambient emerald glow */}
          <div className="absolute -top-[30%] h-[600px] w-[1000px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent blur-[100px]" />
        </div>

        <LandingHeader onAdvisorsClick={handleAdvisorsClick} onTeamClick={handleTeamClick} onFeaturesClick={handleFeaturesClick} onDemoClick={handleDemoClick} />

        <main className="relative z-10 flex-1">
          <LandingHero />
          <LandingMetrics />
          <LandingBentoFeatures />
          <LandingShowcase />
          <LandingCta />
        </main>
        
        <LandingFooter onAdvisorsClick={handleAdvisorsClick} onTeamClick={handleTeamClick} onFeaturesClick={handleFeaturesClick} onDemoClick={handleDemoClick} />
      </div>
    </MotionConfig>
  );
}

// ----------------------------------------------------------------------
// SECTIONS
// ----------------------------------------------------------------------

function LandingHeader({ onAdvisorsClick, onTeamClick, onFeaturesClick, onDemoClick }: any) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'امکانات', action: onFeaturesClick },
    { label: 'پیش‌نمایش اپ', action: onDemoClick },
    { label: 'مشاوران', action: onAdvisorsClick },
    { label: 'تیم ما', action: onTeamClick },
  ];

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60 shadow-lg' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="#top" className="flex items-center gap-2 outline-none group" onClick={() => setOpen(false)}>
          <Logo size={26} variant="dark" />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button key={item.label} onClick={item.action} className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100">
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="#login" className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100 px-2 py-1.5">
            ورود
          </Link>
          <Link href="#signup" className="group relative inline-flex h-9 items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]">
            شروع رایگان
          </Link>
        </div>

        <button className="md:hidden text-zinc-400 hover:text-zinc-100" onClick={() => setOpen(true)}>
          <Menu className="size-6" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 md:hidden bg-zinc-950/95 backdrop-blur-xl flex flex-col p-6">
             <div className="flex items-center justify-between mb-8">
               <Logo size={26} variant="dark" />
               <button className="text-zinc-400 hover:text-zinc-100" onClick={() => setOpen(false)}>
                 <X className="size-6" />
               </button>
             </div>
             <nav className="flex flex-col gap-4 text-lg font-medium text-zinc-300">
               {navItems.map((item) => (
                 <button key={item.label} onClick={() => { item.action(); setOpen(false); }} className="text-right py-2 hover:text-emerald-400 transition-colors">
                   {item.label}
                 </button>
               ))}
               <div className="h-px w-full bg-zinc-800/60 my-2" />
               <Link href="#login" onClick={() => setOpen(false)} className="text-right py-2 hover:text-zinc-100 transition-colors">
                 ورود
               </Link>
               <Link href="#signup" onClick={() => setOpen(false)} className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-4 text-base font-semibold text-emerald-950 shadow-[0_0_24px_-4px_rgba(16,185,129,0.5)]">
                 شروع رایگان
               </Link>
             </nav>
           </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function LandingHero() {
  const reduceMotion = useReducedMotion();
  return (
    <section id="top" className="relative pt-32 pb-20 sm:pt-40 sm:pb-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 text-center sm:px-8">
        <motion.div initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400 backdrop-blur-md">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            نسل جدید پلتفرم هوشمند مدیریت مطالعه
          </div>
          <h1 className="text-balance text-4xl font-black leading-[1.2] tracking-tight text-zinc-100 sm:text-6xl lg:text-7xl">
            برنامه‌ریزی دقیق، آنالیز واقعی <br />
            <span className="bg-gradient-to-l from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">مسیر کنکورت، روی روال.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-base font-normal leading-relaxed text-zinc-400 sm:text-lg">
            روال یک میز کار مدرن و بدون حواس‌پرتی است؛ جایی که برنامه‌ریزی شخصی‌سازی‌شده، آنالیز جزئی دروس و ارتباط مؤثر با مشاور در یک ساختار یکپارچه قرار می‌گیرند.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="#signup" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 text-base font-bold text-emerald-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_32px_-6px_rgba(16,185,129,0.5)] sm:w-auto">
              <ArrowLeft className="size-5" />
              شروع رایگان و ساخت برنامه
            </Link>
            <Link href="#showcase" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-8 text-base font-medium text-zinc-200 transition-all hover:bg-zinc-800/80 hover:border-zinc-700 sm:w-auto">
              مشاهده پیش‌نمایش پلتفرم
            </Link>
          </div>
        </motion.div>

        <motion.div initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative mt-16 w-full max-w-5xl md:mt-24">
          <div className="pointer-events-none absolute -inset-4 z-0 rounded-[2.5rem] bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent blur-2xl opacity-60" />
          <div className="relative z-10 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-2 shadow-2xl shadow-black/80 backdrop-blur-2xl sm:p-3">
            <div className="mb-2 flex items-center gap-2 px-2 sm:mb-3">
              <div className="size-2.5 sm:size-3 rounded-full bg-zinc-700/80" />
              <div className="size-2.5 sm:size-3 rounded-full bg-zinc-700/80" />
              <div className="size-2.5 sm:size-3 rounded-full bg-zinc-700/80" />
              <div className="mx-auto flex h-5 items-center justify-center rounded bg-zinc-800/60 px-3 text-[10px] text-zinc-500 sm:h-6 sm:text-[11px]">
                app.revaledu.ir
              </div>
              <div className="w-12" />
            </div>
            <div className="relative aspect-[16/9] sm:aspect-[16/10] lg:aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-950">
              <Image 
                src="/images/preview/dark/dashboard.webp" 
                alt="نمای داشبورد روال" 
                fill
                className="object-cover object-top" 
                style={{ maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)' }} 
                priority 
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LandingMetrics() {
  return (
    <section className="border-y border-zinc-800/50 bg-zinc-900/20 py-10">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4 sm:gap-4">
          <div className="flex flex-col gap-1"><span className="text-3xl font-black text-zinc-100">+۲,۵۰۰</span><span className="text-xs font-medium text-zinc-400">دانش‌آموز فعال</span></div>
          <div className="flex flex-col gap-1"><span className="text-3xl font-black text-zinc-100">+۱۵۰</span><span className="text-xs font-medium text-zinc-400">مشاور برتر</span></div>
          <div className="flex flex-col gap-1"><span className="text-3xl font-black text-zinc-100">۹۸.۴٪</span><span className="text-xs font-medium text-zinc-400">پایبندی به برنامه</span></div>
          <div className="flex flex-col gap-1"><span className="text-3xl font-black text-zinc-100">۰ ثانیه</span><span className="text-xs font-medium text-zinc-400">اتلاف وقت دستی</span></div>
        </div>
      </div>
    </section>
  );
}

const BENTO_CARDS = [
  {
    title: 'بودجه‌بندی هوشمند و پویای مباحث',
    desc: 'تقسیم خودکار و دقیق صفحات، گفتارها و مباحث با در نظر گرفتن توان مطالعاتی و اهداف کنکور، بدون اضافه بار.',
    icon: CalendarCheck,
    span: 'md:col-span-2',
    visual: (
      <div className="mt-6 flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/50 p-3">
          <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-zinc-300">زیست‌شناسی ۳: گفتار ۲</span>
          </div>
          <span className="text-xs font-medium text-emerald-400">۴۵ دقیقه</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/50 p-3">
          <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-cyan-500" />
            <span className="text-sm font-medium text-zinc-300">فیزیک: دینامیک پیشرفته</span>
          </div>
          <span className="text-xs font-medium text-cyan-400">۱.۵ ساعت</span>
        </div>
      </div>
    )
  },
  {
    title: 'آنالیز دقیق ساعت و تست',
    desc: 'رسم لحظه‌ای نمودارهای تستی و تشریحی و مقایسه عملکرد با هدف‌گذاری، بدون نیاز به دفتر کاغذی.',
    icon: BarChart3,
    span: 'col-span-1',
    visual: (
      <div className="mt-6 flex h-24 items-end justify-between gap-2 px-2">
         {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
           <div key={i} className="w-full rounded-t-sm bg-emerald-500/20" style={{ height: `${h}%` }}>
             <div className="h-full w-full rounded-t-sm bg-gradient-to-t from-emerald-500/40 to-emerald-400" style={{ height: `${h * 0.8}%`, marginTop: 'auto' }} />
           </div>
         ))}
      </div>
    )
  },
  {
    title: 'رابط مطالعه بدون حواس‌پرتی (Zero Distraction)',
    desc: 'طراحی تاریک و مینیمال با حذف هرگونه نویز، نوتیفیکیشن مزاحم یا گزینه‌های گیج‌کننده موقع مطالعه عمیق.',
    icon: Focus,
    span: 'col-span-1',
    visual: (
      <div className="mt-6 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
          <Focus className="size-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400">حالت تمرکز عمیق: فعال</span>
        </div>
      </div>
    )
  },
  {
    title: 'ارتباط شفاف و زنده با مشاور',
    desc: 'ارسال بلادرنگ تمام جزئیات مطالعه و کارنامه‌ها برای مشاور، و تبدیل جلسات به گفت‌وگوهای راهبردی.',
    icon: Users,
    span: 'md:col-span-2',
    visual: (
      <div className="mt-6 flex flex-col gap-3 pr-4">
        <div className="self-end rounded-2xl rounded-tr-sm bg-emerald-500/20 px-4 py-2.5 text-xs text-emerald-100 max-w-[80%]">
          مشاور: عملکرد عالی در تست‌های زیست، برای مبحث ژنتیک تایم بیشتری در نظر بگیر.
        </div>
        <div className="self-start rounded-2xl rounded-tl-sm bg-zinc-800 px-4 py-2.5 text-xs text-zinc-300 max-w-[80%]">
          چشم، توی برنامه فردا براش باکس جبرانی گذاشتم.
        </div>
      </div>
    )
  },
  {
    title: 'پایش ریتم خواب و سبک زندگی',
    desc: 'ثبت ساعت خواب و محاسبه همبستگی ریتم شبانه‌روزی با بازدهی درسی برای حفظ انرژی تا روز کنکور.',
    icon: Moon,
    span: 'col-span-1',
    visual: (
      <div className="mt-6 flex flex-col gap-3">
         <div className="flex items-center justify-between rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-3">
            <span className="text-xs font-medium text-indigo-300">کیفیت خواب دیشب</span>
            <span className="text-sm font-bold text-indigo-400">۷.۵ ساعت</span>
         </div>
      </div>
    )
  },
  {
    title: 'تحلیل هوشمند آزمون‌ها',
    desc: 'بررسی دقیق تاثیر ساعت‌ها و روش‌های مطالعه روی تراز و نتیجه‌ی آزمون‌های آزمایشی شما.',
    icon: TrendingUp,
    span: 'md:col-span-2',
    visual: (
      <div className="mt-6 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-transparent p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-emerald-400 font-medium">رشد تراز (آزمون جامع)</span>
          <span className="text-2xl font-black text-emerald-300">+۴۵۰</span>
        </div>
        <TrendingUp className="size-8 text-emerald-400/50" />
      </div>
    )
  }
];

function LandingBentoFeatures() {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const reduceMotion = useReducedMotion();

  return (
    <section id="features" className="py-24 sm:py-32" ref={ref}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-14 text-center">
          <span className="text-sm font-bold text-emerald-400">امکانات کلیدی</span>
          <h2 className="mt-3 text-3xl font-black text-zinc-100 sm:text-4xl">مهندسی‌شده برای اوج تمرکز و پیشرفت</h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400 text-sm sm:text-base">
            تمام ابزارهایی که برای یک سال تحصیلی بی‌نقص نیاز داری، در یک ساختار منظم و یکپارچه.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 sm:gap-6">
          {BENTO_CARDS.map((card, i) => (
            <motion.div
              key={i}
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: reduceMotion ? 0 : i * 0.1 }}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 sm:p-8 transition-colors hover:border-zinc-700/80 ${card.span}`}
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-zinc-800/0 to-zinc-800/0 transition-colors group-hover:from-zinc-800/20" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-zinc-800/80 text-emerald-400 shadow-inner">
                  <card.icon className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{card.desc}</p>
                <div className="mt-auto pt-4">
                  {card.visual}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const SHOWCASE_TABS = [
  {
    id: 'dashboard',
    label: 'داشبورد روزانه',
    subtitle: 'مدیریت متمرکز تسک‌ها، آمار لحظه‌ای و رصد بازدهی روزانه در یک نگاه.',
    image: '/images/preview/dark/dashboard.webp',
  },
  {
    id: 'planning',
    label: 'برنامه‌ریزی مطالعاتی',
    subtitle: 'تقویم هوشمند با قابلیت تنظیم دقیق مباحث، بودجه‌بندی و تفکیک باکس‌های درسی.',
    image: '/images/preview/dark/study-plan.webp',
  },
  {
    id: 'analysis',
    label: 'آنالیز پیشرفته دروس',
    subtitle: 'تحلیل عمیق عملکرد مبحثی، مقایسه تستی-تشریحی و شناسایی سریع نقاط ضعف.',
    image: '/images/preview/dark/subject-analysis1.webp',
  },
  {
    id: 'sleep',
    label: 'پایش الگوی خواب',
    subtitle: 'ثبت ساعات استراحت و سنجش همبستگی ریتم شبانه‌روزی با بازدهی یادگیری شما.',
    image: '/images/preview/dark/sleep-tracker.webp',
  },
  {
    id: 'advisor',
    label: 'پنل اختصاصی مشاور',
    subtitle: 'ارتباط دوسویه، مانیتورینگ عملکرد دانش‌آموزان و ارسال بازخورد آنی روی برنامه.',
    image: '/landing-shots/feature-advisor.webp',
  }
];

function LandingShowcase() {
  const [activeTab, setActiveTab] = React.useState(SHOWCASE_TABS[0].id);
  const activeItem = SHOWCASE_TABS.find(t => t.id === activeTab)!;
  const reduceMotion = useReducedMotion();

  return (
    <section id="showcase" className="border-t border-zinc-800/50 py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-zinc-900/20" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8 relative z-10">
        <div className="mb-12 text-center">
          <span className="text-sm font-bold text-emerald-400">محیط کاربری روال</span>
          <h2 className="mt-3 text-3xl font-black text-zinc-100 sm:text-4xl">نگاهی نزدیک به تجربه کاربری</h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400 text-sm sm:text-base">
            روی بخش‌های مختلف کلیک کنید تا صفحات واقعی و ابزارهای تحلیلی پلتفرم را مشاهده نمایید.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col items-center">
          <TabsList className="mb-8 flex h-auto flex-wrap items-center justify-center gap-2 bg-transparent p-0 max-w-full overflow-x-auto sm:flex-nowrap">
            {SHOWCASE_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-xl border border-transparent px-4 py-2.5 text-sm font-medium text-zinc-400 transition-all data-[state=active]:border-zinc-700/60 data-[state=active]:bg-zinc-800/80 data-[state=active]:text-emerald-400 data-[state=active]:shadow-md"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="w-full max-w-5xl rounded-2xl border border-zinc-800/80 bg-zinc-900/60 shadow-2xl backdrop-blur-xl overflow-hidden">
            <div className="border-b border-zinc-800/80 bg-zinc-950/50 p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
               <span className="font-bold text-zinc-200">{activeItem.label}</span>
               <span className="text-xs font-medium text-zinc-400 sm:text-left">{activeItem.subtitle}</span>
            </div>
            <div className="relative aspect-[16/9] sm:aspect-[16/10] lg:aspect-[16/9] bg-zinc-950 overflow-hidden p-2 sm:p-4">
              <AnimatePresence mode="wait">
                 <motion.div
                   key={activeItem.id}
                   initial={reduceMotion ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                   animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                   exit={reduceMotion ? { opacity: 0, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                   transition={{ duration: 0.3 }}
                   className="relative w-full h-full rounded-xl overflow-hidden border border-zinc-800/50"
                 >
                   <Image 
                     src={activeItem.image} 
                     alt={activeItem.label} 
                     fill 
                     className="object-cover object-top" 
                     unoptimized={activeItem.image.includes('landing-shots')} 
                   />
                 </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Tabs>
      </div>
    </section>
  );
}

function LandingCta() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-10 text-center shadow-2xl sm:p-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
          
          <div className="relative z-10">
            <span className="text-xs font-bold text-emerald-400">شروع سریع در کمتر از ۲ دقیقه</span>
            <h2 className="mt-4 text-3xl font-black text-zinc-100 sm:text-5xl">آماده‌ای درس خوندنت رو بندازی روی روال؟</h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400 text-sm sm:text-base leading-relaxed">
              همین امروز به صدها دانش‌آموز و مشاور بپیوند که با روال، مطالعه‌شون رو هوشمند و هدفمند مدیریت می‌کنن.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="#signup" className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-8 text-base font-bold text-emerald-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] sm:w-auto">
                ثبت‌نام رایگان و شروع
              </Link>
              <Link href="#login" className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-8 text-base font-medium text-zinc-200 transition-colors hover:bg-zinc-800 hover:border-zinc-700 sm:w-auto">
                ورود به حساب کاربری
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-zinc-500">
               <span>بدون نیاز به کارت بانکی</span>
               <span>•</span>
               <span>شروع کاملاً رایگان</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingFooter({ onAdvisorsClick, onTeamClick, onFeaturesClick, onDemoClick }: any) {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 py-12">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          <div className="flex flex-col items-center gap-3 md:items-start text-center md:text-right">
            <Link href="#top" className="flex items-center gap-2 outline-none">
               <Logo size={28} variant="dark" />
            </Link>
            <p className="text-xs text-zinc-500 max-w-[250px]">
              پلتفرم جامع برنامه‌ریزی، آنالیز تحصیلی و مشاوره هوشمند.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 md:items-end">
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-zinc-400">
              <button onClick={onFeaturesClick} className="hover:text-zinc-100 transition-colors">امکانات</button>
              <button onClick={onDemoClick} className="hover:text-zinc-100 transition-colors">پیش‌نمایش</button>
              <button onClick={onAdvisorsClick} className="hover:text-zinc-100 transition-colors">مشاوران</button>
              <button onClick={onTeamClick} className="hover:text-zinc-100 transition-colors">تیم ما</button>
              <Link href="#login" className="hover:text-zinc-100 transition-colors">ورود</Link>
            </nav>
            <div className="flex items-center gap-4">
              <a href="https://t.me/RevalSupport" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-emerald-400 transition-colors">
                <Send className="size-5" />
              </a>
              <a href="https://instagram.com/reval_academy_" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-pink-500 transition-colors">
                <Instagram className="size-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-800/50 pt-8 sm:flex-row text-xs text-zinc-500">
          <p>© ۲۰۲۶ روال — تمامی حقوق محفوظ است.</p>
          <p>طراحی و توسعه با ❤️ برای دانش‌آموزان ایران.</p>
        </div>
      </div>
    </footer>
  );
}
