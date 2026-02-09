/**
 * Dual Audio Transcript Service
 * Xử lý transcript cho cả local và remote audio trong cuộc gọi LiveKit
 */

import { sentimentService, type SentimentResult } from './sentimentService';

export interface TranscriptEntry {
   id: string;
   text: string;
   timestamp: Date;
   isFinal: boolean;
   speaker: 'local' | 'remote';
   sentiment?: SentimentResult;
   isAnalyzing?: boolean;
}

interface SpeechRecognitionOptions {
   language?: string;
   continuous?: boolean;
   interimResults?: boolean;
   maxAlternatives?: number;
}

type TranscriptCallback = (entry: TranscriptEntry) => void;

class DualAudioTranscriptService {
   private localRecognition: any = null;
   private remoteRecognition: any = null;
   private isSupported: boolean = false;
   private isLocalListening: boolean = false;
   private isRemoteListening: boolean = false;
   private shouldRestartLocal: boolean = true;
   private shouldRestartRemote: boolean = true;
   private transcript: TranscriptEntry[] = [];
   private onTranscriptCallback: TranscriptCallback | null = null;
   private sentimentAnalysisEnabled: boolean = true;
   private remoteAudioContext: AudioContext | null = null;
   private remoteMediaStreamSource: MediaStreamAudioSourceNode | null = null;
   private remoteStreamDestination: MediaStreamAudioDestinationNode | null = null;

   constructor() {
      this.checkSupport();
   }

   /**
    * Kiểm tra trình duyệt có hỗ trợ Web Speech API không
    */
   private checkSupport(): void {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.isSupported = !!SpeechRecognition;

      if (this.isSupported) {
         this.localRecognition = new SpeechRecognition();
         this.remoteRecognition = new SpeechRecognition();
      }
   }

   /**
    * Khởi tạo recognition cho local audio (microphone)
    */
   initializeLocal(options: SpeechRecognitionOptions = {}): boolean {
      if (!this.isSupported || !this.localRecognition) {
         console.warn('Web Speech API is not supported in this browser');
         return false;
      }

      // Cấu hình recognition
      this.localRecognition.continuous = options.continuous ?? true;
      this.localRecognition.interimResults = options.interimResults ?? true;
      this.localRecognition.maxAlternatives = options.maxAlternatives ?? 1;
      this.localRecognition.lang = options.language ?? 'vi-VN';

      // Setup event listeners cho local
      this.setupLocalEventListeners();

      return true;
   }

   /**
    * Khởi tạo recognition cho remote audio (từ LiveKit)
    */
   initializeRemote(options: SpeechRecognitionOptions = {}): boolean {
      if (!this.isSupported || !this.remoteRecognition) {
         console.warn('Web Speech API is not supported in this browser');
         return false;
      }

      // Cấu hình recognition
      this.remoteRecognition.continuous = options.continuous ?? true;
      this.remoteRecognition.interimResults = options.interimResults ?? true;
      this.remoteRecognition.maxAlternatives = options.maxAlternatives ?? 1;
      this.remoteRecognition.lang = options.language ?? 'vi-VN';

      // Setup event listeners cho remote
      this.setupRemoteEventListeners();

      return true;
   }

   /**
    * Setup event listeners cho local recognition
    */
   private setupLocalEventListeners(): void {
      if (!this.localRecognition) return;

      this.localRecognition.onresult = (event: any) => {
         for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            const isFinal = result.isFinal;

            const entry: TranscriptEntry = {
               id: `local-${Date.now()}-${i}`,
               text: transcript,
               timestamp: new Date(),
               isFinal,
               speaker: 'local',
            };

            if (isFinal) {
               this.transcript.push(entry);
               if (this.sentimentAnalysisEnabled && transcript.trim()) {
                  this.analyzeSentiment(entry);
               }
            }

            if (this.onTranscriptCallback) {
               this.onTranscriptCallback(entry);
            }
         }
      };

      this.localRecognition.onstart = () => {
         this.isLocalListening = true;
         console.log('[DualAudioTranscript] Local recognition started');
      };

      this.localRecognition.onend = () => {
         this.isLocalListening = false;
         console.log('[DualAudioTranscript] Local recognition ended');

         if (this.shouldRestartLocal && this.localRecognition) {
            try {
               setTimeout(() => {
                  if (this.shouldRestartLocal && !this.isLocalListening) {
                     this.localRecognition.start();
                  }
               }, 100);
            } catch (error) {
               console.error('Error restarting local recognition:', error);
            }
         }
      };

