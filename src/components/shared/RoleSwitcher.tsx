'use client';

import { useAppStore } from '@/lib/store';
import { UserRole } from '@/lib/types';
import { motion } from 'framer-motion';
import { User, GraduationCap, Building2, Shield, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const ROLES: { role: UserRole; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { role: 'STUDENT', label: 'دانش‌آموز', icon: GraduationCap },
  { role: 'ADVISOR', label: 'مشاور', icon: User },
  { role: 'INSTITUTE_MANAGER', label: 'مدیر آموزشگاه', icon: Building2 },
  { role: 'SUPER_ADMIN', label: 'سوپر ادمین', icon: Shield },
];

export default function RoleSwitcher() {
  const { userRole, setUserRole } = useAppStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = ROLES.find((r) => r.role === userRole);
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const CurrentIcon = current?.icon || GraduationCap;

  return (
    <div
      ref={ref}
      className="fixed top-3 left-3 z-[100] flex items-center gap-2"
    >
      {/* Dropdown trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`group flex items-center gap-2 h-9 pl-2 pr-3 rounded-full border btn-hover ${
          isSuperAdmin
            ? 'bg-[var(--gold-soft)] border-[var(--gold)]/30 text-[var(--gold)]'
            : 'bg-[var(--bg-elevated)] border-[var(--border-strong)] text-[var(--foreground)]'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`flex items-center justify-center w-5 h-5 rounded-full ${
            isSuperAdmin ? 'bg-[var(--gold)] text-zinc-950' : 'bg-[var(--accent)] text-zinc-950'
          }`}
        >
          <CurrentIcon className="w-3 h-3" />
        </span>
        <span className="text-xs font-semibold">{current?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* DEV badge */}
      <div className="bg-amber-500/15 border border-amber-500/30 rounded-full px-2 h-6 flex items-center">
        <span className="text-[9px] text-amber-400 font-bold tracking-wider">DEV</span>
      </div>

      {/* Dropdown menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-12 left-0 w-52 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-overlay)] p-1.5 shadow-2xl"
          style={{ boxShadow: '0 20px 50px -12px rgba(0,0,0,0.7)' }}
          role="listbox"
        >
          <div className="px-2 py-1.5">
            <span className="text-[10px] font-semibold text-[var(--foreground-subtle)] uppercase tracking-wider">
              تغییر نقش
            </span>
          </div>
          {ROLES.map(({ role, label, icon: Icon }) => {
            const active = role === userRole;
            const isSA = role === 'SUPER_ADMIN';
            return (
              <button
                key={role}
                onClick={() => {
                  setUserRole(role);
                  setOpen(false);
                }}
                className={`nav-item-hover w-full flex items-center gap-3 h-10 px-2.5 rounded-xl text-right ${
                  active
                    ? isSA
                      ? 'bg-[var(--gold-soft)] text-[var(--gold)]'
                      : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                }`}
                role="option"
                aria-selected={active}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    active
                      ? isSA
                        ? 'bg-[var(--gold)] text-zinc-950'
                        : 'bg-[var(--accent)] text-zinc-950'
                      : 'bg-white/5 text-[var(--foreground-muted)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="flex-1 text-xs font-semibold">{label}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
