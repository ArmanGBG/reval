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
import AnalyticsView from '@/components/analytics/AnalyticsView';
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
import { UserRole } from '@/lib/types';

export default function Home() {
  const { currentView, onboardingComplete, userRole, hydrateAuth, logout, setUserRole, setUser, setOnboardingComplete } = useAppStore();
  // Track whether we've validated the persisted session with the server
  const [authValidated, setAuthValidated] = useState(false);

  useEffect(() => {
    // On mount, hydrate from localStorage if available
    const persisted = loadAuthFromStorage();
    if (persisted && persisted.onboardingComplete) {
      hydrateAuth();

      // Validate the session cookie with the server.
      // If the cookie is expired/invalid, clear localStorage and reset.
      fetch('/api/auth/me')
        .then((res) => {
          if (!res.ok) {
            // Session is invalid — clear persisted auth and reset store
            clearAuthStorage();
            logout();
          } else {
            // Session is valid — optionally refresh user data from server
            return res.json().then((data) => {
              if (data.user) {
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
              }
            });
          }
        })
        .catch(() => {
          // Network error — trust the localStorage + cookie combo
          // (could be offline; don't log the user out)
        })
        .finally(() => {
          setAuthValidated(true);
        });
    } else {
      setAuthValidated(true);
    }
  }, []);

  // Not logged in yet → show login / landing / onboarding (no chrome)
  const isLoggedIn = onboardingComplete && userRole !== undefined;

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
  );
}
