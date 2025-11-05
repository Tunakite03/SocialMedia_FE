import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

class SocketService {
   private socket: Socket | null = null;
   private reconnectAttempts = 0;
   private maxReconnectAttempts = 5;
   private reconnectDelay = 1000;

   connect(token: string): Socket {
      if (this.socket?.connected) {
         return this.socket;
      }

      const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';

      this.socket = io(serverUrl, {
         auth: {
            token,
         },
         transports: ['websocket', 'polling'],
         timeout: 20000,
         forceNew: true,
      });

      this.setupEventListeners();
      return this.socket;
   }

   private setupEventListeners(): void {
      if (!this.socket) return;

      this.socket.on('connect', () => {
         console.log('Connected to server');
         this.reconnectAttempts = 0;
      });

      this.socket.on('disconnect', (reason) => {
         console.log('Disconnected from server:', reason);

         if (reason === 'io server disconnect') {
            // Server initiated disconnect, don't auto-reconnect
            return;
         }

         // Client-side disconnect, attempt to reconnect
         this.handleReconnect();
      });

      this.socket.on('connect_error', (error) => {
         console.error('Connection error:', error);
         this.handleReconnect();
      });

      this.socket.on('reconnect', (attemptNumber) => {
         console.log('Reconnected after', attemptNumber, 'attempts');
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
         console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
         this.socket?.connect();
      }, delay);
   }

   disconnect(): void {
      if (this.socket) {
         this.socket.disconnect();
         this.socket = null;
      }
   }

   // Event emission methods
   emit(event: string, data?: any): void {
      if (this.socket?.connected) {
         this.socket.emit(event, data);
      } else {
         console.warn('Socket not connected, cannot emit event:', event);
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
   sendMessage(message: {
      content: string;
      receiverId?: string;
      chatRoomId?: string;
      type?: 'text' | 'image' | 'file';
   }): void {
      this.emit('message:send', message);
   }

   markMessageAsRead(messageId: string): void {
      this.emit('message:read', { messageId });
   }

   startTyping(chatRoomId: string, userId: string): void {
      this.emit('typing:start', { chatRoomId, userId });
   }

   stopTyping(chatRoomId: string, userId: string): void {
      this.emit('typing:stop', { chatRoomId, userId });
   }

   // Call methods
   initiateCall(receiverId: string, type: 'audio' | 'video'): void {
      this.emit('call:initiate', { receiverId, type });
   }

   acceptCall(callId: string): void {
      this.emit('call:accept', { callId });
   }

   rejectCall(callId: string): void {
      this.emit('call:reject', { callId });
   }

   endCall(callId: string): void {
      this.emit('call:end', { callId });
   }

   sendCallSignal(callId: string, signal: any, to: string): void {
      this.emit('call:signal', { callId, signal, to });
   }
}

export const socketService = new SocketService();
