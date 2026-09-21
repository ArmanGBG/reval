'use client';

import { useEffect, useState, useCallback } from 'react';
import { MotionConfig } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Header } from './header';
import { Hero } from './hero';
import { PreviewSliderSection } from './preview-slider-section';
import { ForStudents } from './for-students';
import { InteractiveDemo } from './interactive-demo';
import { Features } from './features';
import { Advisors } from './advisors';
import { AdvisorsPage } from './advisors-page';
import { Team } from './team';
import { TeamPage } from './team-page';
import { Footer } from './footer';
import { FloatingLines } from './floating-lines';

// ===== Main Landing Page Component =====
// Composes the landing sections and bridges the landing's hash-based CTAs
// (#login / #signup) to the app's store-based view switching.
//
// Local view state drives 3 "page" modes within the same `/` route
// (the sandbox only exposes a single route, so we cannot add separate
// Next.js routes for /advisors or /team):
//   - 'main'    → the standard landing composition
//   - 'advisors' → dedicated AdvisorsPage (reached via "اطلاعات بیشتر"
//                  in the Advisors section, or "مشاوران" in the Header)
//   - 'team'    → dedicated TeamPage (reached via "داستانِ ما رو بشنو"
//                  CTA in the 4-box Team section, or "تیم ما" in the Header)
export default function LandingPage() {
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const [isMobile, setIsMobile] = useState(true);
  const [landingView, setLandingView] = useState<'main' | 'advisors' | 'team'>('main');

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

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

  // ===== Shared callbacks (passed to Header + Footer in every view) =====
  // Each callback switches the view + scrolls to top. The "demo" callback
  // also scrolls to the #features section after switching back to main.
  const handleAdvisorsClick = useCallback(() => {
    setLandingView('advisors');
    window.scrollTo(0, 0);
  }, []);

  const handleTeamClick = useCallback(() => {
    setLandingView('team');
    window.scrollTo(0, 0);
  }, []);

  const handleDemoClick = useCallback(() => {
    setLandingView('main');
    // Wait for the main-landing DOM to render, then scroll to #features.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }, []);

  const handleBackToMain = useCallback(() => {
    setLandingView('main');
    window.scrollTo(0, 0);
  }, []);

  // ===== Dedicated advisors page view =====
  if (landingView === 'advisors') {
    return (
      <MotionConfig reducedMotion={isMobile ? 'always' : 'user'}>
        <div className="landing-page relative isolate flex min-h-screen flex-col overflow-x-clip bg-background font-yekan md:noise">
          {!isMobile && <div className="aurora pointer-events-none fixed inset-0 z-0 opacity-35" aria-hidden="true" />}
          <div className="pointer-events-none fixed inset-0 z-0 bg-background/25" aria-hidden="true" />
          {!isMobile && <FloatingLines />}

          <Header
            onAdvisorsClick={handleAdvisorsClick}
            onTeamClick={handleTeamClick}
            onDemoClick={handleDemoClick}
          />

          <main className="relative z-10 flex-1">
            <AdvisorsPage onBack={handleBackToMain} />
          </main>
          <Footer
            onAdvisorsClick={handleAdvisorsClick}
            onTeamClick={handleTeamClick}
            onDemoClick={handleDemoClick}
          />
        </div>
      </MotionConfig>
    );
  }

  // ===== Dedicated team page view =====
  if (landingView === 'team') {
    return (
      <MotionConfig reducedMotion={isMobile ? 'always' : 'user'}>
        <div className="landing-page relative isolate flex min-h-screen flex-col overflow-x-clip bg-background font-yekan md:noise">
          {!isMobile && <div className="aurora pointer-events-none fixed inset-0 z-0 opacity-35" aria-hidden="true" />}
          <div className="pointer-events-none fixed inset-0 z-0 bg-background/25" aria-hidden="true" />
          {!isMobile && <FloatingLines />}

          <Header
            onAdvisorsClick={handleAdvisorsClick}
            onTeamClick={handleTeamClick}
            onDemoClick={handleDemoClick}
          />

          <main className="relative z-10 flex-1">
            <TeamPage onBack={handleBackToMain} />
          </main>
          <Footer
            onAdvisorsClick={handleAdvisorsClick}
            onTeamClick={handleTeamClick}
            onDemoClick={handleDemoClick}
          />
        </div>
      </MotionConfig>
    );
  }

  // ===== Main landing page view =====
  return (
    <MotionConfig reducedMotion={isMobile ? 'always' : 'user'}>
      <div className="landing-page relative isolate flex min-h-screen flex-col overflow-x-clip bg-background font-yekan md:noise">
        {!isMobile && <div className="aurora pointer-events-none fixed inset-0 z-0 opacity-35" aria-hidden="true" />}
        <div className="pointer-events-none fixed inset-0 z-0 bg-background/25" aria-hidden="true" />
        {!isMobile && <FloatingLines />}

        <Header
          onAdvisorsClick={handleAdvisorsClick}
          onTeamClick={handleTeamClick}
          onDemoClick={handleDemoClick}
        />

        <main className="relative z-10 flex-1">
          <Hero />
          <PreviewSliderSection />
          <ForStudents />
          <InteractiveDemo />
          <Features />
          <Advisors onMoreInfo={handleAdvisorsClick} />
          <Team onTeamClick={handleTeamClick} />
        </main>
        <Footer
          onAdvisorsClick={handleAdvisorsClick}
          onTeamClick={handleTeamClick}
          onDemoClick={handleDemoClick}
        />
      </div>
    </MotionConfig>
  );
}
