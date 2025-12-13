import { Smile, Frown, Minus } from 'lucide-react';
import type { Post } from '@/types';

interface SentimentBadgeProps {
   sentiment: Post['sentiment'];
   confidence?: number | null;
   scores?: Post['sentimentScores'];
   showDetails?: boolean;
}

const SentimentBadge = ({ sentiment, confidence, scores, showDetails = false }: SentimentBadgeProps) => {
   if (!sentiment) return null;

   const getSentimentConfig = () => {
      switch (sentiment) {
         case 'POSITIVE':
            return {
               icon: <Smile size={14} />,
               label: 'Positive',
               bgColor: 'bg-green-100',
               textColor: 'text-green-700',
               borderColor: 'border-green-300',
            };
         case 'NEGATIVE':
            return {
               icon: <Frown size={14} />,
               label: 'Negative',
               bgColor: 'bg-red-100',
               textColor: 'text-red-700',
               borderColor: 'border-red-300',
            };
         case 'NEUTRAL':
            return {
               icon: <Minus size={14} />,
               label: 'Neutral',
               bgColor: 'bg-gray-100',
               textColor: 'text-gray-700',
               borderColor: 'border-gray-300',
            };
         default:
            return null;
      }
   };

   const config = getSentimentConfig();
   if (!config) return null;

   const formatConfidence = (conf: number) => {
      return (conf * 100).toFixed(1);
   };

   return (
      <div className='inline-flex flex-col gap-1'>
         <div
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
         >
            {config.icon}
            <span>{config.label}</span>
            {confidence && <span className='opacity-70'>{formatConfidence(confidence)}%</span>}
         </div>

         {showDetails && scores && (
            <div className='text-xs text-muted-foreground space-y-0.5 mt-1'>
               {scores.POSITIVE !== undefined && (
                  <div className='flex items-center gap-2'>
                     <span className='text-green-600'>😊</span>
                     <div className='flex-1 bg-gray-200 rounded-full h-1.5'>
                        <div
                           className='bg-green-500 h-1.5 rounded-full'
                           style={{ width: `${(scores.POSITIVE * 100).toFixed(0)}%` }}
                        />
                     </div>
                     <span className='w-10 text-right'>{(scores.POSITIVE * 100).toFixed(0)}%</span>
                  </div>
               )}
               {scores.NEGATIVE !== undefined && (
                  <div className='flex items-center gap-2'>
                     <span className='text-red-600'>😞</span>
                     <div className='flex-1 bg-gray-200 rounded-full h-1.5'>
                        <div
                           className='bg-red-500 h-1.5 rounded-full'
                           style={{ width: `${(scores.NEGATIVE * 100).toFixed(0)}%` }}
                        />
                     </div>
                     <span className='w-10 text-right'>{(scores.NEGATIVE * 100).toFixed(0)}%</span>
                  </div>
               )}
               {scores.NEUTRAL !== undefined && (
                  <div className='flex items-center gap-2'>
                     <span className='text-gray-600'>😐</span>
                     <div className='flex-1 bg-gray-200 rounded-full h-1.5'>
                        <div
                           className='bg-gray-500 h-1.5 rounded-full'
                           style={{ width: `${(scores.NEUTRAL * 100).toFixed(0)}%` }}
                        />
                     </div>
                     <span className='w-10 text-right'>{(scores.NEUTRAL * 100).toFixed(0)}%</span>
                  </div>
               )}
            </div>
         )}
      </div>
   );
};

export default SentimentBadge;
