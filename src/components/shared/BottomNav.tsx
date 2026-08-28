'use client';

import { useAppStore } from '@/lib/store';
import { ViewName, UserRole } from '@/lib/types';
import {
  Home,
  Wrench,
  BarChart3,
  User,
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  Settings,
  Shield,
  ClipboardList,
  BookOpen,
  LogOut,
  History,
} from 'lucide-react';
import { motion } from 'framer-motion';

const STUDENT_NAV: { view: ViewName; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { view: 'dashboard', label: 'خانه', icon: Home },
  { view: 'plan', label: 'برنامه', icon: ClipboardList },
  { view: 'exam-history', label: 'آزمون‌ها', icon: History },
  { view: 'tools', label: 'ابزارها', icon: Wrench },
  { view: 'analytics', label: 'گزارش', icon: BarChart3 },
  { view: 'settings', label: 'پروفایل', icon: User },
];

const ADVISOR_NAV: { view: ViewName; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { view: 'advisor-dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { view: 'advisor-students', label: 'دانش‌آموزان', icon: Users },
  { view: 'advisor-settings', label: 'تنظیمات', icon: Settings },
];

const INSTITUTE_NAV: { view: ViewName; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { view: 'institute-dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { view: 'institute-advisors', label: 'مشاوران', icon: Users },
  { view: 'institute-students', label: 'دانش‌آموزان', icon: GraduationCap },
  { view: 'institute-settings', label: 'تنظیمات', icon: Settings },
];

const SUPER_ADMIN_NAV: { view: ViewName; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { view: 'sa-dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { view: 'sa-subjects', label: 'دروس', icon: BookOpen },
  { view: 'sa-institutes', label: 'موسسات', icon: Building2 },
  { view: 'sa-users', label: 'کاربران', icon: Users },
  { view: 'sa-settings', label: 'تنظیمات', icon: Settings },
];

export default function BottomNav() {
  const { currentView, navigateTo, userRole, logout } = useAppStore();

  const navItems =
    userRole === 'SUPER_ADMIN'
      ? SUPER_ADMIN_NAV
      : userRole === 'INSTITUTE_MANAGER'
        ? INSTITUTE_NAV
        : userRole === 'ADVISOR'
          ? ADVISOR_NAV
          : STUDENT_NAV;

  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const accentText = isSuperAdmin ? 'text-[var(--gold)]' : 'text-[var(--accent)]';
  const accentBg = isSuperAdmin ? 'bg-[var(--gold)]' : 'bg-[var(--accent)]';
  const accentSoftBg = isSuperAdmin ? 'bg-[var(--gold-soft)]' : 'bg-[var(--accent-soft)]';

  return (
    <nav
      className="mobile-only fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
      style={{
        backgroundColor: 'rgba(11, 12, 14, 0.82)',
        backdropFilter: 'blur(16px) saturate(120%)',
        WebkitBackdropFilter: 'blur(16px) saturate(120%)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-start overflow-x-auto px-2 no-scrollbar">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => navigateTo({ view: item.view })}
              className={`nav-item-hover relative flex min-h-[48px] min-w-[58px] flex-1 shrink-0 flex-col items-center justify-center gap-1 rounded-xl ${
                isActive ? accentText : 'text-[var(--foreground-subtle)]'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active pill background */}
              {isActive && (
                <motion.span
                  layoutId="bottomnav-active"
                  className={`absolute inset-x-1.5 top-0.5 bottom-0.5 rounded-xl ${accentSoftBg}`}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              {/* Active top dot */}
              {isActive && (
                <motion.span
                  layoutId="bottomnav-dot"
                  className={`absolute top-0.5 w-1 h-1 rounded-full ${accentBg}`}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                className={`relative w-[22px] h-[22px] transition-transform ${
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                }`}
              />
              <span
                className={`relative text-[10px] leading-none transition-all ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Logout button */}
        <button
          onClick={async () => {
            try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
            logout();
          }}
          className="nav-item-hover relative flex min-h-[48px] min-w-[58px] flex-1 shrink-0 flex-col items-center justify-center gap-1 rounded-xl text-red-400"
          aria-label="خروج"
        >
          <LogOut className="relative w-[22px] h-[22px]" />
          <span className="relative text-[10px] leading-none font-medium">خروج</span>
        </button>
      </div>
    </nav>
  );
}
