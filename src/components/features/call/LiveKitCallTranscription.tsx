/**
 * LiveKit Call Transcription Component
 * Hiển thị real-time transcription trong cuộc gọi LiveKit
 */

import { useEffect } from 'react';
import { useLiveKitTranscription, type TranscriptEntry } from '@/hooks/useLiveKitTranscription';
import type { Room } from 'livekit-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Trash2, BarChart3, X } from 'lucide-react';

interface LiveKitCallTranscriptionProps {
   room: Room | null;
   enabled?: boolean;
   onClose?: () => void;
}

export const LiveKitCallTranscription = ({ room, enabled = true, onClose }: LiveKitCallTranscriptionProps) => {
   const {
      transcript,
      isActive,
      startTranscription,
      stopTranscription,
      clearTranscript,
      toggleSentimentAnalysis,
      exportAsText,
      exportAsJSON,
      sentimentEnabled,
   } = useLiveKitTranscription({ enabled, sentimentAnalysis: true });

   /**
    * Start transcription when room is available
    */
   useEffect(() => {
      if (room && enabled && !isActive) {
         startTranscription(room);
      }

      return () => {
         if (isActive) {
            stopTranscription();
         }
      };
   }, [room, enabled, isActive, startTranscription, stopTranscription]);

   /**
    * Download transcript as text file
    */
   const handleDownloadText = () => {
      const text = exportAsText();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${new Date().toISOString()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
   };

   /**
    * Download transcript as JSON file
    */
   const handleDownloadJSON = () => {
      const json = exportAsJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
   };

   /**
    * Get sentiment color
    */
   const getSentimentColor = (sentiment?: string) => {
      switch (sentiment) {
         case 'POSITIVE':
            return 'text-green-500';
         case 'NEGATIVE':
            return 'text-red-500';
         case 'NEUTRAL':
         default:
            return 'text-gray-500';
      }
   };

   /**
    * Get sentiment emoji
    */
   const getSentimentEmoji = (sentiment?: string) => {
      switch (sentiment) {
         case 'POSITIVE':
            return '😊';
         case 'NEGATIVE':
            return '😞';
         case 'NEUTRAL':
         default:
            return '😐';
      }
   };

   if (!enabled) return null;

   return (
      <Card className='w-full h-full flex flex-col bg-linear-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl'>
         <div className='flex items-center justify-between p-3 bg-linear-to-r from-white/10 to-white/5 border-b border-white/20 backdrop-blur-xl'>
            <h3 className='text-lg font-semibold text-white'>📝 Phiên âm cuộc gọi</h3>
            <div className='flex gap-2'>
               <Button
                  variant={sentimentEnabled ? 'default' : 'outline'}
                  size='sm'
                  onClick={toggleSentimentAnalysis}
                  title='Bật/tắt phân tích cảm xúc'
                  className='bg-white/10 hover:bg-white/20 border-white/20'
               >
                  <BarChart3 className='h-4 w-4' />
               </Button>
               <Button
                  variant='outline'
                  size='sm'
                  onClick={handleDownloadText}
                  title='Tải xuống dạng text'
                  className='bg-white/10 hover:bg-white/20 border-white/20'
               >
                  <Download className='h-4 w-4' />
               </Button>
               <Button
                  variant='outline'
                  size='sm'
                  onClick={handleDownloadJSON}
                  title='Tải xuống dạng JSON'
                  className='bg-white/10 hover:bg-white/20 border-white/20'
               >
                  <Download className='h-4 w-4 mr-1' />
                  JSON
               </Button>
               <Button
                  variant='outline'
                  size='sm'
                  onClick={clearTranscript}
                  title='Xóa phiên âm'
                  className='bg-white/10 hover:bg-white/20 border-white/20'
               >
                  <Trash2 className='h-4 w-4' />
               </Button>
               {onClose && (
                  <Button
                     variant='outline'
                     size='sm'
                     onClick={onClose}
                     title='Đóng'
                     className='bg-white/10 hover:bg-red-500/50 border-white/20'
                  >
                     <X className='h-4 w-4' />
                  </Button>
               )}
            </div>
         </div>

         <ScrollArea className='flex-1 p-4'>
            {transcript.length === 0 ? (
               <div className='text-center text-white/60 py-8'>
                  {isActive ? (
                     <div className='flex flex-col items-center gap-2'>
                        <div className='animate-pulse'>🎙️</div>
                        <p>Đang chờ phiên âm từ LiveKit...</p>
                     </div>
                  ) : (
                     'Chưa có phiên âm'
                  )}
               </div>
            ) : (
               <div className='space-y-3'>
                  {transcript.map((entry) => (
                     <TranscriptEntryItem
                        key={entry.id}
                        entry={entry}
                        showSentiment={sentimentEnabled}
                        getSentimentColor={getSentimentColor}
                        getSentimentEmoji={getSentimentEmoji}
                     />
                  ))}
               </div>
            )}
         </ScrollArea>

         <div className='p-3 text-xs text-white/60 text-center border-t border-white/10 bg-linear-to-r from-white/5 to-white/10 backdrop-blur-xl'>
            {isActive && (
               <>
                  <span className='inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse' />
                  <span className='text-green-400'>Đang ghi âm via LiveKit...</span>
               </>
            )}
            {transcript.length > 0 && <span className='ml-2 text-white/80'>({transcript.length} đoạn)</span>}
         </div>
      </Card>
   );
};

/**
 * Transcript Entry Item Component
 */
interface TranscriptEntryItemProps {
   entry: TranscriptEntry;
   showSentiment: boolean;
   getSentimentColor: (sentiment?: string) => string;
   getSentimentEmoji: (sentiment?: string) => string;
}

const TranscriptEntryItem = ({
   entry,
   showSentiment,
   getSentimentColor,
   getSentimentEmoji,
}: TranscriptEntryItemProps) => {
   const displayText = entry.transcript || entry.text;
   const displayName = entry.speakerName || entry.participantName || (entry.speaker === 'local' ? 'Bạn' : 'Người khác');

   return (
      <div
         className={`p-3 rounded-lg ${
            entry.speaker === 'local' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800/50'
         } ${!entry.isFinal ? 'opacity-60' : ''}`}
      >
         <div className='flex items-start justify-between gap-2'>
            <div className='flex-1'>
               <div className='flex items-center gap-2 mb-1'>
                  {entry.speakerAvatar && (
                     <img
                        src={entry.speakerAvatar}
                        alt={displayName}
                        className='w-5 h-5 rounded-full object-cover'
                     />
                  )}
                  <span className='text-xs font-medium text-muted-foreground'>{displayName}</span>
                  <span className='text-xs text-muted-foreground'>
                     {entry.timestamp.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                     })}
                  </span>
                  {!entry.isFinal && <span className='text-xs text-yellow-500'>(đang gõ...)</span>}
                  {entry.confidence && entry.isFinal && (
                     <span className='text-xs text-blue-500'>{Math.round(entry.confidence * 100)}%</span>
                  )}
               </div>
               <p className='text-sm'>{displayText}</p>
            </div>

            {showSentiment && entry.sentiment && (
               <div className='flex flex-col items-center gap-1'>
                  <span className='text-lg'>{getSentimentEmoji(entry.sentiment.sentiment)}</span>
                  <span className={`text-xs font-medium ${getSentimentColor(entry.sentiment.sentiment)}`}>
                     {(entry.sentiment.confidence * 100).toFixed(0)}%
                  </span>
               </div>
            )}

            {showSentiment && entry.isAnalyzing && (
               <div className='animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent' />
            )}
         </div>
      </div>
   );
};
