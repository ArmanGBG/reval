"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  Shield,
  Network,
  Quote,
  Star,
  BadgeCheck,
  Building2,
  GraduationCap,
  Landmark,
  Brain,
  BookOpen,
  Target,
  Award,
  ChevronLeft,
} from "lucide-react";
import { LogoMark } from "./logo";
import { AnimatedCounter } from "./animated-counter";
import { ParallaxGrid } from "./parallax-grid";

const easeOut = [0.16, 1, 0.3, 1] as const;

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.75, ease: easeOut, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** AnimatedCounter that replays when scrolled into view */
function ReplayCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2,
  className,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: "-50px" });
  const [count, setCount] = React.useState(0);
  const prevInView = React.useRef(false);

  React.useEffect(() => {
    if (!inView) return;
    // Reset counter when coming into view again
    if (inView && !prevInView.current) {
      setCount(0);
    }
    prevInView.current = inView;

    let startTime: number | null = null;
    let raf: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {prefix}{count}{suffix}
    </motion.span>
  );
}

const TESTIMONIALS = [
  {
    img: "/testimonials/p1.png",
    name: "نگار محمدی",
    role: "دانش‌آموز کنکوری",
    quote:
      "قبل از روال، روزها بدون جهت می‌گذشتند. حالا هر صبح دقیقاً می‌دانم اولین کاری که باید انجام دهم چیست.",
    fullQuote:
      "قبل از روال، روزها بدون جهت می‌گذشتند. حالا هر صبح دقیقاً می‌دانم اولین کاری که باید انجام دهم چیست. رادار دانش‌آموز به من نشان می‌دهد کجا قوی‌ترم و کجا باید بیشتر تمرین کنم. این دید ۳۶۰ درجه‌ای واقعاً تغییرآفرین است.",
  },
  {
    img: "/testimonials/p2.png",
    name: "سینا رحیمی",
    role: "دانش‌آموز",
    quote:
      "فلش‌کارت‌های روال، مرور را از یک زحمت خسته‌کننده به یک عادت لذت‌بخش تبدیل کرد.",
    fullQuote:
      "فلش‌کارت‌های روال، مرور را از یک زحمت خسته‌کننده به یک عادت لذت‌بخش تبدیل کرد. سیستم تکرار فاصله‌دار هوشمند، مطالبی که نزدیک فراموشی هستند را در بهترین زمان یادآوری می‌کند.",
  },
  {
    img: "/testimonials/p3.png",
    name: "دکتر سحر کریمی",
    role: "مشاور تحصیلی",
    quote:
      "رادار دانش‌آموز باعث شد قبل از افت نمره مداخله کنم. این سطح از دید برای من بی‌سابقه است.",
    fullQuote:
      "رادار دانش‌آموز باعث شد قبل از افت نمره مداخله کنم. این سطح از دید برای من بی‌سابقه است. الان می‌توانم برای هر دانش‌آموز برنامه اختصاصی بسازم و پیشرفتشان را به‌صورت آنی پیگیری کنم.",
  },
  {
    img: "/testimonials/p4.png",
    name: "مهندس امیر طاهری",
    role: "مدیر موسسه",
    quote:
      "برنامه‌ساز با درگ اند دراپ، زمان چیدمان برنامه هفتگی را به یک‌سوم کاهش داد.",
    fullQuote:
      "برنامه‌ساز با درگ اند دراپ، زمان چیدمان برنامه هفتگی را به یک‌سوم کاهش داد. گزارش‌های سفارشی و تحلیل داده‌های سازمانی به ما کمک کرد تا تصمیم‌گیری‌های بهتری داشته باشیم.",
  },
];

/* ============ Trust logos with icons ============ */
const TRUST_LOGOS = [
  { name: "موسسه گیلان", icon: Building2 },
  { name: "آکادمی نور", icon: Brain },
  { name: "کانون استادان", icon: GraduationCap },
  { name: "هوشمند آموزش", icon: BookOpen },
  { name: "مرکز پارس", icon: Target },
  { name: "موسسه آینده", icon: Award },
  { name: "آموزشگاه پارسیان", icon: Landmark },
  { name: "موسسه طلایی", icon: Building2 },
];

