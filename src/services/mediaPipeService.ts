import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision';

export interface MediaPipeFaceResult {
   detected: boolean;
   landmarks?: number[][];
   blendshapes?: Record<string, number>;
   faceBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
   };
}

class MediaPipeService {
   private faceLandmarker: FaceLandmarker | null = null;
   private isInitialized = false;
   private isInitializing = false;

   async initialize(): Promise<void> {
      if (this.isInitialized || this.isInitializing) {
         console.log('[MediaPipe] Already initialized or initializing');
         return;
      }

      this.isInitializing = true;

      try {
         console.log('[MediaPipe] Initializing Face Landmarker...');

         // Load the MediaPipe Vision tasks
         const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
         );

         // Create Face Landmarker
         this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
               modelAssetPath:
                  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
               delegate: 'GPU',
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: false,
            runningMode: 'VIDEO',
            numFaces: 1,
         });

         this.isInitialized = true;
         console.log('[MediaPipe] Face Landmarker initialized successfully');
      } catch (error) {
         console.error('[MediaPipe] Failed to initialize:', error);
         throw error;
      } finally {
         this.isInitializing = false;
      }
   }

   async detectFace(videoElement: HTMLVideoElement, timestamp: number): Promise<MediaPipeFaceResult> {
      if (!this.isInitialized || !this.faceLandmarker) {
         await this.initialize();
      }

      if (!this.faceLandmarker) {
         return { detected: false };
      }

      // CRITICAL: Check if video has valid dimensions
      if (!videoElement.videoWidth || !videoElement.videoHeight) {
         // Video not ready yet, silently return
         return { detected: false };
      }

      // Check if video is playing and has actual content
      if (videoElement.readyState < 2) {
         // Video metadata not loaded yet
         return { detected: false };
      }

      try {
         // Detect faces
         const results: FaceLandmarkerResult = this.faceLandmarker.detectForVideo(videoElement, timestamp);

         if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
            return { detected: false };
         }

         // Get first face
         const faceLandmarks = results.faceLandmarks[0];
         const faceBlendshapes = results.faceBlendshapes?.[0];

         // Calculate bounding box from landmarks
         const xs = faceLandmarks.map((lm) => lm.x);
         const ys = faceLandmarks.map((lm) => lm.y);
         const minX = Math.min(...xs);
         const maxX = Math.max(...xs);
         const minY = Math.min(...ys);
         const maxY = Math.max(...ys);

         // Convert to pixel coordinates
         const width = videoElement.videoWidth;
         const height = videoElement.videoHeight;

         const faceBox = {
            x: minX * width,
            y: minY * height,
            width: (maxX - minX) * width,
            height: (maxY - minY) * height,
         };

         // Extract blendshapes as a simple object
         const blendshapesMap: Record<string, number> = {};
         if (faceBlendshapes?.categories) {
            for (const category of faceBlendshapes.categories) {
               blendshapesMap[category.categoryName] = category.score;
            }
         }

         return {
            detected: true,
            landmarks: faceLandmarks.map((lm) => [lm.x, lm.y, lm.z || 0]),
            blendshapes: blendshapesMap,
            faceBox,
         };
      } catch (error) {
         console.error('[MediaPipe] Detection error:', error);
         return { detected: false };
      }
   }

   isReady(): boolean {
      return this.isInitialized;
   }

   cleanup(): void {
      if (this.faceLandmarker) {
         this.faceLandmarker.close();
         this.faceLandmarker = null;
      }
      this.isInitialized = false;
   }
}

export const mediaPipeService = new MediaPipeService();
