import { create } from 'zustand';
import type { CallState, User } from '@/types';

interface CallStore extends CallState {
   // Actions
   startCall: (receiver: User, type: 'audio' | 'video') => void;
   acceptCall: () => void;
   rejectCall: () => void;
   endCall: () => void;
   setLocalStream: (stream: MediaStream | undefined) => void;
   setRemoteStream: (stream: MediaStream | undefined) => void;
   updateCallState: (updates: Partial<CallState>) => void;
   resetCallState: () => void;
}

const initialState: CallState = {
   isInCall: false,
   callType: null,
   caller: undefined,
   receiver: undefined,
   localStream: undefined,
   remoteStream: undefined,
   isCallAccepted: false,
   callStartTime: undefined,
};

export const useCallStore = create<CallStore>((set, get) => ({
   ...initialState,

   startCall: (receiver, type) => {
      set({
         isInCall: true,
         callType: type,
         receiver,
         isCallAccepted: false,
         callStartTime: new Date(),
      });
   },

   acceptCall: () => {
      set({
         isCallAccepted: true,
         callStartTime: new Date(),
      });
   },

   rejectCall: () => {
      const state = get();
      // Cleanup streams
      if (state.localStream) {
         state.localStream.getTracks().forEach((track) => track.stop());
      }
      if (state.remoteStream) {
         state.remoteStream.getTracks().forEach((track) => track.stop());
      }

      set(initialState);
   },

   endCall: () => {
      const state = get();
      // Cleanup streams
      if (state.localStream) {
         state.localStream.getTracks().forEach((track) => track.stop());
      }
      if (state.remoteStream) {
         state.remoteStream.getTracks().forEach((track) => track.stop());
      }

      set(initialState);
   },

   setLocalStream: (stream) => {
      set({ localStream: stream });
   },

   setRemoteStream: (stream) => {
      set({ remoteStream: stream });
   },

   updateCallState: (updates) => {
      set((state) => ({ ...state, ...updates }));
   },

   resetCallState: () => {
      const state = get();
      // Cleanup streams
      if (state.localStream) {
         state.localStream.getTracks().forEach((track) => track.stop());
      }
      if (state.remoteStream) {
         state.remoteStream.getTracks().forEach((track) => track.stop());
      }

      set(initialState);
   },
}));
