import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { socketService } from '@/services/socketService';

const CallDebugPanel = () => {
   const [isVisible, setIsVisible] = useState(false);

   const triggerIncomingCall = () => {
      // Simulate incoming call data
      const mockCallData = {
         callId: `debug_call_${Date.now()}`,
         caller: {
            id: 'debug_user_123',
            username: 'testuser',
            displayName: 'Test User',
            avatar: null,
            isOnline: true,
         },
         type: 'audio' as const,
         call: {},
         participants: [],
      };

      console.log('🧪 Debug: Manually triggering call:incoming event with data:', mockCallData);

      // Trigger the event handler directly (simulate receiving from server)
      if (socketService && (socketService as any).socket) {
         (socketService as any).socket.emit('call:incoming', mockCallData);
         // Also try to trigger the handler directly
         setTimeout(() => {
            console.log('🧪 Debug: Attempting to trigger handler directly');
            // We'll use a custom event to simulate this
            window.dispatchEvent(new CustomEvent('debug:incoming-call', { detail: mockCallData }));
         }, 100);
      }
   };

   const triggerVideoCall = () => {
      const mockCallData = {
         callId: `debug_video_call_${Date.now()}`,
         caller: {
            id: 'debug_user_456',
            username: 'videotester',
            displayName: 'Video Test User',
            avatar: null,
            isOnline: true,
         },
         type: 'video' as const,
         call: {},
         participants: [],
      };

      console.log('🧪 Debug: Manually triggering video call:incoming event with data:', mockCallData);

      if (socketService && (socketService as any).socket) {
         (socketService as any).socket.emit('call:incoming', mockCallData);
         setTimeout(() => {
            window.dispatchEvent(new CustomEvent('debug:incoming-call', { detail: mockCallData }));
         }, 100);
      }
   };

   if (!isVisible) {
      return (
         <Button
            onClick={() => setIsVisible(true)}
            className='fixed bottom-4 left-4 z-50 bg-yellow-500 hover:bg-yellow-600'
            size='sm'
         >
            📞 Debug
         </Button>
      );
   }

   return (
      <Card className='fixed bottom-4 left-4 z-50 w-64'>
         <CardHeader className='pb-2'>
            <CardTitle className='text-sm flex justify-between'>
               Call Debug Panel
               <Button
                  onClick={() => setIsVisible(false)}
                  variant='ghost'
                  size='sm'
                  className='h-6 w-6 p-0'
               >
                  ✕
               </Button>
            </CardTitle>
         </CardHeader>
         <CardContent className='space-y-2'>
            <Button
               onClick={triggerIncomingCall}
               className='w-full bg-blue-500 hover:bg-blue-600'
               size='sm'
            >
               🔊 Test Audio Call
            </Button>
            <Button
               onClick={triggerVideoCall}
               className='w-full bg-green-500 hover:bg-green-600'
               size='sm'
            >
               📹 Test Video Call
            </Button>
            <div className='text-xs text-muted-foreground'>
               Socket: {socketService.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
         </CardContent>
      </Card>
   );
};

export default CallDebugPanel;
