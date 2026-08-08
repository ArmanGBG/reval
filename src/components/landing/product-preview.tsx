"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  LayoutDashboard,
  Brain,
  Radar,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  Circle,
  Sparkles,
  BookOpen,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParallaxGrid } from "./parallax-grid";

const easeOut = [0.16, 1, 0.3, 1] as const;

/* ───────── Reveal wrapper ───────── */
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
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: easeOut, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ───────── Navigation items ───────── */
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "داشبورد", id: "dashboard" },
  { icon: Brain, label: "فلش‌کارت", id: "flashcards" },
  { icon: Radar, label: "رادار", id: "radar" },
  { icon: CalendarDays, label: "برنامه", id: "schedule" },
  { icon: BarChart3, label: "آمار", id: "stats" },
] as const;

type ViewId = "dashboard" | "flashcards" | "radar";

/* ───────── Task items ───────── */
const TASKS = [
  { text: "مرور فصل ۳ فیزیک", done: true },
  { text: "۱۵ فلش‌کارت شیمی", done: true },
  { text: "تمرین ریاضی — حد و پیوستگی", done: false },
  { text: "خلاصه زیست — ژنتیک", done: false },
] as const;

/* ───────── Chart bars data ───────── */
const CHART_BARS = [65, 40, 80, 55, 90, 45, 72, 60, 85, 50, 78, 92] as const;

/* ───────── 3D Tilt Card ───────── */
function TiltFrame({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), {
    stiffness: 200,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), {
    stiffness: 200,
    damping: 30,
  });

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px);
    y.set(py);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1200,
      }}
      className="relative"
    >
      {children}
    </motion.div>
  );
}

/* ───────── Sidebar ───────── */
function Sidebar({
  activeView,
  onViewChange,
}: {
  activeView: ViewId;
  onViewChange: (v: ViewId) => void;
}) {
  return (
    <div className="flex h-full w-[180px] shrink-0 flex-col border-l border-white/[0.06] bg-[oklch(0.14_0.005_264)] p-4">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-mint/20">
          <Sparkles className="size-4 text-mint" />
        </div>
        <span className="text-sm font-bold tracking-tight">روال</span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            (activeView === "dashboard" && item.id === "dashboard") ||
            (activeView === "flashcards" && item.id === "flashcards") ||
            (activeView === "radar" && item.id === "radar");
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "dashboard" || item.id === "flashcards" || item.id === "radar") {
                  onViewChange(item.id as ViewId);
                }
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11px] font-medium transition-all duration-200",
                isActive
                  ? "bg-mint/10 text-mint"
                  : "text-muted-foreground/60 hover:bg-white/[0.04] hover:text-foreground/80"
              )}
            >
              <Icon className="size-3.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom user area */}
      <div className="mt-auto flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2.5">
        <div className="flex size-7 items-center justify-center rounded-full bg-mint/20 text-[10px] font-bold text-mint">
          آ
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold leading-tight">آرمان</span>
          <span className="text-[9px] leading-tight text-muted-foreground/50">پیشرفته</span>
        </div>
      </div>
    </div>
  );
}

