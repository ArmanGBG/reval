"use client";

import { motion } from "framer-motion";

const paths = [
  "M-80 180 C 140 20, 310 320, 560 150 S 940 20, 1280 210 S 1600 320, 1820 100",
  "M-120 520 C 120 350, 360 630, 650 430 S 1080 300, 1380 530 S 1640 620, 1880 410",
  "M40 790 C 260 610, 500 850, 780 680 S 1230 560, 1510 760 S 1740 820, 1900 690",
] as const;

export function FloatingLines() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <motion.svg
        viewBox="0 0 1800 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full opacity-100 motion-reduce:opacity-50"
        animate={{ x: [0, 12, -8, 0], y: [0, -8, 6, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id="floating-line-mint" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--mint)" stopOpacity="0" />
            <stop offset="25%" stopColor="var(--mint)" stopOpacity="0.44" />
            <stop offset="60%" stopColor="var(--mint-bright)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--mint)" stopOpacity="0" />
          </linearGradient>
          <filter id="floating-line-glow" x="-30%" y="-100%" width="160%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {paths.map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke="url(#floating-line-mint)"
            strokeWidth={index === 1 ? 1.35 : 0.95}
            strokeLinecap="round"
            filter="url(#floating-line-glow)"
            initial={{ pathLength: 0.15, pathOffset: 0, opacity: 0 }}
            animate={{ pathLength: [0.2, 0.55, 0.2], pathOffset: [0, 0.45, 0.8], opacity: [0.35, 0.8, 0.35] }}
            transition={{ duration: 14 + index * 3, repeat: Infinity, ease: "easeInOut", delay: index * 1.8 }}
          />
        ))}

        <motion.circle
          r="2.4"
          fill="var(--mint-bright)"
          filter="url(#floating-line-glow)"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          style={{ offsetPath: `path('${paths[0]}')` }}
        />
        <motion.circle
          r="1.8"
          fill="var(--mint)"
          filter="url(#floating-line-glow)"
          initial={{ offsetDistance: "15%" }}
          animate={{ offsetDistance: "115%" }}
          transition={{ duration: 21, repeat: Infinity, ease: "linear", delay: 2 }}
          style={{ offsetPath: `path('${paths[1]}')` }}
        />
      </motion.svg>
    </div>
  );
}
