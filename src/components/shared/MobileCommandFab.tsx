'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useCommandPaletteStore } from '@/hooks/use-command-palette';

// =================================================================
// MobileCommandFab
// A floating action button shown only on mobile (below md breakpoint)
// that opens the Command Palette. On desktop the sidebar already has a
// "جستجو یا دستور... Ctrl K" trigger, but mobile users have no keyboard
// and no sidebar, so we provide a tappable FAB.
//
// Hidden:
//  - On desktop (md+)
//  - On detail pages (advisor-student-detail, sa-institute-detail, sa-user-detail)
//  - When the palette is already open
//  - When the keyboard help dialog is open (rare, but avoids overlap)
// =================================================================

export default function MobileCommandFab() {
  const userRole = useAppStore((s) => s.userRole);
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const currentView = useAppStore((s) => s.currentView);
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);

  const isLoggedIn = onboardingComplete && userRole !== undefined;
  if (!isLoggedIn) return null;

  const isDetailPage =
    currentView === 'sa-institute-detail' ||
    currentView === 'sa-user-detail' ||
    currentView === 'advisor-student-detail';

  if (isDetailPage) return null;

  return (
    <AnimatePresence>
      {!open && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          onClick={() => setOpen(true)}
          aria-label="باز کردن پنل دستورات"
          className="md:hidden fixed bottom-20 left-4 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent)] text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4)] active:scale-95 transition-transform"
        >
          {/* Pulse ring */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-full animate-ping-slow opacity-30 bg-[var(--accent)]"
          />
          <Search className="relative w-5 h-5" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
