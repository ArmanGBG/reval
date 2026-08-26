'use client';

import type { ReactNode } from 'react';

export function SectionCard({
  id, title, icon: Icon, children,
}: {
  id?: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section id={id} className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <h2 className="text-base font-bold text-[var(--foreground)]">{title}</h2>
      </div>
      <div className="surface-1 edge-highlight rounded-[var(--radius-lg)] p-4 md:p-5 space-y-4">
        {children}
      </div>
    </section>
  );
}
