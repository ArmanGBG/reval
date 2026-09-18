"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// ===== Team Page (dedicated view within `/` route) =====
// Reached by clicking "داستانِ ما رو بشنو" CTA in the 4-box "Team" section
// on the main landing, OR by clicking the "تیم ما" nav item in the Header.
// Shows the team intro text + 3 team member cards (moved here from the old
// inline Team section on the main landing page).
//
// Layout (top-to-bottom):
//   1. Top bar with "بازگشت به لندینگ" back button (calls onBack)
//   2. Team intro — multi-paragraph essay about why روال was built, ending
//      with "در ادامه، با بچه‌های تیمی آشنا می‌شی..."
//   3. Team member cards — 3 cards (احمدرضا / آرمان / مهدی) with photo,
//      role, and bullet-point bio.
const easeOut = [0.16, 1, 0.3, 1] as const;

const TEAM = [
  {
    name: "احمدرضا صمیمی",
    role: "هم‌بنیان‌گذار و مدیرعامل",
    details: [
      "دانشجوی پزشکی دانشگاه علوم پزشکی تهران",
      "مدال برنز المپیاد زیست‌شناسی دوره ۲۴",
      "رتبه ۱۲ علوم پایه پزشکی",
      "میکروسکوپ تیم در تصمیم‌گیری‌ها! اون‌قدر واسه هر کاری عمیق تحقیق می‌کنه که محاله چیزی در روال سطحی پیش بره؛ خیالتون راحت، مو را از ماست می‌کشه بیرون!",
    ],
    image: "/our team/ahmadreza.webp",
  },
  {
    name: "آرمان قره‌باغی",
    role: "هم‌بنیان‌گذار و مدیر فنی",
    details: [
      "دانشجوی دندانپزشکی دانشگاه علوم پزشکی ارومیه",
      "دیپلم افتخار المپیاد کارآفرینی وزارت بهداشت دوره ۱۵",
      "مغز متفکر کدهای سایت؛ بچه‌های دانشگاه صداش می‌کنن آرمان جی‌پی‌تی! براتون کلی آپدیت باحال در نظر گرفته...",
    ],
    image: "/our team/arman-v2.webp",
  },
  {
    name: "مهدی رحیمی",
    role: "هم‌بنیان‌گذار و مدیر مارکتینگ",
    details: [
      "دانشجوی پزشکی دانشگاه علوم پزشکی تهران",
      "رتبه ۱۱۳ کنکور تجربی",
      "با این‌که تو بیوش نوشته «یه مهدی ساده»، اما تو ارتباط گرفتن با شماها یه نابغه‌ست! همون Simply Mehdi معروف که اینجا قراره صدای شما در تیم ما باشه!",
    ],
    image: "/our team/mehdi.webp",
  },
];

// Intro paragraphs. Short "heading-style" lines are rendered in a slightly
// bolder foreground color; body paragraphs are muted. The last line is a
// transition into the team member cards below.
const INTRO_PARAGRAPHS: { text: string; kind: "heading" | "body" | "transition" }[] = [
  { text: "ما هم دقیقاً همین مسیر رو رفتیم.", kind: "heading" },
  {
    text: "روزهایی که زیر بارِ برنامه‌های سنگین، گزارش‌کارهای خشک و استرسِ عقب موندن کلافه می‌شدیم. همه‌مون این مسیرِ پرفشار رو با تمام وجود حس کردیم و دیدیم که چطور رقابت‌های ناسالم و ابزارهای آموزشی، به جای کمک کردن، فقط دارن به اضطرابِ بچه‌ها اضافه می‌کنن. جای یک فضای آروم که بدون قضاوت بهمون بگه کجای کاریم، واقعاً خالی بود.",
    kind: "body",
  },
  { text: "رِوال از دلِ همین خستگی‌ها متولد شد.", kind: "heading" },
  {
    text: "ما تصمیم گرفتیم به جای غر زدن، دست به کار بشیم. با ترکیبِ تجربه‌های واقعی‌مون در آموزش، روان‌شناسی و برنامه‌نویسی، خواستیم پلتفرمی بسازیم که به جای افزایش استرس، دستت رو بگیره. جایی که بتونی تو یه محیطِ مینیمال، فقط و فقط روی رشدِ خودت تمرکز کنی.",
    kind: "body",
  },
  { text: "مسیرِ ما تازه شروع شده...", kind: "heading" },
  {
    text: "ما ادعا نمی‌کنیم بی‌نقصیم، اما به شدت تشنه‌ی بهتر شدنیم. هر روز تلاش می‌کنیم، یاد می‌گیریم و رِوال رو آپدیت می‌کنیم تا ابزاری بسازیم که واقعاً به دردت بخوره. هدف ما اینه که عذاب‌وجدانِ و استرس رو از بین ببریم تا بتونی با خیالِ راحت، مسیرت رو بندازی روی روال.",
    kind: "body",
  },
  {
    text: "در ادامه، با بچه‌های تیمی آشنا می‌شی که دارن این مسیر رو می‌سازن:",
    kind: "transition",
  },
];

