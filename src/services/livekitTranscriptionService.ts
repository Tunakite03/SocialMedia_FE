/**
 * LiveKit Transcription Service
 * Sử dụng LiveKit's real-time audio transcription
 * Nhanh và chính xác hơn Web Speech API
 */

import { Room, RoomEvent } from 'livekit-client';
import { sentimentQueue } from './sentimentQueue';
import type { SentimentResult } from './sentimentService';

interface TranscriptEntry {
   id: string;
   segmentId: string;
   text: string;
   transcript: string;
   timestamp: Date;
   isFinal: boolean;
   speaker: 'local' | 'remote';
   participantIdentity?: string;
   participantName?: string;
   speakerName?: string;
   speakerAvatar?: string;
   confidence?: number;
   sentiment?: SentimentResult;
   isAnalyzing?: boolean;
}

type TranscriptCallback = (entry: TranscriptEntry) => void;

class LiveKitTranscriptionService {
   private room: Room | null = null;
   private transcript: TranscriptEntry[] = [];
   private onTranscriptCallback: TranscriptCallback | null = null;
   private sentimentAnalysisEnabled: boolean = true;

   // Audio context for processing (deprecated - now handled by backend)
   private audioContext: AudioContext | null = null;
   private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
   private scriptProcessor: ScriptProcessorNode | null = null;

   /**
    * Khởi tạo service với LiveKit room
    */
   initialize(room: Room): boolean {
      if (!room) {
         console.warn('[LiveKitTranscription] Room is required');
         return false;
      }

      this.room = room;
      this.setupRoomListeners();
      console.log('[LiveKitTranscription] ✅ Service initialized successfully');
      console.log('[LiveKitTranscription] 🎙️ Microphone enabled:', room.localParticipant?.isMicrophoneEnabled);
      console.log('[LiveKitTranscription] 👥 Remote participants:', room.remoteParticipants.size);
      console.log(
         '[LiveKitTranscription] ⚠️ IMPORTANT: Backend must send transcription via DataReceived with topic="transcription"',
      );
      return true;
   }

