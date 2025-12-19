import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketService } from '@/services/socketService';
import { webRTCService } from '@/services/webRTCService';
import { useCallStore } from '@/store';
import { CALL_TIMEOUT } from '@/config';
import IncomingCallPopup from '@/components/features/call/IncomingCallPopup';
import type { User } from '@/types';

interface IncomingCall {
   callId: string;
   caller: User;
   type: 'audio' | 'video';
   timestamp: Date;
}

interface CallContextType {
   // Context methods if needed in the future
}

const CallContext = createContext<CallContextType>({});

export const useCallContext = () => {
   const context = useContext(CallContext);
   if (!context) {
      throw new Error('useCallContext must be used within a CallProvider');
   }
   return context;
};

interface CallProviderProps {
   children: React.ReactNode;
}

const CallProvider = ({ children }: CallProviderProps) => {
   const navigate = useNavigate();
   const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
   const incomingCallTimeoutRef = useRef<number | null>(null);

   // Setup socket listeners for incoming calls
   useEffect(() => {
      console.log('CallProvider socket effect - isConnected:', socketService.isConnected);

      const handleIncomingCall = (data: {
         callId: string;
         caller: User;
         type: 'audio' | 'video';
         call?: any;
         participants?: any[];
      }) => {
         console.log(' Incoming call received in CallProvider:', data);
         setIncomingCall({
            callId: data.callId,
            caller: data.caller,
            type: data.type,
            timestamp: new Date(),
         });

         // Thiết lập timeout để tự động từ chối incoming call sau 60s
         incomingCallTimeoutRef.current = setTimeout(() => {
            console.log('Incoming call timeout - auto rejecting');
            webRTCService.rejectCall(data.callId);
            setIncomingCall(null);
            incomingCallTimeoutRef.current = null;
         }, CALL_TIMEOUT);
      };

      const handleCallEnded = (data: { callId: string; endedBy: string }) => {
         console.log('Call ended:', data);
         // Clear timeout nếu có
         if (incomingCallTimeoutRef.current) {
            clearTimeout(incomingCallTimeoutRef.current);
            incomingCallTimeoutRef.current = null;
         }
         setIncomingCall(null);
      };

      const handleCallRejected = (data: { callId: string; rejectedBy: string }) => {
         console.log(' Call rejected:', data);
         // Clear timeout nếu có
         if (incomingCallTimeoutRef.current) {
            clearTimeout(incomingCallTimeoutRef.current);
            incomingCallTimeoutRef.current = null;
         }
         setIncomingCall(null);
      };

      const handleCallAccepted = (data: { callId: string; acceptedBy: string }) => {
         console.log('Call accepted:', data);
         // Clear timeout nếu có
         if (incomingCallTimeoutRef.current) {
            clearTimeout(incomingCallTimeoutRef.current);
            incomingCallTimeoutRef.current = null;
         }
         setIncomingCall(null);
      };

      // Register listeners
      socketService.on('call:incoming', handleIncomingCall);
      socketService.on('call:ended', handleCallEnded);
      socketService.on('call:rejected', handleCallRejected);
      socketService.on('call:accepted', handleCallAccepted);

      // Debug listener for custom events (development only)
      const handleDebugCall = (event: CustomEvent) => {
         console.log('Debug event received:', event.detail);
         handleIncomingCall(event.detail);
      };

      if (import.meta.env.DEV) {
         window.addEventListener('debug:incoming-call', handleDebugCall as EventListener);
      }

      console.log('CallProvider listeners registered');

      return () => {
         console.log('CallProvider cleaning up listeners');
         socketService.off('call:incoming', handleIncomingCall);
         socketService.off('call:ended', handleCallEnded);
         socketService.off('call:rejected', handleCallRejected);
         socketService.off('call:accepted', handleCallAccepted);

         if (import.meta.env.DEV) {
            window.removeEventListener('debug:incoming-call', handleDebugCall as EventListener);
         }
      };
   }, []);

   // Handle incoming call acceptance
   const handleAcceptCall = async () => {
      if (!incomingCall) return;

      // Clear timeout khi accept
      if (incomingCallTimeoutRef.current) {
         clearTimeout(incomingCallTimeoutRef.current);
         incomingCallTimeoutRef.current = null;
      }

      try {
         console.log('Accepting call:', incomingCall.callId);

         // Accept call through WebRTC service
         await webRTCService.acceptCall(incomingCall.callId, incomingCall.type);

         // Update store state to "In Call" for Callee
         // This prevents CallPage from redirecting back to chat
         useCallStore.getState().startCall(incomingCall.caller, incomingCall.type);
         useCallStore.getState().acceptCall(); // Also mark as accepted immediately

         // Navigate to call page
         navigate('/call');

         // Clear incoming call
         setIncomingCall(null);
      } catch (error) {
         console.error('Failed to accept call:', error);
      }
   };

   // Handle incoming call rejection
   const handleRejectCall = () => {
      if (!incomingCall) return;

      // Clear timeout khi reject
      if (incomingCallTimeoutRef.current) {
         clearTimeout(incomingCallTimeoutRef.current);
         incomingCallTimeoutRef.current = null;
      }

      console.log('Rejecting call:', incomingCall.callId);

      // Reject call through WebRTC service
      webRTCService.rejectCall(incomingCall.callId);

      // Clear incoming call
      setIncomingCall(null);
   };

   const contextValue: CallContextType = {};

   return (
      <CallContext.Provider value={contextValue}>
         {children}

         {/* Incoming Call Popup */}
         {incomingCall && (
            <IncomingCallPopup
               caller={incomingCall.caller}
               callType={incomingCall.type}
               onAccept={handleAcceptCall}
               onReject={handleRejectCall}
            />
         )}
      </CallContext.Provider>
   );
};

export default CallProvider;