      this.localRecognition.onerror = (event: any) => {
         console.error('[DualAudioTranscript] Local recognition error:', event.error);
         if (event.error === 'not-allowed') {
            console.error('Microphone permission denied');
            this.shouldRestartLocal = false;
         }
      };
   }

   /**
    * Setup event listeners cho remote recognition
    */
   private setupRemoteEventListeners(): void {
      if (!this.remoteRecognition) return;

      this.remoteRecognition.onresult = (event: any) => {
         for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            const isFinal = result.isFinal;

            const entry: TranscriptEntry = {
               id: `remote-${Date.now()}-${i}`,
               text: transcript,
               timestamp: new Date(),
               isFinal,
               speaker: 'remote',
            };

            if (isFinal) {
               this.transcript.push(entry);
               if (this.sentimentAnalysisEnabled && transcript.trim()) {
                  this.analyzeSentiment(entry);
               }
            }

            if (this.onTranscriptCallback) {
               this.onTranscriptCallback(entry);
            }
         }
      };

      this.remoteRecognition.onstart = () => {
         this.isRemoteListening = true;
         console.log('[DualAudioTranscript] Remote recognition started');
      };

      this.remoteRecognition.onend = () => {
         this.isRemoteListening = false;
         console.log('[DualAudioTranscript] Remote recognition ended');

         if (this.shouldRestartRemote && this.remoteRecognition) {
            try {
               setTimeout(() => {
                  if (this.shouldRestartRemote && !this.isRemoteListening) {
                     this.remoteRecognition.start();
                  }
               }, 100);
            } catch (error) {
               console.error('Error restarting remote recognition:', error);
            }
         }
      };

      this.remoteRecognition.onerror = (event: any) => {
         console.error('[DualAudioTranscript] Remote recognition error:', event.error);
      };
   }

   /**
    * Kết nối remote audio track từ LiveKit vào Web Speech API
    */
   async connectRemoteAudioTrack(audioTrack: MediaStreamTrack): Promise<boolean> {
      try {
         console.log('[DualAudioTranscript] Connecting remote audio track');

         // Tạo AudioContext nếu chưa có
         if (!this.remoteAudioContext) {
            this.remoteAudioContext = new AudioContext();
         }

         // Tạo MediaStream từ track
         const mediaStream = new MediaStream([audioTrack]);

         // Tạo source từ stream
         this.remoteMediaStreamSource = this.remoteAudioContext.createMediaStreamSource(mediaStream);

         // Tạo destination để tạo output stream cho recognition
         this.remoteStreamDestination = this.remoteAudioContext.createMediaStreamDestination();

         // Connect source -> destination
         this.remoteMediaStreamSource.connect(this.remoteStreamDestination);

         console.log('[DualAudioTranscript] Remote audio track connected successfully');

         // Note: Web Speech API chỉ hoạt động với getUserMedia stream
         // Không thể trực tiếp feed audio từ remote track vào recognition
         // Giải pháp: Sử dụng Web Audio API để process, nhưng cần backend service
         // hoặc browser extension để capture remote audio

         return true;
      } catch (error) {
         console.error('[DualAudioTranscript] Error connecting remote audio track:', error);
         return false;
      }
   }

   /**
    * Disconnect remote audio track
    */
   disconnectRemoteAudioTrack(): void {
      try {
         if (this.remoteMediaStreamSource) {
            this.remoteMediaStreamSource.disconnect();
            this.remoteMediaStreamSource = null;
         }

         if (this.remoteStreamDestination) {
            this.remoteStreamDestination = null;
         }

         if (this.remoteAudioContext) {
            this.remoteAudioContext.close();
            this.remoteAudioContext = null;
         }

         console.log('[DualAudioTranscript] Remote audio track disconnected');
      } catch (error) {
         console.error('[DualAudioTranscript] Error disconnecting remote audio:', error);
      }
   }

   /**
    * Bắt đầu local recognition
    */
   startLocal(): boolean {
      if (!this.isSupported || !this.localRecognition) {
         console.warn('Cannot start local: Speech recognition not supported');
         return false;
      }

      if (this.isLocalListening) {
         this.shouldRestartLocal = true;
         return true;
      }

      this.shouldRestartLocal = true;

      try {
         this.localRecognition.start();
         return true;
      } catch (error) {
         console.error('Error starting local recognition:', error);
         this.isLocalListening = false;
         return false;
      }
   }

   /**
    * Bắt đầu remote recognition (chỉ hoạt động với getUserMedia)
    * Note: Hiện tại Web Speech API không hỗ trợ trực tiếp remote streams
    */
   startRemote(): boolean {
      console.warn(
         '[DualAudioTranscript] Remote recognition with Web Speech API has limitations. Consider using backend transcription service.',
      );

      // Không thể start vì Web Speech API không support remote streams
      // Cần backend service như Deepgram, AssemblyAI, Google Cloud Speech-to-Text

      return false;
   }

   /**
    * Dừng local recognition
    */
   stopLocal(): void {
      this.shouldRestartLocal = false;

      if (!this.localRecognition || !this.isLocalListening) {
         return;
      }

      try {
         this.localRecognition.stop();
         this.isLocalListening = false;
      } catch (error) {
         console.error('Error stopping local recognition:', error);
         this.isLocalListening = false;
      }
   }

   /**
    * Dừng remote recognition
    */
   stopRemote(): void {
      this.shouldRestartRemote = false;

      if (!this.remoteRecognition || !this.isRemoteListening) {
         return;
      }

      try {
         this.remoteRecognition.stop();
         this.isRemoteListening = false;
      } catch (error) {
         console.error('Error stopping remote recognition:', error);
         this.isRemoteListening = false;
      }
   }

   /**
    * Dừng tất cả
    */
   stopAll(): void {
      this.stopLocal();
      this.stopRemote();
      this.disconnectRemoteAudioTrack();
   }

   /**
    * Đặt callback để nhận transcript updates
    */
   onTranscript(callback: TranscriptCallback): void {
      this.onTranscriptCallback = callback;
   }

   /**
    * Lấy toàn bộ transcript hiện tại
    */
   getTranscript(): TranscriptEntry[] {
      return [...this.transcript];
   }

   /**
    * Lấy transcript dạng text thuần
    */
   getTranscriptText(): string {
      return this.transcript
         .filter((entry) => entry.isFinal)
         .map((entry) => entry.text)
         .join(' ');
   }

   /**
    * Xóa transcript
    */
   clearTranscript(): void {
      this.transcript = [];
   }

   /**
    * Kiểm tra trạng thái
    */
   getStatus() {
      return {
         isSupported: this.isSupported,
         isLocalListening: this.isLocalListening,
         isRemoteListening: this.isRemoteListening,
         transcriptCount: this.transcript.length,
      };
   }

   /**
    * Export transcript ra file
    */
   exportTranscript(format: 'txt' | 'json' = 'txt'): string {
      if (format === 'json') {
         return JSON.stringify(this.transcript, null, 2);
      }

      return this.transcript
         .filter((entry) => entry.isFinal)
         .map((entry) => {
            const time = entry.timestamp.toLocaleTimeString();
            const speaker = entry.speaker === 'local' ? 'You' : 'Other';
            return `[${time}] ${speaker}: ${entry.text}`;
         })
         .join('\n');
   }

   /**
    * Download transcript file
    */
   downloadTranscript(filename: string = 'call-transcript', format: 'txt' | 'json' = 'txt'): void {
      const content = this.exportTranscript(format);
      const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
   }

   /**
    * Cleanup khi kết thúc cuộc gọi
    */
   cleanup(): void {
      this.stopAll();
      this.clearTranscript();
      this.onTranscriptCallback = null;
   }

   /**
    * Bật/tắt phân tích sentiment
    */
   setSentimentAnalysisEnabled(enabled: boolean): void {
      this.sentimentAnalysisEnabled = enabled;
   }

   /**
    * Phân tích sentiment cho một transcript entry
    */
   private async analyzeSentiment(entry: TranscriptEntry): Promise<void> {
      try {
         entry.isAnalyzing = true;
         this.updateTranscriptEntry(entry);

         const response = await sentimentService.analyzeSingle(entry.text);

         if (response.success && response.data) {
            entry.sentiment = response.data;
            entry.isAnalyzing = false;
            this.updateTranscriptEntry(entry);
         }
      } catch (error) {
         console.error('Error analyzing sentiment for entry:', error);
         entry.isAnalyzing = false;
         this.updateTranscriptEntry(entry);
      }
   }

   /**
    * Update một transcript entry và trigger callback
    */
   private updateTranscriptEntry(entry: TranscriptEntry): void {
      const index = this.transcript.findIndex((e) => e.id === entry.id);
      if (index !== -1) {
         this.transcript[index] = entry;
         if (this.onTranscriptCallback) {
            this.onTranscriptCallback(entry);
         }
      }
   }

   /**
    * Lấy sentiment summary cho cuộc gọi
    */
   async getCallSentimentSummary() {
      const finalEntries = this.transcript.filter((entry) => entry.isFinal);
      const texts = finalEntries.map((e) => e.text);

      if (texts.length === 0) {
         return null;
      }

      try {
         return await sentimentService.analyzeCallOverall(texts);
      } catch (error) {
         console.error('Error getting call sentiment summary:', error);
         return null;
      }
   }

   /**
    * Manual add transcript (để test hoặc thêm transcript từ external source)
    */
   addTranscriptEntry(text: string, speaker: 'local' | 'remote'): void {
      const entry: TranscriptEntry = {
         id: `manual-${speaker}-${Date.now()}`,
         text,
         timestamp: new Date(),
         isFinal: true,
         speaker,
      };

      this.transcript.push(entry);

      if (this.sentimentAnalysisEnabled && text.trim()) {
         this.analyzeSentiment(entry);
      }

      if (this.onTranscriptCallback) {
         this.onTranscriptCallback(entry);
      }
   }
}

export const dualAudioTranscriptService = new DualAudioTranscriptService();
