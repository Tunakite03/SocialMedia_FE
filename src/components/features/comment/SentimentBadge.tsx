import { Smile, Frown, Meh, Angry, Sparkles, Skull } from 'lucide-react';
import type { SentimentType } from '@/types';

interface SentimentBadgeProps {
   sentiment?: SentimentType;
   confidence?: number;
   showConfidence?: boolean;
}

const SentimentBadge = ({ sentiment, confidence, showConfidence = false }: SentimentBadgeProps) => {
   if (!sentiment) return null;

   const getSentimentConfig = () => {
      switch (sentiment) {
         case 'ENJOYMENT':
            return {
               icon: Smile,
               color: 'text-green-600',
               bgColor: 'bg-green-100',
               label: 'Enjoyment',
            };
         case 'SADNESS':
            return {
               icon: Frown,
               color: 'text-blue-600',
               bgColor: 'bg-blue-100',
               label: 'Sadness',
            };
         case 'ANGER':
            return {
               icon: Angry,
               color: 'text-red-600',
               bgColor: 'bg-red-100',
               label: 'Anger',
            };
         case 'FEAR':
            return {
               icon: Skull,
               color: 'text-purple-600',
               bgColor: 'bg-purple-100',
               label: 'Fear',
            };
         case 'DISGUST':
            return {
               icon: Frown,
               color: 'text-yellow-700',
               bgColor: 'bg-yellow-100',
               label: 'Disgust',
            };
         case 'SURPRISE':
            return {
               icon: Sparkles,
               color: 'text-pink-600',
               bgColor: 'bg-pink-100',
               label: 'Surprise',
            };
         case 'OTHER':
            return {
               icon: Meh,
               color: 'text-gray-600',
               bgColor: 'bg-gray-100',
               label: 'Other',
            };
         default:
            return null;
      }
   };

   const config = getSentimentConfig();
   if (!config) return null;

   const Icon = config.icon;
   const confidencePercent = confidence ? Math.round(confidence * 100) : 0;

   return (
      <div
         className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}
         title={showConfidence ? `Độ tin cậy: ${confidencePercent}%` : config.label}
      >
         <Icon
            size={12}
            className='shrink-0'
         />
         <span className='text-[10px] font-medium'>{config.label}</span>
         {showConfidence && confidence && <span className='text-[10px] opacity-75'>({confidencePercent}%)</span>}
      </div>
   );
};

export default SentimentBadge;
