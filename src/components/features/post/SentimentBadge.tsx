import { Smile, Frown, Angry, Sparkles, Skull, Heart } from 'lucide-react';
import type { Post, SentimentType } from '@/types';

interface SentimentBadgeProps {
   sentiment: Post['sentiment'];
   confidence?: number | null;
   scores?: Post['sentimentScores'];
   showDetails?: boolean;
}

const SentimentBadge = ({ sentiment, scores, showDetails = false }: SentimentBadgeProps) => {
   if (!sentiment) return null;

   const getSentimentConfig = () => {
      switch (sentiment) {
         case 'ENJOYMENT':
            return {
               icon: <Smile size={14} />,
               label: 'Enjoyment',
               emoji: '😊',
               bgColor: 'bg-green-100',
               textColor: 'text-green-700',
               borderColor: 'border-green-300',
               barColor: 'bg-green-500',
            };
         case 'SADNESS':
            return {
               icon: <Frown size={14} />,
               label: 'Sadness',
               emoji: '😢',
               bgColor: 'bg-blue-100',
               textColor: 'text-blue-700',
               borderColor: 'border-blue-300',
               barColor: 'bg-blue-500',
            };
         case 'ANGER':
            return {
               icon: <Angry size={14} />,
               label: 'Anger',
               emoji: '😠',
               bgColor: 'bg-red-100',
               textColor: 'text-red-700',
               borderColor: 'border-red-300',
               barColor: 'bg-red-500',
            };
         case 'FEAR':
            return {
               icon: <Skull size={14} />,
               label: 'Fear',
               emoji: '😰',
               bgColor: 'bg-purple-100',
               textColor: 'text-purple-700',
               borderColor: 'border-purple-300',
               barColor: 'bg-purple-500',
            };
         case 'DISGUST':
            return {
               icon: <Frown size={14} />,
               label: 'Disgust',
               emoji: '🤢',
               bgColor: 'bg-yellow-100',
               textColor: 'text-yellow-700',
               borderColor: 'border-yellow-300',
               barColor: 'bg-yellow-500',
            };
         case 'SURPRISE':
            return {
               icon: <Sparkles size={14} />,
               label: 'Surprise',
               emoji: '😲',
               bgColor: 'bg-pink-100',
               textColor: 'text-pink-700',
               borderColor: 'border-pink-300',
               barColor: 'bg-pink-500',
            };
         case 'OTHER':
            return {
               icon: <Heart size={14} />,
               label: 'Other',
               emoji: '😐',
               bgColor: 'bg-gray-100',
               textColor: 'text-gray-700',
               borderColor: 'border-gray-300',
               barColor: 'bg-gray-500',
            };
         default:
            return null;
      }
   };

   const config = getSentimentConfig();
   if (!config) return null;

   const sentimentOrder: SentimentType[] = ['ENJOYMENT', 'SADNESS', 'ANGER', 'FEAR', 'DISGUST', 'SURPRISE', 'OTHER'];

   const getSentimentConfigForType = (type: SentimentType) => {
      switch (type) {
         case 'ENJOYMENT':
            return { emoji: '😊', barColor: 'bg-green-500' };
         case 'SADNESS':
            return { emoji: '😢', barColor: 'bg-blue-500' };
         case 'ANGER':
            return { emoji: '😠', barColor: 'bg-red-500' };
         case 'FEAR':
            return { emoji: '😰', barColor: 'bg-purple-500' };
         case 'DISGUST':
            return { emoji: '🤢', barColor: 'bg-yellow-500' };
         case 'SURPRISE':
            return { emoji: '😲', barColor: 'bg-pink-500' };
         case 'OTHER':
            return { emoji: '😐', barColor: 'bg-gray-500' };
         default:
            return null;
      }
   };

   return (
      <div className='inline-flex flex-col gap-1'>
         <div
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
         >
            {config.icon}
            <span>{config.label}</span>
            {/* {confidence && <span className='opacity-70'>{formatConfidence(confidence)}%</span>} */}
         </div>

         {showDetails && scores && (
            <div className='text-xs text-muted-foreground space-y-0.5 mt-1'>
               {sentimentOrder.map((key) => {
                  const score = scores[key];
                  if (score === undefined || score === 0) return null;

                  const sentimentConfig = getSentimentConfigForType(key);
                  if (!sentimentConfig) return null;

                  return (
                     <div
                        key={key}
                        className='flex items-center gap-2'
                     >
                        <span>{sentimentConfig.emoji}</span>
                        <div className='flex-1 bg-gray-200 rounded-full h-1.5'>
                           <div
                              className={`${sentimentConfig.barColor} h-1.5 rounded-full`}
                              style={{ width: `${(score * 100).toFixed(0)}%` }}
                           />
                        </div>
                        <span className='w-10 text-right'>{(score * 100).toFixed(0)}%</span>
                     </div>
                  );
               })}
            </div>
         )}
      </div>
   );
};

export default SentimentBadge;
