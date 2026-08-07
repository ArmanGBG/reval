'use client';

import { toPersianDigits } from './landing-helpers';

// ===== Footer =====
export function LandingFooter() {
  const currentYear = toPersianDigits(new Date().getFullYear());

  return (
    <footer className="py-10 md:py-12 px-4 md:px-6 relative">
      {/* Gradient top border */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-px"
        style={{
          background: 'linear-gradient(to right, transparent, var(--border-strong), transparent)',
        }}
      />
      <div className="max-w-7xl mx-auto">
        {/* Mobile: simplified footer */}
        <div className="md:hidden max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--accent)] flex items-center justify-center">
              <span className="text-[var(--bg-deep)] font-black text-sm">ر</span>
            </div>
            <span className="text-lg font-bold text-[var(--foreground)]">روال</span>
          </div>
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed text-center mb-6">
            مسیر مطالعه‌ات رو هموار کن. همراه هوشمند تو در مسیر کنکور.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <a href="#features" className="link-underline text-[var(--foreground-muted)]">
              ویژگی‌ها
            </a>
            <a href="#how-it-works" className="link-underline text-[var(--foreground-muted)]">
              نحوه کار
            </a>
            <a href="#testimonials" className="link-underline text-[var(--foreground-muted)]">
              نظرات
            </a>
          </div>
          <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
            <p className="text-xs text-[var(--foreground-subtle)]">
              © {currentYear} روال. تمامی حقوق محفوظ است.
            </p>
          </div>
        </div>

        {/* Desktop: rich grid footer */}
        <div className="hidden md:grid grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--accent)] flex items-center justify-center">
                <span className="text-[var(--bg-deep)] font-black text-sm">ر</span>
              </div>
              <span className="text-lg font-bold text-[var(--foreground)]">روال</span>
            </div>
            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
              مسیر مطالعه‌ات رو هموار کن. همراه هوشمند تو در مسیر کنکور.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)] mb-4">محصول</h4>
            <div className="space-y-2.5">
              {['ویژگی‌ها', 'قیمت‌گذاری', 'سوالات متداول', 'بروزرسانی‌ها'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="link-underline block text-sm text-[var(--foreground-muted)]"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)] mb-4">پشتیبانی</h4>
            <div className="space-y-2.5">
              {['تماس با ما', 'راهنمای استفاده', 'گزارش مشکل', 'پیشنهاد ویژگی'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="link-underline block text-sm text-[var(--foreground-muted)]"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)] mb-4">قانونی</h4>
            <div className="space-y-2.5">
              {['حریم خصوصی', 'شرایط استفاده', 'لایسنس'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="link-underline block text-sm text-[var(--foreground-muted)]"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:flex border-t border-[var(--border)] pt-8 items-center justify-between">
          <p className="text-xs text-[var(--foreground-subtle)]">
            © {currentYear} روال. تمامی حقوق محفوظ است.
          </p>
          <span className="text-xs text-[var(--foreground-subtle)]">
            ساخته شده برای دانش‌آموزان ایران
          </span>
        </div>
      </div>
    </footer>
  );
}
