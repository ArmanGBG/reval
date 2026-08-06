'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { ViewName } from '@/lib/types';

// =================================================================
// Shared state for the keyboard-shortcuts help dialog.
// Decoupled from the main app store so the KeyboardShortcutsHelp
// component can read/write it without prop drilling, and the hook
// can toggle it on `?` independently of React render cycles.
// =================================================================
interface KeyboardHelpState {
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  toggleHelp: () => void;
}

export const useKeyboardHelpStore = create<KeyboardHelpState>((set, get) => ({
  helpOpen: false,
  setHelpOpen: (open) => set({ helpOpen: open }),
  toggleHelp: () => set({ helpOpen: !get().helpOpen }),
}));

// =================================================================
// Helpers
// =================================================================

// Tags where the user is actively typing — shortcuts must NOT fire.
const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (TYPING_TAGS.has(target.tagName)) return true;
  if (target.isContentEditable) return true;
  // Radix/shadcn textboxes sometimes use role="textbox" on a non-input element
  if (target.getAttribute('role') === 'textbox') return true;
  return false;
}

// Student digit shortcuts: 1..5 → student views
const STUDENT_VIEWS: ViewName[] = [
  'dashboard', // ۱
  'plan',      // ۲
  'tools',     // ۳
  'analytics', // ۴
  'settings',  // ۵
];

// Match physical digit keys (top-row Digit1..5 OR numpad Numpad1..5).
// Using e.code keeps this layout-independent (Persian/French/QWERTY all work).
const DIGIT_RE = /^(?:Digit|Numpad)([1-5])$/;

// =================================================================
// Hook
// =================================================================
export function useKeyboardShortcuts(): void {
  const userRole = useAppStore((s) => s.userRole);
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const currentView = useAppStore((s) => s.currentView);
  const currentTool = useAppStore((s) => s.currentTool);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  useEffect(() => {
    // Don't register any shortcuts until the user is actually in the app.
    if (!onboardingComplete) return;

    const isStudent = userRole === 'STUDENT';

    const handler = (e: KeyboardEvent) => {
      // Never fire when typing in an input/textarea/contenteditable
      if (isTypingTarget(e.target)) return;

      // ----- ? (Shift + /) → toggle help dialog -----
      // Cover both `e.key === '?'` (Latin layouts) and physical Slash key
      if (e.shiftKey && (e.key === '?' || e.code === 'Slash')) {
        e.preventDefault();
        useKeyboardHelpStore.getState().toggleHelp();
        return;
      }

      // ----- Ctrl/Cmd + K → command palette (placeholder toast) -----
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        toast.info('پنل دستورات به‌زودی در دسترس خواهد بود', {
          description: 'Command palette coming soon',
        });
        return;
      }

      // ----- Space → toggle Pomodoro (only on Tools page with Pomodoro open) -----
      if (e.code === 'Space' || e.key === ' ') {
        const pomodoroActive =
          isStudent && currentView === 'tools' && currentTool === 'pomodoro';
        if (pomodoroActive) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('pomodoro-toggle'));
        }
        return;
      }

      // ----- Digits 1..5 → student views -----
      if (isStudent) {
        const match = DIGIT_RE.exec(e.code);
        if (match) {
          e.preventDefault();
          const idx = parseInt(match[1], 10) - 1;
          setCurrentView(STUDENT_VIEWS[idx]);
          return;
        }
      }

      // ----- Escape → close help dialog if open -----
      // (Browser/Radix already handle closing other modals natively.)
      if (e.key === 'Escape') {
        const { helpOpen } = useKeyboardHelpStore.getState();
        if (helpOpen) {
          useKeyboardHelpStore.getState().setHelpOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handler, { passive: false });
    return () => window.removeEventListener('keydown', handler);
  }, [userRole, onboardingComplete, currentView, currentTool, setCurrentView]);
}
