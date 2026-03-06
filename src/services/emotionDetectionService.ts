import { mediaPipeService, type MediaPipeFaceResult } from './mediaPipeService';
import * as faceapi from '@vladmandic/face-api';

export interface EmotionData {
   emotion: string;
   confidence: number;
   allEmotions: {
      neutral: number;
      happy: number;
      sad: number;
      angry: number;
      fearful: number;
      disgusted: number;
      surprised: number;
   };
   timestamp: number;
}

export interface FaceDetectionResult {
   detected: boolean;
   emotion?: EmotionData;
   facePosition?: {
      x: number;
      y: number;
      width: number;
      height: number;
   };
}

export type DetectorType = 'face-api'; // Using face-api.js (trained model)
export type FaceDetectorModel = 'tiny' | 'ssd'; // tiny = TinyFaceDetector, ssd = SSD MobileNet v1

interface EmotionResult {
   emotion: string;
   confidence: number;
   allEmotions: {
      neutral: number;
      happy: number;
      sad: number;
      angry: number;
      fearful: number;
      disgusted: number;
      surprised: number;
   };
}

interface DetectionOptions {
   minConfidence?: number;
   minFaceSize?: number;
   detectorType?: DetectorType;
   quality?: 'fast' | 'balanced' | 'accurate'; // Chất lượng detection
   useBlendshapes?: boolean; // Có dùng MediaPipe blendshapes không
   faceDetector?: FaceDetectorModel; // 'tiny' hoặc 'ssd' (SSD chính xác hơn)
}

class EmotionDetectionService {
   private modelsLoaded = false;
   private isLoading = false;
   private detectionInterval: number | null = null;
   private lastEmotionData: EmotionData | null = null;
   private minConfidence = 0.25;
   private minFaceSize = 50;
   private emaEmotions: Record<string, number> | null = null;
   private emaAlpha = 0.5; // Higher alpha = faster reaction to new expressions
   private currentStableEmotion: string | null = null;
   private stableEmotionSince = 0; // Timestamp when current stable emotion started
   private hysteresisThreshold = 0.12; // Higher threshold = less flickering
   private minHoldTimeMs = 600; // Minimum time to hold an emotion before switching
   private confidenceGate = 0.15; // Min confidence to accept an emotion detection
   private modelPath = '/models';
   private detectorType: DetectorType = 'face-api';

   // face-api.js optimization settings
   private faceApiInputSize = 512;
   private faceApiScoreThreshold = 0.3;
   private useMediaPipeBlendshapes = true;
   private faceDetectorModel: FaceDetectorModel = 'ssd';