   /**
    * Setup các event listeners cho LiveKit room
    */
   private setupRoomListeners(): void {
      if (!this.room) return;

      // DEBUG: Listen for ALL data received events
      this.room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant, _kind, topic) => {
         console.log('🔔 [DEBUG] DataReceived event:', {
            topic,
            participantIdentity: participant?.identity,
            dataSize: payload.length,
         });

         // Chỉ xử lý data có topic là 'transcription'
         if (topic !== 'transcription') {
            console.log('⏭️ [DEBUG] Skipping non-transcription topic:', topic);
            return;
         }

         try {
            // Decode binary data thành JSON
            const decoder = new TextDecoder();
            const jsonString = decoder.decode(payload);
            const data = JSON.parse(jsonString);

            console.log('📝 Transcript received from backend:', {
               speaker: data.speakerName,
               text: data.transcript,
               isFinal: data.isFinal,
               segmentId: data.segmentId,
               hasSentiment: !!data.sentiment,
            });

            this.handleTranscriptionData(data, participant?.identity || 'unknown');
         } catch (error) {
            console.error('[LiveKitTranscription] Error parsing transcription data:', error);
         }
      });

      console.log('[LiveKitTranscription] Room listeners setup complete - waiting for transcription data...');
      console.log('[LiveKitTranscription] Room info:', {
         name: this.room.name,
         state: this.room.state,
         localParticipant: this.room.localParticipant?.identity,
      });
   }

   /**
    * Xử lý transcription data từ backend via LiveKit
    */
   private handleTranscriptionData(data: any, participantIdentity: string): void {
      const entry: TranscriptEntry = {
         id: data.id || `${Date.now()}-${data.segmentId}`,
         segmentId: data.segmentId,
         text: data.transcript || data.text,
         transcript: data.transcript,
         timestamp: new Date(data.timestamp || Date.now()),
         isFinal: data.isFinal ?? true,
         speaker: data.speaker || (participantIdentity === this.room?.localParticipant?.identity ? 'local' : 'remote'),
         participantIdentity: data.participantIdentity || participantIdentity,
         participantName: data.participantName,
         speakerName: data.speakerName,
         speakerAvatar: data.speakerAvatar,
         confidence: data.confidence,
         // Sử dụng sentiment từ backend nếu có
         sentiment: data.sentiment,
      };

      // Nếu là interim (chưa final), cập nhật segment cũ
      if (!entry.isFinal) {
         const existingIndex = this.transcript.findIndex((t) => t.segmentId === entry.segmentId);

         if (existingIndex >= 0) {
            // Update existing interim transcript
            this.transcript[existingIndex] = entry;
            this.onTranscriptCallback?.(entry);
            return;
         }
      }

      // Thêm transcript mới (final hoặc interim mới)
      this.transcript.push(entry);

      // Chỉ phân tích sentiment nếu backend chưa gửi kèm
      // (Fallback cho trường hợp backend chưa tích hợp sentiment)
      if (entry.isFinal && !entry.sentiment && this.sentimentAnalysisEnabled && entry.text?.trim()) {
         console.log('[LiveKitTranscription] Backend không gửi sentiment, phân tích trên FE...');
         this.analyzeSentiment(entry);
      }

      // Callback
      this.onTranscriptCallback?.(entry);
   }

   /**
    * REMOVED: Web Speech API processing
    * Backend now handles transcription directly via LiveKit
    * Transcription data is sent via DataReceived events with topic='transcription'
    */

   /**
    * Phân tích sentiment cho transcript entry
    */
   private async analyzeSentiment(entry: TranscriptEntry): Promise<void> {
      const index = this.transcript.findIndex((t) => t.id === entry.id);
      if (index === -1) return;

      // Mark as analyzing
      this.transcript[index].isAnalyzing = true;
      this.onTranscriptCallback?.(this.transcript[index]);

      try {
         // Use sentiment queue for batch processing
         const result = await sentimentQueue.analyze(entry.text);

         if (result && index < this.transcript.length) {
            this.transcript[index].sentiment = result;
            this.transcript[index].isAnalyzing = false;

            // Trigger callback with updated entry
            this.onTranscriptCallback?.(this.transcript[index]);
         }
      } catch (error) {
         console.error('[LiveKitTranscription] Error analyzing sentiment:', error);
         if (index < this.transcript.length) {
            this.transcript[index].isAnalyzing = false;
         }
      }
   }

   /**
    * Bật/tắt sentiment analysis
    */
   setSentimentAnalysisEnabled(enabled: boolean): void {
      this.sentimentAnalysisEnabled = enabled;
      console.log(`[LiveKitTranscription] Sentiment analysis ${enabled ? 'enabled' : 'disabled'}`);
   }

   /**
    * Đăng ký callback cho transcript updates
    */
   onTranscript(callback: TranscriptCallback): void {
      this.onTranscriptCallback = callback;
   }

   /**
    * Lấy toàn bộ transcript
    */
   getTranscript(): TranscriptEntry[] {
      return [...this.transcript];
   }

   /**
    * Lấy transcript text đơn giản
    */
   getTranscriptText(separator: string = '\n'): string {
      return this.transcript
         .filter((entry) => entry.isFinal)
         .map((entry) => {
            const speaker = entry.speakerName || entry.participantName || entry.speaker;
            const text = entry.transcript || entry.text;
            return `[${speaker}] ${text}`;
         })
         .join(separator);
   }

   /**
    * Clear transcript
    */
   clearTranscript(): void {
      this.transcript = [];
      console.log('[LiveKitTranscription] Transcript cleared');
   }

   /**
    * Dừng service và cleanup
    */
   stop(): void {
      console.log('[LiveKitTranscription] Stopping service...');

      // Cleanup audio context
      if (this.scriptProcessor) {
         this.scriptProcessor.disconnect();
         this.scriptProcessor = null;
      }

      if (this.mediaStreamSource) {
         this.mediaStreamSource.disconnect();
         this.mediaStreamSource = null;
      }

      if (this.audioContext) {
         this.audioContext.close();
         this.audioContext = null;
      }

      this.room = null;
      this.onTranscriptCallback = null;
      console.log('[LiveKitTranscription] Service stopped');
   }

   /**
    * Kiểm tra service có đang chạy không
    */
   isActive(): boolean {
      return this.room !== null;
   }

   /**
    * Export transcript as text
    */
   exportAsText(): string {
      return this.getTranscriptText('\n\n');
   }

   /**
    * Export transcript as JSON
    */
   exportAsJSON(): string {
      return JSON.stringify(
         this.transcript.map((entry) => ({
            id: entry.id,
            segmentId: entry.segmentId,
            text: entry.transcript || entry.text,
            transcript: entry.transcript,
            timestamp: entry.timestamp.toISOString(),
            isFinal: entry.isFinal,
            speaker: entry.speaker,
            participantName: entry.participantName,
            speakerName: entry.speakerName,
            speakerAvatar: entry.speakerAvatar,
            confidence: entry.confidence,
            sentiment: entry.sentiment
               ? {
                    sentiment: entry.sentiment.sentiment,
                    confidence: entry.sentiment.confidence,
                 }
               : null,
         })),
         null,
         2,
      );
   }

   /**
    * Lấy sentiment summary cho cuộc gọi
    * @param speakerFilter - 'all' | 'local' | 'remote' - chỉ phân tích entries của speaker nào
    * Mặc định 'remote' để phân tích cảm xúc của người đối diện
    */
   async getCallSentimentSummary(speakerFilter: 'all' | 'local' | 'remote' = 'remote') {
      let finalEntries = this.transcript.filter((entry) => entry.isFinal);

      // Filter theo speaker - mặc định chỉ phân tích REMOTE (người đối diện)
      if (speakerFilter !== 'all') {
         finalEntries = finalEntries.filter((entry) => entry.speaker === speakerFilter);
      }

      const texts = finalEntries.map((e) => e.transcript || e.text);

      if (texts.length === 0) {
         console.log(`[LiveKitTranscription] Không có entries nào cho speaker: ${speakerFilter}`);
         return null;
      }

      try {
         const { sentimentService } = await import('./sentimentService');
         const result = await sentimentService.analyzeCallOverall(texts);
         
         return {
            ...result,
            speakerAnalyzed: speakerFilter,
            entriesCount: finalEntries.length,
         };
      } catch (error) {
         console.error('Error getting call sentiment summary:', error);
         return null;
      }
   }

   /**
    * Lấy số lượng entries theo speaker
    */
   getEntriesCount(): { local: number; remote: number; total: number } {
      const local = this.transcript.filter((e) => e.isFinal && e.speaker === 'local').length;
      const remote = this.transcript.filter((e) => e.isFinal && e.speaker === 'remote').length;
      return { local, remote, total: local + remote };
   }
}

// Export singleton instance
export const livekitTranscriptionService = new LiveKitTranscriptionService();