/* ───────── Dashboard View ───────── */
function DashboardView() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-5">
      {/* Greeting */}
      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-l from-mint/[0.06] to-transparent p-4">
        <p className="text-sm font-bold">
          سلام، آرمان! 👋
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          بیا امروز رو عالی شروع کنیم
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "کار امروز", value: "۱۲", icon: Target, color: "mint" },
          { label: "نرخ انطباق", value: "۸۷٪", icon: Zap, color: "mint-bright" },
          { label: "روز متوالی", value: "۵", icon: BookOpen, color: "chart-4" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <div className="mb-2 flex size-7 items-center justify-center rounded-lg bg-mint/[0.08]">
                <Icon className="size-3.5 text-mint" />
              </div>
              <p className="nums text-lg font-extrabold leading-none text-foreground">{stat.value}</p>
              <p className="mt-1 text-[10px] text-muted-foreground/60">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold">پیشرفت هفتگی</p>
          <span className="nums text-[10px] text-mint">+۱۲٪</span>
        </div>
        <svg
          viewBox="0 0 340 80"
          className="w-full"
          preserveAspectRatio="none"
        >
          {CHART_BARS.map((h, i) => {
            const barW = 340 / CHART_BARS.length;
            const gap = 4;
            return (
              <rect
                key={i}
                x={i * barW + gap / 2}
                y={80 - (h / 100) * 72}
                width={barW - gap}
                height={(h / 100) * 72}
                rx={3}
                fill={h > 75 ? "oklch(0.78 0.11 158 / 0.7)" : "oklch(1 0 0 / 10%)"}
              />
            );
          })}
        </svg>
      </div>

      {/* Task list */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="mb-3 text-[11px] font-semibold">وظایف امروز</p>
        <ul className="flex flex-col gap-2.5">
          {TASKS.map((task, i) => (
            <li key={i} className="flex items-center gap-2.5">
              {task.done ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-mint" />
              ) : (
                <Circle className="size-3.5 shrink-0 text-muted-foreground/30" />
              )}
              <span
                className={cn(
                  "text-[11px]",
                  task.done
                    ? "text-muted-foreground/50 line-through"
                    : "text-foreground/80"
                )}
              >
                {task.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ───────── Flashcards View ───────── */
function FlashcardsView() {
  const CARDS = [
    { subject: "فیزیک", topic: "قوانین نیوتون", count: "۲۴", progress: 78 },
    { subject: "شیمی", topic: "پیوند شیمیایی", count: "۱۸", progress: 55 },
    { subject: "ریاضی", topic: "حد و پیوستگی", count: "۳۲", progress: 90 },
    { subject: "زیست", topic: "ژنتیک مولکولی", count: "۲۱", progress: 42 },
  ] as const;

  return (
    <div className="flex flex-1 flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">فلش‌کارت</p>
        <span className="rounded-md bg-mint/10 px-2 py-0.5 text-[10px] font-medium text-mint">
          ۹۵ کارت فعال
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {CARDS.map((card) => (
          <div
            key={card.topic}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-mint">{card.subject}</span>
              <span className="nums text-[9px] text-muted-foreground/50">{card.count} کارت</span>
            </div>
            <p className="text-[11px] font-medium leading-snug">{card.topic}</p>
            {/* Progress bar */}
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-mint/60"
                style={{ width: `${card.progress}%` }}
              />
            </div>
            <p className="nums mt-1 text-[9px] text-muted-foreground/50">{card.progress}٪ تکمیل</p>
          </div>
        ))}
      </div>
      {/* Stacked card visual */}
      <div className="relative mx-auto mt-2 h-32 w-52">
        <div className="absolute inset-0 rotate-3 rounded-2xl border border-white/[0.04] bg-white/[0.02]" />
        <div className="absolute inset-0 -rotate-2 rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-mint/20 bg-gradient-to-b from-mint/[0.06] to-transparent">
          <Brain className="mb-2 size-6 text-mint" />
          <p className="text-xs font-bold">آماده مرور؟</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/60">شروع جلسه فلش‌کارت</p>
        </div>
      </div>
    </div>
  );
}

/* ───────── Radar View ───────── */
function RadarView() {
  const SKILLS = [
    { name: "فیزیک", pct: 82 },
    { name: "شیمی", pct: 65 },
    { name: "ریاضی", pct: 90 },
    { name: "زیست", pct: 70 },
    { name: "زبان", pct: 55 },
  ] as const;

  /* SVG radar chart - pentagon */
  const cx = 100;
  const cy = 100;
  const r = 75;
  const n = SKILLS.length;

  function polarToCart(angle: number, radius: number) {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  const angleStep = 360 / n;
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-1 flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">رادار مهارت</p>
        <span className="rounded-md bg-mint/10 px-2 py-0.5 text-[10px] font-medium text-mint">
          به‌روزرسانی خودکار
        </span>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* SVG Radar */}
        <svg viewBox="0 0 200 200" className="w-48 shrink-0 sm:w-56">
          {/* Grid lines */}
          {gridLevels.map((level) => {
            const pts = SKILLS.map((_, i) => {
              const p = polarToCart(i * angleStep, r * level);
              return `${p.x},${p.y}`;
            });
            return (
              <polygon
                key={level}
                points={pts.join(" ")}
                fill="none"
                stroke="oklch(1 0 0 / 8%)"
                strokeWidth={1}
              />
            );
          })}
          {/* Axes */}
          {SKILLS.map((_, i) => {
            const p = polarToCart(i * angleStep, r);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke="oklch(1 0 0 / 6%)"
                strokeWidth={1}
              />
            );
          })}
          {/* Data polygon */}
          {(() => {
            const pts = SKILLS.map((s, i) => {
              const p = polarToCart(i * angleStep, r * (s.pct / 100));
              return `${p.x},${p.y}`;
            });
            return (
              <polygon
                points={pts.join(" ")}
                fill="oklch(0.78 0.11 158 / 0.15)"
                stroke="oklch(0.78 0.11 158 / 0.6)"
                strokeWidth={1.5}
              />
            );
          })()}
          {/* Data dots & labels */}
          {SKILLS.map((s, i) => {
            const p = polarToCart(i * angleStep, r * (s.pct / 100));
            const lp = polarToCart(i * angleStep, r + 18);
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={3} fill="oklch(0.78 0.11 158 / 0.8)" />
                <text
                  x={lp.x}
                  y={lp.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="oklch(0.62 0.01 264)"
                  fontSize={9}
                  fontFamily="Yekan Bakh, sans-serif"
                >
                  {s.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Skill list */}
        <div className="flex flex-1 flex-col gap-2.5">
          {SKILLS.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <span className="w-12 text-[10px] font-medium text-muted-foreground/70">
                {s.name}
              </span>
              <div className="flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-2 rounded-full bg-mint/50"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <span className="nums w-8 text-right text-[10px] font-semibold text-foreground/80">
                {s.pct}٪
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── Floating Decorations ───────── */
function FloatingDecorations() {
  return (
    <>
      {/* Gradient orbs */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-20 top-1/4 size-40 rounded-full bg-mint/[0.06] blur-[60px]"
      />
      <motion.div
        animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="pointer-events-none absolute -right-16 bottom-1/3 size-48 rounded-full bg-mint-bright/[0.04] blur-[70px]"
      />
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="pointer-events-none absolute left-1/3 -top-10 size-32 rounded-full bg-chart-4/[0.05] blur-[50px]"
      />

      {/* Small dots */}
      {[
        { x: "-left-3", y: "top-[30%]", delay: 0 },
        { x: "-right-5", y: "top-[20%]", delay: 1.5 },
        { x: "left-[15%]", y: "-bottom-2", delay: 3 },
        { x: "right-[20%]", y: "-top-3", delay: 0.8 },
        { x: "-left-6", y: "bottom-[15%]", delay: 2.2 },
      ].map((dot, i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.3, 1] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: dot.delay,
          }}
          className={cn(
            "pointer-events-none absolute size-1.5 rounded-full bg-mint/40",
            dot.x,
            dot.y
          )}
        />
      ))}
    </>
  );
}

/* ═══════════════ Main Component ═══════════════ */
export function ProductPreview() {
  const [activeView, setActiveView] = React.useState<ViewId>("dashboard");

  return (
    <section
      id="product-preview"
      className="scroll-mt-24 relative overflow-hidden py-24 sm:py-32"
    >
      <ParallaxGrid />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* ─── Header ─── */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-mint/20 bg-mint/[0.08] px-4 py-1.5 text-[11px] font-medium text-mint backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-mint shadow-[0_0_8px_var(--mint)]" />
            نمایش محصول
          </span>
          <h2 className="text-balance text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl">
            روال،{" "}
            <span className="text-gradient-mint">نزدیک‌تر</span>
            {" "}از همیشه
          </h2>
          <p className="mt-5 text-pretty text-base leading-[1.9] text-muted-foreground/80">
            داشبوردی که با هوش مصنوعی تنظیم می‌شه؛ هر لحظه برنامه‌ات رو بهینه می‌کنه و
            دقیقاً همون‌جا که نیاز داری، راهنماییت می‌کنه.
          </p>
        </Reveal>

        {/* ─── Device Frame ─── */}
        <Reveal delay={0.15}>
          <TiltFrame>
            <div className="relative mx-auto mt-14 max-w-3xl">
              {/* Decorations behind frame */}
              <FloatingDecorations />

              {/* The device frame itself */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl",
                  "surface glow-border-hover corner-sparkle"
                )}
              >
                {/* Top bar (window chrome) */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[oklch(0.12_0.005_264)] px-4 py-2.5">
                  {/* Traffic lights */}
                  <span className="size-2.5 rounded-full bg-[oklch(0.55_0.15_25)]" />
                  <span className="size-2.5 rounded-full bg-[oklch(0.72_0.14_85)]" />
                  <span className="size-2.5 rounded-full bg-mint/40" />
                  {/* Center title */}
                  <span className="mx-auto text-[10px] font-medium text-muted-foreground/40">
                    app.reval.ir
                  </span>
                </div>

                {/* Dashboard body */}
                <div
                  className="flex min-h-[420px] flex-row-reverse"
                  style={{ direction: "rtl" }}
                >
                  {/* Sidebar */}
                  <Sidebar
                    activeView={activeView}
                    onViewChange={setActiveView}
                  />

                  {/* Main content */}
                  <div className="relative flex-1 overflow-hidden bg-[oklch(0.135_0.005_264)]">
                    <motion.div
                      key={activeView}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, ease: easeOut }}
                      className="h-full"
                    >
                      {activeView === "dashboard" && <DashboardView />}
                      {activeView === "flashcards" && <FlashcardsView />}
                      {activeView === "radar" && <RadarView />}
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Reflection/shine line */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-mint/20 to-transparent" />
              </div>
            </div>
          </TiltFrame>
        </Reveal>

        {/* ─── View switcher buttons (below mockup) ─── */}
        <Reveal delay={0.3}>
          <div className="mx-auto mt-8 flex justify-center gap-3">
            {([
              { id: "dashboard" as ViewId, label: "داشبورد", icon: LayoutDashboard },
              { id: "flashcards" as ViewId, label: "فلش‌کارت", icon: Brain },
              { id: "radar" as ViewId, label: "رادار", icon: Radar },
            ]).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveView(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium transition-all duration-300",
                    isActive
                      ? "bg-mint/15 text-mint shadow-[0_0_16px_var(--mint)/0.15] border border-mint/25"
                      : "border border-white/[0.06] text-muted-foreground/60 hover:text-foreground/80 hover:border-white/[0.1]"
                  )}
                >
                  <Icon className="size-3.5" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
