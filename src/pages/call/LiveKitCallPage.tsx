import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LiveKitCallScreen } from '@/components/features/call/LiveKitCallScreen';
import { useLiveKitCall } from '@/contexts/LiveKitCallProvider';
import { Loader2 } from 'lucide-react';
import type { User } from '@/types';

export const LiveKitCallPage = () => {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const { currentCallId, endCurrentCall } = useLiveKitCall();

   const [callId, setCallId] = useState<string | null>(null);
   const [callType, setCallType] = useState<'audio' | 'video'>('video');
   const [receiver, setReceiver] = useState<User | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      // Get call info from URL params
      const callIdParam = searchParams.get('callId');
      const typeParam = searchParams.get('type');
      const receiverName = searchParams.get('receiver');
      const receiverAvatar = searchParams.get('receiverAvatar');
      const receiverId = searchParams.get('receiverId');

      if (!callIdParam) {
         // If no callId in URL, use currentCallId from manager
         if (currentCallId) {
            setCallId(currentCallId);
         } else {
            console.error('No call ID provided');
            navigate('/chat');
            return;
         }
      } else {
         setCallId(callIdParam);
      }

      if (typeParam) {
         setCallType(typeParam as 'audio' | 'video');
      }

      if (receiverName) {
         setReceiver({
            id: receiverId || '',
            displayName: receiverName,
            avatar: receiverAvatar || undefined,
         } as User);
      }

      setIsLoading(false);
   }, [searchParams, currentCallId, navigate]);

   const handleCallEnd = async () => {
      await endCurrentCall();
      navigate('/chat');
   };

   if (isLoading) {
      return (
         <div className='fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-gray-950 via-slate-900 to-gray-950'>
            <div className='text-center space-y-6'>
               <div className='relative inline-block'>
                  <div className='w-20 h-20 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl'>
                     <Loader2 className='w-10 h-10 text-blue-300 animate-spin' />
                  </div>
                  <span className='absolute inset-0 rounded-full bg-blue-500/20 animate-ping' />
               </div>
               <p className='text-white text-lg font-medium'>Đang tải cuộc gọi...</p>
            </div>
         </div>
      );
   }

   if (!callId) {
      return (
         <div className='fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-gray-950 via-slate-900 to-gray-950 text-white'>
            <div className='text-center space-y-6 max-w-md mx-auto p-8'>
               <div className='w-20 h-20 mx-auto rounded-full bg-red-500/20 backdrop-blur-xl border border-red-500/30 flex items-center justify-center'>
                  <svg
                     className='w-10 h-10 text-red-400'
                     fill='none'
                     viewBox='0 0 24 24'
                     stroke='currentColor'
                  >
                     <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                     />
                  </svg>
               </div>
               <div className='space-y-2'>
                  <p className='text-2xl font-semibold'>Không tìm thấy cuộc gọi</p>
                  <p className='text-gray-400 text-sm'>Vui lòng kiểm tra lại liên kết hoặc thử lại sau</p>
               </div>
               <button
                  onClick={() => navigate('/chat')}
                  className='px-8 py-3 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg'
               >
                  Quay lại Chat
               </button>
            </div>
         </div>
      );
   }

   return (
      <LiveKitCallScreen
         callId={callId}
         callType={callType}
         receiver={receiver || undefined}
         onCallEnd={handleCallEnd}
      />
   );
};
