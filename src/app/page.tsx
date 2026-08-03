'use client';

import { useAppStore } from '@/lib/store';
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
import SuperAdminInstitutes from '@/components/super-admin/SuperAdminInstitutes';
import SuperAdminUsers from '@/components/super-admin/SuperAdminUsers';
import SuperAdminSettings from '@/components/super-admin/SuperAdminSettings';
import InstituteDetail from '@/components/super-admin/InstituteDetail';
import UserDetail from '@/components/super-admin/UserDetail';
import LandingPage from '@/components/landing/LandingPage';

export default function Home() {
  const { currentView, onboardingComplete, userRole } = useAppStore();

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

  // Render the active view inside AppShell
  const renderView = () => {
    // Super Admin
    if (currentView === 'sa-dashboard') return <SuperAdminDashboard />;
    if (currentView === 'sa-institutes') return <SuperAdminInstitutes />;
    if (currentView === 'sa-institute-detail') return <InstituteDetail />;
    if (currentView === 'sa-users') return <SuperAdminUsers />;
    if (currentView === 'sa-user-detail') return <UserDetail />;
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

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
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
