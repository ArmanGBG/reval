'use client';

import { create } from 'zustand';

// =================================================================
// Command Palette state store.
// Decoupled from the main app store so the keyboard hook can toggle
// the palette on Ctrl/Cmd+K without prop drilling.
// =================================================================
interface CommandPaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  /** Last N command IDs the user ran — shown in a "Recent" group. */
  recent: string[];
  pushRecent: (id: string) => void;
}

const MAX_RECENT = 5;

export const useCommandPaletteStore = create<CommandPaletteState>(
  (set, get) => ({
    open: false,
    setOpen: (open) => set({ open }),
    toggle: () => set((s) => ({ open: !s.open })),
    recent: [],
    pushRecent: (id) => {
      const next = [id, ...get().recent.filter((r) => r !== id)].slice(
        0,
        MAX_RECENT,
      );
      set({ recent: next });
    },
  }),
);