   async loadModels(): Promise<void> {
      if (this.modelsLoaded || this.isLoading) {
         console.log('[EmotionDetection] Models already loaded or loading');
         return;
      }

      this.isLoading = true;

      try {
         console.log('[EmotionDetection] Loading models with detector:', this.detectorType);
         console.log('[EmotionDetection] Face detector model:', this.faceDetectorModel);

         // Always load MediaPipe for face detection
         await mediaPipeService.initialize();

         // Load face-api.js models
         console.log('[EmotionDetection] Using face-api.js (trained model)');

         const modelsToLoad: Promise<void>[] = [faceapi.nets.faceExpressionNet.loadFromUri(this.modelPath)];

         // Load face detector based on setting
         if (this.faceDetectorModel === 'ssd') {
            console.log('[EmotionDetection] Loading SSD MobileNet v1 (more accurate)');
            modelsToLoad.push(faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelPath));
         } else {
            console.log('[EmotionDetection] Loading TinyFaceDetector (faster)');
            modelsToLoad.push(faceapi.nets.tinyFaceDetector.loadFromUri(this.modelPath));
         }

         await Promise.all(modelsToLoad);

         this.modelsLoaded = true;
         console.log('[EmotionDetection] All models loaded successfully');
      } catch (error) {
         console.error('[EmotionDetection] Failed to load models:', error);
         throw error;
      } finally {
         this.isLoading = false;
      }
   }

   setDetectionOptions(options: DetectionOptions): void {
      if (options.minConfidence !== undefined) {
         this.minConfidence = options.minConfidence;
      }
      if (options.minFaceSize !== undefined) {
         this.minFaceSize = options.minFaceSize;
      }
      if (options.detectorType !== undefined) {
         this.detectorType = options.detectorType;
      }
      if (options.useBlendshapes !== undefined) {
         this.useMediaPipeBlendshapes = options.useBlendshapes;
      }
      if (options.quality !== undefined) {
         this.setQualityPreset(options.quality);
      }
      if (options.faceDetector !== undefined && options.faceDetector !== this.faceDetectorModel) {
         // Cần reload model nếu đổi face detector
         this.faceDetectorModel = options.faceDetector;
         this.modelsLoaded = false; // Force reload
         console.log(`[EmotionDetection] Switching face detector to: ${options.faceDetector}`);
      }
      console.log('[EmotionDetection] Options updated:', {
         minConfidence: this.minConfidence,
         minFaceSize: this.minFaceSize,
         detectorType: this.detectorType,
         faceDetector: this.faceDetectorModel,
         quality: { inputSize: this.faceApiInputSize, scoreThreshold: this.faceApiScoreThreshold },
         useBlendshapes: this.useMediaPipeBlendshapes,
      });
   }

   /**
    * Get current face detector model
    */
   getFaceDetectorModel(): FaceDetectorModel {
      return this.faceDetectorModel;
   }

   /**
    * Set detection quality preset
    * - fast: inputSize=320, nhanh nhưng kém chính xác
    * - balanced: inputSize=416, cân bằng (mặc định cũ)
    * - accurate: inputSize=512-608, chính xác nhất nhưng chậm hơn
    */
   private setQualityPreset(quality: 'fast' | 'balanced' | 'accurate'): void {
      switch (quality) {
         case 'fast':
            this.faceApiInputSize = 320;
            this.faceApiScoreThreshold = 0.4;
            this.emaAlpha = 0.6;
            this.minHoldTimeMs = 400;
            break;
         case 'balanced':
            this.faceApiInputSize = 416;
            this.faceApiScoreThreshold = 0.35;
            this.emaAlpha = 0.5;
            this.minHoldTimeMs = 600;
            break;
         case 'accurate':
            this.faceApiInputSize = 512;
            this.faceApiScoreThreshold = 0.3;
            this.emaAlpha = 0.45;
            this.minHoldTimeMs = 800;
            break;
      }
      console.log(`[EmotionDetection] Quality preset: ${quality} (inputSize=${this.faceApiInputSize})`);
   }

   async detectEmotion(videoElement: HTMLVideoElement): Promise<FaceDetectionResult> {
      if (!this.modelsLoaded) {
         await this.loadModels();
      }

      // CRITICAL: Validate video element before processing
      if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
         // Video not ready, return silently without error
         return { detected: false };
      }

      if (videoElement.readyState < 2) {
         // Video metadata not loaded yet
         return { detected: false };
      }

      try {
         const now = performance.now();

         // Step 1: Detect face with MediaPipe (better detection)
         const mpResult: MediaPipeFaceResult = await mediaPipeService.detectFace(videoElement, now);

         if (!mpResult.detected || !mpResult.faceBox) {
            return { detected: false };
         }

         // Check face size
         const faceSize = Math.min(mpResult.faceBox.width, mpResult.faceBox.height);
         if (faceSize < this.minFaceSize) {
            return { detected: false };
         }

         // Step 2: Detect emotion with face-api.js (enhanced với MediaPipe blendshapes)
         const emotionResult = await this.detectEmotionWithFaceAPI(videoElement, mpResult.blendshapes);

         if (!emotionResult) {
            return { detected: false };
         }

         // Convert to normalized format (0-1)
         const expressions: Record<string, number> = {
            neutral: emotionResult.allEmotions.neutral / 100,
            happy: emotionResult.allEmotions.happy / 100,
            sad: emotionResult.allEmotions.sad / 100,
            angry: emotionResult.allEmotions.angry / 100,
            fearful: emotionResult.allEmotions.fearful / 100,
            disgusted: emotionResult.allEmotions.disgusted / 100,
            surprised: emotionResult.allEmotions.surprised / 100,
         };

         // EMA Smoothing with adaptive alpha
         if (!this.emaEmotions) {
            this.emaEmotions = { ...expressions };
         } else {
            for (const key of Object.keys(expressions)) {
               // Use higher alpha for large changes (faster reaction)
               const diff = Math.abs(expressions[key] - (this.emaEmotions[key] || 0));
               const adaptiveAlpha = diff > 0.3 ? Math.min(this.emaAlpha + 0.2, 0.8) : this.emaAlpha;
               this.emaEmotions[key] =
                  (this.emaEmotions[key] || 0) * (1 - adaptiveAlpha) + expressions[key] * adaptiveAlpha;
            }
         }

         const finalExpressions = { ...this.emaEmotions };

         // Hysteresis + Temporal Stability
         const sorted = Object.entries(finalExpressions).sort((a, b) => b[1] - a[1]);
         const [topEmotion, topConfidence] = sorted[0];

         let finalEmotion = topEmotion;
         let finalConfidence = topConfidence;

         // Gate: ignore if top confidence is too low
         if (topConfidence < this.confidenceGate) {
            finalEmotion = this.currentStableEmotion || 'neutral';
            finalConfidence = finalExpressions[finalEmotion] || 0;
         } else if (this.currentStableEmotion && this.currentStableEmotion !== topEmotion) {
            const currentEmotionScore = finalExpressions[this.currentStableEmotion] || 0;
            const holdElapsed = Date.now() - this.stableEmotionSince;

            // Only switch if: new emotion exceeds threshold AND minimum hold time elapsed
            if (topConfidence > currentEmotionScore + this.hysteresisThreshold && holdElapsed >= this.minHoldTimeMs) {
               this.currentStableEmotion = topEmotion;
               this.stableEmotionSince = Date.now();
            } else {
               finalEmotion = this.currentStableEmotion;
               finalConfidence = finalExpressions[finalEmotion] || 0;
            }
         } else if (!this.currentStableEmotion) {
            this.currentStableEmotion = topEmotion;
            this.stableEmotionSince = Date.now();
         }

         const emotionData: EmotionData = {
            emotion: this.translateEmotion(finalEmotion),
            confidence: Math.round(finalConfidence * 100),
            allEmotions: {
               neutral: Math.round(finalExpressions.neutral * 100),
               happy: Math.round(finalExpressions.happy * 100),
               sad: Math.round(finalExpressions.sad * 100),
               angry: Math.round(finalExpressions.angry * 100),
               fearful: Math.round(finalExpressions.fearful * 100),
               disgusted: Math.round(finalExpressions.disgusted * 100),
               surprised: Math.round(finalExpressions.surprised * 100),
            },
            timestamp: Date.now(),
         };

         this.lastEmotionData = emotionData;

         // Use MediaPipe's face box for drawing
         return {
            detected: true,
            emotion: emotionData,
            facePosition: mpResult.faceBox,
         };
      } catch (error) {
         console.error('[EmotionDetection] Detection error:', error);
         return { detected: false };
      }
   }

   /**
    * Detect emotion using face-api.js with optimized settings
    */
   private async detectEmotionWithFaceAPI(
      videoElement: HTMLVideoElement,
      blendshapes?: Record<string, number>,
   ): Promise<EmotionResult | null> {
      try {
         // Chọn detector dựa trên setting
         let faceApiResult;

         if (this.faceDetectorModel === 'ssd') {
            // SSD MobileNet v1 - Chính xác hơn, chậm hơn một chút
            const ssdOptions = new faceapi.SsdMobilenetv1Options({
               minConfidence: this.faceApiScoreThreshold,
            });
            faceApiResult = await faceapi.detectSingleFace(videoElement, ssdOptions).withFaceExpressions();
         } else {
            // TinyFaceDetector - Nhanh hơn, kém chính xác hơn
            const tinyOptions = new faceapi.TinyFaceDetectorOptions({
               inputSize: this.faceApiInputSize,
               scoreThreshold: this.faceApiScoreThreshold,
            });
            faceApiResult = await faceapi.detectSingleFace(videoElement, tinyOptions).withFaceExpressions();
         }

         if (!faceApiResult || !faceApiResult.expressions) {
            return null;
         }

         let expressions: Record<string, number> = { ...faceApiResult.expressions };

         // Kết hợp với MediaPipe blendshapes nếu có (cải thiện độ chính xác)
         if (this.useMediaPipeBlendshapes && blendshapes) {
            expressions = this.enhanceWithBlendshapes(expressions, blendshapes);
         }

         // Adaptive neutral suppression: suppress more when other emotions are present
         const nonNeutralMax = Math.max(
            expressions.happy || 0,
            expressions.sad || 0,
            expressions.angry || 0,
            expressions.fearful || 0,
            expressions.disgusted || 0,
            expressions.surprised || 0,
         );
         const neutralFactor = nonNeutralMax > 0.15 ? 0.6 : 0.85;
         expressions.neutral = (expressions.neutral || 0) * neutralFactor;

         // Proportional boost for subtle emotions based on their current strength
         expressions.sad = (expressions.sad || 0) * 1.2;
         expressions.angry = (expressions.angry || 0) * 1.15;
         expressions.fearful = (expressions.fearful || 0) * 1.15;
         expressions.disgusted = (expressions.disgusted || 0) * 1.1;

         // Normalize
         expressions = this.normalize(expressions);

         // Softmax with moderate temperature — high enough to preserve mixed emotions
         expressions = this.softmax(expressions, 0.65);

         // Get top emotion
         const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
         const [topEmotion, topConfidence] = sorted[0];

         return {
            emotion: this.translateEmotion(topEmotion),
            confidence: Math.round(topConfidence * 100),
            allEmotions: {
               angry: Math.round(expressions.angry * 100),
               disgusted: Math.round(expressions.disgusted * 100),
               fearful: Math.round(expressions.fearful * 100),
               happy: Math.round(expressions.happy * 100),
               neutral: Math.round(expressions.neutral * 100),
               sad: Math.round(expressions.sad * 100),
               surprised: Math.round(expressions.surprised * 100),
            },
         };
      } catch (error) {
         console.error('[EmotionDetection] face-api.js detection error:', error);
         return null;
      }
   }

   /**
    * Enhance face-api.js expressions với MediaPipe blendshapes
    * MediaPipe có 52 blendshapes chi tiết hơn, ta map sang 7 emotions
    */
   /**
    * Enhanced blendshape-to-emotion mapping using weighted facial action units.
    * Each shape has an individual weight reflecting its importance to the emotion.
    */
   private enhanceWithBlendshapes(
      expressions: Record<string, number>,
      blendshapes: Record<string, number>,
   ): Record<string, number> {
      const blendshapeEmotionMap: Record<string, { shapes: { name: string; w: number }[]; blendWeight: number }> = {
         happy: {
            shapes: [
               { name: 'mouthSmileLeft', w: 0.35 },
               { name: 'mouthSmileRight', w: 0.35 },
               { name: 'cheekSquintLeft', w: 0.15 },
               { name: 'cheekSquintRight', w: 0.15 },
               { name: 'mouthDimpleLeft', w: 0.05 },
               { name: 'mouthDimpleRight', w: 0.05 },
            ],
            blendWeight: 0.4,
         },
         sad: {
            shapes: [
               { name: 'mouthFrownLeft', w: 0.25 },
               { name: 'mouthFrownRight', w: 0.25 },
               { name: 'browDownLeft', w: 0.15 },
               { name: 'browDownRight', w: 0.15 },
               { name: 'browInnerUp', w: 0.15 },
               { name: 'mouthPucker', w: 0.05 },
            ],
            blendWeight: 0.35,
         },
         angry: {
            shapes: [
               { name: 'browDownLeft', w: 0.2 },
               { name: 'browDownRight', w: 0.2 },
               { name: 'eyeSquintLeft', w: 0.15 },
               { name: 'eyeSquintRight', w: 0.15 },
               { name: 'jawForward', w: 0.1 },
               { name: 'mouthPressLeft', w: 0.1 },
               { name: 'mouthPressRight', w: 0.1 },
            ],
            blendWeight: 0.35,
         },
         surprised: {
            shapes: [
               { name: 'browOuterUpLeft', w: 0.2 },
               { name: 'browOuterUpRight', w: 0.2 },
               { name: 'eyeWideLeft', w: 0.2 },
               { name: 'eyeWideRight', w: 0.2 },
               { name: 'jawOpen', w: 0.15 },
               { name: 'browInnerUp', w: 0.05 },
            ],
            blendWeight: 0.4,
         },
         fearful: {
            shapes: [
               { name: 'browInnerUp', w: 0.25 },
               { name: 'eyeWideLeft', w: 0.2 },
               { name: 'eyeWideRight', w: 0.2 },
               { name: 'mouthOpen', w: 0.15 },
               { name: 'jawOpen', w: 0.1 },
               { name: 'mouthStretchLeft', w: 0.05 },
               { name: 'mouthStretchRight', w: 0.05 },
            ],
            blendWeight: 0.3,
         },
         disgusted: {
            shapes: [
               { name: 'noseSneerLeft', w: 0.25 },
               { name: 'noseSneerRight', w: 0.25 },
               { name: 'mouthUpperUpLeft', w: 0.15 },
               { name: 'mouthUpperUpRight', w: 0.15 },
               { name: 'mouthShrugLower', w: 0.1 },
               { name: 'browDownLeft', w: 0.05 },
               { name: 'browDownRight', w: 0.05 },
            ],
            blendWeight: 0.3,
         },
      };

      const enhanced = { ...expressions };

      for (const [emotion, config] of Object.entries(blendshapeEmotionMap)) {
         let weightedScore = 0;
         let totalWeight = 0;

         for (const { name, w } of config.shapes) {
            if (blendshapes[name] !== undefined) {
               weightedScore += blendshapes[name] * w;
               totalWeight += w;
            }
         }

         if (totalWeight > 0) {
            const normalizedScore = weightedScore / totalWeight;
            enhanced[emotion] = enhanced[emotion] * (1 - config.blendWeight) + normalizedScore * config.blendWeight;
         }
      }

      return enhanced;
   }

   startContinuousDetection(
      videoElement: HTMLVideoElement,
      callback: (result: FaceDetectionResult) => void,
      intervalMs = 1000,
   ): void {
      if (this.detectionInterval) {
         this.stopContinuousDetection();
      }

      this.detectionInterval = window.setInterval(async () => {
         const result = await this.detectEmotion(videoElement);
         callback(result);
      }, intervalMs);
   }

   stopContinuousDetection(): void {
      if (this.detectionInterval) {
         clearInterval(this.detectionInterval);
         this.detectionInterval = null;
      }
      this.emaEmotions = null;
      this.currentStableEmotion = null;
      this.stableEmotionSince = 0;
      this.lastEmotionData = null;
   }

   getLastEmotion(): EmotionData | null {
      return this.lastEmotionData;
   }

   clearEmotionHistory(): void {
      this.emaEmotions = null;
      this.currentStableEmotion = null;
      this.stableEmotionSince = 0;
   }

   private normalize(expressions: Record<string, number>): Record<string, number> {
      const total = Object.values(expressions).reduce((acc, val) => acc + val, 0);
      if (total === 0) return expressions;

      const result: Record<string, number> = {};
      for (const [key, val] of Object.entries(expressions)) {
         result[key] = val / total;
      }
      return result;
   }

   private softmax(expressions: Record<string, number>, temperature = 1.0): Record<string, number> {
      const mapped = Object.entries(expressions).map(([key, val]) => {
         return [key, Math.exp(val / temperature)] as [string, number];
      });

      const sum = mapped.reduce((acc, [_, val]) => acc + val, 0);

      const result: Record<string, number> = {};
      for (const [key, val] of mapped) {
         result[key] = val / sum;
      }
      return result;
   }

   drawFaceDetection(canvas: HTMLCanvasElement, _videoElement: HTMLVideoElement, result: FaceDetectionResult): void {
      const ctx = canvas.getContext('2d');
      if (!ctx || !result.detected || !result.facePosition || !result.emotion) {
         return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x, y, width, height } = result.facePosition;
      const { emotion, confidence } = result.emotion;

      ctx.strokeStyle = this.getEmotionColor(emotion);
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = this.getEmotionColor(emotion);
      ctx.font = 'bold 16px Arial';
      const text = `${emotion} (${confidence}%)`;
      const textMetrics = ctx.measureText(text);
      const textHeight = 20;

      ctx.fillRect(x, y - textHeight - 5, textMetrics.width + 10, textHeight + 5);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, x + 5, y - 8);
   }

   private translateEmotion(emotion: string): string {
      const translations: Record<string, string> = {
         neutral: 'Neutral',
         happy: 'Happy',
         sad: 'Sad',
         angry: 'Angry',
         fearful: 'Fearful',
         disgusted: 'Disgusted',
         surprised: 'Surprised',
      };
      return translations[emotion] || emotion;
   }

   mapToBackendFormat(emotion: string): string {
      const mapping: Record<string, string> = {
         'Vui vẻ': 'ENJOYMENT',
         happy: 'ENJOYMENT',
         Buồn: 'SADNESS',
         sad: 'SADNESS',
         'Tức giận': 'ANGER',
         angry: 'ANGER',
         'Sợ hãi': 'FEAR',
         fearful: 'FEAR',
         'Ghê tởm': 'DISGUST',
         disgusted: 'DISGUST',
         'Ngạc nhiên': 'SURPRISE',
         surprised: 'SURPRISE',
         'Bình thường': 'OTHER',
         neutral: 'OTHER',
      };
      return mapping[emotion] || 'OTHER';
   }

   mapFromBackendFormat(backendEmotion: string): string {
      const mapping: Record<string, string> = {
         ENJOYMENT: 'Happy',
         SADNESS: 'Sad',
         ANGER: 'Angry',
         FEAR: 'Fearful',
         DISGUST: 'Disgusted',
         SURPRISE: 'Surprised',
         OTHER: 'Neutral',
      };
      return mapping[backendEmotion] || 'Neutral';
   }

   private getEmotionColor(emotion: string): string {
      const colors: Record<string, string> = {
         Happy: '#10b981',
         Sad: '#3b82f6',
         Angry: '#ef4444',
         Fearful: '#8b5cf6',
         Disgusted: '#f59e0b',
         Surprised: '#ec4899',
         Neutral: '#6b7280',
      };
      return colors[emotion] || '#6b7280';
   }

   getEmotionIcon(emotion: string): string {
      const icons: Record<string, string> = {
         Happy: '😊',
         Sad: '😢',
         Angry: '😠',
         Fearful: '😨',
         Disgusted: '🤢',
         Surprised: '😲',
         Neutral: '😐',
      };
      return icons[emotion] || '😐';
   }

   isModelsLoaded(): boolean {
      return this.modelsLoaded;
   }

   getDetectorType(): DetectorType {
      return this.detectorType;
   }

   async switchDetector(type: DetectorType): Promise<void> {
      if (this.detectorType === type) {
         console.log('[EmotionDetection] Already using detector:', type);
         return;
      }

      console.log('[EmotionDetection] Switching detector to:', type);
      this.detectorType = type;
      this.modelsLoaded = false;
      this.clearEmotionHistory();
      await this.loadModels();
   }
}

export const emotionDetectionService = new EmotionDetectionService();
