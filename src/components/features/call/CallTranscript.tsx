
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Languages, X, Sparkles, RefreshCw } from 'lucide-react';
import { useWebSpeechTranscription } from '@/hooks/useWebSpeechTranscription';
import { SentimentBadge } from './SentimentBadge';

interface CallTranscriptProps {
   isVisible: boolean;
   isAudioEnabled: boolean;
   onClose: () => void;
   callId: string;
   userId: string;
   userName: string;
   userAvatar?: string;
}

export const CallTranscript = ({ 
   isVisible, 
   isAudioEnabled, 
   onClose,
   callId,
   userId,
   userName,
   userAvatar,
}: CallTranscriptProps) => {
   const [sentimentEnabled, setSentimentEnabled] = useState<boolean>(true);
   const [summary, setSummary] = useState<any>(null);
   const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
   const [speakerFilter, setSpeakerFilter] = useState<'all' | 'local' | 'remote'>('remote');
   const scrollRef = useRef<HTMLDivElement>(null);
   const summaryUpdateTimer = useRef<number | null>(null);

   // Use WebSpeech Transcription Hook (nhận cả local và remote transcripts từ backend)
   const {
      transcripts,
      isListening,
      isSupportedBrowser,
      error,
      startListening,
      stopListening,
      clearTranscripts,
      getCallSentimentSummary,
      getTranscriptCounts,
   } = useWebSpeechTranscription({
      callId,
      userId,
      userName,
      userAvatar,
      language: 'vi-VN',
      autoStart: false,
   });

   // Start/stop speech recognition dựa trên isAudioEnabled
   useEffect(() => {
      if (!isVisible) return;

      if (isAudioEnabled && !isListening) {
         console.log('[CallTranscript] 🎤 MIC IS ON - Starting speech recognition');
         startListening();
      } else if (!isAudioEnabled && isListening) {
         console.log('[CallTranscript] 🔇 MIC IS OFF - Stopping speech recognition');
         stopListening();
      }
   }, [isVisible, isAudioEnabled, isListening, startListening, stopListening]);

   // Auto scroll to bottom khi có transcript mới
   useEffect(() => {
      if (scrollRef.current) {
         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
   }, [transcripts]);

   // Auto update summary khi có transcripts mới và sentiment enabled
   useEffect(() => {
      if (!sentimentEnabled || transcripts.length === 0) return;

      // Debounce summary update to avoid too many API calls
      if (summaryUpdateTimer.current) {
         clearTimeout(summaryUpdateTimer.current);
      }

      summaryUpdateTimer.current = setTimeout(async () => {
         setIsLoadingSummary(true);
         // Phân tích cảm xúc theo speaker filter (mặc định: remote = người đối diện)
         const callSummary = await getCallSentimentSummary(speakerFilter);
         setSummary(callSummary);
         setIsLoadingSummary(false);
      }, 2000) as any as number; // Update after 2 seconds of inactivity

      return () => {
         if (summaryUpdateTimer.current) {
            clearTimeout(summaryUpdateTimer.current);
         }
      };
   }, [transcripts, sentimentEnabled, speakerFilter, getCallSentimentSummary]);

   const handleClear = () => {
      clearTranscripts();
      setSummary(null);
   };

   const handleDownload = () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const content = transcripts
         .filter(t => t.isFinal)
         .map(t => {
            const time = new Date(t.timestamp).toLocaleTimeString('vi-VN');
            const speaker = t.speakerId === userId ? 'Bạn' : t.speakerName;
            return `[${time}] ${speaker}: ${t.transcript}`;
         })
         .join('\n\n');
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-transcript-${timestamp}.txt`;
      a.click();
      URL.revokeObjectURL(url);
   };

   const handleToggleSentiment = () => {
      const newValue = !sentimentEnabled;
      setSentimentEnabled(newValue);

      // Clear summary when disabled
      if (!newValue) {
         setSummary(null);
      }
   };

   const handleRefreshSummary = async () => {
      if (transcripts.length === 0) return;
      setIsLoadingSummary(true);
      const callSummary = await getCallSentimentSummary(speakerFilter);
      setSummary(callSummary);
      setIsLoadingSummary(false);
   };

   const handleToggleSpeakerFilter = () => {
      const filters: ('all' | 'local' | 'remote')[] = ['remote', 'local', 'all'];
      const currentIndex = filters.indexOf(speakerFilter);
      const nextFilter = filters[(currentIndex + 1) % filters.length];
      setSpeakerFilter(nextFilter);
      
      // Refresh summary with new filter
      if (sentimentEnabled && transcripts.length > 0) {
         setIsLoadingSummary(true);
         getCallSentimentSummary(nextFilter).then(result => {
            setSummary(result);
            setIsLoadingSummary(false);
         });
      }
   };

   if (!isVisible) return null;

   const counts = getTranscriptCounts();
   const speakerFilterLabel = 
      speakerFilter === 'remote' ? '👤 Người khác' :
      speakerFilter === 'local' ? '🎤 Bạn' :
      '👥 Tất cả';

   return (
      <div className='fixed right-4 top-20 bottom-24 w-[450px] max-w-[90vw] card-liquid-glass flex flex-col z-50 anime-slide-in-right shadow-2xl'>
         {/* Header */}
         <div className='relative flex items-center justify-between p-2 border-b border-white/10 '>
            <div className='flex items-center gap-3'>
               <div>
                  <div className='flex items-center gap-2'>
                     {sentimentEnabled && (
                        <p className='text-xs text-foreground flex items-center gap-1'>
                           <Sparkles className='h-3 w-3' />
                           Phân tích: {speakerFilterLabel}
                        </p>
                     )}
                     <p className='text-xs text-white/50'>
                        ({counts.local} bạn • {counts.remote} họ)
                     </p>
                  </div>
               </div>
            </div>
            <Button
               onClick={onClose}
               size='sm'
               variant='ghost'
               className='text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200'
            >
               <X className='h-4 w-4' />
            </Button>
         </div>

         {/* Toolbar */}
         <div className='flex items-center justify-between gap-2 p-3 border-b border-white/10 bg-white/5'>
            <div className='flex items-center gap-1'>
               <Button
                  onClick={handleToggleSentiment}
                  size='sm'
                  variant='ghost'
                  title={sentimentEnabled ? 'Tắt phân tích cảm xúc' : 'Bật phân tích cảm xúc'}
                  className={`transition-all duration-200 ${
                     sentimentEnabled
                        ? 'text-black-400 bg-purple-500/20 hover:bg-purple-500/30'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
               >
                  <Sparkles className='h-4 w-4' />
               </Button>

               {sentimentEnabled && transcripts.length > 0 && (
                  <>
                     <Button
                        onClick={handleToggleSpeakerFilter}
                        size='sm'
                        variant='ghost'
                        title='Chuyển đổi phân tích: Người khác / Bạn / Tất cả'
                        className='text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 text-xs'
                     >
                        {speakerFilterLabel}
                     </Button>
                     <Button
                        onClick={handleRefreshSummary}
                        size='sm'
                        variant='ghost'
                        title='Làm mới tổng kết'
                        disabled={isLoadingSummary}
                        className='text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200'
                     >
                        <RefreshCw className={`h-4 w-4 ${isLoadingSummary ? 'animate-spin' : ''}`} />
                     </Button>
                  </>
               )}
            </div>

            <div className='flex items-center gap-1'>
               <Button
                  onClick={handleClear}
                  size='sm'
                  variant='ghost'
                  title='Xóa transcript'
                  className='text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200'
                  disabled={transcripts.length === 0}
               >
                  <Trash2 className='h-4 w-4' />
               </Button>

               <Button
                  onClick={handleDownload}
                  size='sm'
                  variant='ghost'
                  title='Tải xuống transcript'
                  className='text-white/70 hover:text-green-400 hover:bg-green-500/10 transition-all duration-200'
                  disabled={transcripts.length === 0}
               >
                  <Download className='h-4 w-4' />
               </Button>
            </div>
         </div>

         {/* Content */}
         <div className='flex-1 overflow-hidden flex flex-col'>
            {/* Sentiment Summary - Always visible when enabled */}
            {sentimentEnabled && transcripts.length > 0 && (
               <div className='p-4 border-b border-white/10 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-sm animate-in fade-in slide-in-from-top duration-500'>
                  <div className='flex items-center justify-between mb-3'>
                     <h4 className='text-sm font-semibold text-white flex items-center gap-2'>
                        <div className='w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse'></div>
                        Phân tích cảm xúc
                     </h4>
                     {isLoadingSummary && (
                        <span className='text-xs text-purple-300 animate-pulse flex items-center gap-1'>
                           <RefreshCw className='h-3 w-3 animate-spin' />
                           Đang cập nhật...
                        </span>
                     )}
                  </div>

                  {summary ? (
                     <div className='space-y-3'>
                        {/* Overall Sentiment */}
                        <div className='flex items-center justify-between p-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10'>
                           <span className='text-xs text-white/80 font-medium'>Cảm xúc chung</span>
                           <SentimentBadge
                              sentiment={{
                                 sentiment: summary.overallSentiment,
                                 confidence: summary.averageConfidence,
                                 scores: summary.sentimentDistribution,
                              }}
                              showLabel={true}
                              showConfidence={true}
                              size='md'
                           />
                        </div>

                        {/* Distribution Bars */}
                        <div className='space-y-2.5'>
                           {/* Positive */}
                           <div className='group'>
                              <div className='flex items-center justify-between text-xs mb-1'>
                                 <span className='text-green-400 font-medium flex items-center gap-1.5'>
                                    <span className='text-base'>😊</span>
                                    Tích cực
                                 </span>
                                 <span className='text-white/70 font-semibold'>
                                    {Math.round(summary.sentimentDistribution.POSITIVE * 100)}%
                                 </span>
                              </div>
                              <div className='w-full bg-white/10 rounded-full h-2 overflow-hidden'>
                                 <div
                                    className='bg-linear-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-700 ease-out group-hover:from-green-400 group-hover:to-green-300'
                                    style={{ width: `${summary.sentimentDistribution.POSITIVE * 100}%` }}
                                 ></div>
                              </div>
                           </div>

                           {/* Neutral */}
                           <div className='group'>
                              <div className='flex items-center justify-between text-xs mb-1'>
                                 <span className='text-yellow-400 font-medium flex items-center gap-1.5'>
                                    <span className='text-base'>😐</span>
                                    Trung tính
                                 </span>
                                 <span className='text-white/70 font-semibold'>
                                    {Math.round(summary.sentimentDistribution.NEUTRAL * 100)}%
                                 </span>
                              </div>
                              <div className='w-full bg-white/10 rounded-full h-2 overflow-hidden'>
                                 <div
                                    className='bg-linear-to-r from-yellow-500 to-yellow-400 h-2 rounded-full transition-all duration-700 ease-out group-hover:from-yellow-400 group-hover:to-yellow-300'
                                    style={{ width: `${summary.sentimentDistribution.NEUTRAL * 100}%` }}
                                 ></div>
                              </div>
                           </div>

                           {/* Negative */}
                           <div className='group'>
                              <div className='flex items-center justify-between text-xs mb-1'>
                                 <span className='text-red-400 font-medium flex items-center gap-1.5'>
                                    <span className='text-base'>😞</span>
                                    Tiêu cực
                                 </span>
                                 <span className='text-white/70 font-semibold'>
                                    {Math.round(summary.sentimentDistribution.NEGATIVE * 100)}%
                                 </span>
                              </div>
                              <div className='w-full bg-white/10 rounded-full h-2 overflow-hidden'>
                                 <div
                                    className='bg-linear-to-r from-red-500 to-red-400 h-2 rounded-full transition-all duration-700 ease-out group-hover:from-red-400 group-hover:to-red-300'
                                    style={{ width: `${summary.sentimentDistribution.NEGATIVE * 100}%` }}
                                 ></div>
                              </div>
                           </div>
                        </div>

                        {/* Stats */}
                        <div className='flex items-center justify-center gap-4 pt-2 text-xs text-white/60'>
                           <span className='flex items-center gap-1'>
                              <div className='w-1 h-1 rounded-full bg-purple-400'></div>
                              {summary.totalAnalyzed} đoạn
                           </span>
                           <span className='flex items-center gap-1'>
                              <div className='w-1 h-1 rounded-full bg-blue-400'></div>
                              {Math.round(summary.averageConfidence * 100)}% tin cậy
                           </span>
                        </div>
                     </div>
                  ) : (
                     <div className='text-center py-3'>
                        <p className='text-xs text-white/50'>Đang chờ dữ liệu phân tích...</p>
                     </div>
                  )}
               </div>
            )}

            {/* Transcript Entries */}
            <div
               ref={scrollRef}
               className='flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth'
            >
               {!isSupportedBrowser ? (
                  <div className='text-center py-12 text-white/60'>
                     <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center'>
                        <X className='h-8 w-8 text-red-400' />
                     </div>
                     <p className='text-sm font-medium'>Trình duyệt không hỗ trợ Web Speech API</p>
                     <p className='text-xs mt-2'>Vui lòng sử dụng Chrome hoặc Edge</p>
                  </div>
               ) : transcripts.length === 0 ? (
                  <div className='text-center py-12 text-white/60'>
                     <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse'>
                        <Languages className='h-8 w-8 text-blue-400' />
                     </div>
                     <p className='text-sm font-medium'>Bắt đầu nói để phiên âm...</p>
                     <p className='text-xs mt-2'>Transcript sẽ xuất hiện ở đây</p>
                     {error && (
                        <p className='text-xs mt-2 text-red-400'>Lỗi: {error}</p>
                     )}
                  </div>
               ) : (
                  <>
                     {/* Transcript entries */}
                     {transcripts.filter(t => t.isFinal).map((entry, index) => {
                        const isLocal = entry.speakerId === userId;
                        return (
                           <div
                              key={entry.id || `${entry.timestamp}-${index}`}
                              className={`p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-2 ${
                                 isLocal
                                    ? 'bg-linear-to-br from-blue-500/20 to-blue-600/20 ml-4 border border-blue-500/30'
                                    : 'bg-linear-to-br from-white/10 to-white/5 mr-4 border border-white/10'
                              }`}
                              style={{ animationDelay: `${index * 50}ms` }}
                           >
                              <div className='flex items-center justify-between mb-2'>
                                 <span className='text-xs font-medium text-white/80'>
                                    {isLocal ? '🎤 Bạn' : `👤 ${entry.speakerName}`}
                                 </span>
                                 <span className='text-xs text-white/40 font-mono'>
                                    {new Date(entry.timestamp).toLocaleTimeString('vi-VN', {
                                       hour: '2-digit',
                                       minute: '2-digit',
                                       second: '2-digit',
                                    })}
                                 </span>
                              </div>
                              <p className='text-sm text-white leading-relaxed'>{entry.transcript}</p>
                           </div>
                        );
                     })}
                  </>
               )}
            </div>
         </div>
      </div>
   );
};