export function TeamPage({ onBack }: { onBack: () => void }) {
  const introRef = React.useRef<HTMLDivElement>(null);
  const introInView = useInView(introRef, { once: true, margin: "-60px" });
  const membersRef = React.useRef<HTMLDivElement>(null);
  const membersInView = useInView(membersRef, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  // Scroll to top on mount (same fix as AdvisorsPage — prevents the browser
  // from preserving the previous scroll position when switching views).
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-clip bg-background font-yekan">
      {/* ===== Top bar (back button) — pt-20 clears the fixed Header ===== */}
      <div className="mx-auto w-full max-w-5xl px-5 pt-20 pb-4 sm:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border/60 bg-card/30 px-4 text-xs font-medium text-muted-foreground transition-colors hover:border-mint/40 hover:text-foreground"
        >
          <ArrowRight className="size-3.5 flip-rtl" aria-hidden="true" />
          بازگشت به لندینگ
        </button>
      </div>

      {/* ===== Team intro ===== */}
      <section className="relative overflow-hidden pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <motion.div
            ref={introRef}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={introInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: reduceMotion ? 0.12 : 0.6, ease: easeOut }}
            className="mx-auto max-w-3xl text-right"
          >
            <span className="text-xs font-bold text-mint">معرفی تیم</span>
            <h2 className="mt-3 text-balance text-3xl font-black leading-tight text-foreground sm:text-5xl">
              ما کی هستیم؟
            </h2>
            <div className="mt-8 space-y-5">
              {INTRO_PARAGRAPHS.map((p, i) => (
                <p
                  key={i}
                  className={
                    p.kind === "heading"
                      ? "text-base font-bold leading-8 text-foreground sm:text-lg sm:leading-9"
                      : p.kind === "transition"
                        ? "text-sm font-medium leading-8 text-foreground/80 italic sm:text-base sm:leading-9"
                        : "text-sm font-normal leading-8 text-muted-foreground sm:text-base sm:leading-9"
                  }
                >
                  {p.text}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== Team member cards ===== */}
      <section className="relative overflow-hidden border-t border-border/50 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <motion.div
            ref={membersRef}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={membersInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: reduceMotion ? 0.12 : 0.6, ease: easeOut }}
          >
            <div className="grid gap-10 sm:grid-cols-3 sm:gap-6">
              {TEAM.map((member, index) => (
                <TeamMemberCard key={member.name} member={member} index={index} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// ===== Team member card (moved from the old team.tsx) =====
function TeamMemberCard({
  member,
  index,
}: {
  member: { name: string; role: string; details: string[]; image: string };
  index: number;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      ref={ref}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: reduceMotion ? 0.12 : 0.55, delay: reduceMotion ? 0 : index * 0.08, ease: easeOut }}
      className="group border-t border-white/[0.09] pt-5"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-white/[0.03]">
        <Image
          src={member.image}
          alt={member.name}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover grayscale-[0.15] transition-transform duration-500 group-hover:scale-[1.025]"
        />
      </div>
      <div className="pt-5 text-right">
        <p className="text-[11px] font-bold text-mint">{member.role}</p>
        <h3 className="mt-2 text-xl font-black text-foreground">{member.name}</h3>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
          {member.details.map((detail) => (
            <li key={detail} className="flex items-start gap-2">
              <span className="mt-3 size-1.5 shrink-0 rounded-full bg-mint" aria-hidden="true" />
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}
