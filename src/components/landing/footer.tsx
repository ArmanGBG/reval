"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const easeOut = [0.16, 1, 0.3, 1] as const;

export function Footer() {
  const footerRef = React.useRef<HTMLElement>(null);
  const footerInView = useInView(footerRef, { once: true, margin: "-60px" });

  return (
    <footer
      ref={footerRef}
      className="relative mt-auto border-t border-border/60 bg-background"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-border/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 pt-10 pb-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={footerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: easeOut }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <Logo size={26} />
          <p className="text-xs text-muted-foreground/60">
            © <span className="nums">۱۴۰۵</span> روال — تمام حقوق محفوظ است.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
