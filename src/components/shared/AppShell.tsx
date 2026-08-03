'use client';

import { ReactNode } from 'react';
import { useAppStore } from '@/lib/store';
import BottomNav from './BottomNav';
import SidebarNav from './SidebarNav';
import RoleSwitcher from './RoleSwitcher';
import MusicPlayer from './MusicPlayer';

/**
 * AppShell — responsive layout wrapper.
 *
 * Mobile (< md): full-width canvas, content centered in max-w-md,
 *   bottom nav fixed, padding-bottom to clear nav.
 *
 * Desktop (>= md): sidebar nav on the right (RTL), main content
 *   offset by sidebar width (mr-64), max-w-7xl centered.
 *
 * Detail pages (student/institute/user detail) hide the bottom nav
 *   on mobile so the back-button header is the primary navigation.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const { userRole, currentView, onboardingComplete } = useAppStore();

  const isLoggedIn = onboardingComplete && userRole !== undefined;
  if (!isLoggedIn) {
    // Pre-auth: no chrome, just render the page (login/landing/onboarding)
    return <>{children}</>;
  }

  const isDetailPage =
    currentView === 'sa-institute-detail' ||
    currentView === 'sa-user-detail' ||
    currentView === 'advisor-student-detail';

  const showBottomNav = !isDetailPage;
  const showSidebar = !isDetailPage; // detail pages also hide sidebar for focus
  const showMusicPlayer = userRole === 'STUDENT' && !isDetailPage;

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

      {/* Student music player (floating) */}
      {showMusicPlayer && <MusicPlayer />}

      {/* Dev role switcher */}
      <RoleSwitcher />
    </div>
  );
}
