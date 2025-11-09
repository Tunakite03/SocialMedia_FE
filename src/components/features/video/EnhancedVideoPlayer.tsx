import React, { useCallback } from 'react';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { useDeviceDetection, useFullscreen, useVideoControls } from '@/hooks/useVideoControls';
import { PlayPauseButton } from './PlayPauseButton';
import { VideoProgressBar } from './VideoProgressBar';
import { VideoControls } from './VideoControls';

interface EnhancedVideoPlayerProps {
   src: string;
   autoPlay?: boolean;
   muted?: boolean;
   loop?: boolean;
   onPlayStateChange?: (isPlaying: boolean) => void;
   onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
   src,
   autoPlay = false,
   muted = false,
   loop = false,
   onPlayStateChange,
   onTimeUpdate,
}) => {
   const { isMobile } = useDeviceDetection();
   const { videoRef, isPlaying, currentTime, duration, isLoading, togglePlay, seekTo } = useVideoPlayer();

   const containerRef = React.useRef<HTMLDivElement>(null);
   const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

   const { showControls, showPlayButton, setShowPlayButton, showControlsTemporary } = useVideoControls();

   // Handle play state changes
   React.useEffect(() => {
      onPlayStateChange?.(isPlaying);
      setShowPlayButton(!isPlaying);
   }, [isPlaying, onPlayStateChange, setShowPlayButton]);

   // Handle time updates
   React.useEffect(() => {
      onTimeUpdate?.(currentTime, duration);
   }, [currentTime, duration, onTimeUpdate]);

   const handleContainerClick = useCallback(
      (e: React.MouseEvent) => {
         // Ignore clicks on controls area
         if ((e.target as HTMLElement).closest('.controls-area')) {
            return;
         }

         if (isMobile) {
            // On mobile: first tap shows controls, second tap plays/pauses
            if (showControls) {
               togglePlay();
            } else {
               showControlsTemporary(3000);
            }
         } else {
            togglePlay();
         }
      },
      [isMobile, showControls, togglePlay, showControlsTemporary]
   );

   const shouldShowControls = isMobile ? showControls : true; // Desktop shows on hover via CSS

   return (
      <div
         ref={containerRef}
         className='relative w-full aspect-video bg-black rounded-2xl overflow-hidden group cursor-pointer'
         onClick={handleContainerClick}
      >
         <video
            ref={videoRef}
            src={src}
            className='w-full h-full object-cover'
            autoPlay={autoPlay}
            muted={muted}
            loop={loop}
            playsInline
         />

         {/* Loading state */}
         {isLoading && (
            <div className='absolute inset-0 flex items-center justify-center bg-black/50'>
               <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-white'></div>
            </div>
         )}

         {/* Play/Pause Button */}
         <PlayPauseButton
            isPlaying={isPlaying}
            onToggle={togglePlay}
            showButton={showPlayButton && !isLoading}
         />

         {/* Controls overlay */}
         <div
            className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3 transition-opacity duration-200 controls-area ${
               isMobile ? (shouldShowControls ? 'opacity-100' : 'opacity-0') : 'opacity-0 group-hover:opacity-100'
            }`}
         >
            <VideoProgressBar
               duration={duration}
               currentTime={currentTime}
               onSeek={seekTo}
               isMobile={isMobile}
            />

            <VideoControls
               isPlaying={isPlaying}
               currentTime={currentTime}
               duration={duration}
               isFullscreen={isFullscreen}
               isMobile={isMobile}
               onTogglePlay={togglePlay}
               onToggleFullscreen={toggleFullscreen}
            />
         </div>
      </div>
   );
};
