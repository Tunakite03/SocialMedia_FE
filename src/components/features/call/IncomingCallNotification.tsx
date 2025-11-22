import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video } from 'lucide-react';
import type { User } from '@/types';

interface IncomingCallNotificationProps {
   caller: User;
   callType: 'audio' | 'video';
   onAccept: () => void;
   onReject: () => void;
   isVisible: boolean;
}

export const IncomingCallNotification = ({
   caller,
   callType,
   onAccept,
   onReject,
   isVisible,
}: IncomingCallNotificationProps) => {
   const ringtoneRef = useRef<HTMLAudioElement>(null);

   useEffect(() => {
      if (isVisible) {
         if (ringtoneRef.current) {
            ringtoneRef.current.play().catch(console.error);
         }
      } else {
         if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
         }
      }

      return () => {
         if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
         }
      };
   }, [isVisible]);

   if (!isVisible) return null;

   return (
      <>
         {/* Audio element for ringtone */}
         <audio
            ref={ringtoneRef}
            loop
            preload='auto'
         >
            <source
               src='/sounds/phone-calling.mp3'
               type='audio/mpeg'
            />
         </audio>

         {/* Fullscreen overlay */}
         <div className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center anime-slide-in-bottom'>
            {/* Notification card */}
            <div className='card-liquid-glass p-8 max-w-sm mx-4 text-center'>
               {/* Caller avatar with pulsing animation */}
               <div className='relative mb-6'>
                  <Avatar className='h-24 w-24 mx-auto ring-8 ring-green-400/30 call-pulse'>
                     <AvatarImage
                        src={caller.avatar || ''}
                        alt={caller.displayName || caller.username}
                     />
                     <AvatarFallback className='text-2xl bg-linear-to-br from-green-500 to-blue-500 text-white'>
                        {(caller.displayName || caller.username).slice(0, 2).toUpperCase()}
                     </AvatarFallback>
                  </Avatar>

                  {/* Call type indicator */}
                  <div className='absolute -top-2 -right-2 w-10 h-10 bg-linear-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center anime-bounce shadow-lg'>
                     {callType === 'video' ? (
                        <Video className='w-5 h-5 text-white' />
                     ) : (
                        <Phone className='w-5 h-5 text-white' />
                     )}
                  </div>
               </div>

               {/* Caller info */}
               <h3 className='text-2xl font-anime font-bold text-white mb-2'>
                  {caller.displayName || caller.username}
               </h3>
               <p className='text-purple-200 font-anime text-lg mb-6'>
                  {callType === 'video' ? '📹 Video call' : '📞 Voice call'}
               </p>

               {/* Action buttons */}
               <div className='flex justify-center items-center gap-6'>
                  <Button
                     onClick={onReject}
                     size='lg'
                     className='rounded-full h-14 w-14 bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none shadow-lg hover:shadow-xl anime-hover-lift transition-all duration-300'
                  >
                     <PhoneOff className='h-6 w-6 text-white' />
                  </Button>

                  <Button
                     onClick={onAccept}
                     size='lg'
                     className='rounded-full h-14 w-14 bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-none shadow-lg hover:shadow-xl anime-hover-lift transition-all duration-300'
                  >
                     <Phone className='h-6 w-6 text-white' />
                  </Button>
               </div>
            </div>
         </div>
      </>
   );
};

export default IncomingCallNotification;
