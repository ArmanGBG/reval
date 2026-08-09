"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

const easeOut = [0.16, 1, 0.3, 1] as const;

const TEAM = [
  {
    name: "احمدرضا صمیمی",
    role: "هم‌بنیان‌گذار و مدیرعامل",
    details: [
      "دانشجوی پزشکی دانشگاه علوم پزشکی تهران",
      "مدال برنز المپیاد زیست‌شناسی دوره ۲۴",
      "میکروسکوپ تیم در تصمیم‌گیری‌ها! اون قدر واسه هر کاری عمیق تحقیق میکنه که محاله چیزی در روال سطحی پیش بره؛ خیالتون راحت، مو را از ماست میکشه بیرون!",
    ],
    image: "/our team/ahmadreza.webp",
  },
  {
    name: "آرمان قره‌باغی",
    role: "هم‌بنیان‌گذار و مدیر فنی",
    details: [
      "دانشجوی دندانپزشکی دانشگاه علوم پزشکی ارومیه",
      "دیپلم افتخار المپیاد کارآفرینی وزارت بهداشت دوره ۱۵",
      "مغز متفکر کدهای سایت ;) بچه‌های دانشگاه صداش میکنن آرمان جی‌پی‌تی! براتون کلی اپدیت باحال درنظر گرفته...",
    ],
    image: "/our team/arman-v2.webp",
  },
  {
    name: "مهدی رحیمی",
    role: "هم‌بنیان‌گذار و مدیر مارکتینگ",
    details: [
      "دانشجوی پزشکی دانشگاه علوم پزشکی تهران",
      "رتبه ۱۱۳ کنکور تجربی",
      "با این‌که تو بیوش نوشته «یه مهدی ساده»، اما تو ارتباط گرفتن با شماها یه نابغس! همون Simply Mehdi معروف که اینجا قراره صدای شما در تیم ما باشه!",
    ],
    image: "/our team/mehdi.webp",
  },
];

function TeamCard({
  member,
  index,
}: {
  member: (typeof TEAM)[number];
  index: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: easeOut }}
      className="group flex flex-col items-center rounded-2xl border border-border/40 bg-surface p-6 text-center transition-all duration-300 hover:border-border/70 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)]"
    >
      <div className="relative mb-5 flex size-28 items-center justify-center overflow-hidden rounded-full border-2 border-mint/20 bg-background/40">
        <Image
          src={member.image}
          alt={member.name}
          width={112}
          height={112}
          priority={index === 0}
          className="object-cover"
        />
      </div>

      <h3 className="font-yekan text-lg font-extrabold leading-tight text-foreground">
        {member.name}
      </h3>

      <span className="mt-2 inline-block rounded-full border border-mint/15 bg-mint/[0.05] px-3 py-1 text-[11px] font-semibold tracking-wide text-mint">
        {member.role}
      </span>

      <ul className="mt-4 w-full space-y-2 text-right text-sm leading-relaxed text-muted-foreground/70">
        {member.details.map((detail) => (
          <li key={detail} className="flex items-start gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-mint" />
            <span>
              {detail.split("روال").map((part, index, parts) => (
                <React.Fragment key={`${detail}-${index}`}>
                  {part}
                  {index < parts.length - 1 && <span className="text-gradient-mint">روال</span>}
                </React.Fragment>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function Team() {
  const headerRef = React.useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <section id="team" className="relative py-20 sm:py-28 lg:py-36">
      {/* Subtle top divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      <div className="mx-auto max-w-4xl px-5 sm:px-8 lg:px-12">
        {/* Section header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: easeOut }}
          className="mb-14 text-center sm:mb-18"
        >
          <span className="mb-4 inline-block rounded-full border border-mint/20 bg-mint/[0.06] px-4 py-1.5 text-xs font-semibold text-mint">
            تیم ما
          </span>
          <h2 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            ما هم یک روز از جایگاه فعلی شما شروع کردیم...
            <br />
            تک‌تک استرس‌ها، بی‌خوابی‌ها و چالش‌های مسیر کنکور را تجربه کردیم و حالا اینجاییم تا این مسیر رو برای شما هموار کنیم…
          </h2>
        </motion.div>

        {/* Team cards */}
        <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
          {TEAM.map((member, i) => (
            <TeamCard key={i} member={member} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
