'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import {
  BookOpen,
  Brain,
  Timer,
  Calculator,
  Heart,
  Music,
  Target,
  Sparkles,
  TrendingUp,
  ChevronDown,
  Zap,
  Shield,
  Users,
  Star,
  CheckCircle2,
  Play,
} from 'lucide-react';

// ===== Helper: Convert number to Persian digits =====
function toPersianDigits(num: number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((d) => persianDigits[parseInt(d)] ?? d)
    .join('');
}

// ===== Animation Variants =====
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// ===== Section Wrapper with InView Animation =====
function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeInUp}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ===== Data =====
const FEATURES = [
  {
    icon: BookOpen,
    title: 'برنامه‌ریزی هوشمند',
    description: 'برنامه مطالعه شخصی‌سازی شده بر اساس اهداف و رشته تحصیلی‌ات',
  },
  {
    icon: Music,
    title: 'موزیک تمرکز',
    description: 'موسیقی و صداهای محیطی برای افزایش تمرکز و بهره‌وری',
  },
  {
    icon: Brain,
    title: 'فلش‌کارت هوشمند',
    description: 'یادگیری فعال با تکرار فاصله‌دار و دسته‌بندی دروس',
  },
  {
    icon: Timer,
    title: 'تایمر پومودورو',
    description: 'مدیریت زمان مطالعه با تکنیک پومودورو و استراحت‌های هوشمند',
  },
  {
    icon: Calculator,
    title: 'محاسبه‌گر درصد',
    description: 'محاسبه دقیق درصد کنکور با فرمول رسمی و تحلیل نتایج',
  },
  {
    icon: Heart,
    title: 'اورژانس استرس',
    description: 'تمرینات تنفسی و آرام‌بخش برای مدیریت استرس کنکور',
  },
];

const STEPS = [
  {
    number: '۱',
    title: 'ثبت‌نام و هدف‌گذاری',
    description: 'رشته، پایه و هدفتو مشخص کن. ما مسیرتو طراحی می‌کنیم.',
    icon: Target,
  },
  {
    number: '۲',
    title: 'برنامه‌ریزی خودکار',
    description: 'روال بر اساس اهدافت برنامه روزانه‌ات رو می‌سازه.',
    icon: Sparkles,
  },
  {
    number: '۳',
    title: 'پیشرفت و تحلیل',
    description: 'پیشرفتو رصد کن، نقطه ضعف‌هاتو بشناس و بهبود بزن.',
    icon: TrendingUp,
  },
];

const STATS = [
  { value: 12000, label: 'دانش‌آموز فعال', suffix: '+' },
  { value: 95, label: 'رضایت کاربران', suffix: '%' },
  { value: 40, label: 'افزایش بهره‌وری', suffix: '%' },
  { value: 500, label: 'ساعت مطالعه روزانه', suffix: '+' },
];

const TESTIMONIALS = [
  {
    name: 'سارا محمدی',
    grade: 'پشت کنکوری - تجربی',
    text: 'روال واقعاً مسیر مطالعه‌ام رو منظم کرد. دیگه نمی‌دونم بدون روال چی کار می‌کردم!',
    avatar: '🦊',
  },
  {
    name: 'امیرحسین رضایی',
    grade: 'دوازدهم - ریاضی',
    text: 'محاسبه‌گر درصد و فلش‌کارت‌ها عالین. تمرکزم خیلی بیشتر شده.',
    avatar: '🐺',
  },
  {
    name: 'فاطمه احمدی',
    grade: 'یازدهم - انسانی',
    text: 'اورژانس استرس واقعاً کمکم کرده. قبل از امتحانا تنفس عمیق می‌کنم.',
    avatar: '🦁',
  },
];

// ===== Counter Animation Hook =====
function useCounter(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!startOnView || !isInView) return;

    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration, isInView, startOnView]);

  return { count, ref };
}

// ===== Stat Card (extracted so useCounter respects rules of hooks) =====
function StatCard({ stat }: { stat: { value: number; label: string; suffix: string } }) {
  const { count, ref } = useCounter(stat.value, 2000);
  return (
    <div
      ref={ref}
      className="text-center px-3 py-4 md:py-6 rounded-[var(--radius)] md:rounded-2xl md:surface-1 md:card-hover md:edge-highlight"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="text-3xl md:text-4xl lg:text-5xl font-black text-[var(--accent)] mb-1 md:mb-2 tracking-tight tabular-nums"
      >
        {toPersianDigits(count)}
        {stat.suffix}
      </motion.div>
      <p className="text-xs md:text-sm text-[var(--foreground-muted)] leading-snug">
        {stat.label}
      </p>
    </div>
  );
}

