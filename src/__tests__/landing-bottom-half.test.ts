import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Landing Page Bottom Half Refactor', () => {
  const landingPageFile = path.resolve(process.cwd(), 'src/components/landing/LandingPage.tsx');
  const content = fs.readFileSync(landingPageFile, 'utf8');

  it('contains the Problem/Solution section with exact text', () => {
    expect(content).toContain('رِوال چه مشکلی رو حل می‌کنه؟');
    expect(content).toContain('برنامه‌ریزیم خیلی بی‌نظمه و هر روز کلی از وقتم فقط صرفِ نوشتن و خط زدنِ برنامه میشه...');
    expect(content).toContain('میزکار اختصاصی کنکور');
    expect(content).toContain('تودولیست اختصاصی کنکور که تمام نیاز های برنامه ریزی دانش آموز رو درنظر می گیره');
    
    expect(content).toContain('نمی‌دونم باگِ درس خوندنم کجاست!');
    expect(content).toContain('فضایی به دور از حواس‌پرتی');
    expect(content).toContain('ارتباط یکپارچه با مشاور');
  });

  it('has removed the old Bento grid components', () => {
    expect(content).not.toContain('LandingBentoFeatures');
    expect(content).not.toContain('SpotlightCard');
    // Ensure we don't have the old section title (using regex to avoid matching footer)
    expect(content).not.toMatch(/<h2[^>]*>برای دانش‌آموزان<\/h2>/);
  });

  it('reorders components correctly', () => {
    const mainSectionRegex = /<main[^>]*>[\s\S]*?<LandingHero\s*\/>[\s\S]*?<LandingStatsBar\s*\/>[\s\S]*?<LandingProblemSolution\s*\/>[\s\S]*?<ProductPlayground\s*\/>[\s\S]*?<LandingCta\s*\/>[\s\S]*?<LandingMoreAboutReval[\s\S]*?<\/main>/;
    expect(content).toMatch(mainSectionRegex);
  });

  it('uses semantic theme classes in LandingMoreAboutReval', () => {
    expect(content).not.toContain('bg-zinc-950');
    expect(content).not.toContain('border-zinc-800');
    expect(content).toContain('bg-background');
    expect(content).toContain('border-border');
    expect(content).toContain('bg-card/60');
  });
  
  it('adds theme toggle to header', () => {
    expect(content).toContain('const { theme, toggleTheme } = useAppStore();');
    expect(content).toContain('تغییر تم');
    expect(content).toContain('onClick={toggleTheme}');
  });
});
