import { useState, useRef, useEffect, useCallback } from 'react';

interface UseProgressBarProps {
   duration: number;
   currentTime: number;
   onSeek: (time: number) => void;
   isMobile: boolean;
}

export const useProgressBar = ({ duration, currentTime, onSeek, isMobile }: UseProgressBarProps) => {
   const progressBarRef = useRef<HTMLDivElement>(null);
   const [isDragging, setIsDragging] = useState(false);
   const [hoverTime, setHoverTime] = useState(0);
   const [showHoverTime, setShowHoverTime] = useState(false);

   // Prevent time updates while dragging
   const displayTime = isDragging ? hoverTime : currentTime;

   const calculateTimeFromEvent = useCallback(
      (clientX: number) => {
         if (!progressBarRef.current || !duration) return 0;

         const rect = progressBarRef.current.getBoundingClientRect();
         const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
         return percent * duration;
      },
      [duration]
   );

   const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
         e.preventDefault();
         setIsDragging(true);

         const time = calculateTimeFromEvent(e.clientX);
         onSeek(time);
      },
      [calculateTimeFromEvent, onSeek]
   );

   const handleTouchStart = useCallback(
      (e: React.TouchEvent<HTMLDivElement>) => {
         e.preventDefault();
         setIsDragging(true);

         const time = calculateTimeFromEvent(e.touches[0].clientX);
         onSeek(time);
      },
      [calculateTimeFromEvent, onSeek]
   );

   const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
         if (!isMobile && progressBarRef.current && duration) {
            const time = calculateTimeFromEvent(e.clientX);
            setHoverTime(time);
            setShowHoverTime(true);
         }
      },
      [isMobile, calculateTimeFromEvent, duration]
   );

   const handleMouseLeave = useCallback(() => {
      if (!isMobile) {
         setShowHoverTime(false);
      }
   }, [isMobile]);

   // Global mouse/touch move handlers
   useEffect(() => {
      const handleGlobalMouseMove = (e: MouseEvent) => {
         if (isDragging) {
            const time = calculateTimeFromEvent(e.clientX);
            onSeek(time);
         }
      };

      const handleGlobalTouchMove = (e: TouchEvent) => {
         if (isDragging) {
            const time = calculateTimeFromEvent(e.touches[0].clientX);
            onSeek(time);
         }
      };

      const handleGlobalMouseUp = () => setIsDragging(false);
      const handleGlobalTouchEnd = () => setIsDragging(false);

      if (isDragging) {
         document.addEventListener('mousemove', handleGlobalMouseMove);
         document.addEventListener('mouseup', handleGlobalMouseUp);
         document.addEventListener('touchmove', handleGlobalTouchMove);
         document.addEventListener('touchend', handleGlobalTouchEnd);
      }

      return () => {
         document.removeEventListener('mousemove', handleGlobalMouseMove);
         document.removeEventListener('mouseup', handleGlobalMouseUp);
         document.removeEventListener('touchmove', handleGlobalTouchMove);
         document.removeEventListener('touchend', handleGlobalTouchEnd);
      };
   }, [isDragging, calculateTimeFromEvent, onSeek]);

   const progressPercent = duration ? (displayTime / duration) * 100 : 0;
   const hoverPercent = duration ? (hoverTime / duration) * 100 : 0;

   return {
      progressBarRef,
      isDragging,
      showHoverTime,
      hoverTime,
      progressPercent,
      hoverPercent,
      handleMouseDown,
      handleTouchStart,
      handleMouseMove,
      handleMouseLeave,
   };
};