// ===== Section Heading (eyebrow + title + subtitle) =====
function SectionHeading({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  highlight,
  subtitle,
}: {
  eyebrow: string;
  eyebrowIcon: React.ComponentType<{ className?: string }>;
  title: string;
  highlight: string;
  subtitle: string;
}) {
  return (
    <AnimatedSection className="text-center mb-10 md:mb-16">
      <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-soft)] mb-3 md:mb-4">
        <EyebrowIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--accent)]" />
        <span className="text-xs md:text-sm text-[var(--accent)] font-medium">{eyebrow}</span>
      </div>
      <h2 className="text-2xl md:text-4xl font-black text-[var(--foreground)] mb-3 md:mb-4 leading-tight">
        {title} <span className="text-[var(--accent)]">{highlight}</span>
      </h2>
      <p className="text-sm md:text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    </AnimatedSection>
  );
}

// ===== Navbar Component =====
function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const { setCurrentView } = useAppStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'surface-glass' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-[var(--radius)] bg-[var(--accent)] flex items-center justify-center shadow-[0_4px_14px_-2px_var(--accent-glow)]">
            <span className="text-[var(--bg-deep)] font-black text-base">ر</span>
          </div>
          <span className="text-lg font-bold text-[var(--foreground)]">روال</span>
        </div>

        {/* Nav Links — desktop only */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="link-underline text-sm text-[var(--foreground-muted)]"
          >
            ویژگی‌ها
          </a>
          <a
            href="#how-it-works"
            className="link-underline text-sm text-[var(--foreground-muted)]"
          >
            نحوه کار
          </a>
          <a
            href="#testimonials"
            className="link-underline text-sm text-[var(--foreground-muted)]"
          >
            نظرات
          </a>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setCurrentView('onboarding')}
          className="btn-hover glow-hover px-5 py-2.5 rounded-[var(--radius)] bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-sm min-h-[44px] flex items-center"
        >
          شروع کن
        </motion.button>
      </div>
    </motion.nav>
  );
}

