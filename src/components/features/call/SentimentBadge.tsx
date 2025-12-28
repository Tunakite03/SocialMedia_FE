import { sentimentService, type SentimentResult } from '@/services/sentimentService';
import { Loader } from 'lucide-react';

interface SentimentBadgeProps {
   sentiment?: SentimentResult;
   isAnalyzing?: boolean;
   size?: 'sm' | 'md' | 'lg';
   showLabel?: boolean;
   showConfidence?: boolean;
}

export const SentimentBadge = ({
   sentiment,
   isAnalyzing = false,
   size = 'sm',
   showLabel = true,
   showConfidence = false,
}: SentimentBadgeProps) => {
   if (isAnalyzing) {
      return (
         <div className='inline-flex items-center gap-1 text-white/50'>
            <Loader className='h-3 w-3 animate-spin' />
            {showLabel && <span className='text-xs'>Đang phân tích...</span>}
         </div>
      );
   }

   if (!sentiment) {
      return null;
   }

   const sizeClasses = {
      sm: 'text-xs px-1.5 py-0.5',
      md: 'text-sm px-2 py-1',
      lg: 'text-base px-3 py-1.5',
   };

   const iconSize = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
   };

   const colorClasses = {
      POSITIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
      NEGATIVE: 'bg-red-500/20 text-red-400 border-red-500/30',
      NEUTRAL: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
   };

   const emoji = sentimentService.getSentimentEmoji(sentiment.sentiment);
   const label = sentimentService.getSentimentLabel(sentiment.sentiment);

   return (
      <div
         className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses[size]} ${
            colorClasses[sentiment.sentiment]
         }`}
      >
         <span className={iconSize[size]}>{emoji}</span>
         {showLabel && <span className='font-medium'>{label}</span>}
         {showConfidence && <span className='text-white/70 text-xs'>({Math.round(sentiment.confidence * 100)}%)</span>}
      </div>
   );
};