/* ============ Secure Network visual ============ */
function NetworkVisual() {
  const nodes = [
    { angle: 0, dist: 38, label: "M" },
    { angle: 60, dist: 44, label: "M" },
    { angle: 120, dist: 40, label: "M" },
    { angle: 180, dist: 38, label: "M" },
    { angle: 240, dist: 44, label: "M" },
    { angle: 300, dist: 40, label: "M" },
  ];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      {/* Ambient glow behind network */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] w-[80%] rounded-full bg-mint/[0.06] blur-[60px]" />

      {/* rings */}
      <div className="absolute inset-[8%] rounded-full border border-border/40" />
      <div className="absolute inset-[22%] rounded-full border border-border/30" />
      <div className="absolute inset-[36%] rounded-full border border-border/20" />

      {/* Pulse wave from center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="size-16 rounded-full border border-mint/20 sm:size-20"
          animate={{
            scale: [1, 4],
            opacity: [0.4, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="size-16 rounded-full border border-mint/15 sm:size-20"
          animate={{
            scale: [1, 4],
            opacity: [0.3, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeOut",
            delay: 1.5,
          }}
        />
      </div>

      {/* connecting lines with traveling data packets */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        {nodes.map((n, i) => {
          const x = 50 + Math.cos((n.angle * Math.PI) / 180) * n.dist;
          const y = 50 + Math.sin((n.angle * Math.PI) / 180) * n.dist;
          return (
            <React.Fragment key={i}>
              <line
                x1="50"
                y1="50"
                x2={x}
                y2={y}
                stroke="var(--mint)"
                strokeWidth="0.3"
                strokeOpacity="0.25"
                strokeDasharray="1 1.5"
              />
              {/* Traveling data packet */}
              <motion.circle
                r="0.8"
                fill="var(--mint)"
                fillOpacity={0.7}
                animate={{
                  cx: [50, x],
                  cy: [50, y],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 2 + (i % 2),
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.4,
                }}
              />
            </React.Fragment>
          );
        })}
      </svg>

      {/* mentor nodes */}
      {nodes.map((n, i) => {
        const x = 50 + Math.cos((n.angle * Math.PI) / 180) * n.dist;
        const y = 50 + Math.sin((n.angle * Math.PI) / 180) * n.dist;
        return (
          <motion.div
            key={i}
            className="absolute flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-mint/15 bg-mint/[0.06] text-xs font-bold text-mint shadow-lg backdrop-blur-sm sm:size-12"
            style={{ left: `${x}%`, top: `${y}%` }}
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          >
            <LogoMark size={18} />
          </motion.div>
        );
      })}

      {/* center node — rotating dashed border */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="relative flex size-16 items-center justify-center rounded-2xl border border-mint/30 bg-mint/[0.12] text-mint glow-mint sm:size-20"
          animate={{
            boxShadow: [
              "0 0 0 0 color-mix(in oklch, var(--mint) 30%, transparent)",
              "0 0 0 16px color-mix(in oklch, var(--mint) 0%, transparent)",
              "0 0 0 0 color-mix(in oklch, var(--mint) 0%, transparent)",
            ],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        >
          {/* Rotating dashed border ring */}
          <motion.svg
            className="absolute inset-[-6px] h-[calc(100%+12px)] w-[calc(100%+12px)]"
            viewBox="0 0 80 80"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <rect
              x="2"
              y="2"
              width="76"
              height="76"
              rx="16"
              fill="none"
              stroke="var(--mint)"
              strokeWidth="0.5"
              strokeDasharray="4 6"
              strokeOpacity="0.25"
            />
          </motion.svg>
          <LogoMark size={32} />
        </motion.div>
      </div>
    </div>
  );
}

/* ============ Shimmer star rating ============ */
function ShimmerStars() {
  return (
    <div className="relative mt-auto flex items-center gap-1 text-mint">
      {Array.from({ length: 5 }).map((_, s) => (
        <motion.span
          key={s}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: s * 0.15,
          }}
        >
          <Star className="size-3 fill-current" />
        </motion.span>
      ))}
    </div>
  );
}

/* ============ Testimonial Card with Flip ============ */
function TestimonialCard({
  testimonial,
  delay,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
  delay: number;
}) {
  const [isFlipped, setIsFlipped] = React.useState(false);

  return (
    <Reveal delay={delay}>
      <div
        className="group relative h-[340px] sm:h-[360px]"
        style={{ perspective: "1000px" }}
        onMouseEnter={() => setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front face */}
          <motion.figure
            whileHover={{ y: -4 }}
            className="surface surface-hover group relative flex h-full flex-col overflow-hidden rounded-2xl p-6"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Gradient border on hover */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl border border-mint/0 transition-all duration-500 group-hover:border-mint/30 group-hover:shadow-[inset_0_0_20px_-10px_var(--mint)]"
            />
            <Quote className="size-6 text-mint/30 transition-transform duration-300 group-hover:rotate-12" />
            <blockquote className="mt-4 flex-1 text-pretty text-sm leading-[1.9] text-foreground/85">
              {testimonial.quote}
            </blockquote>
            <ShimmerStars />
            <figcaption className="mt-5 flex items-center gap-3 border-t border-border/40 pt-5">
              <div className="relative size-11 overflow-hidden rounded-full ring-1 ring-border/60">
                <Image
                  src={testimonial.img}
                  alt={testimonial.name}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {testimonial.name}
                  </span>
                  <BadgeCheck className="size-3.5 shrink-0 text-mint" />
                </div>
                <div className="truncate text-[11px] text-muted-foreground/70">
                  {testimonial.role}
                </div>
              </div>
            </figcaption>
          </motion.figure>

          {/* Back face — full review */}
          <div
            className="surface glow-mint absolute inset-0 flex flex-col overflow-hidden rounded-2xl p-6"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Quote className="size-5 text-mint/50" />
              <span className="text-sm font-bold text-mint">نظر کامل</span>
            </div>
            <blockquote className="flex-1 text-pretty text-sm leading-[1.95] text-foreground/85">
              {testimonial.fullQuote}
            </blockquote>
            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
              <div className="flex items-center gap-2">
                <div className="relative size-9 overflow-hidden rounded-full ring-1 ring-border/60">
                  <Image
                    src={testimonial.img}
                    alt={testimonial.name}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {testimonial.name}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/50">
                برای برگشت هاور کنید
              </span>
            </div>
          </div>
        </motion.div>

        {/* "Read more" link on non-flipped state (visible only on mobile where hover doesn't work) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 sm:hidden">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="inline-flex items-center gap-1 text-[10px] text-mint/70"
          >
            {isFlipped ? "بستن" : "بیشتر"}
            <ChevronLeft className="size-3" />
          </button>
        </div>
      </div>
    </Reveal>
  );
}

export function SocialProof() {
  return (
    <section id="team" className="relative py-28 sm:py-36">
      <ParallaxGrid strength={100} opacity={0.25} />
      {/* Ambient glow behind section */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[50rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/[0.03] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Part 1: Secure Network */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div>
              <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
                <Shield className="size-3.5" />
                شبکه امن روال
              </span>
              <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
                متصل به بهترین{" "}
                <span className="text-gradient-mint animated-gradient-underline">مشاوران</span> کشور
              </h2>
              <p className="mt-5 text-pretty leading-[1.9] text-muted-foreground/80">
                روال فقط یک نرم‌افزار نیست؛ یک شبکه امن و دست‌چین‌شده از مشاوران
                برتر است. هر دانش‌آموز به فردی متصل می‌شود که واقعاً می‌فهمد مسیر
                او چیست.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { num: 250, prefix: "+", suffix: "", l: "مشاور برتر" },
                  {
                    num: 98,
                    prefix: "",
                    suffix: "٪",
                    l: "رضایت دانش‌آموزان",
                  },
                  { num: 24, prefix: "", suffix: "/۷", l: "پشتیبانی امن" },
                ].map((s) => (
                  <motion.div
                    key={s.l}
                    whileHover={{ y: -6, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="group relative rounded-2xl border border-border/40 bg-card/30 p-5 text-center transition-all duration-300 hover:border-mint/30 hover:bg-card/50 hover:shadow-[0_0_20px_-6px_var(--mint)]"
                  >
                    <div className="nums text-2xl font-extrabold text-mint drop-shadow-[0_0_10px_var(--mint)]">
                      <ReplayCounter
                        target={s.num}
                        prefix={s.prefix}
                        suffix={s.suffix}
                        duration={2}
                      />
                    </div>
                    <div className="mt-1.5 text-[11px] text-muted-foreground/70">
                      {s.l}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <NetworkVisual />
          </Reveal>
        </div>

        {/* divider */}
        <div className="my-24 h-px w-full bg-gradient-to-l from-transparent via-border to-transparent" />

        {/* Part 2: Testimonials */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <Network className="size-3.5" />
            صدای کاربران
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            کسانی که روال را{" "}
            <span className="text-gradient-mint animated-gradient-underline">تجربه کردند</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard
              key={t.name}
              testimonial={t}
              delay={i * 0.08}
            />
          ))}
        </div>

        {/* logos / trust marquee — styled logo cards with hover scale */}
        <Reveal className="mt-16">
          <div className="text-center text-xs text-muted-foreground/60">
            مورد اعتماد موسسات و مدرسان برتر
          </div>
          <div className="relative mt-6 overflow-hidden mask-fade-x">
            <div className="flex w-max marquee-track items-center opacity-40">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex items-center">
                  {TRUST_LOGOS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <React.Fragment key={item.name + dup}>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-border/30 bg-card/20 px-4 py-2 text-sm font-bold text-muted-foreground transition-transform duration-300 hover:scale-110 hover:border-mint/20">
                          <Icon className="size-4 text-mint/50" />
                          {item.name}
                        </span>
                        {idx < TRUST_LOGOS.length - 1 && (
                          <span className="mx-4 h-4 w-px bg-border/40" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
