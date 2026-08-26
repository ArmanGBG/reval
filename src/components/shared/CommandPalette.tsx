'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command as CommandPrimitive } from 'cmdk';
import {
  Home,
  CalendarDays,
  Wrench,
  BarChart3,
  Settings,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  ClipboardList,
  Plus,
  Brain,
  Calculator,
  Download,
  LogOut,
  Moon,
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  HelpCircle,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useCommandPaletteStore } from '@/hooks/use-command-palette';
import { useKeyboardHelpStore } from '@/hooks/use-keyboard-shortcuts';
import { toast } from 'sonner';
import type { ViewName, UserRole } from '@/lib/types';
import { toPersianDigits } from '@/lib/persian-date';

// =================================================================
// CommandPalette
// A spotlight-style command palette triggered by Ctrl/Cmd+K.
// Role-aware: shows different commands for students, advisors,
// institute managers, and super admins.
// Uses cmdk's built-in fuzzy search.
// =================================================================

interface Command {
  id: string;
  label: string;
  /** Persian subtitle / hint shown under the label. */
  hint?: string;
  /** Keywords used for search but not displayed. */
  keywords?: string;
  icon: LucideIcon;
  /** Visual accent: 'accent' | 'gold' | 'pink' | 'cyan' */
  accent?: 'accent' | 'gold' | 'pink' | 'cyan' | 'violet';
  shortcut?: string[];
  section: 'navigate' | 'tools' | 'actions' | 'account';
  /** Run when the user selects this command. */
  run: () => void;
}

const ACCENT_COLORS: Record<
  NonNullable<Command['accent']>,
  { text: string; bg: string; ring: string }
> = {
  accent: {
    text: 'text-[var(--accent-hover)]',
    bg: 'bg-[var(--accent-soft)]',
    ring: 'group-data-[selected=true]:shadow-[0_0_0_1px_var(--border-strong)]',
  },
  gold: {
    text: 'text-[var(--accent)]',
    bg: 'bg-[var(--accent-soft)]',
    ring: 'group-data-[selected=true]:shadow-[0_0_0_1px_var(--border-strong)]',
  },
  pink: {
    text: 'text-[var(--accent)]',
    bg: 'bg-[var(--accent-soft)]',
    ring: 'group-data-[selected=true]:shadow-[0_0_0_1px_var(--border-strong)]',
  },
  cyan: {
    text: 'text-[var(--accent)]',
    bg: 'bg-[var(--accent-soft)]',
    ring: 'group-data-[selected=true]:shadow-[0_0_0_1px_var(--border-strong)]',
  },
  violet: {
    text: 'text-[var(--accent)]',
    bg: 'bg-[var(--accent-soft)]',
    ring: 'group-data-[selected=true]:shadow-[0_0_0_1px_var(--border-strong)]',
  },
};

// =================================================================
// Role-aware command builders
// =================================================================

