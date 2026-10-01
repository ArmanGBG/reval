'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion, MotionConfig } from 'framer-motion';
import { Menu, X, Send, Instagram, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Logo } from './logo';
import { ProductPlayground } from './ProductPlayground';
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

  const handlePlaygroundClick = React.useCallback(() => {
    setLandingView('main');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' });
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
          <LandingHeader 
            onAdvisorsClick={handleAdvisorsClick} 
            onTeamClick={handleTeamClick} 
            onPlaygroundClick={handlePlaygroundClick} 
          />
          <main className="relative z-10 flex-1 pt-20">
            <AdvisorsPage onBack={handleBackToMain} />
          </main>
          <LandingFooter 
            onAdvisorsClick={handleAdvisorsClick} 
            onTeamClick={handleTeamClick} 
            onPlaygroundClick={handlePlaygroundClick} 
          />
        </div>
      </MotionConfig>
    );
  }

  if (landingView === 'team') {
    return (
      <MotionConfig reducedMotion={isMobile ? 'always' : 'user'}>
        <div className="landing-page relative isolate flex min-h-screen flex-col overflow-x-clip bg-zinc-950 font-yekan text-zinc-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
          <LandingHeader 
            onAdvisorsClick={handleAdvisorsClick} 
            onTeamClick={handleTeamClick} 
            onPlaygroundClick={handlePlaygroundClick} 
          />
          <main className="relative z-10 flex-1 pt-20">
            <TeamPage onBack={handleBackToMain} />
          </main>
          <LandingFooter 
            onAdvisorsClick={handleAdvisorsClick} 
            onTeamClick={handleTeamClick} 
            onPlaygroundClick={handlePlaygroundClick} 
          />
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

        <LandingHeader 
          onAdvisorsClick={handleAdvisorsClick} 
          onTeamClick={handleTeamClick} 
          onPlaygroundClick={handlePlaygroundClick} 
        />

        <main className="relative z-10 flex-1">
          <LandingHero />
          <LandingMetrics />
          <ProductPlayground />
          <LandingCta />
        </main>
        
        <LandingFooter 
          onAdvisorsClick={handleAdvisorsClick} 
          onTeamClick={handleTeamClick} 
          onPlaygroundClick={handlePlaygroundClick} 
        />
      </div>
    </MotionConfig>
  );
}

// ----------------------------------------------------------------------
// HEADER
// ----------------------------------------------------------------------

function LandingHeader({ 
  onAdvisorsClick, 
  onTeamClick, 
  onPlaygroundClick 
}: {
  onAdvisorsClick: () => void;
  onTeamClick: () => void;
  onPlaygroundClick: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'پلی‌گراند و امکانات', action: onPlaygroundClick },
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

        <button className="md:hidden text-zinc-400 hover:text-zinc-100" onClick={() => setOpen(true)} aria-label="منو">
          <Menu className="size-6" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 md:hidden bg-zinc-950/95 backdrop-blur-xl flex flex-col p-6">
             <div className="flex items-center justify-between mb-8">
               <Logo size={26} variant="dark" />
               <button className="text-zinc-400 hover:text-zinc-100" onClick={() => setOpen(false)} aria-label="بستن منو">
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

// ----------------------------------------------------------------------
// HERO
// ----------------------------------------------------------------------

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
            <Link href="#playground" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-8 text-base font-medium text-zinc-200 transition-all hover:bg-zinc-800/80 hover:border-zinc-700 sm:w-auto">
              تست محیط اپلیکیشن (Playground)
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

// ----------------------------------------------------------------------
// METRICS
// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------
// CTA
// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------
// FOOTER
// ----------------------------------------------------------------------

function LandingFooter({ 
  onAdvisorsClick, 
  onTeamClick, 
  onPlaygroundClick 
}: {
  onAdvisorsClick: () => void;
  onTeamClick: () => void;
  onPlaygroundClick: () => void;
}) {
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
              <button onClick={onPlaygroundClick} className="hover:text-zinc-100 transition-colors">پلی‌گراند روال</button>
              <button onClick={onAdvisorsClick} className="hover:text-zinc-100 transition-colors">مشاوران</button>
              <button onClick={onTeamClick} className="hover:text-zinc-100 transition-colors">تیم ما</button>
              <Link href="#login" className="hover:text-zinc-100 transition-colors">ورود</Link>
            </nav>
            <div className="flex items-center gap-4">
              <a href="https://t.me/RevalSupport" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-emerald-400 transition-colors" aria-label="پشتیبانی تلگرام">
                <Send className="size-5" />
              </a>
              <a href="https://instagram.com/reval_academy_" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-pink-500 transition-colors" aria-label="اینستاگرام روال">
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
