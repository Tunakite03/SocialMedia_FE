import React from 'react';
import { useProgressBar } from '@/hooks/useProgressBar';

interface VideoProgressBarProps {
   duration: number;
   currentTime: number;
   onSeek: (time: number) => void;
   isMobile: boolean;
}

const formatTime = (seconds: number): string => {
   if (!seconds || isNaN(seconds)) return '0:00';
   const mins = Math.floor(seconds / 60);
   const secs = Math.floor(seconds % 60);
   return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VideoProgressBar: React.FC<VideoProgressBarProps> = ({ duration, currentTime, onSeek, isMobile }) => {
   const {
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
   } = useProgressBar({ duration, currentTime, onSeek, isMobile });

   return (
      <div className='relative mb-3'>
         {/* Hover time tooltip - only on desktop */}
         {showHoverTime && !isMobile && (
            <div
               className='absolute -top-8 bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none z-10'
               style={{
                  left: `${hoverPercent}%`,
                  transform: 'translateX(-50%)',
               }}
            >
               {formatTime(hoverTime)}
            </div>
         )}

         <div
            ref={progressBarRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`w-full bg-white/30 rounded-full cursor-pointer relative transition-all ${
               isMobile ? 'h-3' : 'h-2 hover:h-3'
            }`}
         >
            {/* Progress fill */}
            <div
               className='h-full bg-linear-to-r from-blue-400 to-blue-500 rounded-full transition-all'
               style={{ width: `${progressPercent}%` }}
            />

            {/* Draggable handle */}
            <div
               className={`absolute top-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg transition-all ${
                  isMobile
                     ? 'w-5 h-5 opacity-100'
                     : `w-4 h-4 ${
                          isDragging || showHoverTime ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'
                       }`
               }`}
               style={{
                  left: `calc(${progressPercent}% - ${isMobile ? '10px' : '8px'})`,
               }}
            />
         </div>
      </div>
   );
};
