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

const REVALIDATE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export default function SessionGuard() {
  const { logout, onboardingComplete } = useAppStore();
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

      // Clear auth state + localStorage, then force a clean reload to login.
      clearAuthStorage();
      logout();
      resetUnauthState();

      // Hard reload after a short delay so the toast is visible.
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    };

    registerUnauthHandler(handleUnauth);
  }, [logout]);

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
          clearAuthStorage();
          logout();
          resetUnauthState();
          // Only reload if we're not already on the landing/login page.
          const store = useAppStore.getState();
          if (store.onboardingComplete) {
            toast.info('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.', {
              duration: 3000,
              style: {
                background: 'var(--bg-overlay, #1B1B22)',
                border: '1px solid var(--warning)',
                color: 'var(--warning)',
              },
            });
            setTimeout(() => {
              window.location.href = '/';
            }, 800);
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
  }, [onboardingComplete, logout]);

  // This component renders nothing — it's a side-effect guard.
  return null;
}