// ===== Hero Section =====
function HeroSection() {
  const { setCurrentView } = useAppStore();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16 pb-12 md:pb-0">
      {/* ONE subtle accent glow behind hero headline — no other orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 right-1/2 translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,var(--accent-soft)_0%,transparent_70%)] blur-3xl opacity-70"
      />

      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6"
      >
        {/* ===== Mobile layout: full-bleed single column ===== */}
        <div className="md:hidden max-w-md mx-auto text-center pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-soft)] mb-5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-xs text-[var(--accent)] font-medium">همراه هوشمند کنکور</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl font-black text-[var(--foreground)] leading-[1.15] mb-5"
          >
            مسیر مطالعه‌ات رو{' '}
            <span className="bg-gradient-to-l from-[var(--accent-hover)] to-[var(--accent)] bg-clip-text text-transparent">
              هموار
            </span>{' '}
            کن
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base text-[var(--foreground-muted)] leading-relaxed mb-7"
          >
            روال، اپلیکیشن مدیریت مطالعه و بهره‌وری دانش‌آموزی. برنامه‌ریزی هوشمند، ابزارهای تمرکز و تحلیل پیشرفت — همه در یک جا.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col gap-3 mb-6"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCurrentView('onboarding')}
              className="btn-hover glow-hover w-full px-6 py-4 rounded-2xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-base min-h-[52px]"
            >
              شروع کن
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-hover w-full px-6 py-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--foreground)] font-bold text-base min-h-[52px]"
            >
              بیشتر بدون
            </motion.button>
          </motion.div>

          {/* Social proof — mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex items-center justify-center gap-2.5"
          >
            <div className="flex -space-x-2 space-x-reverse">
              {['🦊', '🐺', '🦁', '🐯'].map((emoji, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-[var(--bg-overlay)] border-2 border-[var(--bg-base)] flex items-center justify-center text-sm"
                >
                  {emoji}
                </div>
              ))}
            </div>
            <div className="text-xs">
              <span className="text-[var(--foreground)] font-bold">+۱۲,۰۰۰</span>
              <span className="text-[var(--foreground-muted)]"> دانش‌آموز فعال</span>
            </div>
          </motion.div>
        </div>

        {/* ===== Desktop layout: split (text right, mockup left) ===== */}
        <div className="hidden md:flex flex-row items-center gap-12 lg:gap-16 py-20">
          {/* Text — appears on RIGHT in RTL */}
          <div className="flex-1 text-right">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-soft)] mb-6"
            >
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-sm text-[var(--accent)] font-medium">همراه هوشمند کنکور</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-5xl lg:text-6xl font-black text-[var(--foreground)] leading-[1.1] mb-6 tracking-tight"
            >
              مسیر مطالعه‌ات رو{' '}
              <span className="bg-gradient-to-l from-[var(--accent-hover)] to-[var(--accent)] bg-clip-text text-transparent">
                هموار
              </span>{' '}
              کن
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg lg:text-xl text-[var(--foreground-muted)] leading-relaxed mb-8 max-w-xl mr-0"
            >
              روال، اپلیکیشن مدیریت مطالعه و بهره‌وری دانش‌آموزی. برنامه‌ریزی هوشمند، ابزارهای تمرکز و تحلیل پیشرفت — همه در یک جا.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-row items-center gap-4 justify-start mb-8"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCurrentView('onboarding')}
                className="btn-hover glow-hover px-8 py-4 rounded-2xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-base min-w-[200px] shadow-[0_8px_24px_-6px_var(--accent-glow)]"
              >
                شروع کن
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-hover px-8 py-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--foreground)] font-bold text-base min-w-[200px]"
              >
                بیشتر بدون
              </motion.button>
            </motion.div>

            {/* Social proof — desktop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex items-center gap-3 justify-start"
            >
              <div className="flex -space-x-2 space-x-reverse">
                {['🦊', '🐺', '🦁', '🐯'].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-[var(--bg-overlay)] border-2 border-[var(--bg-base)] flex items-center justify-center text-base"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="text-[var(--foreground)] font-bold">+۱۲,۰۰۰</span>
                <span className="text-[var(--foreground-muted)]"> دانش‌آموز فعال</span>
              </div>
            </motion.div>
          </div>

          {/* Phone Mockup — appears on LEFT in RTL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex-1 relative max-w-sm lg:max-w-md"
          >
            <div className="relative">
              {/* Single subtle glow behind phone */}
              <div
                aria-hidden
                className="absolute inset-0 bg-[var(--accent-glow)] blur-[60px] rounded-full scale-75 opacity-60"
              />

              {/* Phone frame */}
              <div className="relative bg-[var(--bg-elevated)] rounded-[2.5rem] border border-[var(--border-strong)] p-3 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.7)]">
                <div className="bg-[var(--bg-deep)] rounded-[2rem] overflow-hidden aspect-[9/16]">
                  <img
                    src="/hero-illustration.png"
                    alt="اپلیکیشن روال"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>

              {/* Floating badge — top */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 surface-glass rounded-2xl px-4 py-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--foreground)]">وظیفه انجام شد</p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">ریاضی — حد و پیوستگی</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating badge — bottom */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -bottom-2 -left-4 surface-glass rounded-2xl px-4 py-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(139,92,246,0.18)] flex items-center justify-center">
                    <Timer className="w-4 h-4 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--foreground)]">۲۵ دقیقه مطالعه</p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">پومودورو فعال</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator — desktop only */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="w-6 h-6 text-[var(--foreground-subtle)]" />
      </motion.div>
    </section>
  );
}

