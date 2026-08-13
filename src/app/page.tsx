'use client';

import { useEffect, useState } from 'react';
import { useAppStore, loadAuthFromStorage, clearAuthStorage } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';
import AppShell from '@/components/shared/AppShell';
import LoginPage from '@/components/auth/LoginPage';
import Dashboard from '@/components/dashboard/Dashboard';
import PlanView from '@/components/plan/PlanView';
import ToolsHub from '@/components/tools/ToolsHub';
import AdvisorPanel from '@/components/advisor/AdvisorDashboard';
import AnalyticsView from '@/components/analytics/MinimalAnalyticsView';
import SettingsView from '@/components/settings/SettingsView';
import InstituteDashboard from '@/components/institute/InstituteDashboard';
import InstituteAdvisors from '@/components/institute/InstituteAdvisors';
import InstituteStudents from '@/components/institute/InstituteStudents';
import InstituteSettings from '@/components/institute/InstituteSettings';
import SuperAdminDashboard from '@/components/super-admin/SuperAdminDashboard';
import SuperAdminSubjects from '@/components/super-admin/SuperAdminSubjects';
import SuperAdminInstitutes from '@/components/super-admin/SuperAdminInstitutes';
import SuperAdminUsers from '@/components/super-admin/SuperAdminUsers';
import SuperAdminSettings from '@/components/super-admin/SuperAdminSettings';
import SuperAdminMessages from '@/components/super-admin/SuperAdminMessages';
import InstituteDetail from '@/components/super-admin/InstituteDetail';
import UserDetail from '@/components/super-admin/UserDetail';
import LandingPage from '@/components/landing/LandingPage';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import SessionGuard from '@/components/shared/SessionGuard';
import { UserRole } from '@/lib/types';

