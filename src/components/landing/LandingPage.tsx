'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Header } from './header';
import { Hero } from './hero';
import { Features } from './features';
import { Team } from './team';
import { Footer } from './footer';
import { FloatingLines } from './floating-lines';

// ===== Main Landing Page Component =====
// Composes the landing sections from the landingreaval repo and bridges the
// landing's hash-based CTAs (#login / #signup) to the app's store-based view
// switching, so the rest of the SPA (auth, dashboard, …) stays untouched.
export default function LandingPage() {
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  useEffect(() => {
    // The landing uses <Link href="#login"> / <Link href="#signup"> for its
    // CTAs. In this SPA those hashes do nothing on their own, so we bridge
    // them to the store's view switching. We use TWO mechanisms:
    //   1. A capture-phase click listener — intercepts the click BEFORE
    //      next/link's handler runs (next/link uses history.pushState for
    //      hash hrefs, which does NOT fire a hashchange event).
    //   2. A hashchange listener — catches manual hash changes (e.g. user
    //      types #login in the address bar, or back/forward navigation).
    const AUTH_HASHES: Record<string, 'login' | 'onboarding'> = {
      '#login': 'login',
      '#signup': 'onboarding',
    };

    const goTo = (view: 'login' | 'onboarding', hash: string) => {
      window.history.pushState({ revalView: view }, '', `${window.location.pathname}${hash}`);
      setCurrentView(view);
    };

    const handleClick = (e: MouseEvent) => {
      // Only handle plain (non-modifier) clicks.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (hash && hash in AUTH_HASHES) {
        e.preventDefault();
        e.stopPropagation();
        goTo(AUTH_HASHES[hash], hash);
      }
    };

    const handleHash = () => {
      const hash = window.location.hash;
      if (hash in AUTH_HASHES) {
        setCurrentView(AUTH_HASHES[hash]);
      }
    };

    // Handle a hash already present on mount.
    handleHash();

    // Capture phase so we run before next/link's own click handler.
    document.addEventListener('click', handleClick, true);
    window.addEventListener('hashchange', handleHash);
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('hashchange', handleHash);
    };
  }, [setCurrentView]);

  return (
    <>
      <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-background noise font-yekan">
        <div className="aurora pointer-events-none fixed inset-0 z-0 opacity-35" aria-hidden="true" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-background/25" aria-hidden="true" />
        <FloatingLines />

        <Header />

        <main className="relative z-10 flex-1">
          <Hero />
          <Features />
          <Team />
        </main>
        <Footer />
      </div>
    </>
  );
}
