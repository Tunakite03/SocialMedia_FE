import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

class SocketService {
   private socket: Socket | null = null;
   private reconnectAttempts = 0;
   private maxReconnectAttempts = 5;
   private reconnectDelay = 1000;
   private isConnecting = false; // Add flag to prevent multiple connections

   connect(token: string): Socket {
      // Return existing connected socket
      if (this.socket?.connected) {
         return this.socket;
      }

      // Prevent multiple simultaneous connection attempts
      if (this.isConnecting) {
         return this.socket!;
      }

      // If socket exists but not connected, disconnect first
      if (this.socket && !this.socket.connected) {
         this.socket.disconnect();
         this.socket = null;
      }

      this.isConnecting = true;
      const serverUrl = import.meta.env.PROD
         ? import.meta.env.VITE_SOCKET_URL
         : import.meta.env.VITE_SOCKET_URL_DEV || 'http://localhost:8080';

      this.socket = io(serverUrl, {
         auth: {
            token,
         },
         transports: ['websocket', 'polling'],
         timeout: 20000,
         forceNew: false, // Change to false to reuse connection if possible
      });

      this.setupEventListeners();
      return this.socket;
   }

   private setupEventListeners(): void {
      if (!this.socket) return;

      this.socket.on('connect', () => {
         this.reconnectAttempts = 0;
         this.isConnecting = false; // Reset flag on successful connection
      });

      this.socket.on('disconnect', (reason) => {
         this.isConnecting = false; // Reset flag on disconnect

         if (reason === 'io server disconnect') {
            // Server initiated disconnect, don't auto-reconnect
            return;
         }

         // Client-side disconnect, attempt to reconnect
         this.handleReconnect();
      });

      this.socket.on('connect_error', (error) => {
         console.error('Connection error:', error);
         this.isConnecting = false; // Reset flag on error
         this.handleReconnect();
      });

      this.socket.on('reconnect', () => {
         this.reconnectAttempts = 0;
      });

      this.socket.on('reconnect_error', (error) => {
         console.error('Reconnection error:', error);
      });
   }

   private handleReconnect(): void {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
         console.error('Max reconnection attempts reached');
         return;
      }

      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      setTimeout(() => {
         this.socket?.connect();
      }, delay);
   }

   disconnect(): void {
      if (this.socket) {
         this.socket.disconnect();
         this.socket = null;
      }
      this.isConnecting = false; // Reset flag when manually disconnecting
   }

   // Event emission methods
   emit(event: string, data?: any): void {
      if (this.socket?.connected) {
         this.socket.emit(event, data);
      } else {
         console.warn('[SocketService] Socket not connected, cannot emit event:', event, 'data:', data);
      }
   }

   // Event listening methods
   on(event: string, callback: (...args: any[]) => void): void {
      this.socket?.on(event, callback);
   }

   off(event: string, callback?: (...args: any[]) => void): void {
      this.socket?.off(event, callback);
   }

   once(event: string, callback: (...args: any[]) => void): void {
      this.socket?.once(event, callback);
   }

   // Connection status
   get isConnected(): boolean {
      return this.socket?.connected ?? false;
   }

   get connectionId(): string | undefined {
      return this.socket?.id;
   }

   // User presence methods
   updateUserStatus(status: 'online' | 'offline' | 'away'): void {
      this.emit('user:status-update', { status });
   }

   joinRoom(roomId: string): void {
      this.emit('room:join', { roomId });
   }

   leaveRoom(roomId: string): void {
      this.emit('room:leave', { roomId });
   }

   // Chat methods
   joinConversation(conversationId: string): void {
      this.emit('conversation:join', { conversationId });
   }

   leaveConversation(conversationId: string): void {
      this.emit('conversation:leave', { conversationId });
   }

   sendMessage(message: {
      conversationId: string;
      content: string;
      type?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
      replyToId?: string | null;
   }): void {
      this.emit('message:send', message);
   }

   reactToMessage(messageId: string, emoji: string): void {
      this.emit('message:react', { messageId, emoji });
   }

   markMessageAsRead(messageId: string): void {
      this.emit('message:read', { messageId });
   }

   // Mark entire conversation as read with batch operation
   markConversationAsRead(conversationId: string, lastMessageId?: string): void {
      this.emit('conversation:markAsRead', {
         conversationId,
         lastMessageId,
      });
   }

   startTyping(conversationId: string): void {
      this.emit('typing:start', { conversationId });
   }

   stopTyping(conversationId: string): void {
      this.emit('typing:stop', { conversationId });
   }

   // Call methods
   initiateCall(receiverId: string, type: 'VOICE' | 'VIDEO'): void {
      this.emit('call:initiate', { receiverId, type });
   }

   acceptCall(callId: string): void {
      this.emit('call:response', { callId, accepted: true });
   }

   rejectCall(callId: string): void {
      this.emit('call:response', { callId, accepted: false });
   }

   endCall(callId: string): void {
      this.emit('call:end', { callId });
   }

   // WebRTC Signaling methods
   sendWebRTCOffer(receiverId: string, offer: RTCSessionDescriptionInit, callId: string): void {
      this.emit('webrtc:offer', { receiverId, offer, callId });
   }

   sendWebRTCAnswer(senderId: string, answer: RTCSessionDescriptionInit, callId: string): void {
      this.emit('webrtc:answer', { senderId, answer, callId });
   }

   sendICECandidate(targetId: string, candidate: RTCIceCandidate, callId: string): void {
      this.emit('webrtc:ice-candidate', { targetId, candidate, callId });
   }

   // Notification methods
   sendNotification(receiverId: string, type: string, message: string, entityId?: string, entityType?: string): void {
      this.emit('notification:send', {
         receiverId,
         type,
         message,
         entityId,
         entityType,
      });
   }

   // Connection health methods
   ping(): void {
      this.emit('ping');
   }
}

export const socketService = new SocketService();