export default function Home() {
  const { currentView, onboardingComplete, userRole, hydrateAuth, logout, setCurrentView, setUserRole, setUser, setOnboardingComplete } = useAppStore();
  // Track whether we've validated the persisted session with the server
  const [authValidated, setAuthValidated] = useState(false);

  useEffect(() => {
    // On mount, check if there's a persisted session in localStorage.
    // CRITICAL: We do NOT call hydrateAuth() until the server confirms the
    // session cookie is still valid. This prevents a race condition where:
    //   1. Stale localStorage says onboardingComplete=true (from a previous
    //      session that has since expired).
    //   2. The AppShell + SessionGuard mount prematurely.
    //   3. A concurrent API call (e.g. loadInboxMessages from the store's
    //      queueMicrotask) returns 401.
    //   4. The SessionGuard fires the "نشست شما منقضی شده" toast even though
    //      the user hasn't even tried to log in yet.
    // By validating FIRST and only hydrating on success, the AppShell never
    // mounts with stale state, so no premature 401 handler fires.
    const persisted = loadAuthFromStorage();
    if (persisted && persisted.onboardingComplete) {
      // Validate the session cookie with the server BEFORE hydrating the store.
      fetch('/api/auth/me', { credentials: 'same-origin' })
        .then((res) => {
          if (!res.ok) {
            // Session is invalid/expired — silently clear persisted auth.
            // Reset BOTH localStorage and the already-hydrated Zustand state;
            // clearing storage alone leaves stale onboardingComplete=true in
            // memory and briefly renders a broken authenticated screen.
            clearAuthStorage();
            logout();
            setCurrentView('login');
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (!data || !data.user) {
            // Either the session was invalid, or no user data returned.
            // Either way, we're not logged in.
            return;
          }
          // Session is valid — NOW hydrate the store from the server response.
          const role = data.user.role as UserRole;
          setUserRole(role);
          setUser({
            id: data.user.id,
            name: data.user.name,
            avatar: data.user.avatar,
            grade: data.user.grade || 'دوازدهم',
            major: data.user.major || 'تجربی',
            goal: data.user.goal || 'کنکور',
            dailyTargetHours: data.user.dailyTargetHours || 6,
            phone: data.user.phone,
            assignedAdvisorId: data.user.assignedAdvisorId || null,
          });
          setOnboardingComplete(true);

          // Load role-specific data in the background
          const { loadTasksForStudent, loadAdvisorStudents, loadExams } = useAppStore.getState();
          if (role === 'STUDENT') {
            loadTasksForStudent(data.user.id).catch(() => {});
            loadExams({ studentId: data.user.id }).catch(() => {});
          } else if (role === 'ADVISOR') {
            loadAdvisorStudents(data.user.id).catch(() => {});
            loadExams({ advisorId: data.user.id }).catch(() => {});
          }
        })
        .catch(() => {
          // Network error — trust the localStorage + cookie combo as a
          // fallback (could be offline). Hydrate from localStorage so the
          // user can use the app offline; API calls will fail individually
          // if the cookie is actually expired.
          hydrateAuth();
        })
        .finally(() => {
          setAuthValidated(true);
        });
    } else {
      setAuthValidated(true);
    }
  }, [hydrateAuth, logout, setCurrentView, setOnboardingComplete, setUser, setUserRole]);

  useEffect(() => {
    const syncPublicViewFromHistory = () => {
      if (useAppStore.getState().onboardingComplete) return;
      const hash = window.location.hash;
      setCurrentView(hash === '#login' ? 'login' : hash === '#signup' ? 'onboarding' : 'landing');
    };
    window.addEventListener('popstate', syncPublicViewFromHistory);
    return () => window.removeEventListener('popstate', syncPublicViewFromHistory);
  }, [setCurrentView]);

  // Not logged in yet → show login / landing / onboarding (no chrome)
  const isLoggedIn = onboardingComplete && userRole !== undefined;

  // While validating a persisted session with the server, show a minimal
  // loading screen. This prevents:
  //   - A flash of the landing page before the user is logged in.
  //   - The AppShell + SessionGuard mounting with stale state and firing
  //     premature 401 toasts.
  // Only shown when there might be a persisted session (authValidated is false).
  if (!authValidated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-deep)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-1 w-20 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-mint" /></div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 rounded-full border-2 border-mint/30 border-t-mint animate-spin" />
            <span className="text-sm">در حال بارگذاری…</span>
          </div>
        </div>
      </div>
    );
  }

  // Landing page is full-bleed (no AppShell)
  if (currentView === 'landing' && !isLoggedIn) {
    return (
      <motion.div
        key="landing"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <LandingPage />
      </motion.div>
    );
  }

  // Sign-up wizard is also full-bleed (no AppShell) and only reachable pre-auth.
  // It creates a real STUDENT account via /api/auth/register and issues a session
  // cookie, so the user is fully authenticated by the time they land on the dashboard.
  if (currentView === 'onboarding' && !isLoggedIn) {
    return (
      <motion.div
        key="onboarding"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <OnboardingWizard />
      </motion.div>
    );
  }

  // Login page (full-bleed, no AppShell). Reachable from the landing page and
  // from the onboarding wizard ("حساب داری؟ ورود"). Hosts the quick-access
  // buttons for demo accounts (super-admin, institute-manager, advisor, student).
  if (currentView === 'login' && !isLoggedIn) {
    return (
      <motion.div
        key="login"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <LoginPage />
      </motion.div>
    );
  }

  // Render the active view inside AppShell
  const renderView = () => {
    // Super Admin
    if (currentView === 'sa-dashboard') return <SuperAdminDashboard />;
    if (currentView === 'sa-subjects') return <SuperAdminSubjects />;
    if (currentView === 'sa-institutes') return <SuperAdminInstitutes />;
    if (currentView === 'sa-institute-detail') return <InstituteDetail />;
    if (currentView === 'sa-users') return <SuperAdminUsers />;
    if (currentView === 'sa-user-detail') return <UserDetail />;
    if (currentView === 'sa-messages') return <SuperAdminMessages />;
    if (currentView === 'sa-settings') return <SuperAdminSettings />;

    // Institute Manager
    if (currentView === 'institute-dashboard') return <InstituteDashboard />;
    if (currentView === 'institute-advisors') return <InstituteAdvisors />;
    if (currentView === 'institute-students') return <InstituteStudents />;
    if (currentView === 'institute-settings') return <InstituteSettings />;

    // Advisor
    if (currentView === 'advisor-dashboard') return <AdvisorPanel />;
    if (currentView === 'advisor-students') return <AdvisorPanel />;
    if (currentView === 'advisor-student-detail') return <AdvisorPanel />;
    if (currentView === 'advisor-messages') return <AdvisorPanel />;
    if (currentView === 'advisor-settings') return <AdvisorPanel />;

    // Student
    if (currentView === 'dashboard') return <Dashboard />;
    if (currentView === 'plan') return <PlanView />;
    if (currentView === 'tools') return <ToolsHub />;
    if (currentView === 'analytics') return <AnalyticsView />;
    if (currentView === 'settings') return <SettingsView />;

    // Pre-auth fallback
    return <LoginPage />;
  };

  // Compute a stable key per role-group so sub-view switches
  // (e.g., advisor-students → advisor-settings) don't unmount the entire panel.
  // This lets the panel's own AnimatePresence handle sub-view transitions cleanly.
  const viewGroupKey =
    currentView.startsWith('advisor-')   ? 'advisor'   :
    currentView.startsWith('sa-')        ? 'sa'        :
    currentView.startsWith('institute-') ? 'institute' :
    currentView;

  return (
    <>
      {/* Global session guard: catches 401s from any API call and
          re-validates the session on window focus / periodically. */}
      <SessionGuard />
      <AppShell>
        <AnimatePresence mode="wait">
          <motion.div
            key={viewGroupKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </AppShell>
    </>
  );
}
