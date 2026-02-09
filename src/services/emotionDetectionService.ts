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
   private emaAlpha = 0.35;
   private currentStableEmotion: string | null = null;
   private hysteresisThreshold = 0.08;
   private modelPath = '/models';
   private detectorType: DetectorType = 'face-api'; // Using face-api.js (has trained model)

   // face-api.js optimization settings
   private faceApiInputSize = 512; // Tăng từ 416 lên 512 để chính xác hơn (options: 128, 160, 224, 320, 416, 512, 608)
   private faceApiScoreThreshold = 0.3; // Giảm threshold để detect được nhiều expression hơn
   private useMediaPipeBlendshapes = true; // Kết hợp với MediaPipe blendshapes
   private faceDetectorModel: FaceDetectorModel = 'ssd'; // Mặc định dùng SSD MobileNet (chính xác hơn)

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
         
         const modelsToLoad: Promise<void>[] = [
            faceapi.nets.faceExpressionNet.loadFromUri(this.modelPath),
         ];

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
            this.emaAlpha = 0.5; // React faster
            break;
         case 'balanced':
            this.faceApiInputSize = 416;
            this.faceApiScoreThreshold = 0.35;
            this.emaAlpha = 0.4;
            break;
         case 'accurate':
            this.faceApiInputSize = 512;
            this.faceApiScoreThreshold = 0.3;
            this.emaAlpha = 0.3; // Smoother, more stable
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

         // EMA Smoothing
         if (!this.emaEmotions) {
            this.emaEmotions = expressions;
         } else {
            for (const key of Object.keys(expressions)) {
               this.emaEmotions[key] =
                  this.emaEmotions[key] * (1 - this.emaAlpha) + expressions[key] * this.emaAlpha;
            }
         }

         const finalExpressions = this.emaEmotions;

         // Hysteresis Logic
         const sorted = Object.entries(finalExpressions).sort((a, b) => b[1] - a[1]);
         const [topEmotion, topConfidence] = sorted[0];

         let finalEmotion = topEmotion;
         let finalConfidence = topConfidence;

         if (this.currentStableEmotion && this.currentStableEmotion !== topEmotion) {
            const currentEmotionScore = finalExpressions[this.currentStableEmotion] || 0;

            if (topConfidence > currentEmotionScore + this.hysteresisThreshold) {
               this.currentStableEmotion = topEmotion;
            } else {
               finalEmotion = this.currentStableEmotion;
               finalConfidence = finalExpressions[finalEmotion];
            }
         } else {
            this.currentStableEmotion = topEmotion;
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
            faceApiResult = await faceapi
               .detectSingleFace(videoElement, ssdOptions)
               .withFaceExpressions();
         } else {
            // TinyFaceDetector - Nhanh hơn, kém chính xác hơn
            const tinyOptions = new faceapi.TinyFaceDetectorOptions({
               inputSize: this.faceApiInputSize,
               scoreThreshold: this.faceApiScoreThreshold,
            });
            faceApiResult = await faceapi
               .detectSingleFace(videoElement, tinyOptions)
               .withFaceExpressions();
         }

         if (!faceApiResult || !faceApiResult.expressions) {
            return null;
         }

         let expressions: Record<string, number> = { ...faceApiResult.expressions };

         // Kết hợp với MediaPipe blendshapes nếu có (cải thiện độ chính xác)
         if (this.useMediaPipeBlendshapes && blendshapes) {
            expressions = this.enhanceWithBlendshapes(expressions, blendshapes);
         }

         // Apply neutral suppression (giảm bias về neutral)
         expressions.neutral = expressions.neutral * 0.8;

         // Boost subtle emotions (tăng độ nhạy cho các emotion yếu)
         expressions.sad = expressions.sad * 1.15;
         expressions.angry = expressions.angry * 1.1;
         expressions.fearful = expressions.fearful * 1.1;

         // Normalize
         expressions = this.normalize(expressions);

         // Apply softmax for sharpening (temperature thấp hơn = sharper)
         expressions = this.softmax(expressions, 0.4);

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
   private enhanceWithBlendshapes(
      expressions: Record<string, number>,
      blendshapes: Record<string, number>,
   ): Record<string, number> {
      // MediaPipe blendshape weights cho mỗi emotion
      const blendshapeEmotionMap: Record<string, { shapes: string[]; weight: number }> = {
         happy: {
            shapes: ['mouthSmileLeft', 'mouthSmileRight', 'cheekSquintLeft', 'cheekSquintRight'],
            weight: 0.3,
         },
         sad: {
            shapes: ['mouthFrownLeft', 'mouthFrownRight', 'browDownLeft', 'browDownRight', 'mouthPucker'],
            weight: 0.25,
         },
         angry: {
            shapes: ['browDownLeft', 'browDownRight', 'eyeSquintLeft', 'eyeSquintRight', 'jawForward'],
            weight: 0.25,
         },
         surprised: {
            shapes: ['browOuterUpLeft', 'browOuterUpRight', 'eyeWideLeft', 'eyeWideRight', 'jawOpen'],
            weight: 0.3,
         },
         fearful: {
            shapes: ['browInnerUp', 'eyeWideLeft', 'eyeWideRight', 'mouthOpen'],
            weight: 0.2,
         },
         disgusted: {
            shapes: ['noseSneerLeft', 'noseSneerRight', 'mouthUpperUpLeft', 'mouthUpperUpRight'],
            weight: 0.2,
         },
      };

      const enhanced = { ...expressions };

      for (const [emotion, config] of Object.entries(blendshapeEmotionMap)) {
         let blendshapeScore = 0;
         let validShapes = 0;

         for (const shape of config.shapes) {
            if (blendshapes[shape] !== undefined) {
               blendshapeScore += blendshapes[shape];
               validShapes++;
            }
         }

         if (validShapes > 0) {
            const avgScore = blendshapeScore / validShapes;
            // Blend face-api score với blendshape score
            enhanced[emotion] = enhanced[emotion] * (1 - config.weight) + avgScore * config.weight;
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
      this.lastEmotionData = null;
   }

   getLastEmotion(): EmotionData | null {
      return this.lastEmotionData;
   }

   clearEmotionHistory(): void {
      this.emaEmotions = null;
      this.currentStableEmotion = null;
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

   drawFaceDetection(
      canvas: HTMLCanvasElement,
      _videoElement: HTMLVideoElement,
      result: FaceDetectionResult,
   ): void {
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
         'Happy': '#10b981',
         "Sad": '#3b82f6',
         'Angry': '#ef4444',
         'Fearful': '#8b5cf6',
         'Disgusted': '#f59e0b',
         'Surprised': '#ec4899',
         'Neutral': '#6b7280',
      };
      return colors[emotion] || '#6b7280';
   }

   getEmotionIcon(emotion: string): string {
      const icons: Record<string, string> = {
         'Happy': '😊',
         "Sad": '😢',
         'Angry': '😠',
         'Fearful': '😨',
         'Disgusted': '🤢',
         'Surprised': '😲',
         'Neutral': '😐',
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
