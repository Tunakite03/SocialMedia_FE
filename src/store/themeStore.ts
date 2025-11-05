import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Language = 'vi' | 'en';

interface ThemeState {
   theme: Theme;
   language: Language;
   setTheme: (theme: Theme) => void;
   setLanguage: (language: Language) => void;
   toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
   persist(
      (set) => ({
         theme: 'light',
         language: 'vi',
         setTheme: (theme) => {
            console.log('Setting theme to:', theme); // Debug log
            set({ theme });
            // Apply theme to document with multiple methods for compatibility
            const root = document.documentElement;
            if (theme === 'dark') {
               root.classList.add('dark');
               root.setAttribute('data-theme', 'dark');
               console.log('Applied dark theme, classes:', root.className); // Debug log
            } else {
               root.classList.remove('dark');
               root.setAttribute('data-theme', 'light');
               console.log('Applied light theme, classes:', root.className); // Debug log
            }
         },
         setLanguage: (language) => set({ language }),
         toggleTheme: () =>
            set((state) => {
               const newTheme = state.theme === 'light' ? 'dark' : 'light';
               // Apply theme to document with multiple methods for compatibility
               const root = document.documentElement;
               if (newTheme === 'dark') {
                  root.classList.add('dark');
                  root.setAttribute('data-theme', 'dark');
               } else {
                  root.classList.remove('dark');
                  root.setAttribute('data-theme', 'light');
               }
               return { theme: newTheme };
            }),
      }),
      {
         name: 'theme-storage',
         onRehydrateStorage: () => (state) => {
            // Apply theme on hydration with multiple methods for compatibility
            if (state?.theme) {
               const root = document.documentElement;
               if (state.theme === 'dark') {
                  root.classList.add('dark');
                  root.setAttribute('data-theme', 'dark');
               } else {
                  root.classList.remove('dark');
                  root.setAttribute('data-theme', 'light');
               }
            }
         },
      }
   )
);
