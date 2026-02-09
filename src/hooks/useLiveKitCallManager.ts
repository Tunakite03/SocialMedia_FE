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
   const incomingCallTimeoutRef = useRef<number | null>(null);
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

            // Clear timeout
            if (incomingCallTimeoutRef.current) {
               clearTimeout(incomingCallTimeoutRef.current);
               incomingCallTimeoutRef.current = null;
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

            // Clear timeout
            if (incomingCallTimeoutRef.current) {
               clearTimeout(incomingCallTimeoutRef.current);
               incomingCallTimeoutRef.current = null;
            }

            setIncomingCall(null);
            setCurrentCallId(null);

            // Cleanup LiveKit if in call
            if (livekitService.getCurrentCallId() === actualCallId) {
               livekitService.leaveCall();
            }
         };

         // ===== Handle call ended =====
         const handleCallEnded = (data: { callId: string; call?: { id: string } }) => {
            console.log('[LiveKitCallManager] Call ended:', data);

            // Use call.id if available, fallback to callId
            const actualCallId = data.call?.id || data.callId;

            setCurrentCallId(null);
            setIncomingCall(null);

            // Cleanup LiveKit
            if (livekitService.getCurrentCallId() === actualCallId) {
               livekitService.leaveCall();
            }
         };

         // Register socket listeners
         socketService.on('call:incoming', handleIncomingCall);
         socketService.on('call:accepted', handleCallAccepted);
         socketService.on('call:rejected', handleCallRejected);
         socketService.on('call:ended', handleCallEnded);

         console.log('[LiveKitCallManager] Listeners registered successfully');

         cleanupFn = () => {
            // Cleanup socket listeners
            socketService.off('call:incoming', handleIncomingCall);
            socketService.off('call:accepted', handleCallAccepted);
            socketService.off('call:rejected', handleCallRejected);
            socketService.off('call:ended', handleCallEnded);

            // Clear timeout
            if (incomingCallTimeoutRef.current) {
               clearTimeout(incomingCallTimeoutRef.current);
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

   const initiateCall = useCallback(async (conversationId: string, type: 'audio' | 'video'): Promise<string | null> => {
      try {
         console.log('[LiveKitCallManager] Initiating call:', { conversationId, type });

         const response = await callService.initiateCall({
            conversationId,
            type: type.toUpperCase() as 'AUDIO' | 'VIDEO',
         });

         if (!response.data) {
            throw new Error('Failed to initiate call');
         }

         const callId = response.data.call.id;
         setCurrentCallId(callId);

         console.log('[LiveKitCallManager] Call initiated:', callId);
         return callId;
      } catch (error) {
         console.error('[LiveKitCallManager] Failed to initiate call:', error);
         return null;
      }
   }, []);

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

   return {
      incomingCall,
      hasIncomingCall: incomingCall !== null,
      initiateCall,
      acceptIncomingCall,
      rejectIncomingCall,
      endCurrentCall,
      currentCallId,
      isInCall: livekitService.isInCall(),
   };
};
