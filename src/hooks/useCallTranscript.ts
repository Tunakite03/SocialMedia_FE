import { useEffect, useState, useCallback, useRef } from 'react';
import { dualAudioTranscriptService, type TranscriptEntry } from '@/services/dualAudioTranscriptService';

interface UseCallTranscriptOptions {
   enabled?: boolean;
   language?: string;
   sentimentAnalysisEnabled?: boolean;
}

interface UseCallTranscriptReturn {
   // Transcript data
   entries: TranscriptEntry[];
   interimText: string;
   transcriptText: string;

   // Status
   isLocalListening: boolean;
   isRemoteListening: boolean;
   isSupported: boolean;

   // Controls
   startLocal: () => boolean;
   stopLocal: () => void;
   stopAll: () => void;
   clearTranscript: () => void;
   connectRemoteAudioTrack: (track: MediaStreamTrack) => Promise<boolean>;
   disconnectRemoteAudioTrack: () => void;

   // Export
   exportTranscript: (format?: 'txt' | 'json') => string;
   downloadTranscript: (filename?: string, format?: 'txt' | 'json') => void;

   // Manual add (for testing or external sources)
   addTranscriptEntry: (text: string, speaker: 'local' | 'remote') => void;

   // Sentiment
   getCallSentimentSummary: () => Promise<any>;
}

export const useCallTranscript = (options: UseCallTranscriptOptions = {}): UseCallTranscriptReturn => {
   const { enabled = true, language = 'vi-VN', sentimentAnalysisEnabled = true } = options;

   const [entries, setEntries] = useState<TranscriptEntry[]>([]);
   const [interimText, setInterimText] = useState<string>('');
   const [isLocalListening, setIsLocalListening] = useState<boolean>(false);
   const [isRemoteListening, setIsRemoteListening] = useState<boolean>(false);
   const [isSupported, setIsSupported] = useState<boolean>(false);
   const statusCheckIntervalRef = useRef<number | null>(null);

   // Initialize service
   useEffect(() => {
      if (!enabled) return;

      // Initialize local recognition
      const localInitialized = dualAudioTranscriptService.initializeLocal({
         language,
         continuous: true,
         interimResults: true,
      });

      // Initialize remote recognition (may not work directly)
      dualAudioTranscriptService.initializeRemote({
         language,
         continuous: true,
         interimResults: true,
      });

      dualAudioTranscriptService.setSentimentAnalysisEnabled(sentimentAnalysisEnabled);

      const status = dualAudioTranscriptService.getStatus();
      setIsSupported(status.isSupported);

      if (!localInitialized) {
         console.error('[useCallTranscript] Failed to initialize transcript service');
         return;
      }

      // Setup callback để nhận transcript updates
      dualAudioTranscriptService.onTranscript((entry) => {
         if (entry.isFinal) {
            setEntries((prev) => {
               const existingIndex = prev.findIndex((e) => e.id === entry.id);
               if (existingIndex !== -1) {
                  // Update existing entry (for sentiment updates)
                  const updated = [...prev];
                  updated[existingIndex] = entry;
                  return updated;
               }
               // Add new entry
               return [...prev, entry];
            });
            setInterimText('');
         } else {
            setInterimText(entry.text);
         }
      });

      // Periodically check status
      statusCheckIntervalRef.current = window.setInterval(() => {
         const status = dualAudioTranscriptService.getStatus();
         setIsLocalListening(status.isLocalListening);
         setIsRemoteListening(status.isRemoteListening);
      }, 500);

      return () => {
         if (statusCheckIntervalRef.current) {
            clearInterval(statusCheckIntervalRef.current);
         }
      };
   }, [enabled, language, sentimentAnalysisEnabled]);

   // Start local recognition
   const startLocal = useCallback((): boolean => {
      const result = dualAudioTranscriptService.startLocal();
      if (result) {
         setIsLocalListening(true);
      }
      return result;
   }, []);

   // Stop local recognition
   const stopLocal = useCallback((): void => {
      dualAudioTranscriptService.stopLocal();
      setIsLocalListening(false);
   }, []);

   // Stop all
   const stopAll = useCallback((): void => {
      dualAudioTranscriptService.stopAll();
      setIsLocalListening(false);
      setIsRemoteListening(false);
   }, []);

   // Clear transcript
   const clearTranscript = useCallback((): void => {
      dualAudioTranscriptService.clearTranscript();
      setEntries([]);
      setInterimText('');
   }, []);

   // Connect remote audio track
   const connectRemoteAudioTrack = useCallback(async (track: MediaStreamTrack): Promise<boolean> => {
      const result = await dualAudioTranscriptService.connectRemoteAudioTrack(track);
      return result;
   }, []);

   // Disconnect remote audio track
   const disconnectRemoteAudioTrack = useCallback((): void => {
      dualAudioTranscriptService.disconnectRemoteAudioTrack();
   }, []);

   // Export transcript
   const exportTranscript = useCallback((format: 'txt' | 'json' = 'txt'): string => {
      return dualAudioTranscriptService.exportTranscript(format);
   }, []);

   // Download transcript
   const downloadTranscript = useCallback((filename?: string, format: 'txt' | 'json' = 'txt'): void => {
      dualAudioTranscriptService.downloadTranscript(filename, format);
   }, []);

   // Add transcript entry manually
   const addTranscriptEntry = useCallback((text: string, speaker: 'local' | 'remote'): void => {
      dualAudioTranscriptService.addTranscriptEntry(text, speaker);
   }, []);

   // Get sentiment summary
   const getCallSentimentSummary = useCallback(async () => {
      return await dualAudioTranscriptService.getCallSentimentSummary();
   }, []);

   // Get transcript text
   const transcriptText = dualAudioTranscriptService.getTranscriptText();

   // Cleanup on unmount
   useEffect(() => {
      return () => {
         dualAudioTranscriptService.cleanup();
      };
   }, []);

   return {
      // Data
      entries,
      interimText,
      transcriptText,

      // Status
      isLocalListening,
      isRemoteListening,
      isSupported,

      // Controls
      startLocal,
      stopLocal,
      stopAll,
      clearTranscript,
      connectRemoteAudioTrack,
      disconnectRemoteAudioTrack,

      // Export
      exportTranscript,
      downloadTranscript,

      // Manual
      addTranscriptEntry,

      // Sentiment
      getCallSentimentSummary,
   };
};
