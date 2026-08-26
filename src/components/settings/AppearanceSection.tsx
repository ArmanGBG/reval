'use client';

import { Sun, Moon } from 'lucide-react';
import { SectionCard } from './SectionCard';

export function AppearanceSection({ theme, setTheme }: {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}) {
  return (
    <SectionCard id="appearance" title="ظاهر و تم" icon={Sun}>
      <div className="space-y-3">
        <p className="text-xs text-[var(--foreground-muted)]">تم برنامه را انتخاب کنید:</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`btn-hover flex flex-col items-center gap-2 rounded-xl border p-4 transition-all min-h-[80px] ${
              theme === 'light'
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'surface-1 border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span className="text-sm font-semibold">روشن</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`btn-hover flex flex-col items-center gap-2 rounded-xl border p-4 transition-all min-h-[80px] ${
              theme === 'dark'
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'surface-1 border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Moon className="w-5 h-5" />
            <span className="text-sm font-semibold">تاریک</span>
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
