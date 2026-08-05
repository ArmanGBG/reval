'use client';

import { LandingNav } from './LandingNav';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { StatsSection } from './StatsSection';
import { TestimonialsSection } from './TestimonialsSection';
import { CTASection } from './CTASection';
import { LandingFooter } from './LandingFooter';

// ===== Main Landing Page Component =====
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--foreground)] overflow-x-hidden">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
