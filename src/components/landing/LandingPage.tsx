'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion, useInView, MotionConfig } from 'framer-motion';
import { Menu, X, Send, Instagram, ArrowLeft, CheckCircle2, BarChart3, Users, Zap, LayoutDashboard, BookOpen, UserCheck, Clock, Sun, Moon, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Logo } from './logo';
import { ProductPlayground } from './ProductPlayground';
import { AdvisorsPage } from './advisors-page';
import { TeamPage } from './team-page';
import { FloatingLines } from './floating-lines';

// ----------------------------------------------------------------------
// MAIN EXPORT
// ----------------------------------------------------------------------

export default function LandingPage({ initialView = 'main' }: { initialView?: 'main' | 'advisors' | 'team' } = {}) {
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const [isMobile, setIsMobile] = React.useState(true);
  const [landingView, setLandingView] = React.useState<'main' | 'advisors' | 'team'>(initialView);

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
      } else if (hash === '#advisors') {
        setLandingView('advisors');
      } else if (hash === '#team' || hash === '#about' || hash === '#story') {
        setLandingView('team');
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
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/';
      return;
    }
    setLandingView('main');
    window.scrollTo(0, 0);
  }, []);

  if (landingView === 'advisors') {
    return (
      <MotionConfig reducedMotion={isMobile ? 'always' : 'user'}>
        <div className="landing-page relative isolate flex min-h-screen flex-col overflow-x-clip bg-background font-yekan text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-600 dark:selection:text-emerald-400 md:noise" dir="rtl">
          {!isMobile && <div className="aurora pointer-events-none fixed inset-0 z-0 opacity-35" aria-hidden="true" />}
          <div className="pointer-events-none fixed inset-0 z-0 bg-background/25" aria-hidden="true" />
          {!isMobile && <FloatingLines />}

          <LandingHeader 
            landingView={landingView}
            setLandingView={setLandingView}
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
        <div className="landing-page relative isolate flex min-h-screen flex-col overflow-x-clip bg-background font-yekan text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-600 dark:selection:text-emerald-400 md:noise" dir="rtl">
          {!isMobile && <div className="aurora pointer-events-none fixed inset-0 z-0 opacity-35" aria-hidden="true" />}
          <div className="pointer-events-none fixed inset-0 z-0 bg-background/25" aria-hidden="true" />
          {!isMobile && <FloatingLines />}

          <LandingHeader 
            landingView={landingView}
            setLandingView={setLandingView}
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
      <div className="landing-page relative isolate flex min-h-screen flex-col overflow-x-clip bg-background font-yekan text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-600 dark:selection:text-emerald-400 md:noise" dir="rtl">
        {/* Dynamic Background */}
        {!isMobile && <div className="aurora pointer-events-none fixed inset-0 z-0 opacity-35" aria-hidden="true" />}
        <div className="pointer-events-none fixed inset-0 z-0 bg-background/25" aria-hidden="true" />
        {!isMobile && <FloatingLines />}

        <LandingHeader 
            landingView={landingView}
            setLandingView={setLandingView}
            onAdvisorsClick={handleAdvisorsClick}
            onTeamClick={handleTeamClick}
            onPlaygroundClick={handlePlaygroundClick}
          />

        <main className="relative z-10 flex-1">
          <LandingHero />
          <LandingStatsBar />
          <LandingProblemSolution />
          <ProductPlayground />
          <LandingCta />
          <LandingMoreAboutReval onTeamClick={handleTeamClick} />
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
  landingView = 'main',
  setLandingView,
  onAdvisorsClick,
  onTeamClick,
  onPlaygroundClick,
}: {
  landingView?: 'main' | 'advisors' | 'team';
  setLandingView?: (view: 'main' | 'advisors' | 'team') => void;
  onAdvisorsClick?: () => void;
  onTeamClick?: () => void;
  onPlaygroundClick?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { theme, toggleTheme } = useAppStore();

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (id: string) => {
    setOpen(false);
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = `/#${id}`;
      return;
    }
    if (setLandingView && landingView !== 'main') {
      setLandingView('main');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      dir="rtl"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 font-yekan ${
        scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        {/* Right side: Brand Logo */}
        <Link href="#top" className="flex items-center gap-2 outline-none group" onClick={() => setOpen(false)}>
          <Logo size={26} variant="auto" />
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          <button
            type="button"
            onClick={() => handleScrollTo('solutions')}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            راه‌حل‌ها
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo('playground')}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            امکانات رِوال
          </button>
          <button
            type="button"
            onClick={onAdvisorsClick}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            برای مشاوران
          </button>
          <button
            type="button"
            onClick={onTeamClick}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            داستان رِوال
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo('contact')}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            ارتباط با ما
          </button>
        </nav>

        {/* Left side: Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
                    <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            aria-label="تغییر تم"
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          <Link
            href="#login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground px-2 py-1.5"
          >
            ورود
          </Link>
          <Link
            href="#signup"
            className="group relative inline-flex h-9 items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
          >
            ثبت‌نام
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(true)}
          aria-label="منو"
        >
          <Menu className="size-6" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden bg-background/95 backdrop-blur-xl flex flex-col p-6 font-yekan"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-8">
              <Logo size={26} variant="auto" />
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
                aria-label="بستن منو"
              >
                <X className="size-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-4 text-lg font-medium text-muted-foreground">
              <button
                type="button"
                onClick={() => handleScrollTo('solutions')}
                className="text-right py-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                راه‌حل‌ها
              </button>
              <button
                type="button"
                onClick={() => handleScrollTo('playground')}
                className="text-right py-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                امکانات رِوال
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); onAdvisorsClick?.(); }}
                className="text-right py-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                برای مشاوران
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); onTeamClick?.(); }}
                className="text-right py-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                داستان رِوال
              </button>
              <button
                type="button"
                onClick={() => handleScrollTo('contact')}
                className="text-right py-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                ارتباط با ما
              </button>
              <div className="h-px w-full bg-border/60 my-2" />
              <Link
                href="#login"
                onClick={() => setOpen(false)}
                className="text-right py-2 hover:text-foreground transition-colors"
              >
                ورود
              </Link>
              <div className="flex items-center justify-between py-2 border-y border-border/40 my-2">
                <span className="text-sm font-medium">تغییر تم</span>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full bg-muted/30 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="تغییر تم"
                >
                  {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </button>
              </div>
              <Link
                href="#signup"
                onClick={() => setOpen(false)}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-4 text-base font-semibold text-emerald-950 shadow-[0_0_24px_-4px_rgba(16,185,129,0.5)]"
              >
                ثبت‌نام
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

  const handlePlaygroundScroll = () => {
    document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="top" className="relative pt-32 pb-14 sm:pt-44 sm:pb-20 overflow-hidden font-yekan" dir="rtl">
      {/* Subtle, premium animated ambient background behind text */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden" aria-hidden="true">
        <motion.div
          animate={reduceMotion ? undefined : {
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.55, 0.35],
            x: [0, 30, -20, 0],
            y: [0, -25, 20, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/4 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-emerald-500/25 via-teal-500/15 to-transparent blur-[120px] sm:h-[620px] sm:w-[620px] sm:blur-[160px]"
        />
        <motion.div
          animate={reduceMotion ? undefined : {
            scale: [1.1, 0.95, 1.1],
            opacity: [0.25, 0.45, 0.25],
            x: [0, -30, 25, 0],
            y: [0, 20, -15, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 h-[380px] w-[380px] rounded-full bg-gradient-to-bl from-teal-400/20 via-emerald-600/10 to-transparent blur-[110px] sm:h-[540px] sm:w-[540px] sm:blur-[150px]"
        />
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-5 text-center sm:px-8">
        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <h1 className="text-balance text-4xl font-black leading-[1.25] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            یادگیری هدفمند،{' '}
            <span className="bg-gradient-to-l from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              روی رِوال!
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-base font-normal leading-relaxed text-muted-foreground sm:text-lg sm:leading-8">
            رِوال میز کار شخصیِ تو برای یادگیریه. جایی که برنامه‌‌ریزی و آنالیز دقیق فعالیت یک دانش‌آموز انجام میشه و دقیقا به مشاوری وصل می‌شی که دغدغه‌هات رو می‌فهمه.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row w-full sm:w-auto">
            <Link
              href="#signup"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 text-base font-bold text-emerald-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_32px_-6px_rgba(16,185,129,0.5)] sm:w-auto"
            >
              <ArrowLeft className="size-5" />
              ثبت‌نام
            </Link>
            <button
              type="button"
              onClick={handlePlaygroundScroll}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/60 px-8 text-base font-medium text-foreground transition-all hover:bg-card/80 hover:border-border/80 sm:w-auto cursor-pointer"
            >
              امکانات سایت
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------
// STATS BAR (Replaces Testimonials immediately below Hero)
// ----------------------------------------------------------------------

function LandingStatsBar() {
  const reduceMotion = useReducedMotion();
  const stats = [
    {
      value: '+1000',
      label: 'دانش‌آموز ثبت‌نام کردن',
      fullText: '+1000 دانش‌آموز ثبت‌نام کردن',
      icon: Users,
    },
    {
      value: '+4000',
      label: 'تسک در روال ثبت شده',
      fullText: '+4000 تسک در روال ثبت شده',
      icon: CheckCircle2,
    },
    {
      value: '+50',
      label: 'دانش‌آموز به مشاور اختصاصی خودشون وصل شدن',
      fullText: '+50 دانش‌آموز به مشاور اختصاصی خودشون وصل شدن',
      icon: UserCheck,
    },
  ];

  return (
    <section className="relative z-20 mx-auto w-full max-w-5xl px-5 sm:px-8 pb-16 sm:pb-24 font-yekan" dir="rtl">
      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-2xl shadow-black/20"
      >
        {/* Subtle top border gradient accent */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

        <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-3 sm:divide-y-0 sm:divide-x sm:divide-x-reverse">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              aria-label={stat.fullText}
              className="group flex flex-col items-center justify-center p-6 sm:p-7 text-center transition-colors duration-300 hover:bg-accent/30"
            >
              <div className="mb-3.5 flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm transition-transform duration-300 group-hover:scale-105">
                <stat.icon className="size-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-foreground bg-gradient-to-l from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent font-yekan">
                {stat.value}
              </div>
              <p className="mt-2 text-sm sm:text-base font-medium text-muted-foreground leading-relaxed max-w-[220px]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ----------------------------------------------------------------------
// PROBLEM / SOLUTION
// ----------------------------------------------------------------------

function LandingProblemSolution() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);
  const reduceMotion = useReducedMotion();

  const problems = [
    {
      problem: "برنامه‌ریزیم خیلی بی‌نظمه و هر روز کلی از وقتم فقط صرفِ نوشتن و خط زدنِ برنامه میشه...",
      solutionTitle: "میزکار اختصاصی کنکور",
      solution: "تودولیست اختصاصی کنکور که تمام نیاز های برنامه ریزی دانش آموز رو درنظر می گیره تا تمام تمرکزت روی «انجام دادن» باشه، نه «نوشتن». تازه با فیدبک های خودتون دوره ای هم آپدیت میشه :)"
    },
    {
      problem: "نمی‌دونم باگِ درس خوندنم کجاست! اصلاً نمی‌فهمم برای هر مبحث واقعاً چقدر وقت گذاشتم...",
      solutionTitle: "آنالیز دقیق فعالیت و مطالعه",
      solution: "نمودارهای تحلیلی که بهت نشون میده روی هر درس چقدر زمان گذاشتی، چقدر تست زدی و بازدهی واقعیت چقدر بوده."
    },
    {
      problem: "گوشیم بزرگترین دشمنمه! نمی‌تونم تمرکز کنم و ثبتِ ساعت مطالعه‌ام همیشه با حواس‌پرتی همراهه...",
      solutionTitle: "فضایی به دور از حواس‌پرتی",
      solution: "محیطی مینیمال، آرام و بدون ویژگی های اضافه که حواستو پرت کنن، اینجا مخصوص ثبت عملکردته تا درگیرِ فضای مجازی نشی."
    },
    {
      problem: "هم پیدا کردن مشاور خوب سخته، هم از فرستادن گزارش‌کارهای نامنظمِ هر شبه خسته شدم...",
      solutionTitle: "ارتباط یکپارچه با مشاور",
      solution: "اتصال مستقیم به بهترین مشاوران (که توسط ما تایید میشن و بر اساس شرایط شما انتخاب میشن) و ارسال خودکارِ گزارش‌ها. مشاورت هر لحظه داشبورد تو رو می‌بینه و برات پیام و برنامه میذاره."
    }
  ];

  return (
    <section id="solutions" className="relative scroll-mt-20 py-20 sm:py-28 font-yekan" dir="rtl">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black text-foreground sm:text-4xl">رِوال چه مشکلی رو حل می‌کنه؟</h2>
        </div>

        <div className="flex flex-col gap-4">
          {problems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`overflow-hidden rounded-2xl border transition-colors ${openIndex === idx ? 'border-emerald-500/50 bg-card shadow-md' : 'border-border/60 bg-card/40 hover:border-border/80 hover:bg-card/60'}`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="flex w-full items-center justify-between p-5 sm:p-6 text-right outline-none cursor-pointer"
              >
                <span className="text-base sm:text-lg font-bold text-foreground pr-3 border-r-4 border-transparent data-[active=true]:border-emerald-500 transition-colors" data-active={openIndex === idx}>
                  {item.problem}
                </span>
                <span className="ml-2 flex-shrink-0 text-muted-foreground">
                  {openIndex === idx ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-5 sm:px-6 pb-6 pt-2">
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-5">
                        <h4 className="text-emerald-600 dark:text-emerald-400 font-bold mb-2 flex items-center gap-2 text-base">
                          <CheckCircle2 className="size-5" />
                          {item.solutionTitle}
                        </h4>
                        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                          {item.solution}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------
// MORE ABOUT REVAL ("بیشتر با رِوال آشنا شو")
// ----------------------------------------------------------------------

const TELEGRAM_HANDLE = process.env.NEXT_PUBLIC_ADVISOR_TELEGRAM_HANDLE || "RevalSupport";
const TELEGRAM_URL = `https://t.me/${TELEGRAM_HANDLE}`;
const INSTAGRAM_HANDLE = "reval_academy_";
const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;
const teamEaseOut = [0.16, 1, 0.3, 1] as const;

function LandingMoreAboutReval({ onTeamClick }: { onTeamClick: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="contact"
      className="relative scroll-mt-16 border-t border-border bg-background py-24 sm:py-32"
      dir="rtl"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <motion.div
          ref={ref}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reduceMotion ? 0.12 : 0.6, ease: teamEaseOut }}
        >
          <div className="mb-12 max-w-2xl text-right">
            <span className="text-xs font-bold text-emerald-400">بخش‌های نهایی</span>
            <h2 className="mt-3 text-balance text-3xl font-black leading-tight text-foreground sm:text-5xl">
              بیشتر با رِوال آشنا شو
            </h2>
          </div>

          {/* 2x2 grid of boxes (desktop) / single column (mobile) */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
            {/* ===== Box 1: Team intro with CTA ===== */}
            <TeamBox
              index={0}
              eyebrow="بچه‌های تیم رِوال"
              icon={<Users className="size-5" strokeWidth={2.2} aria-hidden="true" />}
              title="ما کی هستیم؟"
              body="ما تیمی هستیم که خودمون مسیر سختِ آموزش رو رفتیم و حالا با بررسی مشکلات شما و کمک گرفتن از متخصصین، می‌خوایم یه ابزارِ واقعی و به‌دردبخور برای درس خوندن بسازیم."
            >
              <button
                type="button"
                onClick={onTeamClick}
                className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-500 px-4 text-xs font-bold text-emerald-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] shadow-[0_0_20px_-4px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                داستانِ ما رو بشنو
                <ArrowLeft className="size-3.5 flip-rtl transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              </button>
            </TeamBox>

            {/* ===== Box 2: Articles (tag: coming soon) ===== */}
            <TeamBox
              index={1}
              eyebrow="مقالات و جستارها"
              icon={<BookOpen className="size-5" strokeWidth={2.2} aria-hidden="true" />}
              title="خوندنی‌های رِوال"
              body="مقاله‌ها و یادداشت‌های خودمونی و کاربردی درباره‌ی روش‌های تمرکز، فرار از کمال‌گرایی و اینکه چطور کمتر حرص بخوریم و بهتر یاد بگیریم."
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="size-3.5" aria-hidden="true" />
                به‌زودی منتشر می‌شود
              </span>
            </TeamBox>

            {/* ===== Box 3: Choose advisor — CTA to Telegram ===== */}
            <TeamBox
              index={2}
              eyebrow="انتخاب مشاور"
              icon={<UserCheck className="size-5" strokeWidth={2.2} aria-hidden="true" />}
              title="پیدا کردنِ یه مشاورِ مخصوص خودت"
              body="اینجا می‌تونی رزومه‌ی مشاورهای مختلف رو ببینی، نظر بقیه‌ی بچه‌ها رو بخونی و مشاوری رو انتخاب کنی که دقیقا حرفت رو می‌فهمه و باهات جوره."
            >
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-500 px-4 text-xs font-bold text-emerald-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] shadow-[0_0_20px_-4px_rgba(16,185,129,0.3)]"
              >
                <Send className="size-3.5" aria-hidden="true" />
                ارتباط با مشاور
                <ArrowLeft className="size-3.5 flip-rtl transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              </a>
            </TeamBox>

            {/* ===== Box 4: Contact + social ===== */}
            <TeamBox
              index={3}
              eyebrow="ارتباط با ما و شبکه‌های اجتماعی"
              icon={<Send className="size-5" strokeWidth={2.2} aria-hidden="true" />}
              title="صدای شما رو می‌شنویم!"
              body="مشتاقِ شنیدن نظرات، پیشنهادها و دغدغه‌هات هستیم. برای باخبر شدن از آپدیت‌های جدیدِ پلتفرم و خوندنِ نکاتِ کوتاه، توی شبکه‌های اجتماعی کنارمون باش."
            >
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-500 px-4 text-xs font-bold text-emerald-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] shadow-[0_0_20px_-4px_rgba(16,185,129,0.3)]"
                >
                  <Send className="size-3.5" aria-hidden="true" />
                  پشتیبانی و راه‌های ارتباطی
                  <ArrowLeft className="size-3.5 flip-rtl transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                </a>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="اینستاگرام روال"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card/60 text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10"
                >
                  <Instagram className="size-4" aria-hidden="true" />
                </a>
              </div>
            </TeamBox>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TeamBox({
  index,
  eyebrow,
  icon,
  title,
  body,
  children,
}: {
  index: number;
  eyebrow: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: reduceMotion ? 0.12 : 0.45,
        delay: reduceMotion ? 0 : index * 0.08,
        ease: teamEaseOut,
      }}
      className="group flex flex-col rounded-2xl border border-border bg-card/60 p-6 transition-colors duration-300 hover:border-emerald-500/40 sm:p-7"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500 group-hover:text-emerald-950">
        {icon}
      </div>
      <p className="mt-4 text-xs font-bold text-emerald-400">{eyebrow}</p>
      <h3 className="mt-2 text-base font-black leading-snug text-foreground sm:text-lg">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-8 text-muted-foreground">
        {body}
      </p>
      <div className="mt-5">{children}</div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// CTA
// ----------------------------------------------------------------------

function LandingCta() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 text-center shadow-2xl sm:p-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
          
          <div className="relative z-10">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">ثبت نام و استفاده از تمامی قابلیت های روال رایگانه!</span>
            <h2 className="mt-4 text-3xl font-black text-foreground sm:text-5xl">آماده‌ای درس خوندنت رو بندازی روی روال؟</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-sm sm:text-base leading-relaxed">
              همین امروز به صدها دانش‌آموز و مشاور بپیوند که با روال، مطالعه‌شون رو هوشمند و هدفمند مدیریت می‌کنن.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="#signup" className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-8 text-base font-bold text-emerald-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] sm:w-auto">
                ثبت‌نام رایگان و شروع
              </Link>
              <Link href="#login" className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-muted px-8 text-base font-medium text-foreground transition-colors hover:bg-muted/80 hover:border-border/80 sm:w-auto">
                ورود به حساب کاربری
              </Link>
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
    <footer className="border-t border-border/80 bg-card py-12">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          <div className="flex flex-col items-center gap-3 md:items-start text-center md:text-right">
            <Link href="#top" className="flex items-center gap-2 outline-none">
               <Logo size={28} variant="auto" />
            </Link>
            <p className="text-xs text-muted-foreground max-w-[250px]">
              پلتفرم جامع برنامه‌ریزی، آنالیز تحصیلی و مشاوره هوشمند.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 md:items-end">
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground">
              <button onClick={() => {
                if (typeof window !== 'undefined' && window.location.pathname !== '/') window.location.href = '/#solutions';
                else {
                  onPlaygroundClick(); // Reset to main view if needed
                  setTimeout(() => document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
              }} className="hover:text-foreground transition-colors cursor-pointer">راه‌حل‌ها</button>
              <button onClick={onPlaygroundClick} className="hover:text-foreground transition-colors cursor-pointer">امکانات رِوال</button>
              <button onClick={onAdvisorsClick} className="hover:text-foreground transition-colors cursor-pointer">برای مشاوران</button>
              <button onClick={onTeamClick} className="hover:text-foreground transition-colors cursor-pointer">داستان رِوال</button>
              <button onClick={() => {
                if (typeof window !== 'undefined' && window.location.pathname !== '/') window.location.href = '/#contact';
                else {
                  onPlaygroundClick(); // Reset to main view if needed
                  setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
              }} className="hover:text-foreground transition-colors cursor-pointer">ارتباط با ما</button>
            </nav>
            <div className="flex items-center gap-4">
              <a href="https://t.me/RevalSupport" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" aria-label="پشتیبانی تلگرام">
                <Send className="size-5" />
              </a>
              <a href="https://instagram.com/reval_academy_" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-pink-600 dark:hover:text-pink-500 transition-colors" aria-label="اینستاگرام روال">
                <Instagram className="size-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row text-xs text-muted-foreground">
          <p>© ۲۰۲۶ روال — تمامی حقوق محفوظ است.</p>
          <p>طراحی و توسعه با ❤️ برای دانش‌آموزان ایران.</p>
        </div>
      </div>
    </footer>
  );
}
