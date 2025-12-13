import { Smile, Frown, Meh } from 'lucide-react';

interface SentimentBadgeProps {
   sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
   confidence?: number;
   showConfidence?: boolean;
}

const SentimentBadge = ({ sentiment, confidence, showConfidence = false }: SentimentBadgeProps) => {
   if (!sentiment) return null;

   const getSentimentConfig = () => {
      switch (sentiment) {
         case 'POSITIVE':
            return {
               icon: Smile,
               color: 'text-green-600',
               bgColor: 'bg-green-100',
               label: 'Tích cực',
            };
         case 'NEGATIVE':
            return {
               icon: Frown,
               color: 'text-red-600',
               bgColor: 'bg-red-100',
               label: 'Tiêu cực',
            };
         case 'NEUTRAL':
            return {
               icon: Meh,
               color: 'text-gray-600',
               bgColor: 'bg-gray-100',
               label: 'Trung lập',
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
