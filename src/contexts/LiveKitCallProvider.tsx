import { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveKitCallManager } from '@/hooks/useLiveKitCallManager';
import { LiveKitIncomingCallModal } from '@/components/features/call/LiveKitIncomingCallModal';
import type { User } from '@/types';

interface IncomingCall {
   callId: string;
   caller: User;
   type: 'audio' | 'video';
   timestamp: Date;
}

interface LiveKitCallContextValue {
   // Incoming call state
   incomingCall: IncomingCall | null;
   hasIncomingCall: boolean;

   // Call actions
   initiateCall: (conversationId: string, type: 'audio' | 'video') => Promise<string | null>;
   acceptIncomingCall: () => Promise<void>;
   rejectIncomingCall: () => Promise<void>;
   endCurrentCall: () => Promise<void>;

   // Current call state
   currentCallId: string | null;
   isInCall: boolean;
}

const LiveKitCallContext = createContext<LiveKitCallContextValue | null>(null);

export const useLiveKitCall = () => {
   const context = useContext(LiveKitCallContext);
   if (!context) {
      throw new Error('useLiveKitCall must be used within LiveKitCallProvider');
   }
   return context;
};

const CallNavigator = ({ callManager }: { callManager: LiveKitCallContextValue }) => {
   const navigate = useNavigate();
   const { incomingCall, hasIncomingCall, acceptIncomingCall, rejectIncomingCall } = callManager;

   const handleAccept = async () => {
      if (!incomingCall) return;

      // Save call info BEFORE accepting (because acceptIncomingCall clears the state)
      const callId = incomingCall.callId;
      const callType = incomingCall.type;
      const callerName = incomingCall.caller.displayName;
      const callerAvatar = incomingCall.caller.avatar || '';
      const callerId = incomingCall.caller.id;

      console.log('[LiveKitCallProvider] Accept button pressed, callId:', callId);

      await acceptIncomingCall();

      // Navigate using React Router with saved values
      const params = new URLSearchParams({
         callId,
         type: callType,
         receiver: callerName,
         receiverAvatar: callerAvatar,
         receiverId: callerId,
      });

      console.log('[LiveKitCallProvider] Navigating to:', `/call/livekit?${params.toString()}`);
      navigate(`/call/livekit?${params.toString()}`);
   };

   const handleReject = async () => {
      console.log('[LiveKitCallProvider] Reject button pressed');
      await rejectIncomingCall();
   };

   return (
      <>
         {hasIncomingCall && incomingCall && (
            <LiveKitIncomingCallModal
               caller={incomingCall.caller}
               callType={incomingCall.type}
               onAccept={handleAccept}
               onReject={handleReject}
            />
         )}
      </>
   );
};

export const LiveKitCallProvider = ({ children }: { children: React.ReactNode }) => {
   // Use the hook ONLY ONCE in the entire app
   const callManager = useLiveKitCallManager();

   return (
      <LiveKitCallContext.Provider value={callManager}>
         {children}
         <CallNavigator callManager={callManager} />
      </LiveKitCallContext.Provider>
   );
};
