import { useEffect, useState, useRef, useCallback } from 'react';
import { socketService } from '@/services/socketService';
import { callService } from '@/services/callService';
import { livekitService } from '@/services/livekitService';
import type { User } from '@/types';

interface IncomingCall {
   callId: string;
   caller: User;
   type: 'audio' | 'video';
   timestamp: Date;
}

interface UseLiveKitCallManagerReturn {
   // Incoming call state
   incomingCall: IncomingCall | null;
   hasIncomingCall: boolean;

   // Call error state
   callError: string | null;
   clearCallError: () => void;

   // Call actions
   initiateCall: (conversationId: string, type: 'audio' | 'video') => Promise<string | null>;
   acceptIncomingCall: () => Promise<void>;
   rejectIncomingCall: () => Promise<void>;
   endCurrentCall: () => Promise<void>;

   // Current call state
   currentCallId: string | null;
   isInCall: boolean;
}

export const useLiveKitCallManager = (): UseLiveKitCallManagerReturn => {
   const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
   const [currentCallId, setCurrentCallId] = useState<string | null>(null);
   const [callError, setCallError] = useState<string | null>(null);
   const incomingCallTimeoutRef = useRef<number | null>(null);
   const outgoingCallTimeoutRef = useRef<number | null>(null);
   // Flag to prevent socket listener from clearing incomingCall while user is accepting
   const isAcceptingRef = useRef<boolean>(false);

   useEffect(() => {
      let cleanupFn: (() => void) | undefined;
      let retryTimeout: number | undefined;
      let isSetup = false;

      // Setup all event handlers
      const setupListeners = () => {
         if (isSetup) return; // Already setup

         if (!socketService.isConnected) {
            console.log('[LiveKitCallManager] Waiting for socket connection...');
            // Retry after a short delay
            retryTimeout = setTimeout(setupListeners, 1000) as any as number;
            return;
         }

         isSetup = true;
         console.log('[LiveKitCallManager] Socket connected, setting up listeners');

         // ===== Handle incoming call =====
         const handleIncomingCall = (data: {
            callId: string;
            caller: User;
            type: 'AUDIO' | 'VIDEO';
            call?: { id: string };
         }) => {
            console.log('[LiveKitCallManager] Incoming call:', data);

            // Use call.id if available, fallback to callId
            const actualCallId = data.call?.id || data.callId;

            // Auto-reject if already in a call
            if (livekitService.isInCall() || livekitService.getCurrentCallId()) {
               console.log('[LiveKitCallManager] Already in a call, auto-rejecting incoming call');
               callService
                  .rejectCall(actualCallId)
                  .catch((err) => console.error('[LiveKitCallManager] Failed to auto-reject:', err));
               return;
            }

            setIncomingCall({
               callId: actualCallId,
               caller: data.caller,
               type: data.type.toLowerCase() as 'audio' | 'video',
               timestamp: new Date(),
            });

            // Auto-reject after timeout
            incomingCallTimeoutRef.current = setTimeout(() => {
               console.log('[LiveKitCallManager] Incoming call timeout, auto-rejecting');
               rejectIncomingCall();
            }, 30000) as any as number; // 30 seconds
         };

         // ===== Handle call accepted =====
         const handleCallAccepted = (data: { callId: string; acceptedBy: string; call?: { id: string } }) => {
            console.log('[LiveKitCallManager] Call accepted:', data);

            // Use call.id if available, fallback to callId
            const actualCallId = data.call?.id || data.callId;

            // Clear timeouts
            if (incomingCallTimeoutRef.current) {
               clearTimeout(incomingCallTimeoutRef.current);
               incomingCallTimeoutRef.current = null;
            }
            if (outgoingCallTimeoutRef.current) {
               clearTimeout(outgoingCallTimeoutRef.current);
               outgoingCallTimeoutRef.current = null;
            }

            // If we're currently accepting the call, don't clear incomingCall here
            // Let acceptIncomingCall handle it after navigation
            if (isAcceptingRef.current) {
               console.log('[LiveKitCallManager] Skipping incomingCall clear - user is accepting');
               setCurrentCallId(actualCallId);
               return;
            }

            setIncomingCall(null);
            setCurrentCallId(actualCallId);
         };

         // ===== Handle call rejected =====
         const handleCallRejected = (data: { callId: string; rejectedBy: string; call?: { id: string } }) => {
            console.log('[LiveKitCallManager] Call rejected:', data);

            // Use call.id if available, fallback to callId
            const actualCallId = data.call?.id || data.callId;

            // Clear timeouts
            if (incomingCallTimeoutRef.current) {
               clearTimeout(incomingCallTimeoutRef.current);
               incomingCallTimeoutRef.current = null;
            }
            if (outgoingCallTimeoutRef.current) {
               clearTimeout(outgoingCallTimeoutRef.current);
               outgoingCallTimeoutRef.current = null;
            }

            setIncomingCall(null);
            setCurrentCallId(null);

            // Cleanup LiveKit if in call
            if (livekitService.getCurrentCallId() === actualCallId) {
               livekitService.leaveCall();
            }
         };

         // ===== Handle call ended =====
         const handleCallEnded = (data: { callId: string; call?: { id: string }; reason?: string }) => {
            console.log('[LiveKitCallManager] Call ended:', data);

            // Use call.id if available, fallback to callId
            const actualCallId = data.call?.id || data.callId;

            // Clear incoming call timeout
            if (incomingCallTimeoutRef.current) {
               clearTimeout(incomingCallTimeoutRef.current);
               incomingCallTimeoutRef.current = null;
            }
            if (outgoingCallTimeoutRef.current) {
               clearTimeout(outgoingCallTimeoutRef.current);
               outgoingCallTimeoutRef.current = null;
            }

            setCurrentCallId(null);
            setIncomingCall(null);

            // Cleanup LiveKit
            if (livekitService.getCurrentCallId() === actualCallId) {
               livekitService.leaveCall();
            }
         };

         // ===== Handle participant disconnected (other user left) =====
         const handleParticipantDisconnected = (data: {
            callId: string;
            userId: string;
            remainingParticipants: number;
         }) => {
            console.log('[LiveKitCallManager] Participant disconnected:', data);

            // If call effectively ended (1:1 call, other person left)
            if (data.remainingParticipants <= 1) {
               setCurrentCallId(null);
               setIncomingCall(null);

               if (livekitService.getCurrentCallId() === data.callId) {
                  livekitService.leaveCall();
               }
            }
         };

         // Register socket listeners
         socketService.on('call:incoming', handleIncomingCall);
         socketService.on('call:accepted', handleCallAccepted);
         socketService.on('call:rejected', handleCallRejected);
         socketService.on('call:ended', handleCallEnded);
         socketService.on('call:end', handleCallEnded);
         socketService.on('call:participant_disconnected', handleParticipantDisconnected);

         console.log('[LiveKitCallManager] Listeners registered successfully');

         cleanupFn = () => {
            // Cleanup socket listeners
            socketService.off('call:incoming', handleIncomingCall);
            socketService.off('call:accepted', handleCallAccepted);
            socketService.off('call:rejected', handleCallRejected);
            socketService.off('call:ended', handleCallEnded);
            socketService.off('call:end', handleCallEnded);
            socketService.off('call:participant_disconnected', handleParticipantDisconnected);

            // Clear timeout
            if (incomingCallTimeoutRef.current) {
               clearTimeout(incomingCallTimeoutRef.current);
            }
            if (outgoingCallTimeoutRef.current) {
               clearTimeout(outgoingCallTimeoutRef.current);
            }

            console.log('[LiveKitCallManager] Listeners cleaned up');
         };
      };

      // Start setup
      setupListeners();

      // Cleanup function
      return () => {
         if (retryTimeout) {
            clearTimeout(retryTimeout);
         }
         if (cleanupFn) {
            cleanupFn();
         }
      };
   }, []);

   const initiateCall = useCallback(
      async (conversationId: string, type: 'audio' | 'video'): Promise<string | null> => {
         try {
            // Prevent initiating a new call while already in one
            if (currentCallId || livekitService.isInCall()) {
               console.warn('[LiveKitCallManager] Already in a call, cannot initiate another');
               setCallError('Bạn đang trong một cuộc gọi khác');
               return null;
            }

            // Prevent initiating while receiving an incoming call
            if (incomingCall) {
               console.warn('[LiveKitCallManager] Have incoming call, cannot initiate');
               setCallError('Bạn đang có cuộc gọi đến');
               return null;
            }

            console.log('[LiveKitCallManager] Initiating call:', { conversationId, type });

            const response = await callService.initiateCall({
               conversationId,
               type: type.toUpperCase() as 'AUDIO' | 'VIDEO',
            });

            if (!response.data) {
               setCallError('Không thể bắt đầu cuộc gọi');
               return null;
            }

            const callId = response.data.call.id;
            setCurrentCallId(callId);

            // Auto-end if receiver doesn't answer within 30s
            outgoingCallTimeoutRef.current = setTimeout(async () => {
               console.log('[LiveKitCallManager] Outgoing call timeout, auto-ending');
               try {
                  await callService.endCall(callId);
               } catch (err) {
                  console.error('[LiveKitCallManager] Failed to auto-end call:', err);
               }
               setCurrentCallId(null);
            }, 30000) as unknown as number;

            console.log('[LiveKitCallManager] Call initiated:', callId);
            return callId;
         } catch (error: unknown) {
            console.error('[LiveKitCallManager] Failed to initiate call:', error);
            const apiMessage =
               error && typeof error === 'object' && 'message' in error
                  ? (error as { message: string }).message
                  : undefined;
            setCallError(apiMessage || 'Không thể bắt đầu cuộc gọi');
            return null;
         }
      },
      [currentCallId, incomingCall],
   );

   const acceptIncomingCall = useCallback(async () => {
      if (!incomingCall) {
         console.warn('[LiveKitCallManager] No incoming call to accept');
         return;
      }

      try {
         console.log('[LiveKitCallManager] Accepting call:', incomingCall.callId);

         // Set flag to prevent socket listener from clearing incomingCall prematurely
         isAcceptingRef.current = true;

         // Clear timeout
         if (incomingCallTimeoutRef.current) {
            clearTimeout(incomingCallTimeoutRef.current);
            incomingCallTimeoutRef.current = null;
         }

         // Save callId before clearing state
         const acceptedCallId = incomingCall.callId;

         await callService.answerCall(acceptedCallId);

         setCurrentCallId(acceptedCallId);
         // Clear incomingCall AFTER setting currentCallId to close the popup
         setIncomingCall(null);

         console.log('[LiveKitCallManager] Call accepted successfully');
      } catch (error) {
         console.error('[LiveKitCallManager] Failed to accept call:', error);
         setIncomingCall(null);
      } finally {
         isAcceptingRef.current = false;
      }
   }, [incomingCall]);

   const rejectIncomingCall = useCallback(async () => {
      if (!incomingCall) {
         console.warn('[LiveKitCallManager] No incoming call to reject');
         return;
      }

      try {
         console.log('[LiveKitCallManager] Rejecting call:', incomingCall.callId);

         // Clear timeout
         if (incomingCallTimeoutRef.current) {
            clearTimeout(incomingCallTimeoutRef.current);
            incomingCallTimeoutRef.current = null;
         }

         await callService.rejectCall(incomingCall.callId);

         setIncomingCall(null);

         console.log('[LiveKitCallManager] Call rejected');
      } catch (error) {
         console.error('[LiveKitCallManager] Failed to reject call:', error);
         setIncomingCall(null);
      }
   }, [incomingCall]);

   const endCurrentCall = useCallback(async () => {
      // Clear outgoing call timeout
      if (outgoingCallTimeoutRef.current) {
         clearTimeout(outgoingCallTimeoutRef.current);
         outgoingCallTimeoutRef.current = null;
      }

      if (!currentCallId) {
         console.warn('[LiveKitCallManager] No current call to end');
         return;
      }

      try {
         console.log('[LiveKitCallManager] Ending call:', currentCallId);

         await livekitService.leaveCall();

         setCurrentCallId(null);

         console.log('[LiveKitCallManager] Call ended');
      } catch (error) {
         console.error('[LiveKitCallManager] Failed to end call:', error);
         setCurrentCallId(null);
      }
   }, [currentCallId]);

   const clearCallError = useCallback(() => {
      setCallError(null);
   }, []);

   return {
      incomingCall,
      hasIncomingCall: incomingCall !== null,
      callError,
      clearCallError,
      initiateCall,
      acceptIncomingCall,
      rejectIncomingCall,
      endCurrentCall,
      currentCallId,
      isInCall: livekitService.isInCall(),
   };
};
