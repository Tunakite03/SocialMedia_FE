import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video } from 'lucide-react';
import type { User } from '@/types';

interface LiveKitIncomingCallModalProps {
   caller: User;
   callType: 'audio' | 'video';
   onAccept: () => void;
   onReject: () => void;
}

export const LiveKitIncomingCallModal = ({ caller, callType, onAccept, onReject }: LiveKitIncomingCallModalProps) => {
   const audioRef = useRef<HTMLAudioElement | null>(null);
   const isPlayingRef = useRef(false);

   useEffect(() => {
      // Initialize and play ringtone
      const playRingtone = async () => {
         try {
            if (!audioRef.current) {
               audioRef.current = new Audio('/sounds/phone-calling.mp3');
               audioRef.current.loop = true;
               audioRef.current.volume = 0.5;
               
               // Add event listeners for debugging
               audioRef.current.addEventListener('error', (e) => {
                  console.error('Audio loading error:', e);
               });
            }

            // Only play if not already playing
            if (!isPlayingRef.current && audioRef.current.paused) {
               await audioRef.current.play();
               isPlayingRef.current = true;
            }
         } catch (error) {
            console.error('Failed to play ringtone:', error);
            // Fallback: try to use notification sound service if available
            try {
               const { notificationSoundService } = await import('@/services/notificationSoundService');
               notificationSoundService.playSound('message');
            } catch (fallbackError) {
               console.warn('Fallback sound also failed:', fallbackError);
            }
         }
      };

      playRingtone();

      return () => {
         // Cleanup: stop audio safely
         if (audioRef.current && isPlayingRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            isPlayingRef.current = false;
         }
      };
   }, []);

   const handleAccept = () => {
      console.log('[LiveKitIncomingCallModal] Accept button clicked');
      if (audioRef.current && isPlayingRef.current) {
         audioRef.current.pause();
         audioRef.current.currentTime = 0;
         isPlayingRef.current = false;
      }
      console.log('[LiveKitIncomingCallModal] Calling onAccept callback');
      onAccept();
   };

   const handleReject = () => {
      console.log('[LiveKitIncomingCallModal] Reject button clicked');
      if (audioRef.current && isPlayingRef.current) {
         audioRef.current.pause();
         audioRef.current.currentTime = 0;
         isPlayingRef.current = false;
      }
      onReject();
   };

   return (
      <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm'>
         <div className='bg-linear-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 border border-white/10'>
            {/* Caller Info */}
            <div className='flex flex-col items-center text-center mb-8'>
               <Avatar className='w-24 h-24 mb-4 ring-4 ring-emerald-500/30'>
                  <AvatarImage src={caller.avatar} />
                  <AvatarFallback className='text-2xl'>{caller.displayName?.[0]}</AvatarFallback>
               </Avatar>
               <h2 className='text-2xl font-bold text-white mb-2'>{caller.displayName}</h2>
               <p className='text-gray-400 flex items-center gap-2'>
                  {callType === 'video' ? (
                     <>
                        <Video className='w-4 h-4' />
                        <span>Cuộc gọi video</span>
                     </>
                  ) : (
                     <>
                        <Phone className='w-4 h-4' />
                        <span>Cuộc gọi thoại</span>
                     </>
                  )}
               </p>
            </div>

            {/* Ringing Animation */}
            <div className='flex justify-center mb-8'>
               <div className='relative'>
                  <div className='absolute inset-0 rounded-full bg-emerald-500/20 animate-ping' />
                  <div className='relative w-16 h-16 rounded-full bg-emerald-500/30 flex items-center justify-center'>
                     <Phone className='w-8 h-8 text-emerald-400 animate-bounce' />
                  </div>
               </div>
            </div>

            {/* Call Actions */}
            <div className='flex gap-4'>
               <Button
                  onClick={() => {
                     console.log('[LiveKitIncomingCallModal] REJECT button clicked!');
                     handleReject();
                  }}
                  variant='destructive'
                  size='lg'
                  className='flex-1 h-14 rounded-full gap-2'
               >
                  <PhoneOff className='w-5 h-5' />
                  Từ chối
               </Button>
               <Button
                  onClick={() => {
                     console.log('[LiveKitIncomingCallModal] ACCEPT button clicked!');
                     handleAccept();
                  }}
                  size='lg'
                  className='flex-1 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 gap-2'
               >
                  <Phone className='w-5 h-5' />
                  Trả lời
               </Button>
            </div>
         </div>
      </div>
   );
};
