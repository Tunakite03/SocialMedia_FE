/**
 * Hook to manage LiveKit transcription
 * Tích hợp transcription vào LiveKit calls
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { livekitTranscriptionService } from '@/services/livekitTranscriptionService';
import type { SentimentResult } from '@/services/sentimentService';
import type { Room } from 'livekit-client';

export interface TranscriptEntry {
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

interface UseLiveKitTranscriptionOptions {
   enabled?: boolean;
   sentimentAnalysis?: boolean;
}

interface UseLiveKitTranscriptionReturn {
   // Transcript state
   transcript: TranscriptEntry[];
   isActive: boolean;

   // Actions
   startTranscription: (room: Room) => void;
   stopTranscription: () => void;
   clearTranscript: () => void;
   toggleSentimentAnalysis: () => void;

   // Export
   exportAsText: () => string;
   exportAsJSON: () => string;

   // Settings
   sentimentEnabled: boolean;
}

export const useLiveKitTranscription = (
   options: UseLiveKitTranscriptionOptions = {},
): UseLiveKitTranscriptionReturn => {
   const { enabled = true, sentimentAnalysis = true } = options;

   const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
   const [isActive, setIsActive] = useState(false);
   const [sentimentEnabled, setSentimentEnabled] = useState(sentimentAnalysis);
   const transcriptRef = useRef<TranscriptEntry[]>([]);

   /**
    * Start transcription
    */
   const startTranscription = useCallback(
      (room: Room) => {
         if (!enabled) {
            console.log('[useLiveKitTranscription] Transcription is disabled');
            return;
         }

         console.log('[useLiveKitTranscription] Starting transcription...');

         // Initialize service
         const success = livekitTranscriptionService.initialize(room);
         if (!success) {
            console.error('[useLiveKitTranscription] Failed to initialize transcription');
            return;
         }

         // Set sentiment analysis preference
         livekitTranscriptionService.setSentimentAnalysisEnabled(sentimentEnabled);

         // Setup callback
         livekitTranscriptionService.onTranscript((entry) => {
            console.log('[useLiveKitTranscription] New transcript entry:', entry);

            setTranscript((prev) => {
               // Update existing entry or add new one
               const index = prev.findIndex((e) => e.id === entry.id);
               if (index >= 0) {
                  const updated = [...prev];
                  updated[index] = entry;
                  transcriptRef.current = updated;
                  return updated;
               } else {
                  const updated = [...prev, entry];
                  transcriptRef.current = updated;
                  return updated;
               }
            });
         });

         setIsActive(true);
         console.log('[useLiveKitTranscription] Transcription started');
      },
      [enabled, sentimentEnabled],
   );

   /**
    * Stop transcription
    */
   const stopTranscription = useCallback(() => {
      console.log('[useLiveKitTranscription] Stopping transcription...');
      livekitTranscriptionService.stop();
      setIsActive(false);
   }, []);

   /**
    * Clear transcript
    */
   const clearTranscript = useCallback(() => {
      livekitTranscriptionService.clearTranscript();
      setTranscript([]);
      transcriptRef.current = [];
   }, []);

   /**
    * Toggle sentiment analysis
    */
   const toggleSentimentAnalysis = useCallback(() => {
      setSentimentEnabled((prev) => {
         const newValue = !prev;
         livekitTranscriptionService.setSentimentAnalysisEnabled(newValue);
         return newValue;
      });
   }, []);

   /**
    * Export as text
    */
   const exportAsText = useCallback(() => {
      return livekitTranscriptionService.exportAsText();
   }, []);

   /**
    * Export as JSON
    */
   const exportAsJSON = useCallback(() => {
      return livekitTranscriptionService.exportAsJSON();
   }, []);

   /**
    * Cleanup on unmount
    */
   useEffect(() => {
      return () => {
         if (isActive) {
            stopTranscription();
         }
      };
   }, [isActive, stopTranscription]);

   return {
      transcript,
      isActive,
      startTranscription,
      stopTranscription,
      clearTranscript,
      toggleSentimentAnalysis,
      exportAsText,
      exportAsJSON,
      sentimentEnabled,
   };
};
