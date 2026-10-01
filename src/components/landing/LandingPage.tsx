'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion, useInView, MotionConfig } from 'framer-motion';
import { Menu, X, Send, Instagram, ArrowLeft, CheckCircle2, BarChart3, Users, Zap, LayoutDashboard, BookOpen, UserCheck, Clock } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Logo } from './logo';
import { ProductPlayground } from './ProductPlayground';
import { AdvisorsPage } from './advisors-page';
import { TeamPage } from './team-page';
import { FloatingLines } from './floating-lines';

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
        <div className="landing-page relative isolate flex min-h-screen flex-col overflow-x-clip bg-background font-yekan text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-600 dark:selection:text-emerald-400 md:noise">
          {!isMobile && <div className="aurora pointer-events-none fixed inset-0 z-0 opacity-35" aria-hidden="true" />}
          <div className="pointer-events-none fixed inset-0 z-0 bg-background/25" aria-hidden="true" />
          {!isMobile && <FloatingLines />}

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
        <div className="landing-page relative isolate flex min-h-screen flex-col overflow-x-clip bg-background font-yekan text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-600 dark:selection:text-emerald-400 md:noise">
          {!isMobile && <div className="aurora pointer-events-none fixed inset-0 z-0 opacity-35" aria-hidden="true" />}
          <div className="pointer-events-none fixed inset-0 z-0 bg-background/25" aria-hidden="true" />
          {!isMobile && <FloatingLines />}

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
      <div className="landing-page relative isolate flex min-h-screen flex-col overflow-x-clip bg-background font-yekan text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-600 dark:selection:text-emerald-400 md:noise" dir="rtl">
        {/* Dynamic Background from main branch */}
        {!isMobile && <div className="aurora pointer-events-none fixed inset-0 z-0 opacity-35" aria-hidden="true" />}
        <div className="pointer-events-none fixed inset-0 z-0 bg-background/25" aria-hidden="true" />
        {!isMobile && <FloatingLines />}

        <LandingHeader 
          onAdvisorsClick={handleAdvisorsClick} 
          onTeamClick={handleTeamClick} 
          onPlaygroundClick={handlePlaygroundClick} 
        />

        <main className="relative z-10 flex-1">
          <LandingHero />
          <LandingBentoFeatures />
          <LandingSocialProof />
          <ProductPlayground />
          <LandingMoreAboutReval onTeamClick={handleTeamClick} />
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
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-sm' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="#top" className="flex items-center gap-2 outline-none group" onClick={() => setOpen(false)}>
          <Logo size={26} variant="auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button key={item.label} onClick={item.action} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="#login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground px-2 py-1.5">
            ورود
          </Link>
          <Link href="#signup" className="group relative inline-flex h-9 items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]">
            ثبت‌نام / ورود
          </Link>
        </div>

        <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setOpen(true)} aria-label="منو">
          <Menu className="size-6" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 md:hidden bg-background/95 backdrop-blur-xl flex flex-col p-6">
             <div className="flex items-center justify-between mb-8">
               <Logo size={26} variant="auto" />
               <button className="text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)} aria-label="بستن منو">
                 <X className="size-6" />
               </button>
             </div>
             <nav className="flex flex-col gap-4 text-lg font-medium text-muted-foreground">
               {navItems.map((item) => (
                 <button key={item.label} onClick={() => { item.action(); setOpen(false); }} className="text-right py-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                   {item.label}
                 </button>
               ))}
               <div className="h-px w-full bg-border/60 my-2" />
               <Link href="#login" onClick={() => setOpen(false)} className="text-right py-2 hover:text-foreground transition-colors">
                 ورود
               </Link>
               <Link href="#signup" onClick={() => setOpen(false)} className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-4 text-base font-semibold text-emerald-950 shadow-[0_0_24px_-4px_rgba(16,185,129,0.5)]">
                 ثبت‌نام / ورود
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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 backdrop-blur-md">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            نسل جدید پلتفرم هوشمند مدیریت مطالعه
          </div>
          <h1 className="text-balance text-4xl font-black leading-[1.2] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            ما اینجاییم <br />
            <span className="bg-gradient-to-l from-emerald-500 via-teal-400 to-emerald-400 bg-clip-text text-transparent">همه چی بیفته رو روال!</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-base font-normal leading-relaxed text-muted-foreground sm:text-lg">
            روال یک میز کار مدرن و بدون حواس‌پرتی است؛ جایی که برنامه‌ریزی شخصی‌سازی‌شده، آنالیز جزئی دروس و ارتباط مؤثر با مشاور در یک ساختار یکپارچه قرار می‌گیرند.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="#signup" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 text-base font-bold text-emerald-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_32px_-6px_rgba(16,185,129,0.5)] sm:w-auto">
              <ArrowLeft className="size-5" />
              شروع رایگان و ساخت برنامه
            </Link>
            <Link href="#playground" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/60 px-8 text-base font-medium text-foreground transition-all hover:bg-card/80 hover:border-border/80 sm:w-auto">
              تست محیط اپلیکیشن (Playground)
            </Link>
          </div>
        </motion.div>

        <motion.div initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative mt-16 w-full max-w-5xl md:mt-24">
          <div className="pointer-events-none absolute -inset-10 z-0 rounded-[3rem] bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-transparent blur-[120px] opacity-20" />
          <div className="relative z-10 overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-2 shadow-2xl backdrop-blur-2xl sm:p-3">
            <div className="mb-2 flex items-center gap-2 px-2 sm:mb-3">
              <div className="size-2.5 sm:size-3 rounded-full bg-red-500/80" />
              <div className="size-2.5 sm:size-3 rounded-full bg-amber-500/80" />
              <div className="size-2.5 sm:size-3 rounded-full bg-emerald-500/80" />
              <div className="mx-auto flex h-5 items-center justify-center rounded bg-muted/60 px-3 text-[10px] text-muted-foreground sm:h-6 sm:text-[11px] border border-border/40">
                app.revaledu.ir
              </div>
              <div className="w-12" />
            </div>
            <div className="relative aspect-[16/9] sm:aspect-[16/10] lg:aspect-[16/9] w-full overflow-hidden rounded-xl bg-background">
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
// SPOTLIGHT CARD (Linear-style Mouse Tracking)
// ----------------------------------------------------------------------
function SpotlightCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const divRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = React.useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm transition-colors hover:border-border/80 ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(16,185,129,0.08), transparent 40%)`,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

// ----------------------------------------------------------------------
// BENTO FEATURES
// ----------------------------------------------------------------------

function LandingBentoFeatures() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black text-foreground sm:text-4xl">برای دانش‌آموزان</h2>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base">همه ابزارهایی که برای ساختن یک مسیر مطالعاتی موفق و منظم نیاز داری.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
          {/* Card 1 */}
          <SpotlightCard className="md:col-span-2 p-8 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
              <LayoutDashboard className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">داشبورد هوشمند</h3>
              <p className="text-muted-foreground leading-relaxed">
                نگاهی سریع به وضعیت روزانه‌ات. تسک‌های امروز، پیام‌های خوانده‌نشده، و وضعیت پیشرفت هفته در یک نگاه برای حفظ تمرکز.
              </p>
            </div>
          </SpotlightCard>

          {/* Card 2 */}
          <SpotlightCard className="p-8 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4 text-teal-600 dark:text-teal-400">
              <Zap className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">ثبت سریع عملکرد</h3>
              <p className="text-muted-foreground leading-relaxed">
                بدون اتلاف وقت، تست‌ها و ساعت مطالعه‌ات رو با یک کلیک ثبت کن.
              </p>
            </div>
          </SpotlightCard>

          {/* Card 3 */}
          <SpotlightCard className="p-8 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
              <BarChart3 className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">آنالیز دقیق ساعت و تست</h3>
              <p className="text-muted-foreground leading-relaxed">
                نمودارهای لحظه‌ای از عملکرد شما در هر درس.
              </p>
            </div>
          </SpotlightCard>

          {/* Card 4 */}
          <SpotlightCard className="md:col-span-2 p-8 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
              <Users className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">ارتباط یکپارچه با مشاور</h3>
              <p className="text-muted-foreground leading-relaxed">
                برنامه‌ات مستقیماً از سمت مشاور به پنل شما ارسال می‌شه. گزارش‌کارهای آخر شب خودکار ایجاد می‌شن و نیازی به تایپ و ارسال دستی در تلگرام نیست.
              </p>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------
// SOCIAL PROOF
// ----------------------------------------------------------------------

function LandingSocialProof() {
  const testimonials = [
    {
      text: "نظم دادن به درس‌هام همیشه برام کابوس بود، ولی روال دقیقا همون چیزی بود که نیاز داشتم. خفن‌ترین ویژگیش تحلیل‌های دقیقشه!",
      author: "علی",
      role: "پایه دوازدهم",
      avatar: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
      letter: "ع"
    },
    {
      text: "ارتباط با مشاورم خیلی سریع‌تر و راحت‌تر شده. دیگه نیازی نیست آخر هفته‌ها دفتر برنامه‌ریزی کاغذی ببرم آموزشگاه.",
      author: "سارا",
      role: "فارغ‌التحصیل تجربی",
      avatar: "bg-pink-500/20 text-pink-600 dark:text-pink-400",
      letter: "س"
    },
    {
      text: "واقعاً حس خوبی میده وقتی تیک تسک‌ها رو می‌زنم و نوار سبز پر می‌شه. انگار بازیه ولی واقعاً دارم درس می‌خونم!",
      author: "مبینا",
      role: "پایه یازدهم ریاضی",
      avatar: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
      letter: "م"
    }
  ];

  return (
    <section className="relative border-y border-border/60 bg-muted/30 py-16 sm:py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            تجربه کسانی که زودتر <span className="text-emerald-600 dark:text-emerald-400">روالی</span> شدن 🚀
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="relative rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                «{t.text}»
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${t.avatar}`}>
                  {t.letter}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{t.author}</h4>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
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
      id="team"
      className="relative scroll-mt-16 border-t border-zinc-800 bg-zinc-950 py-24 sm:py-32"
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
            <h2 className="mt-3 text-balance text-3xl font-black leading-tight text-zinc-100 sm:text-5xl">
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
                className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-500 px-4 text-xs font-bold text-zinc-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] shadow-[0_0_20px_-4px_rgba(16,185,129,0.3)]"
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
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-400">
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
                className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-500 px-4 text-xs font-bold text-zinc-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] shadow-[0_0_20px_-4px_rgba(16,185,129,0.3)]"
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
                  className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-500 px-4 text-xs font-bold text-zinc-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] shadow-[0_0_20px_-4px_rgba(16,185,129,0.3)]"
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
                  className="inline-flex size-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10"
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
      className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors duration-300 hover:border-emerald-500/40 sm:p-7"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500 group-hover:text-zinc-950">
        {icon}
      </div>
      <p className="mt-4 text-xs font-bold text-emerald-400">{eyebrow}</p>
      <h3 className="mt-2 text-base font-black leading-snug text-zinc-100 sm:text-lg">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-8 text-zinc-400">
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
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">شروع سریع در کمتر از ۲ دقیقه</span>
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
            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
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
              <button onClick={onPlaygroundClick} className="hover:text-foreground transition-colors">پلی‌گراند روال</button>
              <button onClick={onAdvisorsClick} className="hover:text-foreground transition-colors">مشاوران</button>
              <button onClick={onTeamClick} className="hover:text-foreground transition-colors">تیم ما</button>
              <Link href="#login" className="hover:text-foreground transition-colors">ورود</Link>
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
