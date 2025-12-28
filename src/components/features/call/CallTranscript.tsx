import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Languages, X, Sparkles, RefreshCw } from 'lucide-react';
import { speechToTextService } from '@/services/speechToTextService';
import { SentimentBadge } from './SentimentBadge';
import type { SentimentResult } from '@/services/sentimentService';

interface TranscriptEntry {
   id: string;
   text: string;
   timestamp: Date;
   isFinal: boolean;
   speaker: 'local' | 'remote';
   sentiment?: SentimentResult;
   isAnalyzing?: boolean;
}

interface CallTranscriptProps {
   isVisible: boolean;
   isAudioEnabled: boolean;
   onClose: () => void;
}

export const CallTranscript = ({ isVisible, isAudioEnabled, onClose }: CallTranscriptProps) => {
   const [entries, setEntries] = useState<TranscriptEntry[]>([]);
   const [interimText, setInterimText] = useState<string>('');
   const [language, setLanguage] = useState<'vi-VN' | 'en-US'>('vi-VN');
   const [sentimentEnabled, setSentimentEnabled] = useState<boolean>(true);
   const [summary, setSummary] = useState<any>(null);
   const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
   const scrollRef = useRef<HTMLDivElement>(null);
   const summaryUpdateTimer = useRef<number | null>(null);

   useEffect(() => {
      if (!isVisible) return;

      // Initialize speech recognition
      const initialized = speechToTextService.initialize({
         language: language,
         continuous: true,
         interimResults: true,
      });

      if (!initialized) {
         console.error('Failed to initialize speech recognition');
         return;
      }

      // Setup callback để nhận transcript updates
      speechToTextService.onTranscript((entry) => {
         if (entry.isFinal) {
            // Update existing entry or add new one (avoid duplicates)
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

      // Chỉ start nếu audio enabled
      if (isAudioEnabled) {
         speechToTextService.start();
      }

      return () => {
         speechToTextService.stop();
      };
   }, [isVisible, language, isAudioEnabled]);

   // Auto scroll to bottom khi có entry mới
   useEffect(() => {
      if (scrollRef.current) {
         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
   }, [entries, interimText]);

   // Auto update summary khi có entries mới và sentiment enabled
   useEffect(() => {
      if (!sentimentEnabled || entries.length === 0) return;

      // Debounce summary update to avoid too many API calls
      if (summaryUpdateTimer.current) {
         clearTimeout(summaryUpdateTimer.current);
      }

      summaryUpdateTimer.current = setTimeout(async () => {
         setIsLoadingSummary(true);
         const callSummary = await speechToTextService.getCallSentimentSummary();
         setSummary(callSummary);
         setIsLoadingSummary(false);
      }, 2000); // Update after 2 seconds of inactivity

      return () => {
         if (summaryUpdateTimer.current) {
            clearTimeout(summaryUpdateTimer.current);
         }
      };
   }, [entries, sentimentEnabled]);

   const handleClear = () => {
      setEntries([]);
      setInterimText('');
      speechToTextService.clearTranscript();
   };

   const handleDownload = () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      speechToTextService.downloadTranscript(`call-transcript-${timestamp}`, 'txt');
   };

   const handleToggleLanguage = () => {
      const newLang = language === 'vi-VN' ? 'en-US' : 'vi-VN';
      setLanguage(newLang);
      speechToTextService.setLanguage(newLang);
   };

   const handleToggleSentiment = () => {
      const newValue = !sentimentEnabled;
      setSentimentEnabled(newValue);
      speechToTextService.setSentimentAnalysisEnabled(newValue);

      // Clear summary when disabled
      if (!newValue) {
         setSummary(null);
      }
   };

   const handleRefreshSummary = async () => {
      if (entries.length === 0) return;
      setIsLoadingSummary(true);
      const callSummary = await speechToTextService.getCallSentimentSummary();
      setSummary(callSummary);
      setIsLoadingSummary(false);
   };

   if (!isVisible) return null;

   const isSupported = speechToTextService.getIsSupported();

   return (
      <div className='fixed right-4 top-20 bottom-24 w-[450px] max-w-[90vw] card-liquid-glass flex flex-col z-50 anime-slide-in-right shadow-2xl'>
         {/* Header */}
         <div className='relative flex items-center justify-between p-2 border-b border-white/10 '>
            <div className='flex items-center gap-3'>
               <div>
                  {sentimentEnabled && (
                     <p className='text-xs text-foreground flex items-center gap-1 mt-0.5'>
                        <Sparkles className='h-3 w-3' />
                        Phân tích cảm xúc đang bật
                     </p>
                  )}
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

               {sentimentEnabled && entries.length > 0 && (
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
               )}
            </div>

            <div className='flex items-center gap-1'>
               <Button
                  onClick={handleClear}
                  size='sm'
                  variant='ghost'
                  title='Xóa transcript'
                  className='text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200'
                  disabled={entries.length === 0}
               >
                  <Trash2 className='h-4 w-4' />
               </Button>

               <Button
                  onClick={handleDownload}
                  size='sm'
                  variant='ghost'
                  title='Tải xuống transcript'
                  className='text-white/70 hover:text-green-400 hover:bg-green-500/10 transition-all duration-200'
                  disabled={entries.length === 0}
               >
                  <Download className='h-4 w-4' />
               </Button>
            </div>
         </div>

         {/* Content */}
         <div className='flex-1 overflow-hidden flex flex-col'>
            {/* Sentiment Summary - Always visible when enabled */}
            {sentimentEnabled && entries.length > 0 && (
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
               {!isSupported ? (
                  <div className='text-center py-12 text-white/60'>
                     <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center'>
                        <X className='h-8 w-8 text-red-400' />
                     </div>
                     <p className='text-sm font-medium'>Trình duyệt không hỗ trợ Web Speech API</p>
                     <p className='text-xs mt-2'>Vui lòng sử dụng Chrome hoặc Edge</p>
                  </div>
               ) : entries.length === 0 && !interimText ? (
                  <div className='text-center py-12 text-white/60'>
                     <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse'>
                        <Languages className='h-8 w-8 text-blue-400' />
                     </div>
                     <p className='text-sm font-medium'>Bắt đầu nói để phiên âm...</p>
                     <p className='text-xs mt-2'>Transcript sẽ xuất hiện ở đây</p>
                  </div>
               ) : (
                  <>
                     {/* Transcript entries */}
                     {entries.map((entry, index) => (
                        <div
                           key={entry.id}
                           className={`p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-2 ${
                              entry.speaker === 'local'
                                 ? 'bg-linear-to-br from-blue-500/20 to-blue-600/20 ml-4 border border-blue-500/30'
                                 : 'bg-linear-to-br from-white/10 to-white/5 mr-4 border border-white/10'
                           }`}
                           style={{ animationDelay: `${index * 50}ms` }}
                        >
                           <div className='flex items-center justify-between mb-2'>
                              <span className='text-xs font-medium text-white/80'>
                                 {entry.speaker === 'local' ? '🎤 Bạn' : '👤 Người khác'}
                              </span>
                              <div className='flex items-center gap-2'>
                                 {sentimentEnabled && (
                                    <SentimentBadge
                                       sentiment={entry.sentiment}
                                       isAnalyzing={entry.isAnalyzing}
                                       size='sm'
                                       showLabel={false}
                                       showConfidence={false}
                                    />
                                 )}
                                 <span className='text-xs text-white/40 font-mono'>
                                    {entry.timestamp.toLocaleTimeString('vi-VN', {
                                       hour: '2-digit',
                                       minute: '2-digit',
                                       second: '2-digit',
                                    })}
                                 </span>
                              </div>
                           </div>
                           <p className='text-sm text-white leading-relaxed'>{entry.text}</p>
                        </div>
                     ))}

                     {/* Interim text (đang phiên âm) */}
                     {interimText && (
                        <div className='p-3 rounded-xl bg-linear-to-br from-blue-500/10 to-purple-500/10 ml-4 border border-blue-400/40 animate-in fade-in slide-in-from-bottom-2'>
                           <div className='flex items-center justify-between mb-2'>
                              <span className='text-xs font-medium text-white/80'>🎤 Bạn</span>
                              <span className='text-xs text-blue-400 font-medium flex items-center gap-1.5'>
                                 <span className='relative flex h-2 w-2'>
                                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75'></span>
                                    <span className='relative inline-flex rounded-full h-2 w-2 bg-blue-500'></span>
                                 </span>
                                 Đang phiên âm...
                              </span>
                           </div>
                           <p className='text-sm text-white/80 italic leading-relaxed'>{interimText}</p>
                        </div>
                     )}
                  </>
               )}
            </div>
         </div>
      </div>
   );
};
