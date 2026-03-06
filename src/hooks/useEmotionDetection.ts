import { useEffect, useRef, useState, useCallback } from 'react';
import {
   emotionDetectionService,
   type FaceDetectionResult,
   type EmotionData,
} from '@/services/emotionDetectionService';

interface UseEmotionDetectionOptions {
   enabled?: boolean;
   intervalMs?: number;
   onEmotionChange?: (emotion: EmotionData) => void;
}

interface UseEmotionDetectionReturn {
   currentEmotion: EmotionData | null;
   isDetecting: boolean;
   faceDetected: boolean;
   error: string | null;
   startDetection: () => Promise<void>;
   stopDetection: () => void;
   canvasRef: React.RefObject<HTMLCanvasElement>;
}

/**
 * Hook để handle emotion detection từ video element
 */
export const useEmotionDetection = (
   videoElement: HTMLVideoElement | null,
   options: UseEmotionDetectionOptions = {},
): UseEmotionDetectionReturn => {
   const { enabled = true, intervalMs = 1000, onEmotionChange } = options;

   const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
   const [isDetecting, setIsDetecting] = useState(false);
   const [faceDetected, setFaceDetected] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const canvasRef = useRef<HTMLCanvasElement>(null);
   const isInitializedRef = useRef(false);
   const mountedRef = useRef(true);

   /**
    * Initialize models
    */
   const initializeModels = useCallback(async () => {
      if (isInitializedRef.current || !enabled) {
         return;
      }

      try {
         setError(null);
         console.log('[useEmotionDetection] Initializing face-api models...');
         await emotionDetectionService.loadModels();
         isInitializedRef.current = true;
         console.log('[useEmotionDetection] Models initialized successfully');
      } catch (err) {
         console.error('[useEmotionDetection] Failed to initialize models:', err);
         setError('Không thể tải models nhận diện cảm xúc');
      }
   }, [enabled]);

   /**
    * Start detection
    */
   const startDetection = useCallback(async () => {
      console.log('[useEmotionDetection] startDetection called:', {
         hasVideoElement: !!videoElement,
         enabled,
         isDetecting,
         isInitialized: isInitializedRef.current,
      });

      if (!videoElement || !enabled || isDetecting) {
         console.log('[useEmotionDetection] Cannot start detection:', {
            reason: !videoElement ? 'No video element' : !enabled ? 'Not enabled' : 'Already detecting',
         });
         return;
      }

      // Ensure models are loaded
      if (!isInitializedRef.current) {
         console.log('[useEmotionDetection] Models not initialized, initializing now...');
         await initializeModels();
      }

      if (!isInitializedRef.current) {
         console.error('[useEmotionDetection] Models not initialized');
         return;
      }

      setIsDetecting(true);
      setError(null);

      console.log('[useEmotionDetection] Starting continuous detection...');

      emotionDetectionService.startContinuousDetection(
         videoElement,
         (result: FaceDetectionResult) => {
            if (!mountedRef.current) return;

            setFaceDetected(result.detected);

            if (result.detected && result.emotion) {
               setCurrentEmotion(result.emotion);
               onEmotionChange?.(result.emotion);

               // Draw on canvas if available
               if (canvasRef.current && videoElement) {
                  // Match canvas size to video size
                  if (
                     canvasRef.current.width !== videoElement.videoWidth ||
                     canvasRef.current.height !== videoElement.videoHeight
                  ) {
                     canvasRef.current.width = videoElement.videoWidth;
                     canvasRef.current.height = videoElement.videoHeight;
                  }

                  emotionDetectionService.drawFaceDetection(canvasRef.current, videoElement, result);
               }
            } else {
               // Clear canvas if no face detected
               if (canvasRef.current) {
                  const ctx = canvasRef.current.getContext('2d');
                  ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
               }
            }
         },
         intervalMs,
      );
   }, [videoElement, enabled, isDetecting, intervalMs, onEmotionChange, initializeModels]);

   /**
    * Stop detection
    */
   const stopDetection = useCallback(() => {
      console.log('[useEmotionDetection] Stopping detection...');
      emotionDetectionService.stopContinuousDetection();
      setIsDetecting(false);
      setFaceDetected(false);
      setCurrentEmotion(null);

      // Clear canvas
      if (canvasRef.current) {
         const ctx = canvasRef.current.getContext('2d');
         ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
   }, []);

   /**
    * Auto-start detection when video element is ready
    * Re-runs when videoElement, enabled, or detecting state changes
    */
   useEffect(() => {
      if (!videoElement || !enabled) {
         // Stop detection if disabled or video removed
         if (isDetecting) {
            stopDetection();
         }
         return;
      }

      // Don't start if already detecting
      if (isDetecting) {
         return;
      }

      const handleVideoReady = () => {
         if (videoElement.readyState >= 2) {
            console.log('[useEmotionDetection] Video ready, starting detection...');
            startDetection();
         }
      };

      // Check if video is already ready
      if (videoElement.readyState >= 2) {
         handleVideoReady();
      } else {
         videoElement.addEventListener('loadeddata', handleVideoReady);
         videoElement.addEventListener('canplay', handleVideoReady);
         return () => {
            videoElement.removeEventListener('loadeddata', handleVideoReady);
            videoElement.removeEventListener('canplay', handleVideoReady);
         };
      }
   }, [videoElement, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

   /**
    * Cleanup on unmount
    */
   useEffect(() => {
      mountedRef.current = true;

      return () => {
         mountedRef.current = false;
         stopDetection();
      };
   }, [stopDetection]);

   return {
      currentEmotion,
      isDetecting,
      faceDetected,
      error,
      startDetection,
      stopDetection,
      canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
   };
};
