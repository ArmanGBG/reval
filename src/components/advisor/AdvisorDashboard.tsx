'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Shield } from 'lucide-react';
import { AdvisorDashboardHome } from './AdvisorDashboardHome';
import { AdvisorStudentsList } from './AdvisorStudentsList';
import { AdvisorStudentDetail } from './AdvisorStudentDetail';
import { AdvisorSettings } from './AdvisorSettings';

// ===== Main Advisor Panel (router) =====
export default function AdvisorPanel() {
  const { currentView } = useAppStore();

  return (
    <div className="space-y-5 md:space-y-8" dir="rtl">
      {/* Mobile sticky glass header (glassmorphism allowed here per design rules) */}
      <header className="md:hidden sticky top-0 z-30 -mx-4 px-4 py-3 bg-[rgba(10,10,13,0.75)] backdrop-blur-xl border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-[var(--accent)] leading-tight">پنل مشاور</h1>
            <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">مدیریت و تحلیل دانش‌آموزان</p>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[var(--accent-soft)] border border-[var(--border)]">
            <Shield className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-[11px] font-medium text-[var(--accent)]">مشاور</span>
          </div>
        </div>
      </header>

      {/* Desktop simple header (no glass) */}
      <header className="hidden md:flex items-center justify-between border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] leading-tight">پنل مشاور</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">مدیریت و تحلیل دانش‌آموزان</p>
        </div>
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[var(--accent-soft)] border border-[var(--border)]">
          <Shield className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-xs font-medium text-[var(--accent)]">مشاور تحصیلی</span>
        </div>
      </header>

      {/* Content with AnimatePresence transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {currentView === 'advisor-dashboard' && <AdvisorDashboardHome />}
          {currentView === 'advisor-students' && <AdvisorStudentsList />}
          {currentView === 'advisor-student-detail' && <AdvisorStudentDetail />}
          {currentView === 'advisor-settings' && <AdvisorSettings />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