function buildCommands(args: {
  role: UserRole;
  navigateTo: (target: { view: ViewName; currentTool?: string | null }) => void;
  setCurrentTool: (t: string | null) => void;
  closePalette: () => void;
  openHelp: () => void;
  logout: () => void;
  exportData: () => void;
}): Command[] {
  const { role, navigateTo, setCurrentTool, closePalette, openHelp, logout, exportData } = args;

  const go = (view: ViewName) => {
    navigateTo({ view });
    closePalette();
  };

  const openTool = (tool: string) => {
    navigateTo({ view: 'tools', currentTool: tool });
    setCurrentTool(tool);
    closePalette();
  };

  const cmds: Command[] = [];

  // ----- Navigation (role-aware) -----
  if (role === 'STUDENT') {
    cmds.push(
      {
        id: 'nav-dashboard',
        label: 'خانه',
        hint: 'داشبورد اصلی',
        keywords: 'خانه dashboard home',
        icon: Home,
        accent: 'accent',
        shortcut: ['۱'],
        section: 'navigate',
        run: () => go('dashboard'),
      },
      {
        id: 'nav-plan',
        label: 'برنامه من',
        hint: 'برنامه‌ریزی هفتگی',
        keywords: 'برنامه plan schedule',
        icon: CalendarDays,
        accent: 'gold',
        shortcut: ['۲'],
        section: 'navigate',
        run: () => go('plan'),
      },
      {
        id: 'nav-tools',
        label: 'ابزارها',
        hint: 'ابزارهای مطالعه',
        keywords: 'ابزار tools',
        icon: Wrench,
        accent: 'cyan',
        shortcut: ['۳'],
        section: 'navigate',
        run: () => go('tools'),
      },
      {
        id: 'nav-analytics',
        label: 'گزارش',
        hint: 'گزارش‌های مطالعه',
        keywords: 'گزارش analytics report',
        icon: BarChart3,
        accent: 'violet',
        shortcut: ['۴'],
        section: 'navigate',
        run: () => go('analytics'),
      },
      {
        id: 'nav-settings',
        label: 'پروفایل',
        hint: 'تنظیمات حساب',
        keywords: 'پروفایل settings profile',
        icon: Settings,
        accent: 'pink',
        shortcut: ['۵'],
        section: 'navigate',
        run: () => go('settings'),
      },
    );
  } else if (role === 'ADVISOR') {
    cmds.push(
      {
        id: 'nav-advisor-dashboard',
        label: 'داشبورد مشاور',
        hint: 'نمای کلی',
        keywords: 'dashboard مشاور',
        icon: Home,
        accent: 'accent',
        section: 'navigate',
        run: () => go('advisor-dashboard'),
      },
      {
        id: 'nav-advisor-students',
        label: 'دانش‌آموزان',
        hint: 'لیست دانش‌آموزان',
        keywords: 'students دانشآموز',
        icon: Users,
        accent: 'gold',
        section: 'navigate',
        run: () => go('advisor-students'),
      },
      {
        id: 'nav-advisor-settings',
        label: 'تنظیمات',
        hint: 'تنظیمات مشاور',
        keywords: 'settings',
        icon: Settings,
        accent: 'pink',
        section: 'navigate',
        run: () => go('advisor-settings'),
      },
    );
  } else if (role === 'INSTITUTE_MANAGER') {
    cmds.push(
      {
        id: 'nav-inst-dashboard',
        label: 'داشبورد آموزشگاه',
        hint: 'نمای کلی',
        keywords: 'dashboard آموزشگاه',
        icon: Home,
        accent: 'accent',
        section: 'navigate',
        run: () => go('institute-dashboard'),
      },
      {
        id: 'nav-inst-advisors',
        label: 'مشاوران',
        hint: 'مدیریت مشاوران',
        keywords: 'advisors مشاور',
        icon: GraduationCap,
        accent: 'gold',
        section: 'navigate',
        run: () => go('institute-advisors'),
      },
      {
        id: 'nav-inst-students',
        label: 'دانش‌آموزان',
        hint: 'مدیریت دانش‌آموزان',
        keywords: 'students دانشآموز',
        icon: Users,
        accent: 'cyan',
        section: 'navigate',
        run: () => go('institute-students'),
      },
      {
        id: 'nav-inst-settings',
        label: 'تنظیمات',
        hint: 'تنظیمات آموزشگاه',
        keywords: 'settings',
        icon: Settings,
        accent: 'pink',
        section: 'navigate',
        run: () => go('institute-settings'),
      },
    );
  } else if (role === 'SUPER_ADMIN') {
    cmds.push(
      {
        id: 'nav-sa-dashboard',
        label: 'داشبورد اصلی',
        hint: 'گزارش‌های پلتفرم',
        keywords: 'dashboard super admin',
        icon: Home,
        accent: 'accent',
        section: 'navigate',
        run: () => go('sa-dashboard'),
      },
      {
        id: 'nav-sa-subjects',
        label: 'مدیریت دروس',
        hint: 'دروس و برنامه درسی',
        keywords: 'subjects دروس',
        icon: BookOpen,
        accent: 'gold',
        section: 'navigate',
        run: () => go('sa-subjects'),
      },
      {
        id: 'nav-sa-institutes',
        label: 'آموزشگاه‌ها',
        hint: 'مدیریت آموزشگاه‌ها',
        keywords: 'institutes آموزشگاه',
        icon: Building2,
        accent: 'cyan',
        section: 'navigate',
        run: () => go('sa-institutes'),
      },
      {
        id: 'nav-sa-users',
        label: 'کاربران',
        hint: 'مدیریت کاربران',
        keywords: 'users کاربران',
        icon: Users,
        accent: 'violet',
        section: 'navigate',
        run: () => go('sa-users'),
      },
      {
        id: 'nav-sa-settings',
        label: 'تنظیمات',
        hint: 'تنظیمات سیستم',
        keywords: 'settings',
        icon: Settings,
        accent: 'pink',
        section: 'navigate',
        run: () => go('sa-settings'),
      },
    );
  }

  // ----- Tools (student-only) -----
  if (role === 'STUDENT') {
    cmds.push(
      {
        id: 'tool-flashcards',
        label: 'فلشکارت',
        hint: 'مرور فلشکارت‌ها',
        keywords: 'flashcards فلشکارت',
        icon: Brain,
        accent: 'gold',
        section: 'tools',
        run: () => openTool('flashcards'),
      },
      {
        id: 'tool-grade',
        label: 'محاسبه‌گر درصد',
        hint: 'محاسبه درصد کنکور',
        keywords: 'grade calculator percent کنکور',
        icon: Calculator,
        accent: 'violet',
        section: 'tools',
        run: () => openTool('calculator'),
      },
    );
  }

  // ----- Actions -----
  cmds.push({
    id: 'action-help',
    label: 'نمایش میانبرهای کیبورد',
    hint: 'راهنمای میانبرها',
    keywords: 'help keyboard shortcuts میانبر',
    icon: HelpCircle,
    accent: 'cyan',
    shortcut: ['?'],
    section: 'actions',
    run: () => {
      closePalette();
      openHelp();
    },
  });

  if (role === 'STUDENT') {
    cmds.push({
      id: 'action-export',
      label: 'خروجی داده‌ها',
      hint: 'دانلود CSV/JSON',
      keywords: 'export download csv json خروجی',
      icon: Download,
      accent: 'gold',
      section: 'actions',
      run: () => {
        closePalette();
        exportData();
      },
    });
  }

  // ----- Account -----
  cmds.push({
    id: 'account-logout',
    label: 'خروج از حساب',
    hint: 'log out',
    keywords: 'logout sign out خروج',
    icon: LogOut,
    accent: 'pink',
    section: 'account',
    run: () => {
      closePalette();
      logout();
    },
  });

  return cmds;
}

