'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useKeyboardHelpStore } from '@/hooks/use-keyboard-shortcuts';
import { toPersianDigits } from '@/lib/persian-date';

// =================================================================
// KeyboardShortcutsHelp
// A self-contained dialog listing all global keyboard shortcuts.
// Open state is managed via the shared `useKeyboardHelpStore` so the
// `useKeyboardShortcuts` hook can toggle it on `?` without prop drilling.
// =================================================================

interface ShortcutItem {
  /** One or more keys shown as <kbd> chips (joined by "+"). */
  keys: string[];
  /** Persian description of what the shortcut does. */
  description: string;
}

const SHORTCUTS: ShortcutItem[] = [
  {
    keys: [
      toPersianDigits(1),
      toPersianDigits(2),
      toPersianDigits(3),
      toPersianDigits(4),
      toPersianDigits(5),
    ],
    description: 'جابجایی بین بخش‌ها',
  },
  {
    keys: ['F'],
    description: 'حالت تمرکز (پنهان کردن منو)',
  },
  {
    keys: ['Esc'],
    description: 'بستن پنجره‌ها',
  },
  {
    keys: ['Ctrl', 'K'],
    description: 'باز کردن پنل دستورات',
  },
  {
    keys: ['?'],
    description: 'نمایش این راهنما',
  },
];

/** A small keyboard-key chip styled like a physical key. */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      dir="ltr"
      className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--foreground)] text-xs font-mono font-medium shadow-sm select-none"
    >
      {children}
    </kbd>
  );
}

export default function KeyboardShortcutsHelp() {
  const helpOpen = useKeyboardHelpStore((s) => s.helpOpen);
  const setHelpOpen = useKeyboardHelpStore((s) => s.setHelpOpen);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent
        dir="rtl"
        className="sm:max-w-md bg-[var(--bg-elevated)] border-[var(--border-strong)]"
      >
        <DialogHeader>
          <DialogTitle className="text-right text-[var(--foreground)]">
            میانبرهای کیبورد
          </DialogTitle>
          <DialogDescription className="text-right text-[var(--foreground-muted)]">
            برای افزایش سرعت کارت، از این میانبرها استفاده کن.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 mt-1" dir="rtl">
          {SHORTCUTS.map((shortcut, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg surface-1 border border-[var(--border-strong)]"
            >
              <span className="text-sm text-[var(--foreground)]">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1.5 shrink-0" dir="ltr">
                {shortcut.keys.map((k, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <span className="text-[var(--foreground-muted)] text-xs font-medium">
                        +
                      </span>
                    )}
                    <Kbd>{k}</Kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
