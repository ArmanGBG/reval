'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { needsEnglishKeyboardHint } from '@/lib/digits';

// Global safety net: when the user's keyboard is Persian and they press a key
// in a field whose native input grammar (number/date) silently rejects it,
// show a one-off hint telling them to switch the keyboard to English.
export function KeyboardLayoutHint() {
  useEffect(() => {
    let lastShownAt = 0;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length !== 1) return;
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (!needsEnglishKeyboardHint(event.key, target.type)) return;
      const now = Date.now();
      if (now - lastShownAt < 5000) return;
      lastShownAt = now;
      toast('برای تایپ در این فیلد، کیبورد را انگلیسی (EN) کنید');
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, []);

  return null;
}
