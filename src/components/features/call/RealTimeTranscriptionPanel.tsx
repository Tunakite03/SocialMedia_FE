/**
 * Real-time Transcription Panel
 * Sử dụng Web Speech API + Socket.IO backend
 */

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, X, RefreshCw, Loader2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useWebSpeechTranscription } from '@/hooks/useWebSpeechTranscription';
import { useAuth } from '@/hooks/useAuth';
import { sentimentService } from '@/services/sentimentService';
import type { SentimentResult } from '@/services/sentimentService';

interface TranscriptEntry {
   id?: string;
   callId: string;
   transcript: string;
   speakerId: string;
   speakerName: string;
   speakerAvatar?: string;
   isFinal: boolean;
   confidence?: number;
   timestamp: string;
   segmentId?: string;
   source: string;
   sentiment?: SentimentResult;
   isAnalyzing?: boolean;
}

interface RealTimeTranscriptionPanelProps {
   callId: string;
   isVisible: boolean;
   isAudioEnabled: boolean;
   onClose: () => void;
   language?: string;
}

export const RealTimeTranscriptionPanel = ({
   callId,
   isVisible,
   isAudioEnabled,
   onClose,
   language = 'vi-VN',
}: RealTimeTranscriptionPanelProps) => {
   const { user } = useAuth();
   const [sentimentEnabled] = useState(true); // Always enabled, cannot be toggled
   const [speakerFilter, setSpeakerFilter] = useState<'all' | 'local' | 'remote'>('remote'); // Mặc định phân tích REMOTE
   const [summary, setSummary] = useState<any>(null);
   const [isLoadingSummary, setIsLoadingSummary] = useState(false);
   const [enrichedTranscripts, setEnrichedTranscripts] = useState<TranscriptEntry[]>([]);
   const [showEmotionDetails, setShowEmotionDetails] = useState(false); // Toggle emotion details
   const scrollRef = useRef<HTMLDivElement>(null);
   const lastAnalyzedCountRef = useRef<number>(0); // Track how many transcripts we've analyzed

   const {
      isConnected,
      isListening,
      isEnabled,
      isSupportedBrowser,
      error,
      transcripts,
      enableTranscription,
      startListening,
      stopListening,
      clearTranscripts,
   } = useWebSpeechTranscription({
      callId,
      userId: user?.id || '',
      userName: user?.displayName || 'Unknown',
      userAvatar: user?.avatar,
      language,
      autoStart: false, // Don't auto start, we'll control it manually
      onError: (err) => console.error('[RealTimeTranscription] Error:', err),
   });

   // Start/stop transcription based on mic state
   useEffect(() => {
      if (!isSupportedBrowser) {
         console.log('⚠️ [Transcription] Browser not supported');
         return;
      }

      // LOGIC: Only trigger on isAudioEnabled change
      // If mic OFF -> stop, if mic ON -> start (if conditions met)
      if (!isAudioEnabled) {
         // Mic is muted - ALWAYS stop transcription
         console.log('🔇 [Transcription] MIC IS OFF - Stopping transcription');
         stopListening();
         return;
      }

      // Mic is ON - only start if transcription is enabled
      if (!isEnabled) {
         console.log('⚠️ [Transcription] Mic is ON but transcription not enabled yet');
         return;
      }

      // Mic is ON AND transcription is enabled - start listening
      console.log('🎤 [Transcription] MIC IS ON - Starting transcription');
      startListening();
      
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isAudioEnabled]); // Only trigger when mic state changes!

   // Enable transcription when component mounts
   useEffect(() => {
      if (!isEnabled) {
         enableTranscription();
      }
   }, [isEnabled, enableTranscription]);

   // Auto-start when transcription becomes enabled (if mic is ON)
   useEffect(() => {
      if (isEnabled && isAudioEnabled && !isListening && isSupportedBrowser) {
         console.log('🎤 [Transcription] Auto-starting - transcription just enabled');
         startListening();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isEnabled]); // Only trigger when isEnabled changes

   // Enrich transcripts with sentiment analysis (batch 4 items at a time)
   useEffect(() => {
      if (!sentimentEnabled) {
         setEnrichedTranscripts(transcripts);
         return;
      }

      // Don't process during active recognition to avoid interference
      if (isListening) {
         // Just update display without processing
         setEnrichedTranscripts(transcripts as TranscriptEntry[]);
         return;
      }

      const enrichWithSentiment = async () => {
         // Get all final transcripts theo speaker filter
         let filteredTranscripts = transcripts.filter((t) => {
            const entry = t as TranscriptEntry;
            if (!entry.isFinal) return false;
            if (entry.transcript.trim().length < 3) return false;
            return true;
         }) as TranscriptEntry[];

         // Apply speaker filter
         if (speakerFilter === 'remote') {
            // Chỉ lấy transcript của người khác (không phải mình)
            filteredTranscripts = filteredTranscripts.filter((t) => user && t.speakerId !== user.id);
         } else if (speakerFilter === 'local') {
            // Chỉ lấy transcript của mình
            filteredTranscripts = filteredTranscripts.filter((t) => user && t.speakerId === user.id);
         }
         // speakerFilter === 'all' -> lấy tất cả

         if (filteredTranscripts.length === 0) {
            setEnrichedTranscripts(transcripts as TranscriptEntry[]);
            return;
         }

         const currentCount = filteredTranscripts.length;
         const lastAnalyzedCount = lastAnalyzedCountRef.current;

         console.log(
            `[RealTimeTranscription] Current: ${currentCount}, Last analyzed: ${lastAnalyzedCount}, Filter: ${speakerFilter}`,
         );

         // Only analyze when:
         // 1. First time: we have at least 4 transcripts total
         // 2. After first time: we have at least 4 NEW transcripts since last analysis
         const isFirstAnalysis = lastAnalyzedCount === 0;
         const shouldAnalyze = isFirstAnalysis 
            ? currentCount >= 4 
            : (currentCount - lastAnalyzedCount) >= 4;

         if (!shouldAnalyze) {
            const needed = isFirstAnalysis ? (4 - currentCount) : (4 - (currentCount - lastAnalyzedCount));
            console.log(`[RealTimeTranscription] Waiting for ${needed} more transcripts (filter: ${speakerFilter})`);
            setEnrichedTranscripts(transcripts as TranscriptEntry[]);
            return;
         }

         // Get only the last 4 transcripts for analysis
         const last4Transcripts = filteredTranscripts.slice(-4);
         
         console.log(
            `[RealTimeTranscription] Analyzing sentiment for 4 latest transcripts (filter: ${speakerFilter}):`,
            last4Transcripts.map(t => t.transcript)
         );

         try {
            const overall = await sentimentService.analyzeCallOverall(
               last4Transcripts.map((t) => t.transcript),
            );

            console.log(
               `[RealTimeTranscription] Overall sentiment: ${overall.overallSentiment} (${(overall.averageConfidence * 100).toFixed(1)}%)`,
            );
            console.log('[RealTimeTranscription] Sentiment distribution:', overall.sentimentDistribution);

            // Update the last analyzed count
            lastAnalyzedCountRef.current = currentCount;

            // Update summary with the latest sentiment
            setSummary({
               overallSentiment: overall.overallSentiment,
               averageConfidence: overall.averageConfidence,
               sentimentDistribution: overall.sentimentDistribution,
               totalAnalyzed: currentCount, // Show total transcripts, not just analyzed ones
               speakerAnalyzed: speakerFilter,
            });

            setEnrichedTranscripts(transcripts as TranscriptEntry[]);
         } catch (error) {
            console.error('Error analyzing overall sentiment:', error);
            setEnrichedTranscripts(transcripts as TranscriptEntry[]);
         }
      };

      enrichWithSentiment();
   }, [transcripts, sentimentEnabled, isListening, user, speakerFilter]);

   // Auto scroll to bottom
   useEffect(() => {
      if (scrollRef.current) {
         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
   }, [enrichedTranscripts]);

   // Summary is now computed directly in enrichWithSentiment() - no need for auto-update

   // Auto-enable transcription when panel opens for the first time
   useEffect(() => {
      if (isVisible && !isEnabled && isConnected) {
         const enabled = enableTranscription();
         if (enabled && isAudioEnabled) {
            setTimeout(() => startListening(), 500);
         }
      }
   }, [isVisible, isEnabled, isConnected, isAudioEnabled, enableTranscription, startListening]);

   // Start/stop listening based on audio state
   useEffect(() => {
      if (!isVisible || !isEnabled) return;

      if (isAudioEnabled && !isListening) {
         startListening();
      } else if (!isAudioEnabled && isListening) {
         stopListening();
      }
   }, [isVisible, isAudioEnabled, isEnabled, isListening, startListening, stopListening]);

   const handleClear = () => {
      clearTranscripts();
      setEnrichedTranscripts([]);
      setSummary(null);
      lastAnalyzedCountRef.current = 0; // Reset counter
   };

   const handleToggleSpeakerFilter = () => {
      const filters: ('all' | 'local' | 'remote')[] = ['remote', 'local', 'all'];
      const currentIndex = filters.indexOf(speakerFilter);
      const nextFilter = filters[(currentIndex + 1) % filters.length];
      setSpeakerFilter(nextFilter);
      lastAnalyzedCountRef.current = 0; // Reset để trigger phân tích lại
   };

   const handleRefreshSummary = async () => {
      if (!user || enrichedTranscripts.length === 0) return;
      
      setIsLoadingSummary(true);
      try {
         // Get all final transcripts theo speaker filter
         let filteredTranscripts = enrichedTranscripts.filter(
            (t) => t.isFinal && t.transcript.trim().length >= 3,
         );

         // Apply speaker filter
         if (speakerFilter === 'remote') {
            filteredTranscripts = filteredTranscripts.filter((t) => t.speakerId !== user.id);
         } else if (speakerFilter === 'local') {
            filteredTranscripts = filteredTranscripts.filter((t) => t.speakerId === user.id);
         }

         if (filteredTranscripts.length === 0) {
            setIsLoadingSummary(false);
            return;
         }

         // Analyze only the last 4 transcripts
         const last4Transcripts = filteredTranscripts.slice(-4);
         
         console.log(`[RealTimeTranscription] Refreshing sentiment for 4 latest transcripts (filter: ${speakerFilter}):`, last4Transcripts.map(t => t.transcript));

         // Call API to re-analyze sentiment for last 4 transcripts
         const overall = await sentimentService.analyzeCallOverall(last4Transcripts.map((t) => t.transcript));

         // Update the last analyzed count to current total
         lastAnalyzedCountRef.current = filteredTranscripts.length;

         setSummary({
            overallSentiment: overall.overallSentiment,
            averageConfidence: overall.averageConfidence,
            sentimentDistribution: overall.sentimentDistribution,
            totalAnalyzed: filteredTranscripts.length, // Show total, not just analyzed
            speakerAnalyzed: speakerFilter,
         });

         console.log(`[RealTimeTranscription] Summary refreshed: ${overall.overallSentiment} (${(overall.averageConfidence * 100).toFixed(1)}%)`);
      } catch (error) {
         console.error('Error refreshing summary:', error);
      }
      setIsLoadingSummary(false);
   };

   if (!isVisible) return null;

   if (!isSupportedBrowser) {
      return (
         <div className='fixed right-4 top-20 bottom-24 w-[420px] max-w-[90vw] bg-linear-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl flex flex-col z-50 anime-slide-in-right'>
            <div className='flex-1 flex items-center justify-center p-8'>
               <div className='text-center space-y-4'>
                  <div className='w-20 h-20 mx-auto rounded-full bg-red-500/20 backdrop-blur-xl border-2 border-red-500/40 flex items-center justify-center animate-pulse'>
                     <X className='h-10 w-10 text-red-400' />
                  </div>
                  <div>
                     <p className='text-base font-semibold text-white'>Trình duyệt không hỗ trợ</p>
                     <p className='text-sm mt-2 text-white/60'>Vui lòng sử dụng Chrome, Edge, hoặc Safari</p>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   return (
         <div className='fixed right-4 top-20 bottom-24 w-[420px] max-w-[90vw] bg-linear-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl flex flex-col z-50 anime-slide-in-right overflow-hidden'>
         {/* Compact Header - merged status & controls */}
         <div className='relative flex items-center justify-between p-3 bg-linear-to-r from-white/10 to-white/5 border-b border-white/20 backdrop-blur-xl'>
            <div className='flex items-center gap-3'>
               {/* Status Indicator */}
               <div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 border border-white/20'>
                  {isListening ? (
                     <>
                        <div className='relative'>
                           <span className='animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-green-400 opacity-75'></span>
                           <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500'></span>
                        </div>
                        <span className='text-xs font-medium text-green-400'>Đang ghi âm</span>
                     </>
                  ) : (
                     <>
                        <div className='w-2.5 h-2.5 rounded-full bg-yellow-500'></div>
                        <span className='text-xs font-medium text-yellow-400'>Đang chờ</span>
                     </>
                  )}
               </div>

            </div>

            {/* Control Buttons */}
            <div className='flex items-center gap-1.5'>
               {/* Transcription and Sentiment are always enabled */}
               {sentimentEnabled && enrichedTranscripts.length > 0 && (
                  <>
                     <Button
                        onClick={handleToggleSpeakerFilter}
                        size='sm'
                        variant='ghost'
                        title={`Phân tích: ${speakerFilter === 'remote' ? 'Người khác' : speakerFilter === 'local' ? 'Bạn' : 'Tất cả'}`}
                        className='h-8 px-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 border border-white/20 transition-all duration-300 text-xs'
                     >
                        {speakerFilter === 'remote' ? '👤' : speakerFilter === 'local' ? '🎤' : '👥'}
                     </Button>
                     <Button
                        onClick={handleRefreshSummary}
                        size='sm'
                        variant='ghost'
                        title='Làm mới'
                        disabled={isLoadingSummary}
                        className='h-8 w-8 p-0 rounded-full text-white/60 hover:text-white hover:bg-white/20 border border-white/20 transition-all duration-300'
                     >
                        <RefreshCw className={`h-4 w-4 ${isLoadingSummary ? 'animate-spin' : ''}`} />
                     </Button>
                  </>
               )}

               <Button
                  onClick={handleClear}
                  size='sm'
                  variant='ghost'
                  title='Xóa'
                  className='h-8 w-8 p-0 rounded-full text-white/60 hover:text-red-400 hover:bg-red-500/20 border border-white/20 transition-all duration-300'
                  disabled={enrichedTranscripts.length === 0}
               >
                  <Trash2 className='h-4 w-4' />
               </Button>

               <Button
                  onClick={onClose}
                  size='sm'
                  variant='ghost'
                  className='h-8 w-8 p-0 rounded-full text-white/60 hover:text-white hover:bg-white/20 border border-white/20 transition-all duration-300'
               >
                  <X className='h-4 w-4' />
               </Button>
            </div>
         </div>

         {/* Error Banner */}
         {error && (
            <div className='px-4 py-2 bg-red-500/30 border-b border-red-500/50 backdrop-blur-lg text-red-200 text-xs font-medium flex items-center gap-2'>
               <div className='w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse'></div>
               {error}
            </div>
         )}

         {/* Content - Two Column Layout */}
         <div className='flex-1 overflow-hidden flex gap-3 p-4'>
            {/* Left: Transcripts */}
            <div className='flex-1 flex flex-col gap-3 overflow-hidden'>
               {/* Sentiment Summary - Compact Horizontal */}
               {sentimentEnabled && enrichedTranscripts.length > 0 && summary && (
                  <div className='p-3 rounded-xl bg-linear-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 backdrop-blur-lg border border-white/20 animate-in fade-in slide-in-from-top duration-500 shadow-lg'>
                     <div className='flex flex-col gap-3'>
                        {/* Row 1: Dominant Emotion with Toggle Button */}
                        <div className='flex items-center justify-between'>
                           {(() => {
                              const dist = summary.sentimentDistribution as any;
                              
                              // Find the dominant emotion
                              const emotionConfigs = {
                                 ENJOYMENT: { emoji: '😊', label: 'Happy', color: 'bg-green-500', textColor: 'text-green-400', borderColor: 'border-green-400' },
                                 SURPRISE: { emoji: '😮', label: 'Surprise', color: 'bg-blue-500', textColor: 'text-blue-400', borderColor: 'border-blue-400' },
                                 FEAR: { emoji: '😨', label: 'Fear', color: 'bg-purple-500', textColor: 'text-purple-400', borderColor: 'border-purple-400' },
                                 SADNESS: { emoji: '😢', label: 'Sadness', color: 'bg-indigo-500', textColor: 'text-indigo-400', borderColor: 'border-indigo-400' },
                                 ANGER: { emoji: '😠', label: 'Anger', color: 'bg-red-500', textColor: 'text-red-400', borderColor: 'border-red-400' },
                                 DISGUST: { emoji: '🤢', label: 'Disgust', color: 'bg-orange-500', textColor: 'text-orange-400', borderColor: 'border-orange-400' },
                                 OTHER: { emoji: '😐', label: 'Other', color: 'bg-gray-500', textColor: 'text-gray-400', borderColor: 'border-gray-400' },
                              } as const;
                              
                              const emotionEntries = Object.keys(emotionConfigs).map(type => ({
                                 type: type as keyof typeof emotionConfigs,
                                 value: dist?.[type] || 0
                              }));
                              const dominantEmotion = emotionEntries.reduce((max, curr) => curr.value > max.value ? curr : max);
                              const config = emotionConfigs[dominantEmotion.type];
                              const percentage = Math.round(dominantEmotion.value * 100);
                              
                              return (
                                 <>
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.borderColor} ${config.color}/20 backdrop-blur-sm`}>
                                       <span className='text-lg'>{config.emoji}</span>
                                       <span className={`text-sm font-semibold ${config.textColor}`}>
                                          {config.label}
                                       </span>
                                       <span className='text-xs text-white/60 font-medium'>
                                          {percentage}%
                                       </span>
                                    </div>
                                    
                                    {/* Toggle Details Button */}
                                    <Button
                                       onClick={() => setShowEmotionDetails(!showEmotionDetails)}
                                       size='sm'
                                       variant='ghost'
                                       className='h-8 w-8 p-0 rounded-full text-white/60 hover:text-white hover:bg-white/20 border border-white/20 transition-all duration-300'
                                       title={showEmotionDetails ? 'Hide details' : 'Show details'}
                                    >
                                       {showEmotionDetails ? (
                                          <ChevronUp className='h-4 w-4' />
                                       ) : (
                                          <ChevronDown className='h-4 w-4' />
                                       )}
                                    </Button>
                                 </>
                              );
                           })()}
                        </div>

                        {/* Row 2 & 3: All Emotions Distribution (Collapsible) */}
                        {showEmotionDetails && (
                           <div className='flex flex-col gap-2 animate-in fade-in slide-in-from-top duration-300'>
                              {/* Row 2: First 4 emotions */}
                              <div className='flex items-center gap-2'>
                                 {(() => {
                                    const dist = summary.sentimentDistribution as any;
                                    
                                    return ['ENJOYMENT', 'SURPRISE', 'FEAR', 'SADNESS'].map((type) => {
                                       const config = {
                                          ENJOYMENT: { emoji: '😊', label: 'Happy', color: 'bg-green-500' },
                                          SURPRISE: { emoji: '😮', label: 'Surprise', color: 'bg-blue-500' },
                                          FEAR: { emoji: '😨', label: 'Fear', color: 'bg-purple-500' },
                                          SADNESS: { emoji: '😢', label: 'Sadness', color: 'bg-indigo-500' },
                                       }[type];

                                       const value = dist?.[type] || 0;
                                       const percentage = Math.round(value * 100);

                                       return (
                                          <div
                                             key={type}
                                             className='flex-1'
                                             title={`${config?.label}: ${percentage}%`}
                                          >
                                             <div className='flex items-center gap-1 mb-1'>
                                                <span className='text-xs'>{config?.emoji}</span>
                                                <span className='text-[10px] text-white/70 font-medium'>
                                                   {percentage}%
                                                </span>
                                             </div>
                                             <div className='w-full bg-white/10 rounded-full h-1.5 overflow-hidden'>
                                                <div
                                                   className={`${config?.color} h-1.5 rounded-full transition-all duration-700 ease-out`}
                                                   style={{ width: `${percentage}%` }}
                                                ></div>
                                             </div>
                                          </div>
                                       );
                                    });
                                 })()}
                              </div>

                              {/* Row 3: Last 3 emotions */}
                              <div className='flex items-center gap-2'>
                                 {(() => {
                                    const dist = summary.sentimentDistribution as any;
                                    
                                    return ['ANGER', 'DISGUST', 'OTHER'].map((type) => {
                                       const config = {
                                          ANGER: { emoji: '😠', label: 'Anger', color: 'bg-red-500' },
                                          DISGUST: { emoji: '🤢', label: 'Disgust', color: 'bg-orange-500' },
                                          OTHER: { emoji: '😐', label: 'Other', color: 'bg-gray-500' },
                                       }[type];

                                       const value = dist?.[type] || 0;
                                       const percentage = Math.round(value * 100);

                                       return (
                                          <div
                                             key={type}
                                             className='flex-1'
                                             title={`${config?.label}: ${percentage}%`}
                                          >
                                             <div className='flex items-center gap-1 mb-1'>
                                                <span className='text-xs'>{config?.emoji}</span>
                                                <span className='text-[10px] text-white/70 font-medium'>
                                                   {percentage}%
                                                </span>
                                             </div>
                                             <div className='w-full bg-white/10 rounded-full h-1.5 overflow-hidden'>
                                                <div
                                                   className={`${config?.color} h-1.5 rounded-full transition-all duration-700 ease-out`}
                                                   style={{ width: `${percentage}%` }}
                                                ></div>
                                             </div>
                                          </div>
                                       );
                                    });
                                 })()}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {/* Transcripts - Chat-like Overlay */}
               <div
                  ref={scrollRef}
                  className='flex-1 overflow-y-auto space-y-2 scroll-smooth pr-1 custom-scrollbar'
                  style={{
                     scrollbarWidth: 'thin',
                     scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
                  }}
               >
                  {enrichedTranscripts.length === 0 ? (
                     <div className='flex flex-col items-center justify-center h-full text-white/60'>
                        <div className='w-16 h-16 mb-3 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/20 backdrop-blur-lg'>
                           {!isConnected ? (
                              <Loader2 className='h-8 w-8 text-blue-400 animate-spin' />
                           ) : (
                              <MessageSquare className='h-8 w-8 text-blue-400' />
                           )}
                        </div>
                        <p className='text-sm font-medium'>
                           {!isConnected
                              ? 'Đang kết nối...'
                              : !isEnabled
                                ? 'Đang khởi tạo transcription...'
                                : 'Bắt đầu nói để phiên âm...'}
                        </p>
                        <p className='text-xs mt-1.5 text-white/40'>
                           {!isConnected
                              ? 'Đang kết nối với server'
                              : 'Transcript sẽ xuất hiện ở đây • AI phân tích tự động'}
                        </p>
                     </div>
                  ) : (
                     enrichedTranscripts.map((item, index) => {
                        const isMyMessage = item.speakerId === user?.id;

                        return (
                           <div
                              key={item.segmentId || index}
                              className={`group flex ${isMyMessage ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                              style={{ animationDelay: `${index * 30}ms` }}
                           >
                              <div
                                 className={`max-w-[75%] p-2.5 rounded-2xl backdrop-blur-lg transition-all duration-300 ${
                                    item.isFinal ? 'hover:scale-[1.02]' : 'opacity-70'
                                 } ${
                                    isMyMessage
                                       ? 'bg-linear-to-br from-blue-500/40 to-blue-600/30 border border-blue-500/50 shadow-lg shadow-blue-500/20'
                                       : 'bg-linear-to-br from-white/20 to-white/10 border border-white/30 shadow-lg'
                                 }`}
                              >
                                 {/* Message Header */}
                                 <div className='flex items-center justify-between gap-2 mb-1.5'>
                                    <div className='flex items-center gap-1.5'>
                                       {item.speakerAvatar && (
                                          <img
                                             src={item.speakerAvatar}
                                             alt={item.speakerName}
                                             className='w-5 h-5 rounded-full ring-1 ring-white/30'
                                          />
                                       )}
                                       <span className='text-xs font-semibold text-white/90'>
                                          {isMyMessage ? 'Bạn' : item.speakerName}
                                       </span>
                                    </div>
                                    <div className='flex items-center gap-1.5'>
                                       {/* Sentiment badge removed - only show overall sentiment summary */}
                                       <span className='text-[10px] text-white/50 font-mono'>
                                          {new Date(item.timestamp).toLocaleTimeString('vi-VN', {
                                             hour: '2-digit',
                                             minute: '2-digit',
                                          })}
                                       </span>
                                    </div>
                                 </div>
                                 {/* Message Text */}
                                 <p className='text-sm text-white leading-relaxed wrap-break-words'>
                                    {item.transcript}
                                 </p>
                              </div>
                           </div>
                        );
                     })
                  )}
               </div>
            </div>
         </div>
         </div>
   );
};
