import { useEffect, useState, useRef } from 'react';
import { useCallStore } from '@/store';
import { socketService } from '@/services/socketService';
import { webRTCService } from '@/services/webRTCService';
import { CALL_TIMEOUT } from '@/config';
import type { User } from '@/types';

interface UseCallManagerProps {
   currentUser?: User;
}

interface IncomingCall {
   callId: string;
   caller: User;
   type: 'audio' | 'video';
   timestamp: Date;
}

export const useCallManager = ({}: UseCallManagerProps = {}) => {
   const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
   const [isCallActive, setIsCallActive] = useState(false);
   const callTimeoutRef = useRef<number | null>(null);
   const incomingCallTimeoutRef = useRef<number | null>(null);

   const { isInCall, startCall, endCall, setError, setConnecting } = useCallStore();

   useEffect(() => {
      if (!socketService.isConnected) return;

      // ===== Incoming call (callee side) =====
      const handleIncomingCall = (data: {
         callId: string;
         caller: User;
         type: 'audio' | 'video';
         call?: any;
         participants?: any[];
      }) => {
         console.log('Incoming call received in useCallManager:', data);
         setIncomingCall({
            callId: data.callId,
            caller: data.caller,
            type: data.type,
            timestamp: new Date(),
         });
      };

      // ===== Call accepted (server notify both sides) =====
      const handleCallAccepted = (data: { callId: string; acceptedBy: string }) => {
         console.log('Call accepted (useCallManager):', data);
         // Clear timeout khi call được accepted
         if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
         }
         if (incomingCallTimeoutRef.current) {
            clearTimeout(incomingCallTimeoutRef.current);
            incomingCallTimeoutRef.current = null;
         }
         // Caller side: WebRTCService sẽ tự handle createOffer trong handleCallAccepted()
         // UI side:
         setIncomingCall(null);
         setIsCallActive(true);
         setConnecting(false);
      };

      // ===== Call rejected (server notify both sides) =====
      const handleCallRejected = (data: { callId: string; rejectedBy: string }) => {
         console.log('Call rejected:', data);
         // Clear timeout
         if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
         }
         setIncomingCall(null);
         setIsCallActive(false);
         setError('Call was rejected');

         // cleanup local WebRTC mà không notify server lần nữa
         webRTCService.endCall(data.callId, false);
         endCall();
      };

      // ===== Call ended (server notify) =====
      const handleCallEnded = (data: { callId: string; endedBy: string }) => {
         console.log('Call ended:', data);
         // Clear timeout
         if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
         }
         setIncomingCall(null);
         setIsCallActive(false);

         // cleanup local WebRTC mà không notify server
         webRTCService.endCall(data.callId, false);
         endCall();
      };

      // Connection error (socket)
      const handleConnectionError = (error: any) => {
         console.error('Connection error:', error);
         setError('Connection failed');
         setConnecting(false);

         const currentCallId = webRTCService.getCurrentCallId();
         if (currentCallId) {
            webRTCService.endCall(currentCallId, false);
         }
         setIsCallActive(false);
         endCall();
      };

      // Call error (business level)
      const handleCallError = (error: any) => {
         console.error('Call error:', error);
         let errorMessage = 'Call failed';

         if (error) {
            if (typeof error === 'string') {
               errorMessage = error;
            } else if (typeof error === 'object') {
               errorMessage = error.message || (error as any).error || 'Call error occurred';
            }
         }

         setError(errorMessage);
         setConnecting(false);

         // Cleanup local state
         const currentCallId = webRTCService.getCurrentCallId();
         if (currentCallId) {
            webRTCService.endCall(currentCallId, false);
         }

         setIsCallActive(false);
         endCall();

         // Clear error after 5 seconds
         setTimeout(() => setError(undefined), 5000);
      };

      // Call ringing (server báo cho caller: bên kia đang rung chuông)
      const handleCallRinging = (data: { callId: string }) => {
         console.log('Call ringing:', data);
         setConnecting(true);
      };

      // Call cancel (caller hủy trước khi callee accept)
      const handleCallCancel = (data: { callId: string }) => {
         console.log('Call cancelled:', data);
         // Clear timeout
         if (incomingCallTimeoutRef.current) {
            clearTimeout(incomingCallTimeoutRef.current);
            incomingCallTimeoutRef.current = null;
         }
         setIncomingCall(null);
         setIsCallActive(false);
         setError('Call was cancelled');

         webRTCService.endCall(data.callId, false);
         endCall();
      };

      // Another alias for "call ended" (tuỳ backend)
      const handleCallEnd = (data: { callId: string; endedBy: string }) => {
         console.log('Call ended (call:end):', data);
         setIncomingCall(null);
         setIsCallActive(false);

         webRTCService.endCall(data.callId, false);
         endCall();
      };

      // For caller side: some backends dùng "call:accept/call:reject"
      const handleCallAccept = (data: { callId: string; acceptedBy: string }) => {
         console.log('Call accept (call:accept):', data);
         setIncomingCall(null);
         setIsCallActive(true);
         setConnecting(false);
      };

      const handleCallReject = (data: { callId: string; rejectedBy: string }) => {
         console.log('Call reject (call:reject):', data);
         setIncomingCall(null);
         setIsCallActive(false);
         setError('Call was rejected');

         webRTCService.endCall(data.callId, false);
         endCall();
      };

      // Handle call timeout from Backend
      const handleCallTimeout = (data: {
         callId: string;
         reason: 'no_answer' | 'connection_failed';
         message?: string;
      }) => {
         console.log('Call timeout from server:', data);

         // Clear local timeouts
         if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
         }
         if (incomingCallTimeoutRef.current) {
            clearTimeout(incomingCallTimeoutRef.current);
            incomingCallTimeoutRef.current = null;
         }

         setIncomingCall(null);
         setIsCallActive(false);

         // Set error message based on timeout reason
         const errorMessage =
            data.reason === 'no_answer' ? 'No answer - Call timed out' : 'Connection failed - Unable to establish call';

         setError(data.message || errorMessage);
         setConnecting(false);

         // Cleanup WebRTC without notifying server (server already handled it)
         webRTCService.endCall(data.callId, false);
         endCall();
      };

      // Đăng ký listener
      socketService.on('call:incoming', handleIncomingCall);
      socketService.on('call:accepted', handleCallAccepted);
      socketService.on('call:rejected', handleCallRejected);
      socketService.on('call:ended', handleCallEnded);
      socketService.on('call:error', handleCallError);
      socketService.on('connect_error', handleConnectionError);
      socketService.on('call:ringing', handleCallRinging);
      socketService.on('call:cancel', handleCallCancel);
      socketService.on('call:end', handleCallEnd);
      socketService.on('call:accept', handleCallAccept);
      socketService.on('call:reject', handleCallReject);
      socketService.on('call:timeout', handleCallTimeout);

      return () => {
         socketService.off('call:incoming', handleIncomingCall);
         socketService.off('call:accepted', handleCallAccepted);
         socketService.off('call:rejected', handleCallRejected);
         socketService.off('call:ended', handleCallEnded);
         socketService.off('call:error', handleCallError);
         socketService.off('connect_error', handleConnectionError);
         socketService.off('call:ringing', handleCallRinging);
         socketService.off('call:cancel', handleCallCancel);
         socketService.off('call:end', handleCallEnd);
         socketService.off('call:accept', handleCallAccept);
         socketService.off('call:reject', handleCallReject);
         socketService.off('call:timeout', handleCallTimeout);
      };
   }, [socketService.isConnected, endCall, setError, setConnecting]);

   const initiateCall = async (receiver: User, callType: 'audio' | 'video') => {
      try {
         setConnecting(true);
         setError(undefined);

         // initializeCall giờ chỉ gửi request, chưa tạo WebRTC
         const callId = await webRTCService.initializeCall(receiver.id, callType);

         // startCall hiện tại chỉ nhận 2 tham số (receiver, type)
         startCall(receiver, callType);

         // Đang ở trạng thái "calling..." – chưa nối WebRTC
         setIsCallActive(false);

         // Thiết lập timeout để tự động hủy call nếu không có response
         // Note: Backend cũng có timeout 30s, event call:timeout sẽ được emit từ server
         callTimeoutRef.current = setTimeout(() => {
            console.log('Call timeout - no response from receiver');
            setError('No answer - Call timed out after 30 seconds');
            setConnecting(false);
            webRTCService.endCall(callId, true);
            endCall();
            callTimeoutRef.current = null;
         }, CALL_TIMEOUT);

         return callId;
      } catch (error) {
         console.error('Error initiating call:', error);
         setError('Failed to start call');
         setConnecting(false);
         throw error;
      }
   };
   const acceptIncomingCall = async () => {
      if (!incomingCall) return;

      try {
         setConnecting(true);
         setError(undefined);

         // Callee mở cam/mic + báo server accept
         await webRTCService.acceptCall(incomingCall.callId, incomingCall.type);

         // startCall hiện tại chỉ nhận (user, type)
         startCall(incomingCall.caller, incomingCall.type);

         setIncomingCall(null);
         setIsCallActive(true);
      } catch (error) {
         console.error('Error accepting call:', error);
         setError('Failed to accept call');
         setConnecting(false);
         rejectIncomingCall();
      }
   };

   const rejectIncomingCall = () => {
      if (!incomingCall) return;

      webRTCService.rejectCall(incomingCall.callId);
      setIncomingCall(null);
   };

   const endCurrentCall = () => {
      // Clear timeout nếu có
      if (callTimeoutRef.current) {
         clearTimeout(callTimeoutRef.current);
         callTimeoutRef.current = null;
      }
      if (incomingCallTimeoutRef.current) {
         clearTimeout(incomingCallTimeoutRef.current);
         incomingCallTimeoutRef.current = null;
      }

      const callId = webRTCService.getCurrentCallId();
      if (callId) {
         // user chủ động end -> notify server
         webRTCService.endCall(callId);
      }

      setIsCallActive(false);
      setIncomingCall(null);
      endCall();
   };

   return {
      // State
      incomingCall,
      isCallActive,
      isInCall,

      // Actions
      initiateCall,
      acceptIncomingCall,
      rejectIncomingCall,
      endCurrentCall,

      // Utils
      hasIncomingCall: !!incomingCall,
   };
};

export default useCallManager;
