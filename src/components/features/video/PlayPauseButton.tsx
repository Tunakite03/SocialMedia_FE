import React from 'react';
import { Play, Pause } from 'lucide-react';

interface PlayPauseButtonProps {
   isPlaying: boolean;
   onToggle: () => void;
   showButton: boolean;
   size?: number;
}

export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({ isPlaying, onToggle, showButton, size = 40 }) => {
   if (!showButton) return null;

   return (
      <div
         onClick={(e) => {
            e.stopPropagation();
            onToggle();
         }}
         className='absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-all duration-200 anime-hover-scale'
      >
         <div className='bg-white/95 backdrop-blur-sm p-4 rounded-full shadow-2xl hover:bg-white transition-colors'>
            {isPlaying ? (
               <Pause
                  size={size}
                  className='text-black fill-black'
               />
            ) : (
               <Play
                  size={size}
                  className='text-black fill-black ml-1'
               />
            )}
         </div>
      </div>
   );
};
