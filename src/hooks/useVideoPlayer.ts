import { useState, useRef, useEffect, useCallback } from 'react';

export const useVideoPlayer = () => {
   const videoRef = useRef<HTMLVideoElement>(null);
   const [isPlaying, setIsPlaying] = useState(false);
   const [currentTime, setCurrentTime] = useState(0);
   const [duration, setDuration] = useState(0);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handleTimeUpdate = () => {
         setCurrentTime(video.currentTime);
      };

      const handleLoadedMetadata = () => {
         setDuration(video.duration);
         setIsLoading(false);
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);

      return () => {
         video.removeEventListener('timeupdate', handleTimeUpdate);
         video.removeEventListener('loadedmetadata', handleLoadedMetadata);
         video.removeEventListener('play', handlePlay);
         video.removeEventListener('pause', handlePause);
         video.removeEventListener('ended', handleEnded);
      };
   }, []);

   const play = useCallback(() => {
      videoRef.current?.play();
   }, []);

   const pause = useCallback(() => {
      videoRef.current?.pause();
   }, []);

   const togglePlay = useCallback(() => {
      if (videoRef.current) {
         if (videoRef.current.paused) {
            play();
         } else {
            pause();
         }
      }
   }, [play, pause]);

   const seekTo = useCallback(
      (time: number) => {
         if (videoRef.current && duration) {
            const clampedTime = Math.max(0, Math.min(time, duration));
            videoRef.current.currentTime = clampedTime;
            setCurrentTime(clampedTime);
         }
      },
      [duration]
   );

   const seekToPercent = useCallback(
      (percent: number) => {
         const time = (percent / 100) * duration;
         seekTo(time);
      },
      [duration, seekTo]
   );

   return {
      videoRef,
      isPlaying,
      currentTime,
      duration,
      isLoading,
      play,
      pause,
      togglePlay,
      seekTo,
      seekToPercent,
   };
};
