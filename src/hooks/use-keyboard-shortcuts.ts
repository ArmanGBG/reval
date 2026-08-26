'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { useAppStore } from '@/lib/store';
import { useCommandPaletteStore } from '@/hooks/use-command-palette';
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
  const navigateTo = useAppStore((s) => s.navigateTo);
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode);

  useEffect(() => {
    // Don't register any shortcuts until the user is actually in the app.
    if (!onboardingComplete) return;

    const isStudent = userRole === 'STUDENT';

    const handler = (e: KeyboardEvent) => {
      // ----- Escape → close any open overlay (palette, help dialog, focus mode) -----
      // IMPORTANT: this runs BEFORE the typing-target guard so that Escape
      // works even when the Command Palette search input is focused.
      if (e.key === 'Escape') {
        const { open: paletteOpen } = useCommandPaletteStore.getState();
        const { helpOpen } = useKeyboardHelpStore.getState();
        const { focusMode } = useAppStore.getState();
        if (paletteOpen) {
          e.preventDefault();
          useCommandPaletteStore.getState().setOpen(false);
          return;
        }
        if (helpOpen) {
          e.preventDefault();
          useKeyboardHelpStore.getState().setHelpOpen(false);
          return;
        }
        if (focusMode) {
          e.preventDefault();
          useAppStore.getState().setFocusMode(false);
          return;
        }
      }

      // Never fire other shortcuts when typing in an input/textarea/contenteditable
      if (isTypingTarget(e.target)) return;

      // ----- ? (Shift + /) → toggle help dialog -----
      // Cover both `e.key === '?'` (Latin layouts) and physical Slash key
      if (e.shiftKey && (e.key === '?' || e.code === 'Slash')) {
        e.preventDefault();
        useKeyboardHelpStore.getState().toggleHelp();
        return;
      }

      // ----- Ctrl/Cmd + K → open command palette -----
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        useCommandPaletteStore.getState().toggle();
        return;
      }

      // ----- F → toggle Focus Mode (student-only, distraction-free) -----
      // Activates on Plan view (current task focus) or Tools view (Pomodoro focus)
      if (e.key === 'f' || e.key === 'F') {
        if (isStudent && (currentView === 'plan' || currentView === 'tools' || currentView === 'dashboard')) {
          e.preventDefault();
          toggleFocusMode();
          return;
        }
      }

      // ----- Digits 1..5 → student views -----
      if (isStudent) {
        const match = DIGIT_RE.exec(e.code);
        if (match) {
          e.preventDefault();
          const idx = parseInt(match[1], 10) - 1;
          navigateTo({ view: STUDENT_VIEWS[idx] });
          return;
        }
      }
    };

    window.addEventListener('keydown', handler, { passive: false });
    return () => window.removeEventListener('keydown', handler);
  }, [userRole, onboardingComplete, currentView, navigateTo, toggleFocusMode]);
}
