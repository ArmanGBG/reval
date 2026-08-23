"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Send } from "lucide-react";

const easeOut = [0.16, 1, 0.3, 1] as const;
const TELEGRAM_HANDLE = process.env.NEXT_PUBLIC_ADVISOR_TELEGRAM_HANDLE || "reval_support";

const TEAM = [
  {
    name: "احمدرضا صمیمی",
    role: "هم‌بنیان‌گذار و مدیرعامل",
    details: [
      "فارغ‌التحصیل سمپاد",
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
      "فارغ‌التحصیل سمپاد",
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
      "فارغ‌التحصیل سمپاد",
      "دانشجوی پزشکی دانشگاه علوم پزشکی تهران",
      "رتبه ۱۱۳ کنکور تجربی",
      "با این‌که تو بیوش نوشته «یه مهدی ساده»، اما تو ارتباط گرفتن با شماها یه نابغه‌ست! همون Simply Mehdi معروف که اینجا قراره صدای شما در تیم ما باشه!",
    ],
    image: "/our team/mehdi.webp",
  },
];

function TeamMember({ member, index }: { member: (typeof TEAM)[number]; index: number }) {
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

export function Team() {
  const headerRef = React.useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  return (
    <section id="team" className="relative py-20 sm:py-28 lg:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="mb-20 flex flex-col items-start justify-between gap-6 border-y border-mint/20 bg-mint/[0.045] px-5 py-8 sm:flex-row sm:items-center sm:px-8">
          <div className="text-right">
            <p className="text-xs font-bold text-mint">همکاری با روال</p>
            <h2 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">مشاور هستید؟ تماس بگیرید</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">برای همکاری و آشنایی با پنل مشاوران، مستقیم در تلگرام پیام بدهید.</p>
          </div>
          <a
            href={`https://t.me/${TELEGRAM_HANDLE}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-mint px-5 text-sm font-semibold text-[#06120c] transition-all hover:brightness-110 focus-ring-mint"
          >
            <Send className="size-4" aria-hidden="true" />
            @{TELEGRAM_HANDLE}
          </a>
        </div>

        <motion.div
          ref={headerRef}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reduceMotion ? 0.12 : 0.6, ease: easeOut }}
          className="mb-12 max-w-2xl text-right"
        >
          <span className="text-xs font-bold text-mint">بنیان‌گذاران روال</span>
          <h2 className="mt-3 text-balance text-3xl font-black leading-tight text-foreground sm:text-5xl">ما هم یک روز از جایگاه فعلی شما شروع کردیم...</h2>
          <p className="mt-4 text-sm leading-8 text-muted-foreground">تک‌تک استرس‌ها، بی‌خوابی‌ها و چالش‌های مسیر کنکور را تجربه کردیم و حالا اینجاییم تا این مسیر را برای شما هموار کنیم.</p>
        </motion.div>

        <div className="grid gap-10 sm:grid-cols-3 sm:gap-6">
          {TEAM.map((member, index) => <TeamMember key={member.name} member={member} index={index} />)}
        </div>
      </div>
    </section>
  );
}
