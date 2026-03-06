import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveKitCall } from '@/contexts/LiveKitCallProvider';
import { Button } from '@/components/ui/button';
import { Phone, Video, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveKitCallButtonsProps {
   conversationId: string;
   receiverName?: string;
   receiverAvatar?: string;
   receiverId?: string;
   className?: string;
   variant?: 'default' | 'icon';
}

export const LiveKitCallButtons = ({
   conversationId,
   receiverName,
   receiverAvatar,
   receiverId,
   className,
   variant = 'default',
}: LiveKitCallButtonsProps) => {
   const navigate = useNavigate();
   const { initiateCall } = useLiveKitCall();
   const [isInitiating, setIsInitiating] = useState(false);

   const handleStartCall = async (type: 'audio' | 'video') => {
      if (isInitiating) return;

      try {
         setIsInitiating(true);

         const callId = await initiateCall(conversationId, type);

         if (callId) {
            // Navigate to LiveKit call page
            const params = new URLSearchParams({
               callId,
               type,
            });

            if (receiverName) {
               params.append('receiver', receiverName);
            }
            if (receiverAvatar) {
               params.append('receiverAvatar', receiverAvatar);
            }
            if (receiverId) {
               params.append('receiverId', receiverId);
            }

            navigate(`/call/livekit?${params.toString()}`);
         }
      } catch (error: unknown) {
         console.error('Failed to start call:', error);
      } finally {
         setIsInitiating(false);
      }
   };

   if (variant === 'icon') {
      return (
         <div className={cn('flex items-center gap-2', className)}>
            <Button
               size='icon'
               variant='ghost'
               onClick={() => handleStartCall('audio')}
               disabled={isInitiating}
               className='h-9 w-9'
            >
               {isInitiating ? <Loader2 className='h-5 w-5 animate-spin' /> : <Phone className='h-5 w-5' />}
            </Button>
            <Button
               size='icon'
               variant='ghost'
               onClick={() => handleStartCall('video')}
               disabled={isInitiating}
               className='h-9 w-9'
            >
               {isInitiating ? <Loader2 className='h-5 w-5 animate-spin' /> : <Video className='h-5 w-5' />}
            </Button>
         </div>
      );
   }

   return (
      <div className={cn('flex items-center gap-2', className)}>
         <Button
            onClick={() => handleStartCall('audio')}
            disabled={isInitiating}
            variant='outline'
            className='gap-2'
         >
            {isInitiating ? <Loader2 className='h-4 w-4 animate-spin' /> : <Phone className='h-4 w-4' />}
            Voice Call
         </Button>
         <Button
            onClick={() => handleStartCall('video')}
            disabled={isInitiating}
            variant='outline'
            className='gap-2'
         >
            {isInitiating ? <Loader2 className='h-4 w-4 animate-spin' /> : <Video className='h-4 w-4' />}
            Video Call
         </Button>
      </div>
   );
};
