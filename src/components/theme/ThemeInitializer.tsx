import { useEffect } from 'react';
import { useThemeStore } from '@/store';

export const ThemeInitializer = () => {
   const { theme } = useThemeStore();

   useEffect(() => {
      // Immediately apply theme to prevent flash
      const root = document.documentElement;

      // Clear any existing theme classes/attributes
      root.classList.remove('dark', 'light');
      root.removeAttribute('data-theme');

      // Apply current theme
      if (theme === 'dark') {
         root.classList.add('dark');
         root.setAttribute('data-theme', 'dark');
      } else {
         root.classList.add('light');
         root.setAttribute('data-theme', 'light');
      }
   }, [theme]);

   // Add initial theme detection script
   useEffect(() => {
      // This runs once on mount to set initial theme
      const savedTheme = localStorage.getItem('theme-storage');
      if (savedTheme) {
         try {
            const parsedData = JSON.parse(savedTheme);
            const theme = parsedData?.state?.theme || 'light';

            const root = document.documentElement;
            root.classList.remove('dark', 'light');

            if (theme === 'dark') {
               root.classList.add('dark');
               root.setAttribute('data-theme', 'dark');
            } else {
               root.classList.add('light');
               root.setAttribute('data-theme', 'light');
            }
         } catch (error) {
            console.warn('Error parsing theme from localStorage:', error);
            // Fallback to light theme
            document.documentElement.classList.add('light');
            document.documentElement.setAttribute('data-theme', 'light');
         }
      } else {
         // Default to light theme
         document.documentElement.classList.add('light');
         document.documentElement.setAttribute('data-theme', 'light');
      }
   }, []);

   return null; // This component doesn't render anything
};

export default ThemeInitializer;
