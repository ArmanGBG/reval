'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
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
  Play,
} from 'lucide-react';

// ===== Helper: Convert number to Persian digits =====
export function toPersianDigits(num: number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((d) => persianDigits[parseInt(d)] ?? d)
    .join('');
}

// ===== Animation Variants =====
export const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// ===== Section Wrapper with InView Animation =====
export function AnimatedSection({
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
export const FEATURES = [
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

export const STEPS = [
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

export const STATS = [
  { value: 12000, label: 'دانش‌آموز فعال', suffix: '+' },
  { value: 95, label: 'رضایت کاربران', suffix: '%' },
  { value: 40, label: 'افزایش بهره‌وری', suffix: '%' },
  { value: 500, label: 'ساعت مطالعه روزانه', suffix: '+' },
];

export const TESTIMONIALS = [
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
export function useCounter(end: number, duration = 2000, startOnView = true) {
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
export function StatCard({ stat }: { stat: { value: number; label: string; suffix: string } }) {
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
export function SectionHeading({
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