// =================================================================
// Section labels (Persian)
// =================================================================
const SECTION_LABELS: Record<Command['section'], string> = {
  navigate: 'مسیریابی',
  tools: 'ابزارها',
  actions: 'اقدامات',
  account: 'حساب کاربری',
};

const SECTION_ORDER: Command['section'][] = [
  'navigate',
  'tools',
  'actions',
  'account',
];

// =================================================================
// Component
// =================================================================
export default function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const recent = useCommandPaletteStore((s) => s.recent);
  const pushRecent = useCommandPaletteStore((s) => s.pushRecent);

  const role = useAppStore((s) => s.userRole);
  const navigateTo = useAppStore((s) => s.navigateTo);
  const setCurrentTool = useAppStore((s) => s.setCurrentTool);
  const setHelpOpen = useKeyboardHelpStore((s) => s.setHelpOpen);

  const [search, setSearch] = React.useState('');

  // Reset search when palette opens/closes
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setSearch(''), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  const closePalette = React.useCallback(() => setOpen(false), [setOpen]);

  const logout = React.useCallback(() => {
    // Call the API to clear the httpOnly cookie, then reset Zustand store.
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      useAppStore.getState().logout();
    });
  }, []);

  const exportData = React.useCallback(() => {
    // Trigger the export — handled by a global event listener in AnalyticsView.
    window.dispatchEvent(new CustomEvent('reval-export-data'));
  }, []);

  const commands = React.useMemo(
    () =>
      buildCommands({
        role,
        navigateTo,
        setCurrentTool,
        closePalette,
        openHelp: () => setHelpOpen(true),
        logout,
        exportData,
      }),
    [
      role,
      navigateTo,
      setCurrentTool,
      closePalette,
      setHelpOpen,
      logout,
      exportData,
    ],
  );

  // Build a lookup for recent commands
  const cmdById = React.useMemo(() => {
    const m = new Map<string, Command>();
    commands.forEach((c) => m.set(c.id, c));
    return m;
  }, [commands]);

  const recentCmds = React.useMemo(
    () =>
      recent
        .map((id) => cmdById.get(id))
        .filter((c): c is Command => Boolean(c)),
    [recent, cmdById],
  );

  const runCommand = React.useCallback(
    (cmd: Command) => {
      pushRecent(cmd.id);
      cmd.run();
    },
    [pushRecent],
  );

  // Group commands by section, preserving build order
  const grouped = React.useMemo(() => {
    const g: Record<Command['section'], Command[]> = {
      navigate: [],
      tools: [],
      actions: [],
      account: [],
    };
    commands.forEach((c) => g[c.section].push(c));
    return g;
  }, [commands]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)]/95 backdrop-blur-xl shadow-2xl"
            style={{
              boxShadow:
                '0 24px 64px -12px rgba(0,0,0,0.6), 0 0 0 1px var(--border-strong)',
            }}
          >
            <CommandPrimitive
              className="flex flex-col"
              loop
              shouldFilter
              // cmdk filters by label + keywords; we also want the hint searchable
              filter={(value, search) => {
                const v = value.toLowerCase();
                const s = search.toLowerCase();
                if (v.includes(s)) return 1;
                return 0;
              }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 border-b border-[var(--border-strong)]">
                <Search className="w-4 h-4 text-[var(--foreground-muted)] shrink-0" />
                <CommandPrimitive.Input
                  autoFocus
                  value={search}
                  onValueChange={setSearch}
                  placeholder="جستجو یا تایپ دستور..."
                  className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none py-4"
                />
                <kbd
                  dir="ltr"
                  className="hidden sm:inline-flex items-center justify-center h-6 px-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface-glass)] text-[10px] font-mono text-[var(--foreground-muted)]"
                >
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <CommandPrimitive.List className="max-h-[52vh] overflow-y-auto overflow-x-hidden py-2 custom-scrollbar">
                <CommandPrimitive.Empty>
                  <div className="px-6 py-10 text-center">
                    <div className="text-3xl mb-2">🔍</div>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      نتیجه‌ای پیدا نشد
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1 opacity-70">
                      عبارت دیگری را امتحان کنید
                    </p>
                  </div>
                </CommandPrimitive.Empty>

                {/* Recent group (only when no search) */}
                {!search && recentCmds.length > 0 && (
                  <CommandPrimitive.Group
                    heading="اخیر"
                    className="mb-1"
                  >
                    {recentCmds.map((cmd) => (
                      <CommandRow
                        key={`recent-${cmd.id}`}
                        cmd={cmd}
                        onRun={runCommand}
                      />
                    ))}
                  </CommandPrimitive.Group>
                )}

                {/* Section groups */}
                {SECTION_ORDER.map((section) => {
                  const items = grouped[section];
                  if (items.length === 0) return null;
                  return (
                    <CommandPrimitive.Group
                      key={section}
                      heading={SECTION_LABELS[section]}
                      className="mb-1"
                    >
                      {items.map((cmd) => (
                        <CommandRow
                          key={cmd.id}
                          cmd={cmd}
                          onRun={runCommand}
                        />
                      ))}
                    </CommandPrimitive.Group>
                  );
                })}

                {/* Footer hint */}
                {!search && (
                  <div className="px-3 pt-2 pb-1 mt-1 border-t border-[var(--border-strong)]">
                    <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-[10px] text-[var(--foreground-muted)]">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        میانبرها فعال است
                      </span>
                      <span className="flex items-center gap-2" dir="ltr">
                        <span className="flex items-center gap-1">
                          <ArrowUp className="w-3 h-3" />
                          <ArrowDown className="w-3 h-3" />
                          انتخاب
                        </span>
                        <span className="flex items-center gap-1">
                          <CornerDownLeft className="w-3 h-3" />
                          اجرا
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </CommandPrimitive.List>
            </CommandPrimitive>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =================================================================
// CommandRow — a single command item
// =================================================================
function CommandRow({
  cmd,
  onRun,
}: {
  cmd: Command;
  onRun: (cmd: Command) => void;
}) {
  const accent = cmd.accent ?? 'accent';
  const colors = ACCENT_COLORS[accent];
  const Icon = cmd.icon;

  return (
    <CommandPrimitive.Item
      value={`${cmd.label} ${cmd.hint ?? ''} ${cmd.keywords ?? ''}`}
      onSelect={() => onRun(cmd)}
      className="group relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg cursor-pointer outline-none data-[selected=true]:bg-[var(--surface-glass)] transition-colors"
    >
      {/* Icon */}
      <span
        className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${colors.bg} ${colors.text} transition-transform group-data-[selected=true]:scale-110`}
      >
        <Icon className="w-4 h-4" />
      </span>

      {/* Text */}
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-sm font-medium text-[var(--foreground)] truncate">
          {cmd.label}
        </span>
        {cmd.hint && (
          <span className="text-xs text-[var(--foreground-muted)] truncate">
            {cmd.hint}
          </span>
        )}
      </span>

      {/* Shortcut */}
      {cmd.shortcut && (
        <span className="flex items-center gap-1 shrink-0" dir="ltr">
          {cmd.shortcut.map((k, i) => (
            <kbd
              key={i}
              className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded border border-[var(--border-strong)] bg-[var(--surface-glass)] text-[10px] font-mono text-[var(--foreground-muted)]"
            >
              {k}
            </kbd>
          ))}
        </span>
      )}

      {/* Selected indicator */}
      <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-[var(--accent)] opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
    </CommandPrimitive.Item>
  );
}
