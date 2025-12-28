import { socketService } from './socketService';
import { callService } from './callService';
import { useCallStore } from '@/store';

interface PeerConnection {
   pc: RTCPeerConnection;
   userId: string;
}

class WebRTCService {
   private peerConnections: Map<string, PeerConnection> = new Map();
   private localStream: MediaStream | null = null;

   // thêm state để biết mình đang ở role nào & call nào
   private currentCallId: string | null = null;
   private currentRole: 'caller' | 'callee' | null = null;
   private currentCallType: 'audio' | 'video' | null = null;
   private lastEmittedConnectionState: Map<string, RTCPeerConnectionState> = new Map();

   private configuration: RTCConfiguration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
   };

   constructor() {
      this.setupSocketListeners();
      this.setupWindowListeners();
   }

   /**
    * Setup window event listeners to handle page unload
    */
   private setupWindowListeners(): void {
      // Handle page refresh (F5) or browser close
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

      // Handle visibility change (tab switch, minimize)
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
   }

   /**
    * Cleanup call when user refreshes or closes the page
    */
   private handleBeforeUnload(event: BeforeUnloadEvent): void {
      if (this.currentCallId) {
         console.log('[WebRTC] Page unloading, ending call:', this.currentCallId);
         // End call immediately without notifying server (socket will disconnect anyway)
         // Use sendBeacon for reliable last-minute API call
         const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
         const callId = this.currentCallId;

         // Try to notify server through socket first (may not work if connection lost)
         socketService.endCall(callId);

         // Cleanup local resources
         this.cleanup();
      }
   }

   /**
    * Handle visibility change - detect when user switches tabs
    */
   private handleVisibilityChange(): void {
      // We don't end call on visibility change, just log it
      if (document.hidden && this.currentCallId) {
         console.log('[WebRTC] Page hidden, call still active:', this.currentCallId);
      }
   }

   /**
    * Internal cleanup method without server notification
    */
   private cleanup(): void {
      // Clean up peer connections
      this.peerConnections.forEach((connection) => {
         connection.pc.close();
      });
      this.peerConnections.clear();
      this.lastEmittedConnectionState.clear();

      // Stop local stream
      if (this.localStream) {
         this.localStream.getTracks().forEach((track) => track.stop());
         this.localStream = null;
      }

      // Reset internal state
      this.currentCallId = null;
      this.currentRole = null;
      this.currentCallType = null;
   }

   private setupSocketListeners(): void {
      // Nhận offer từ peer (cả caller/callee đều có thể nhận nếu sau này support nhiều người)
      socketService.on(
         'call:offer',
         async (data: { callId: string; offer: RTCSessionDescriptionInit; from: string }) => {
            await this.handleOffer(data.callId, data.offer, data.from);
         }
      );

      // Nhận answer
      socketService.on(
         'call:answer',
         async (data: { callId: string; answer: RTCSessionDescriptionInit; from: string }) => {
            await this.handleAnswer(data.callId, data.answer, data.from);
         }
      );

      // Nhận ICE candidate
      socketService.on(
         'call:ice-candidate',
         async (data: { callId: string; candidate: RTCIceCandidate; from: string }) => {
            await this.handleIceCandidate(data.callId, data.candidate, data.from);
         }
      );

      // Caller nhận thông báo "call đã được accept" -> lúc này mới bắt đầu tạo offer
      socketService.on('call:accepted', async (data: { callId: string; acceptedBy: string }) => {
         console.log('Call accepted (WebRTCService):', data);
         await this.handleCallAccepted(data.callId, data.acceptedBy);
      });

      // Các event rejected/ended sẽ được handle ở useCallManager
      // để tránh double-cleanup + double socket emit
   }

   /**
    * Caller bấm nút Call:
    * - Không tạo peer connection
    * - Không tạo offer
    * - Chỉ gửi request lên server
    */
   async initializeCall(receiverId: string, callType: 'audio' | 'video'): Promise<string> {
      try {
         // Ghi nhớ role + peer + loại call
         this.currentRole = 'caller';
         this.currentCallType = callType;

         // FE vẫn tự tạo 1 callId local để store / UI xài
         const callId = this.generateCallId();
         this.currentCallId = callId;

         // Flow mới: chỉ gửi request lên server, KHÔNG tạo offer/WebRTC ở đây
         socketService.initiateCall(receiverId, callType === 'video' ? 'VIDEO' : 'VOICE', callId);

         // Vẫn return callId cho useCallManager/startCall dùng
         return callId;
      } catch (error) {
         console.error('Error initializing call:', error);
         throw error;
      }
   }

   /**
    * Callee bấm Accept:
    * - Mở cam/mic
    * - Cập nhật store
    * - Báo server là đã accept
    * - WebRTC handshake (offer/answer) sẽ bắt đầu khi:
    *   + Caller nhận event "call:accepted" -> tạo offer
    *   + Callee nhận "call:offer" -> tạo answer
    */
   async acceptCall(callId: string, callType: 'audio' | 'video'): Promise<void> {
      try {
         this.currentRole = 'callee';
         this.currentCallId = callId;
         this.currentCallType = callType;

         // Lưu ý: currentPeerId đối với callee sẽ được set khi nhận offer (vì fromUserId là bên kia)
         const stream = await this.getUserMedia(callType);
         this.localStream = stream;

         const callStore = useCallStore.getState();
         callStore.setLocalStream(stream);
         callStore.acceptCall();

         // Báo server là đã accept
         socketService.acceptCall(callId);
      } catch (error) {
         console.error('Error accepting call:', error);
         throw error;
      }
   }

   rejectCall(callId: string): void {
      socketService.rejectCall(callId);
      this.endCall(callId); // user chủ động reject -> vẫn notify server
   }

   /**
    * Cleanup peer + localStream
    * notifyServer = false dùng khi remote end, để không spam endCall lên server nữa
    */
   endCall(callId: string, notifyServer: boolean = true): void {
      // Notify through socket nếu là user chủ động end
      if (notifyServer) {
         socketService.endCall(callId);
      }

      // Cleanup local resources
      this.cleanup();

      // Update call store
      const callStore = useCallStore.getState();
      callStore.resetCallState();
   }

   private async getUserMedia(callType: 'audio' | 'video'): Promise<MediaStream> {
      const constraints: MediaStreamConstraints = {
         audio: true,
         video: callType === 'video',
      };

      try {
         const stream = await navigator.mediaDevices.getUserMedia(constraints);
         console.log(
            `[WebRTC] getUserMedia success. Tracks:`,
            stream.getTracks().map((t) => `${t.kind}:${t.enabled}:${t.readyState}`)
         );
         return stream;
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
         console.log('[WebRTC] Remote track received:', event.track.kind, event.streams[0]?.id);
         const remoteStream = event.streams[0];
         const callStore = useCallStore.getState();
         callStore.setRemoteStream(remoteStream);
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
         const state = pc.connectionState;
         console.log('[WebRTC] Connection state changed:', state, 'for call:', this.currentCallId);

         // Notify server about connection state to clear establishment timeout
         if (this.currentCallId) {
            const connectionId = `${callId}_${userId}`;
            const lastState = this.lastEmittedConnectionState.get(connectionId);

            // Only emit if state actually changed (prevent spam)
            if (lastState !== state) {
               console.log('[WebRTC] Emitting connection state to server:', state);

               socketService.emit('webrtc:connection-state', {
                  callId: this.currentCallId,
                  connectionState: state,
                  timestamp: new Date().toISOString(), // Backend requires timestamp
               });

               // Track last emitted state
               this.lastEmittedConnectionState.set(connectionId, state);
            }

            // Update call store when connected
            if (state === 'connected') {
               console.log('✅ [WebRTC] Connection established successfully - Backend should clear timeout now!');
               const callStore = useCallStore.getState();
               // Ensure call is marked as accepted when connection is stable
               if (!callStore.isCallAccepted) {
                  callStore.acceptCall();
               }

               // Dispatch custom window event to notify Frontend to clear timeout
               // (Cannot use socket event since Backend doesn't broadcast it back)
               const event = new CustomEvent('webrtc:established', {
                  detail: {
                     callId: this.currentCallId,
                     timestamp: new Date().toISOString(),
                  },
               });
               window.dispatchEvent(event);
               console.log('✅ [WebRTC] Dispatched webrtc:established event to clear Frontend timeout');
            }
         }

         if (state === 'disconnected' || state === 'failed') {
            if (this.currentCallId) {
               this.endCall(this.currentCallId);
            }
         }
      };

      const peerConnection: PeerConnection = { pc, userId };
      this.peerConnections.set(connectionId, peerConnection);

      return peerConnection;
   }

   /**
    * Caller nhận accepted -> bắt đầu WebRTC: getUserMedia (nếu chưa có) + createOffer
    */
   private async handleCallAccepted(callId: string, acceptedByUserId: string): Promise<void> {
      try {
         // Chỉ caller mới xử lý logic này
         if (this.currentRole !== 'caller') return;

         this.currentCallId = callId;

         // Nếu caller chưa mở cam/mic thì mở tại đây
         if (!this.localStream) {
            const callType = this.currentCallType ?? 'audio';
            const stream = await this.getUserMedia(callType);
            this.localStream = stream;
            const callStore = useCallStore.getState();
            callStore.setLocalStream(stream);
         }

         if (!this.localStream) {
            throw new Error('No local media stream available for caller');
         }

         const peerConnection = this.createPeerConnection(callId, acceptedByUserId);

         // Add local tracks
         this.localStream.getTracks().forEach((track) => {
            peerConnection.pc.addTrack(track, this.localStream!);
         });

         // Create and send offer
         const offer = await peerConnection.pc.createOffer();
         await peerConnection.pc.setLocalDescription(offer);

         socketService.emit('call:offer', {
            callId,
            offer,
            to: acceptedByUserId,
         });

         // Update UI state to "Accepted" for Caller
         const callStore = useCallStore.getState();
         callStore.acceptCall();
      } catch (error) {
         console.error('Error handling call accepted (creating offer):', error);
      }
   }
   private async handleOffer(callId: string, offer: RTCSessionDescriptionInit, fromUserId: string): Promise<void> {
      try {
         // callee nhận offer (hoặc các peer khác nếu sau này là group)
         this.currentCallId = callId;

         const peerConnection = this.createPeerConnection(callId, fromUserId);

         await peerConnection.pc.setRemoteDescription(new RTCSessionDescription(offer));

         // Add local stream nếu đã có (callee đã accept & mở cam/mic)
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

         // WORKAROUND: Also call REST API to ensure Backend clears establishment timeout
         // Backend should clear timeout when receiving call:answer socket event,
         // but we're calling REST API as backup until Backend is fixed
         callService.answerCall(callId).catch((error) => {
            console.warn('REST API answer call failed (non-critical):', error);
         });

         // Notify server that answer has been sent (helps clear establishment timeout)
         socketService.emit('webrtc:connection-state', {
            callId,
            connectionState: 'connecting',
            timestamp: new Date().toISOString(),
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

            // Notify server that answer has been received (helps clear establishment timeout)
            socketService.emit('webrtc:connection-state', {
               callId,
               connectionState: 'connecting',
               timestamp: new Date().toISOString(),
            });
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

   getCurrentCallId(): string | null {
      return this.currentCallId;
   }
}

export const webRTCService = new WebRTCService();
