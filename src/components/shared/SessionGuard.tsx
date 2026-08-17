'use client';

// ====================================================================
// SessionGuard — invisible component that:
//   1. Registers the global 401 handler (api-client) so ANY /api/* call
//      that returns 401 triggers a graceful logout + redirect to login,
//      instead of a scary "احراز هویت لازم است" toast.
//   2. Re-validates the session on window focus (user returns to the tab
//      after the cookie may have expired).
//   3. Periodically re-validates the session (every 10 min) to proactively
//      catch expired cookies before the user interacts.
//
// Render this ONCE at the top of the authenticated app shell.
// ====================================================================

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAppStore, clearAuthStorage } from '@/lib/store';
import { registerUnauthHandler, resetUnauthState } from '@/lib/api-client';

const REVALIDATE_INTERVAL_MS = 60 * 1000;

export default function SessionGuard() {
  const { logout, onboardingComplete, setCurrentView, setUser, setUserRole } = useAppStore();
  const revalidatingRef = useRef(false);

  // Register the global 401 handler once.
  useEffect(() => {
    const handleUnauth = () => {
      // Show a single, friendly toast (not the scary server error).
      toast.info('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.', {
        duration: 3000,
        style: {
          background: 'var(--bg-overlay, #1B1B22)',
          border: '1px solid var(--warning)',
          color: 'var(--warning)',
        },
      });

      // Clear only session/UI auth state. The permanent user record remains in
      // PostgreSQL and the returning user only needs to log in again.
      clearAuthStorage();
      logout();
      setCurrentView('login');
      resetUnauthState();
    };

    registerUnauthHandler(handleUnauth);
  }, [logout, setCurrentView]);

  // Re-validate the session on window focus + periodically.
  useEffect(() => {
    if (!onboardingComplete) return;

    const revalidate = async () => {
      // De-dupe concurrent revalidation attempts.
      if (revalidatingRef.current) return;
      revalidatingRef.current = true;
      try {
        const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (!res.ok) {
          // Session expired — the global handler will fire for API calls,
          // but /api/auth/me is called with raw fetch (not apiFetch), so we
          // handle it explicitly here.
          const wasLoggedIn = useAppStore.getState().onboardingComplete;
          clearAuthStorage();
          logout();
          setCurrentView('login');
          resetUnauthState();
          if (wasLoggedIn) {
            toast.info('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.', {
              duration: 3000,
              style: {
                background: 'var(--bg-overlay, #1B1B22)',
                border: '1px solid var(--warning)',
                color: 'var(--warning)',
              },
            });
          }
        } else {
          const data = await res.json();
          const nextUser = data.user;
          if (nextUser) {
            const previous = useAppStore.getState();
            const roleChanged = previous.userRole !== nextUser.role;
            const assignmentChanged = previous.user?.assignedAdvisorId !== (nextUser.assignedAdvisorId || null);
            setUserRole(nextUser.role);
            setUser({
              id: nextUser.id,
              name: nextUser.name,
              avatar: nextUser.avatar,
              grade: nextUser.grade || 'دوازدهم',
              major: nextUser.major || 'تجربی',
              phone: nextUser.phone,
              assignedAdvisorId: nextUser.assignedAdvisorId || null,
            });
            if (roleChanged) {
              setCurrentView(nextUser.role === 'ADVISOR' ? 'advisor-dashboard' : nextUser.role === 'INSTITUTE_MANAGER' ? 'institute-dashboard' : nextUser.role === 'SUPER_ADMIN' ? 'sa-dashboard' : 'dashboard');
            }
            if (assignmentChanged) window.dispatchEvent(new Event('reval:relationship-changed'));
            if (nextUser.role === 'ADVISOR') {
              await useAppStore.getState().loadAdvisorStudents(nextUser.id);
            } else if (nextUser.role === 'STUDENT' && assignmentChanged) {
              await useAppStore.getState().loadTasksForStudent(nextUser.id);
            }
          }
        }
      } catch {
        // Network error — don't log the user out (could be offline).
      } finally {
        revalidatingRef.current = false;
      }
    };

    const onFocus = () => revalidate();
    window.addEventListener('focus', onFocus);

    const interval = window.setInterval(revalidate, REVALIDATE_INTERVAL_MS);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(interval);
    };
  }, [onboardingComplete, logout, setCurrentView, setUser, setUserRole]);

  // This component renders nothing — it's a side-effect guard.
  return null;
}
