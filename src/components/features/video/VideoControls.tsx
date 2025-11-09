import React from 'react';
import { Play, Pause, Maximize2, Minimize2 } from 'lucide-react';

interface VideoControlsProps {
   isPlaying: boolean;
   currentTime: number;
   duration: number;
   isFullscreen: boolean;
   isMobile: boolean;
   onTogglePlay: () => void;
   onToggleFullscreen: () => void;
}

const formatTime = (seconds: number): string => {
   if (!seconds || isNaN(seconds)) return '0:00';
   const mins = Math.floor(seconds / 60);
   const secs = Math.floor(seconds % 60);
   return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VideoControls: React.FC<VideoControlsProps> = ({
   isPlaying,
   currentTime,
   duration,
   isFullscreen,
   isMobile,
   onTogglePlay,
   onToggleFullscreen,
}) => {
   return (
      <div className='flex items-center justify-between text-xs text-white'>
         <div className='flex items-center gap-3'>
            <span className='font-mono'>
               {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Mobile play/pause button */}
            {isMobile && (
               <button
                  onClick={(e) => {
                     e.stopPropagation();
                     onTogglePlay();
                  }}
                  className='flex items-center justify-center p-1 hover:bg-white/20 rounded transition-colors'
                  title={isPlaying ? 'Pause' : 'Play'}
               >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
               </button>
            )}
         </div>

         <button
            onClick={(e) => {
               e.stopPropagation();
               onToggleFullscreen();
            }}
            className={`hover:bg-white/20 rounded transition-colors ${isMobile ? 'p-2' : 'p-1'}`}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
         >
            {isFullscreen ? <Minimize2 size={isMobile ? 20 : 16} /> : <Maximize2 size={isMobile ? 20 : 16} />}
         </button>
      </div>
   );
};
