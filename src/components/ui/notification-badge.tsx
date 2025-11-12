import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
   count: number;
   className?: string;
   size?: 'sm' | 'md' | 'lg';
   color?: 'red' | 'blue' | 'green' | 'purple' | 'orange';
   showZero?: boolean;
}

const NotificationBadge = ({
   count,
   className,
   size = 'sm',
   color = 'red',
   showZero = false,
}: NotificationBadgeProps) => {
   if (count === 0 && !showZero) return null;

   const sizeClasses = {
      sm: 'min-w-[18px] h-[18px] text-xs',
      md: 'min-w-[20px] h-[20px] text-sm',
      lg: 'min-w-[24px] h-[24px] text-sm',
   };

   const colorClasses = {
      red: 'bg-red-500 text-white',
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      purple: 'bg-purple-500 text-white',
      orange: 'bg-orange-500 text-white',
   };

   const displayCount = count > 9 ? '9+' : count.toString();

   return (
      <div
         className={cn(
            'absolute top-0 -right-2 rounded-full flex items-center justify-center font-medium',
            'animate-pulse shadow-lg border-2 border-white',
            'anime-bounce', // Custom anime effect
            sizeClasses[size],
            colorClasses[color],
            className
         )}
      >
         {displayCount}
      </div>
   );
};

export default NotificationBadge;