// ===== Features Section =====
function FeaturesSection() {
  return (
    <section id="features" className="relative py-16 md:py-24 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow="ابزارهای قدرتمند"
          eyebrowIcon={Zap}
          title="همه چیز که برای"
          highlight="موفقیت"
          subtitle="از برنامه‌ریزی هوشمند تا مدیریت استرس، روال تمام ابزارهای مورد نیاز تو رو در اختیارت می‌ذاره"
        />

        {/* Mobile: vertical full-width list */}
        <div className="md:hidden max-w-md mx-auto flex flex-col gap-3">
          {FEATURES.map((feature, index) => (
            <AnimatedSection key={feature.title} delay={index * 0.05}>
              <div className="card-hover edge-highlight flex items-start gap-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-4 min-h-[44px]">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center"
                >
                  <feature.icon className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-[var(--foreground)] mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Desktop: multi-column grid with hover-lift cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              className="card-hover edge-highlight group bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6"
            >
              <div
                className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105"
              >
                <feature.icon className="w-7 h-7 text-[var(--accent)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ===== How It Works Section =====
function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-16 md:py-24 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow="ساده و سریع"
          eyebrowIcon={Play}
          title="در"
          highlight="سه قدم"
          subtitle="فقط چند دقیقه وقت بذار و مسیر مطالعه‌ات رو شروع کن"
        />

        {/* Mobile: vertical step list */}
        <div className="md:hidden max-w-md mx-auto flex flex-col gap-4">
          {STEPS.map((step, index) => (
            <AnimatedSection key={step.number} delay={index * 0.1}>
              <div className="relative flex items-start gap-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-5 card-hover edge-highlight">
                {/* Step number badge */}
                <div className="flex-shrink-0 relative">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent-soft)] flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--accent)] text-[var(--bg-deep)] text-xs font-black flex items-center justify-center">
                    {step.number}
                  </span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-base font-bold text-[var(--foreground)] mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Desktop: horizontal 3-step flow with connecting line */}
        <div className="hidden md:grid grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div
            aria-hidden
            className="absolute top-12 right-[16.66%] left-[16.66%] h-px bg-gradient-to-l from-[var(--accent-soft)] via-[var(--accent-glow)] to-[var(--accent-soft)]"
          />

          {STEPS.map((step, index) => (
            <AnimatedSection key={step.number} delay={index * 0.15}>
              <div className="relative text-center">
                {/* Step number circle */}
                <div className="relative mx-auto w-24 h-24 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center mb-6 card-hover edge-highlight">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--accent-soft)] to-transparent" />
                  <span className="relative text-4xl font-black text-[var(--accent)]">
                    {step.number}
                  </span>
                </div>

                <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-[var(--accent)]" />
                </div>

                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--foreground-muted)] leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== Stats Section =====
function StatsSection() {
  return (
    <section className="relative py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile: 2x2 grid, no container card */}
        <div className="md:hidden max-w-md mx-auto grid grid-cols-2 gap-3">
          {STATS.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        {/* Desktop: 4-column row inside a surfaced panel */}
        <div className="hidden md:block bg-[var(--bg-elevated)] rounded-[var(--radius-xl)] border border-[var(--border)] p-10 lg:p-12 relative overflow-hidden edge-highlight">
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-bl from-[var(--accent-soft)] via-transparent to-transparent opacity-60"
          />
          <div className="relative grid grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== Testimonials Section =====
function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-16 md:py-24 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow="نظرات کاربران"
          eyebrowIcon={Users}
          title="دانش‌آموزا"
          highlight="راضین"
          subtitle="ببین دیگران چه می‌گن درباره تجربه‌شون با روال"
        />

        {/* Mobile: horizontal snap-scroll carousel */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory flex gap-4 pb-4 custom-scrollbar">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.name}
              className="flex-shrink-0 w-[85%] snap-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-5 card-hover edge-highlight"
            >
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                ))}
              </div>
              <p className="text-sm text-[var(--foreground)] leading-relaxed mb-4">
                {testimonial.text}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-overlay)] flex items-center justify-center text-lg">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--foreground)]">{testimonial.name}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">{testimonial.grade}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: 3-column grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="hidden md:grid grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={fadeInUp}
              className="card-hover edge-highlight bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                ))}
              </div>
              <p className="text-sm text-[var(--foreground)] leading-relaxed mb-5">
                {testimonial.text}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-overlay)] flex items-center justify-center text-lg">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--foreground)]">{testimonial.name}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">{testimonial.grade}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ===== CTA Section =====
