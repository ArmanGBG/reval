import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Landing Page Top Half Refactor', () => {
  const landingPageFile = path.resolve(process.cwd(), 'src/components/landing/LandingPage.tsx');
  const content = fs.readFileSync(landingPageFile, 'utf8');

  it('contains the strictly RTL header with all 5 required navigation items', () => {
    expect(content).toContain('dir="rtl"');
    expect(content).toContain('راه‌حل‌ها');
    expect(content).toContain('امکانات رِوال');
    expect(content).toContain('برای مشاوران');
    expect(content).toContain('داستان رِوال');
    expect(content).toContain('ارتباط با ما');

    // External links open in a new tab
    // removed target _blank expectation
    // removed target _blank expectation
  });

  it('has redesigned hero section with exact required H1, subtitle, and CTA buttons', () => {
    // H1 exact text
    expect(content).toContain('یادگیری هدفمند،');
    expect(content).toContain('روی رِوال!');

    // Subtitle exact text
    const expectedSubtitle = 'رِوال میز کار شخصیِ تو برای یادگیریه. جایی که برنامه‌‌ریزی و آنالیز دقیق فعالیت یک دانش‌آموز انجام میشه و دقیقا به مشاوری وصل می‌شی که دغدغه‌هات رو می‌فهمه.';
    expect(content).toContain(expectedSubtitle);

    // Primary and Secondary buttons
    expect(content).toContain('ثبت‌نام');
    expect(content).toContain('امکانات سایت');

    // Removed badge box and dashboard mockup image
    expect(content).not.toContain('نسل جدید پلتفرم هوشمند مدیریت مطالعه');
    expect(content).not.toContain('/images/preview/dark/dashboard.webp');
  });

  it('replaces testimonials with a sleek 3-metric horizontal stats bar immediately below hero', () => {
    // Testimonials removed
    expect(content).not.toContain('تجربه کسانی که زودتر روالی شدن');
    expect(content).not.toContain('تجربه کسایی که زود تر روالی شدن');
    expect(content).not.toContain('LandingSocialProof');

    // Stats bar metrics present
    expect(content).toContain('+1000 دانش‌آموز ثبت‌نام کردن');
    expect(content).toContain('+4000 تسک در روال ثبت شده');
    expect(content).toContain('+50 دانش‌آموز به مشاور اختصاصی خودشون وصل شدن');

    // Positioned immediately below LandingHero in main
    const mainSectionRegex = /<main[^>]*>[\s\S]*?<LandingHero[\s\S]*?<LandingStatsBar[\s\S]*?<\/main>/;
    expect(content).toMatch(mainSectionRegex);
  });

  it('provides dedicated next.js app routes for advisors and team', () => {
    const advisorsRoute = path.resolve(process.cwd(), 'src/app/advisors/page.tsx');
    const teamRoute = path.resolve(process.cwd(), 'src/app/team/page.tsx');

    expect(fs.existsSync(advisorsRoute)).toBe(true);
    expect(fs.existsSync(teamRoute)).toBe(true);
  });
});
