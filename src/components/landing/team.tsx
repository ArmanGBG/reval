"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

const easeOut = [0.16, 1, 0.3, 1] as const;

const TEAM = [
  {
    name: "احمدرضا صمیمی",
    role: "CEO & Co-Founder",
    bio: "دانشجوی پزشکی دانشگاه علوم پزشکی تهران",
    avatar: null, // Will use initials
  },
  {
    name: "آرمان قره‌باغی",
    role: "CTO & Co-Founder",
    bio: "دانشجوی دندانپزشکی دانشگاه علوم پزشکی ارومیه",
    avatar: null,
  },
  {
    name: "مهدی رحیمی",
    role: "CMO & Co-Founder",
    bio: "دانشجوی پزشکی دانشگاه علوم پزشکی تهران",
    avatar: null,
  },
];

function getInitials(name: string) {
  // For Persian names, take the first letter of each word
  return name
    .split(" ")
    .map((w) => w[0])
    .join("");
}

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
      className="group relative flex flex-col items-center rounded-2xl border border-border/40 bg-surface p-8 text-center transition-all duration-300 hover:border-border/70 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)]"
    >
      {/* Avatar with initials */}
      <div className="relative mb-5 flex size-20 items-center justify-center rounded-full border-2 border-mint/20 bg-gradient-to-br from-mint/10 to-mint/[0.03]">
        <span className="font-yekan text-xl font-extrabold text-mint">
          {getInitials(member.name)}
        </span>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full border border-mint/10 animate-ping opacity-20 [animation-duration:3s]" />
      </div>

      {/* Name */}
      <h3 className="font-yekan text-lg font-extrabold leading-tight text-foreground">
        {member.name}
      </h3>

      {/* Role badge */}
      <span className="mt-2 inline-block rounded-full border border-mint/15 bg-mint/[0.05] px-3 py-1 text-[11px] font-semibold tracking-wide text-mint">
        {member.role}
      </span>

      {/* Bio */}
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground/70">
        {member.bio}
      </p>
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
          <h2 className="text-balance text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            تیم ما تک‌تک <span className="text-gradient-mint">چالش‌های فعلی</span> شمارو در مسیر کنکور تجربه کرده…
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
