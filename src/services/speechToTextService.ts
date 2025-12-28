/**
 * Speech to Text Service using Web Speech API
 * Chuyển đổi giọng nói thành văn bản real-time trong cuộc gọi
 */

import { sentimentService, type SentimentResult } from './sentimentService';

interface TranscriptEntry {
   id: string;
   text: string;
   timestamp: Date;
   isFinal: boolean;
   speaker: 'local' | 'remote';
   sentiment?: SentimentResult;
   isAnalyzing?: boolean;
}

interface SpeechToTextOptions {
   language?: string;
   continuous?: boolean;
   interimResults?: boolean;
   maxAlternatives?: number;
}

type TranscriptCallback = (entry: TranscriptEntry) => void;

class SpeechToTextService {
   private recognition: any = null;
   private isSupported: boolean = false;
   private isListening: boolean = false;
   private shouldRestart: boolean = true; // Flag để kiểm soát auto-restart
   private transcript: TranscriptEntry[] = [];
   private onTranscriptCallback: TranscriptCallback | null = null;
   private sentimentAnalysisEnabled: boolean = true;

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
         this.recognition = new SpeechRecognition();
      }
   }

   /**
    * Khởi tạo speech recognition
    */
   initialize(options: SpeechToTextOptions = {}): boolean {
      if (!this.isSupported || !this.recognition) {
         console.warn('Web Speech API is not supported in this browser');
         return false;
      }

      // Cấu hình recognition
      this.recognition.continuous = options.continuous ?? true;
      this.recognition.interimResults = options.interimResults ?? true;
      this.recognition.maxAlternatives = options.maxAlternatives ?? 1;
      this.recognition.lang = options.language ?? 'vi-VN'; // Vietnamese by default

      // Setup event listeners
      this.setupEventListeners();

      return true;
   }

   /**
    * Setup các event listeners cho recognition
    */
   private setupEventListeners(): void {
      if (!this.recognition) return;

      // Khi có kết quả
      this.recognition.onresult = (event: any) => {
         for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            const isFinal = result.isFinal;

            const entry: TranscriptEntry = {
               id: `${Date.now()}-${i}`,
               text: transcript,
               timestamp: new Date(),
               isFinal,
               speaker: 'local',
            };

            // Nếu là kết quả cuối cùng, lưu vào transcript
            if (isFinal) {
               this.transcript.push(entry);

               // Phân tích sentiment nếu được bật
               if (this.sentimentAnalysisEnabled && transcript.trim()) {
                  this.analyzeSentiment(entry);
               }
            }

            // Callback để update UI real-time
            if (this.onTranscriptCallback) {
               this.onTranscriptCallback(entry);
            }
         }
      };

      // Khi bắt đầu
      this.recognition.onstart = () => {
         this.isListening = true;
      };

      // Khi kết thúc
      this.recognition.onend = () => {
         this.isListening = false;

         // Tự động restart nếu shouldRestart = true (mic đang bật)
         if (this.shouldRestart && this.recognition && this.recognition.continuous) {
            try {
               this.recognition.start();
            } catch (error) {
               console.error('Error restarting recognition:', error);
            }
         }
      };

      // Khi có lỗi
      this.recognition.onerror = (event: any) => {
         console.error('Speech recognition error:', event.error);

         // Xử lý một số lỗi phổ biến
         if (event.error === 'no-speech') {
         } else if (event.error === 'audio-capture') {
            console.error('No microphone was found');
         } else if (event.error === 'not-allowed') {
            console.error('Microphone permission denied');
         }
      };
   }

   /**
    * Bắt đầu nhận dạng giọng nói
    */
   start(): boolean {
      if (!this.isSupported || !this.recognition) {
         console.warn('Cannot start: Speech recognition not supported');
         return false;
      }

      // Nếu đã đang listening thì không start lại
      if (this.isListening) {
         console.log('Speech recognition already active');
         this.shouldRestart = true; // Vẫn update flag
         return true;
      }

      this.shouldRestart = true; // Cho phép auto-restart

      try {
         this.recognition.start();
         return true;
      } catch (error) {
         console.error('Error starting recognition:', error);
         // Reset listening state nếu có lỗi
         this.isListening = false;
         return false;
      }
   }

   /**
    * Dừng nhận dạng giọng nói
    */
   stop(): void {
      this.shouldRestart = false; // Ngăn auto-restart

      if (!this.recognition) return;

      // Chỉ stop nếu đang listening
      if (!this.isListening) {
         console.log('Speech recognition already stopped');
         return;
      }

      try {
         this.recognition.stop();
         this.isListening = false;
      } catch (error) {
         console.error('Error stopping recognition:', error);
         // Reset state nếu có lỗi
         this.isListening = false;
      }
   }

   /**
    * Kiểm tra có đang listening không
    */
   isActive(): boolean {
      return this.isListening;
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
    * Kiểm tra xem có đang listening không
    */
   getIsListening(): boolean {
      return this.isListening;
   }

   /**
    * Kiểm tra xem browser có hỗ trợ không
    */
   getIsSupported(): boolean {
      return this.isSupported;
   }

   /**
    * Thay đổi ngôn ngữ
    */
   setLanguage(language: string): void {
      if (this.recognition) {
         const wasListening = this.isListening;

         if (wasListening) {
            this.stop();
         }

         this.recognition.lang = language;

         if (wasListening) {
            setTimeout(() => this.start(), 100);
         }
      }
   }

   /**
    * Export transcript ra file
    */
   exportTranscript(format: 'txt' | 'json' = 'txt'): string {
      if (format === 'json') {
         return JSON.stringify(this.transcript, null, 2);
      }

      // Format text
      return this.transcript
         .filter((entry) => entry.isFinal)
         .map((entry) => {
            const time = entry.timestamp.toLocaleTimeString();
            return `[${time}] ${entry.speaker === 'local' ? 'Bạn' : 'Người khác'}: ${entry.text}`;
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
      a.download = `${filename}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
   }

   /**
    * Cleanup khi kết thúc cuộc gọi
    */
   cleanup(): void {
      this.stop();
      this.onTranscriptCallback = null;
   }

   /**
    * Bật/tắt phân tích sentiment
    */
   setSentimentAnalysisEnabled(enabled: boolean): void {
      this.sentimentAnalysisEnabled = enabled;
   }

   /**
    * Kiểm tra sentiment analysis có được bật không
    */
   isSentimentAnalysisEnabled(): boolean {
      return this.sentimentAnalysisEnabled;
   }

   /**
    * Phân tích sentiment cho một transcript entry
    */
   private async analyzeSentiment(entry: TranscriptEntry): Promise<void> {
      try {
         // Đánh dấu đang phân tích
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
         // Trigger callback để update UI
         if (this.onTranscriptCallback) {
            this.onTranscriptCallback(entry);
         }
      }
   }

   /**
    * Phân tích sentiment cho toàn bộ transcript (batch)
    */
   async analyzeBatchSentiment(): Promise<void> {
      const unannayzedEntries = this.transcript.filter((entry) => entry.isFinal && !entry.sentiment);

      if (unannayzedEntries.length === 0) return;

      try {
         const texts = unannayzedEntries.map((e) => e.text);
         const results = await sentimentService.analyzeTranscript(texts);

         results.forEach((result, index) => {
            const entry = unannayzedEntries[index];
            entry.sentiment = result;
            this.updateTranscriptEntry(entry);
         });
      } catch (error) {
         console.error('Error analyzing batch sentiment:', error);
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
}

export const speechToTextService = new SpeechToTextService();
