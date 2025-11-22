import { Signal, Wifi, WifiOff, Phone, Video } from 'lucide-react';

interface CallStatusIndicatorProps {
   connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
   callType: 'audio' | 'video';
   callDuration: number;
   className?: string;
}

export const CallStatusIndicator = ({
   connectionQuality,
   callType,
   callDuration,
   className = '',
}: CallStatusIndicatorProps) => {
   const formatDuration = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
   };

   const getConnectionIcon = () => {
      switch (connectionQuality) {
         case 'excellent':
            return <Signal className='w-4 h-4 text-green-400' />;
         case 'good':
            return <Wifi className='w-4 h-4 text-yellow-400' />;
         case 'poor':
            return <WifiOff className='w-4 h-4 text-red-400' />;
         case 'disconnected':
            return <WifiOff className='w-4 h-4 text-gray-400' />;
         default:
            return <Signal className='w-4 h-4 text-green-400' />;
      }
   };

   const getConnectionColorClass = () => {
      switch (connectionQuality) {
         case 'excellent':
            return 'connection-excellent';
         case 'good':
            return 'connection-good';
         case 'poor':
            return 'connection-poor';
         default:
            return 'text-gray-400';
      }
   };

   return (
      <div className={`flex justify-between items-center ${className}`}>
         {/* Connection indicator */}
         <div className='card-liquid-glass px-3 py-2 flex items-center gap-2'>
            {getConnectionIcon()}
            <span className={`text-sm font-anime capitalize ${getConnectionColorClass()}`}>{connectionQuality}</span>
         </div>

         {/* Call duration */}
         <div className='card-liquid-glass px-4 py-2'>
            <span className='text-white font-mono text-sm'>{formatDuration(callDuration)}</span>
         </div>

         {/* Call type indicator */}
         <div className='card-liquid-glass px-3 py-2 flex items-center gap-2'>
            {callType === 'video' ? (
               <Video className='w-4 h-4 text-blue-400' />
            ) : (
               <Phone className='w-4 h-4 text-green-400' />
            )}
            <span className='text-white text-sm font-anime'>{callType === 'video' ? 'Video' : 'Voice'}</span>
         </div>
      </div>
   );
};

export default CallStatusIndicator;
