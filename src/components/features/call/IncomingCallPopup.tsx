import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video, Vibrate } from 'lucide-react';
import type { User } from '@/types';

interface IncomingCallPopupProps {
   caller: User;
   callType: 'audio' | 'video';
   onAccept: () => void;
   onReject: () => void;
}

const IncomingCallPopup = ({ caller, callType, onAccept, onReject }: IncomingCallPopupProps) => {
   return (
      <div className='fixed inset-0 z-9999  backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500'>
         {/* Background particles effect */}
         <div className='absolute inset-0 overflow-hidden'>
            <div className='absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-pulse'></div>
            <div className='absolute top-3/4 right-1/4 w-3 h-3 bg-purple-400/20 rounded-full animate-pulse delay-75'></div>
            <div className='absolute bottom-1/4 left-1/3 w-1 h-1 bg-green-400/40 rounded-full animate-pulse delay-150'></div>
         </div>

         <div className='relative bg-linear-to-br from-white via-white to-gray-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl border border-gray-200/20 dark:border-gray-700/30 animate-in slide-in-from-bottom-8 duration-500 backdrop-blur-sm'>
            {/* Pulsing rings around avatar */}
            <div className='relative mb-8'>
               <div className='absolute inset-0 rounded-full bg-linear-to-r from-blue-400 to-purple-500 opacity-20 animate-ping'></div>
               <div className='absolute inset-2 rounded-full bg-linear-to-r from-blue-400 to-purple-500 opacity-30 animate-ping animation-delay-75'></div>
               <div className='absolute inset-4 rounded-full bg-linear-to-r from-blue-400 to-purple-500 opacity-40 animate-ping animation-delay-150'></div>

               {/* Avatar container with glow */}
               <div className='relative z-10'>
                  <Avatar className='h-24 w-24 mx-auto mb-4 ring-4 ring-white/20 dark:ring-gray-700/50 shadow-2xl'>
                     <AvatarImage
                        src={caller.avatar || ''}
                        alt={caller.displayName || caller.username}
                        className='object-cover'
                     />
                     <AvatarFallback className='text-2xl bg-linear-to-br from-blue-500 to-purple-600 text-white font-bold'>
                        {(caller.displayName || caller.username).slice(0, 2).toUpperCase()}
                     </AvatarFallback>
                  </Avatar>
               </div>
            </div>

            {/* Caller Info */}
            <div className='mb-8 space-y-2'>
               <h3 className='text-2xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent'>
                  {caller.displayName || caller.username}
               </h3>

               <div className='flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400'>
                  <Vibrate className='h-4 w-4 animate-bounce' />
                  <p className='text-lg font-medium'>Incoming {callType} call</p>
                  {callType === 'video' ? (
                     <Video className='h-4 w-4 text-blue-500' />
                  ) : (
                     <Phone className='h-4 w-4 text-green-500' />
                  )}
               </div>

               {/* Sound waves animation */}
               <div className='flex justify-center items-center space-x-1 mt-4'>
                  <div
                     className='w-1 bg-linear-to-t from-blue-400 to-purple-500 rounded-full animate-pulse'
                     style={{ height: '20px', animationDelay: '0ms' }}
                  ></div>
                  <div
                     className='w-1 bg-linear-to-t from-blue-400 to-purple-500 rounded-full animate-pulse'
                     style={{ height: '30px', animationDelay: '100ms' }}
                  ></div>
                  <div
                     className='w-1 bg-linear-to-t from-blue-400 to-purple-500 rounded-full animate-pulse'
                     style={{ height: '25px', animationDelay: '200ms' }}
                  ></div>
                  <div
                     className='w-1 bg-linear-to-t from-blue-400 to-purple-500 rounded-full animate-pulse'
                     style={{ height: '35px', animationDelay: '300ms' }}
                  ></div>
                  <div
                     className='w-1 bg-linear-to-t from-blue-400 to-purple-500 rounded-full animate-pulse'
                     style={{ height: '25px', animationDelay: '400ms' }}
                  ></div>
                  <div
                     className='w-1 bg-linear-to-t from-blue-400 to-purple-500 rounded-full animate-pulse'
                     style={{ height: '30px', animationDelay: '500ms' }}
                  ></div>
                  <div
                     className='w-1 bg-linear-to-t from-blue-400 to-purple-500 rounded-full animate-pulse'
                     style={{ height: '20px', animationDelay: '600ms' }}
                  ></div>
               </div>
            </div>

            {/* Call Actions */}
            <div className='flex justify-center items-center space-x-12'>
               {/* Reject Button */}
               <div className='relative group'>
                  <div className='absolute inset-0 bg-linear-to-r from-red-500 to-red-600 rounded-full opacity-75 group-hover:opacity-100 animate-pulse transition-opacity'></div>
                  <Button
                     onClick={onReject}
                     variant='destructive'
                     size='lg'
                     className='relative rounded-full h-16 w-16 p-0 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all duration-200 group-hover:animate-none'
                  >
                     <PhoneOff className='h-7 w-7 text-white' />
                  </Button>
               </div>

               {/* Accept Button */}
               <div className='relative group'>
                  <div className='absolute inset-0 bg-linear-to-r from-green-500 to-emerald-600 rounded-full opacity-75 group-hover:opacity-100 animate-pulse transition-opacity'></div>
                  <Button
                     onClick={onAccept}
                     variant='default'
                     size='lg'
                     className='relative rounded-full h-16 w-16 p-0 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all duration-200 group-hover:animate-none'
                  >
                     {callType === 'video' ? (
                        <Video className='h-7 w-7 text-white' />
                     ) : (
                        <Phone className='h-7 w-7 text-white' />
                     )}
                  </Button>
               </div>
            </div>

            {/* Swipe indicator */}
            <div className='mt-6 text-xs text-gray-500 dark:text-gray-400 animate-pulse'>
               Tap to answer • Hold to decline
            </div>
         </div>
      </div>
   );
};

export default IncomingCallPopup;
