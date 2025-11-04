import { socketService } from './socketService';
import { useCallStore } from '@/store';

interface PeerConnection {
   pc: RTCPeerConnection;
   userId: string;
}

class WebRTCService {
   private peerConnections: Map<string, PeerConnection> = new Map();
   private localStream: MediaStream | null = null;
   private configuration: RTCConfiguration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
   };

   constructor() {
      this.setupSocketListeners();
   }

   private setupSocketListeners(): void {
      // Listen for incoming call offers
      socketService.on(
         'call:offer',
         async (data: { callId: string; offer: RTCSessionDescriptionInit; from: string }) => {
            await this.handleOffer(data.callId, data.offer, data.from);
         }
      );

      // Listen for call answers
      socketService.on(
         'call:answer',
         async (data: { callId: string; answer: RTCSessionDescriptionInit; from: string }) => {
            await this.handleAnswer(data.callId, data.answer, data.from);
         }
      );

      // Listen for ICE candidates
      socketService.on(
         'call:ice-candidate',
         async (data: { callId: string; candidate: RTCIceCandidate; from: string }) => {
            await this.handleIceCandidate(data.callId, data.candidate, data.from);
         }
      );

      // Listen for call events
      socketService.on('call:accepted', (data: { callId: string; acceptedBy: string }) => {
         console.log('Call accepted:', data);
      });

      socketService.on('call:rejected', (data: { callId: string; rejectedBy: string }) => {
         console.log('Call rejected:', data);
         this.endCall(data.callId);
      });

      socketService.on('call:ended', (data: { callId: string; endedBy: string }) => {
         console.log('Call ended:', data);
         this.endCall(data.callId);
      });
   }

   async initializeCall(receiverId: string, callType: 'audio' | 'video'): Promise<string> {
      try {
         // Get user media
         const stream = await this.getUserMedia(callType);
         this.localStream = stream;

         // Update call store
         const callStore = useCallStore.getState();
         callStore.setLocalStream(stream);

         // Create peer connection
         const callId = this.generateCallId();
         const peerConnection = this.createPeerConnection(callId, receiverId);

         // Add local stream to peer connection
         stream.getTracks().forEach((track) => {
            peerConnection.pc.addTrack(track, stream);
         });

         // Create and send offer
         const offer = await peerConnection.pc.createOffer();
         await peerConnection.pc.setLocalDescription(offer);

         // Send offer through socket
         socketService.emit('call:offer', {
            callId,
            offer,
            to: receiverId,
         });

         // Initiate call through socket
         socketService.initiateCall(receiverId, callType);

         return callId;
      } catch (error) {
         console.error('Error initializing call:', error);
         throw error;
      }
   }

   async acceptCall(callId: string, callType: 'audio' | 'video'): Promise<void> {
      try {
         // Get user media
         const stream = await this.getUserMedia(callType);
         this.localStream = stream;

         // Update call store
         const callStore = useCallStore.getState();
         callStore.setLocalStream(stream);
         callStore.acceptCall();

         // Accept call through socket
         socketService.acceptCall(callId);
      } catch (error) {
         console.error('Error accepting call:', error);
         throw error;
      }
   }

   rejectCall(callId: string): void {
      socketService.rejectCall(callId);
      this.endCall(callId);
   }

   endCall(callId: string): void {
      // Clean up peer connections
      this.peerConnections.forEach((connection, id) => {
         if (id.includes(callId)) {
            connection.pc.close();
            this.peerConnections.delete(id);
         }
      });

      // Stop local stream
      if (this.localStream) {
         this.localStream.getTracks().forEach((track) => track.stop());
         this.localStream = null;
      }

      // Update call store
      const callStore = useCallStore.getState();
      callStore.resetCallState();

      // Notify through socket
      socketService.endCall(callId);
   }

   private async getUserMedia(callType: 'audio' | 'video'): Promise<MediaStream> {
      const constraints: MediaStreamConstraints = {
         audio: true,
         video: callType === 'video',
      };

      try {
         return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
         console.error('Error accessing user media:', error);
         throw new Error('Unable to access camera/microphone');
      }
   }

   private createPeerConnection(callId: string, userId: string): PeerConnection {
      const pc = new RTCPeerConnection(this.configuration);
      const connectionId = `${callId}_${userId}`;

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
         if (event.candidate) {
            socketService.emit('call:ice-candidate', {
               callId,
               candidate: event.candidate,
               to: userId,
            });
         }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
         const remoteStream = event.streams[0];
         const callStore = useCallStore.getState();
         callStore.setRemoteStream(remoteStream);
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
         console.log('Connection state:', pc.connectionState);

         if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            this.endCall(callId);
         }
      };

      const peerConnection: PeerConnection = { pc, userId };
      this.peerConnections.set(connectionId, peerConnection);

      return peerConnection;
   }

   private async handleOffer(callId: string, offer: RTCSessionDescriptionInit, fromUserId: string): Promise<void> {
      try {
         const peerConnection = this.createPeerConnection(callId, fromUserId);

         await peerConnection.pc.setRemoteDescription(new RTCSessionDescription(offer));

         // Add local stream if available
         if (this.localStream) {
            this.localStream.getTracks().forEach((track) => {
               peerConnection.pc.addTrack(track, this.localStream!);
            });
         }

         // Create and send answer
         const answer = await peerConnection.pc.createAnswer();
         await peerConnection.pc.setLocalDescription(answer);

         socketService.emit('call:answer', {
            callId,
            answer,
            to: fromUserId,
         });
      } catch (error) {
         console.error('Error handling offer:', error);
      }
   }

   private async handleAnswer(callId: string, answer: RTCSessionDescriptionInit, fromUserId: string): Promise<void> {
      try {
         const connectionId = `${callId}_${fromUserId}`;
         const peerConnection = this.peerConnections.get(connectionId);

         if (peerConnection) {
            await peerConnection.pc.setRemoteDescription(new RTCSessionDescription(answer));
         }
      } catch (error) {
         console.error('Error handling answer:', error);
      }
   }

   private async handleIceCandidate(callId: string, candidate: RTCIceCandidate, fromUserId: string): Promise<void> {
      try {
         const connectionId = `${callId}_${fromUserId}`;
         const peerConnection = this.peerConnections.get(connectionId);

         if (peerConnection) {
            await peerConnection.pc.addIceCandidate(new RTCIceCandidate(candidate));
         }
      } catch (error) {
         console.error('Error handling ICE candidate:', error);
      }
   }

   private generateCallId(): string {
      return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
   }

   // Utility methods
   toggleAudio(): void {
      if (this.localStream) {
         const audioTrack = this.localStream.getAudioTracks()[0];
         if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
         }
      }
   }

   toggleVideo(): void {
      if (this.localStream) {
         const videoTrack = this.localStream.getVideoTracks()[0];
         if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
         }
      }
   }

   isAudioEnabled(): boolean {
      if (this.localStream) {
         const audioTrack = this.localStream.getAudioTracks()[0];
         return audioTrack ? audioTrack.enabled : false;
      }
      return false;
   }

   isVideoEnabled(): boolean {
      if (this.localStream) {
         const videoTrack = this.localStream.getVideoTracks()[0];
         return videoTrack ? videoTrack.enabled : false;
      }
      return false;
   }
}

export const webRTCService = new WebRTCService();
