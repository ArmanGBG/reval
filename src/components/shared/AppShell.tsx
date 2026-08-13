'use client';

import { ReactNode } from 'react';
import { useAppStore } from '@/lib/store';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import BottomNav from './BottomNav';
import SidebarNav from './SidebarNav';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import CelebrationOverlay from './CelebrationOverlay';
import CommandPalette from './CommandPalette';
import DataExportHelper from './DataExportHelper';
import FocusMode from './FocusMode';

/**
 * AppShell — responsive layout wrapper.
 *
 * Mobile (< md): full-width canvas, content centered in max-w-md,
 *   bottom nav fixed, padding-bottom to clear nav, floating command FAB.
 *
 * Desktop (>= md): sidebar nav on the right (RTL), main content
 *   offset by sidebar width (mr-64), max-w-7xl centered.
 *
 * Detail pages (student/institute/user detail) hide the bottom nav
 *   on mobile so the back-button header is the primary navigation.
 *
 * Focus Mode (F key): overlays the entire screen with a distraction-free
 *   view of the current page content. The page tree is re-rendered inside
 *   the FocusMode portal so student keeps their plan / Pomodoro visible.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const { userRole, currentView, onboardingComplete, focusMode } = useAppStore();

  // Register global keyboard shortcuts.
  // Must be called unconditionally (Rules of Hooks); the hook itself
  // bails out early when the user is not yet logged in.
  useKeyboardShortcuts();

  const isLoggedIn = onboardingComplete && userRole !== undefined;
  if (!isLoggedIn) {
    // Pre-auth: no chrome, just render the page (login/landing/onboarding)
    return (
      <>
        {children}
        <CelebrationOverlay />
      </>
    );
  }

  const isDetailPage =
    currentView === 'sa-institute-detail' ||
    currentView === 'sa-user-detail' ||
    currentView === 'advisor-student-detail';

  const showBottomNav = !isDetailPage && !focusMode;
  const showSidebar = !isDetailPage && !focusMode; // detail pages + focus hide sidebar
  const isStudent = userRole === 'STUDENT';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Desktop sidebar (right side in RTL) */}
      {showSidebar && <SidebarNav />}

      {/* Main content area — offset for desktop sidebar */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          showSidebar ? 'md:mr-64' : ''
        }`}
      >
        <main
          className={`flex-1 w-full mx-auto ${
            isDetailPage ? 'max-w-5xl' : 'max-w-7xl'
          } px-4 md:px-6 lg:px-8 pt-4 md:pt-8 ${
            showBottomNav ? 'pb-24 md:pb-12' : 'pb-12'
          }`}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {showBottomNav && <BottomNav />}

      {/* Focus mode overlay — when active, the page chrome above is hidden
          and the student sees a distraction-free view of the current page. */}
      {isStudent && focusMode && <FocusMode>{children}</FocusMode>}

      {/* Global keyboard shortcuts help dialog (managed by useKeyboardShortcuts) */}
      <KeyboardShortcutsHelp />

      {/* Command palette (Ctrl/Cmd+K) — role-aware fuzzy search over views,
          tools, and actions. Rendered at root so it floats above everything. */}
      <CommandPalette />

      {/* Data export helper — listens for `reval-export-data` events from
          the command palette and downloads CSV + JSON files. Invisible. */}
      {isStudent && <DataExportHelper />}

      {/* Celebration overlay — confetti bursts on task completion.
          Rendered once at the app root so it's always available.
          pointer-events: none, so it never blocks interaction. */}
      <CelebrationOverlay />

    </div>
  );
}
