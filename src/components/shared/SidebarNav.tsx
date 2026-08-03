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
  Crown,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

// ===== Nav configs per role =====
const STUDENT_NAV: { view: ViewName; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { view: 'dashboard', label: 'خانه', icon: Home },
  { view: 'plan', label: 'برنامه من', icon: ClipboardList },
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
  { view: 'sa-institutes', label: 'موسسات', icon: Building2 },
  { view: 'sa-users', label: 'کاربران', icon: Users },
  { view: 'sa-settings', label: 'تنظیمات', icon: Settings },
];

const ROLE_LABEL: Record<UserRole, { label: string; sub: string }> = {
  STUDENT: { label: 'دانش‌آموز', sub: 'حساب شخصی' },
  ADVISOR: { label: 'مشاور', sub: 'پنل مدیریت' },
  INSTITUTE_MANAGER: { label: 'مدیر آموزشگاه', sub: 'پنل موسسه' },
  SUPER_ADMIN: { label: 'سوپر ادمین', sub: 'حالت God Mode' },
};

export default function SidebarNav() {
  const { currentView, setCurrentView, userRole, user } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);

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
  const roleInfo = ROLE_LABEL[userRole];

  return (
    <aside
      className={`desktop-only hidden md:flex fixed top-0 right-0 bottom-0 z-40 flex-col border-l border-[var(--border)] bg-[var(--bg-deep)] transition-[width] duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* ===== Brand / Logo ===== */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-[var(--border)]">
        <div
          className={`relative w-9 h-9 rounded-xl ${accentBg} flex items-center justify-center shadow-lg`}
          style={{
            boxShadow: `0 8px 20px -6px ${isSuperAdmin ? 'var(--gold-glow)' : 'var(--accent-glow)'}`,
          }}
        >
          {isSuperAdmin ? (
            <Crown className="w-5 h-5 text-zinc-950" />
          ) : (
            <span className="text-zinc-950 font-black text-base">ر</span>
          )}
          <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-[var(--foreground)]">روال</span>
            <span className={`text-[10px] font-medium ${accentText}`}>Reval</span>
          </div>
        )}
      </div>

      {/* ===== Role badge ===== */}
      {!collapsed && (
        <div className="px-3 pt-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${accentBg} animate-pulse`} />
              <span className="text-xs font-semibold text-[var(--foreground)]">
                {roleInfo.label}
              </span>
            </div>
            <span className="text-[10px] text-[var(--foreground-subtle)] mt-0.5 block">
              {roleInfo.sub}
            </span>
          </div>
        </div>
      )}

      {/* ===== Nav items ===== */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            const Icon = item.icon;
            return (
              <li key={item.view}>
                <button
                  onClick={() => setCurrentView(item.view)}
                  className={`nav-item-hover group relative w-full flex items-center gap-3 rounded-xl px-3 h-11 ${
                    isActive
                      ? `${accentSoftBg} ${accentText} font-semibold`
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Active indicator bar (right side in RTL) */}
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full ${accentBg}`}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? '' : 'opacity-80'}`} />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ===== User footer ===== */}
      <div className="border-t border-[var(--border)] p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--bg-elevated)] nav-item-hover cursor-pointer">
            <div className={`w-9 h-9 rounded-full ${accentSoftBg} flex items-center justify-center text-sm font-bold ${accentText}`}>
              {user?.avatar || '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[var(--foreground)] truncate">
                {user?.name || 'کاربر روال'}
              </div>
              <div className="text-[10px] text-[var(--foreground-subtle)] truncate">
                {user?.phone || 'ورود موفق'}
              </div>
            </div>
          </div>
        ) : (
          <div className={`w-9 h-9 mx-auto rounded-full ${accentSoftBg} flex items-center justify-center text-sm font-bold ${accentText}`}>
            {user?.avatar || '👤'}
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="nav-item-hover mt-2 w-full flex items-center justify-center gap-2 rounded-lg h-8 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] text-[11px]"
        >
          {collapsed ? '«' : '» فشرده'}
        </button>
      </div>
    </aside>
  );
}
