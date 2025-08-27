import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '@/lib/types';

interface SettingsState {
  defaultLanguage: Language | null;
  setDefaultLanguage: (language: Language) => void;
  clearDefaultLanguage: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultLanguage: null,
      setDefaultLanguage: (language: Language) => set({ defaultLanguage: language }),
      clearDefaultLanguage: () => set({ defaultLanguage: null }),
    }),
    {
      name: 'nextjudge-settings',
    }
  )
);