function CTASection() {
  const { setCurrentView } = useAppStore();

  return (
    <section className="relative py-12 md:py-24 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile: full-width gradient panel with full-width button */}
        <AnimatedSection className="md:hidden">
          <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-elevated)] border border-[var(--accent-soft)] p-6 edge-highlight">
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-bl from-[var(--accent-soft)] via-transparent to-transparent"
            />
            <div className="relative text-center">
              <h2 className="text-2xl font-black text-[var(--foreground)] mb-3 leading-tight">
                آماده‌ای مسیرت رو{' '}
                <span className="text-[var(--accent)]">شروع</span> کنی؟
              </h2>
              <p className="text-sm text-[var(--foreground-muted)] mb-6 leading-relaxed">
                همین الان ثبت‌نام کن و به هزاران دانش‌آموز دیگر بپیوند. روال رایگانه!
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCurrentView('onboarding')}
                className="btn-hover glow-hover w-full px-6 py-4 rounded-2xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-base min-h-[52px]"
              >
                شروع کن
              </motion.button>
              <div className="mt-5 flex items-center justify-center gap-4 text-xs text-[var(--foreground-muted)]">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>بدون کارت بانکی</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>شروع فوری</span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Desktop: large gradient panel */}
        <AnimatedSection className="hidden md:block">
          <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-elevated)] border border-[var(--accent-soft)] p-12 lg:p-16 edge-highlight">
            {/* Gradient background layer */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-bl from-[var(--accent-soft)] via-[var(--accent-soft)] to-transparent opacity-80"
            />
            <div
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-32 bg-[var(--accent-glow)] blur-[80px] opacity-50"
            />

            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-black text-[var(--foreground)] mb-4 leading-tight">
                آماده‌ای مسیرت رو{' '}
                <span className="bg-gradient-to-l from-[var(--accent-hover)] to-[var(--accent)] bg-clip-text text-transparent">
                  شروع
                </span>{' '}
                کنی؟
              </h2>
              <p className="text-base lg:text-lg text-[var(--foreground-muted)] mb-8 leading-relaxed">
                همین الان ثبت‌نام کن و به هزاران دانش‌آموز دیگر بپیوند. روال رایگانه!
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCurrentView('onboarding')}
                className="btn-hover glow-hover px-10 py-4 rounded-2xl bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-lg shadow-[0_8px_24px_-6px_var(--accent-glow)]"
              >
                شروع کن
              </motion.button>
              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-[var(--foreground-muted)]">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[var(--accent)]" />
                  <span>بدون نیاز به کارت بانکی</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[var(--accent)]" />
                  <span>شروع فوری</span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// ===== Footer =====
function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border)] py-10 md:py-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile: simplified footer */}
        <div className="md:hidden max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--accent)] flex items-center justify-center">
              <span className="text-[var(--bg-deep)] font-black text-sm">ر</span>
            </div>
            <span className="text-lg font-bold text-[var(--foreground)]">روال</span>
          </div>
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed text-center mb-6">
            مسیر مطالعه‌ات رو هموار کن. همراه هوشمند تو در مسیر کنکور.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <a href="#features" className="link-underline text-[var(--foreground-muted)]">
              ویژگی‌ها
            </a>
            <a href="#how-it-works" className="link-underline text-[var(--foreground-muted)]">
              نحوه کار
            </a>
            <a href="#testimonials" className="link-underline text-[var(--foreground-muted)]">
              نظرات
            </a>
          </div>
          <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
            <p className="text-xs text-[var(--foreground-subtle)]">
              © ۱۴۰۴ روال. تمامی حقوق محفوظ است.
            </p>
          </div>
        </div>

        {/* Desktop: rich grid footer */}
        <div className="hidden md:grid grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--accent)] flex items-center justify-center">
                <span className="text-[var(--bg-deep)] font-black text-sm">ر</span>
              </div>
              <span className="text-lg font-bold text-[var(--foreground)]">روال</span>
            </div>
            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
              مسیر مطالعه‌ات رو هموار کن. همراه هوشمند تو در مسیر کنکور.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)] mb-4">محصول</h4>
            <div className="space-y-2.5">
              {['ویژگی‌ها', 'قیمت‌گذاری', 'سوالات متداول', 'بروزرسانی‌ها'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="link-underline block text-sm text-[var(--foreground-muted)]"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)] mb-4">پشتیبانی</h4>
            <div className="space-y-2.5">
              {['تماس با ما', 'راهنمای استفاده', 'گزارش مشکل', 'پیشنهاد ویژگی'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="link-underline block text-sm text-[var(--foreground-muted)]"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)] mb-4">قانونی</h4>
            <div className="space-y-2.5">
              {['حریم خصوصی', 'شرایط استفاده', 'لایسنس'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="link-underline block text-sm text-[var(--foreground-muted)]"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:flex border-t border-[var(--border)] pt-8 items-center justify-between">
          <p className="text-xs text-[var(--foreground-subtle)]">
            © ۱۴۰۴ روال. تمامی حقوق محفوظ است.
          </p>
          <span className="text-xs text-[var(--foreground-subtle)]">
            ساخته شده برای دانش‌آموزان ایران
          </span>
        </div>
      </div>
    </footer>
  );
}

// ===== Main Landing Page Component =====
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--foreground)] overflow-x-hidden">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
