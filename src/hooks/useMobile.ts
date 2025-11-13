import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current device is mobile based on screen width
 * @param breakpoint - The width breakpoint for mobile detection (default: 768px)
 * @returns boolean indicating if the device is considered mobile
 */
export const useMobile = (breakpoint: number = 768): boolean => {
   const [isMobile, setIsMobile] = useState<boolean>(false);

   useEffect(() => {
      // Check if window is available (SSR safety)
      if (typeof window === 'undefined') return;

      const checkIsMobile = () => {
         setIsMobile(window.innerWidth < breakpoint);
      };

      // Set initial value
      checkIsMobile();

      // Add resize listener
      window.addEventListener('resize', checkIsMobile);

      // Cleanup
      return () => window.removeEventListener('resize', checkIsMobile);
   }, [breakpoint]);

   return isMobile;
};
