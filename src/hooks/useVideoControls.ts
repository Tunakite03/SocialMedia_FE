import { useState, useEffect, useCallback } from 'react';

export const useDeviceDetection = () => {
   const [isMobile, setIsMobile] = useState(false);
   const [isTablet, setIsTablet] = useState(false);

   useEffect(() => {
      const checkDevice = () => {
         const width = window.innerWidth;
         const hasTouch = 'ontouchstart' in window;

         setIsMobile(width <= 768 || hasTouch);
         setIsTablet(width > 768 && width <= 1024);
      };

      checkDevice();
      window.addEventListener('resize', checkDevice);

      return () => window.removeEventListener('resize', checkDevice);
   }, []);

   return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
};

export const useFullscreen = (elementRef: React.RefObject<HTMLElement | null>) => {
   const [isFullscreen, setIsFullscreen] = useState(false);

   useEffect(() => {
      const handleFullscreenChange = () => {
         setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
   }, []);

   const enterFullscreen = useCallback(async () => {
      if (!elementRef.current || document.fullscreenElement) return;

      try {
         await elementRef.current.requestFullscreen();
      } catch (err) {
         console.error('Failed to enter fullscreen:', err);
      }
   }, [elementRef]);

   const exitFullscreen = useCallback(async () => {
      if (!document.fullscreenElement) return;

      try {
         await document.exitFullscreen();
      } catch (err) {
         console.error('Failed to exit fullscreen:', err);
      }
   }, []);

   const toggleFullscreen = useCallback(async () => {
      if (document.fullscreenElement) {
         await exitFullscreen();
      } else {
         await enterFullscreen();
      }
   }, [enterFullscreen, exitFullscreen]);

   return {
      isFullscreen,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen,
   };
};

export const useVideoControls = () => {
   const [showControls, setShowControls] = useState(false);
   const [showPlayButton, setShowPlayButton] = useState(true);

   const showControlsTemporary = useCallback((duration = 3000) => {
      setShowControls(true);
      setTimeout(() => setShowControls(false), duration);
   }, []);

   const hidePlayButton = useCallback(() => setShowPlayButton(false), []);
   const showPlayButtonTemporary = useCallback(() => setShowPlayButton(true), []);

   return {
      showControls,
      showPlayButton,
      setShowControls,
      setShowPlayButton,
      showControlsTemporary,
      hidePlayButton,
      showPlayButtonTemporary,
   };
};
