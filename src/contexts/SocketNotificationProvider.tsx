import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import { useAuthStore } from '@/store';
import { socketService } from '@/services';

interface OnlineUser {
   id: string;
   username: string;
   displayName: string;
   avatar: string | null;
   lastSeen: string;
}

interface SocketNotificationContextType {
   isConnected: boolean;
   onlineUsers: OnlineUser[];
   connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
   lastPing: Date | null;
   sendNotification: (
      receiverId: string,
      type: string,
      message: string,
      entityId?: string,
      entityType?: string,
   ) => void;

   // Call management
   initiateCall: (receiverId: string, type: 'VOICE' | 'VIDEO') => void;
   acceptCall: (callId: string) => void;
   rejectCall: (callId: string) => void;
   endCall: (callId: string) => void;

   // Messaging
   sendMessage: (message: {
      conversationId: string;
      content: string;
      type?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
      replyToId?: string | null;
   }) => void;
   markMessageAsRead: (messageId: string) => void;
   startTyping: (conversationId: string) => void;
   stopTyping: (conversationId: string) => void;

   // Room management
   joinRoom: (roomId: string) => void;
   leaveRoom: (roomId: string) => void;
}

const SocketNotificationContext = createContext<SocketNotificationContextType | null>(null);

interface SocketNotificationProviderProps {
   children: React.ReactNode;
}

export const SocketNotificationProvider: React.FC<SocketNotificationProviderProps> = ({ children }) => {
   const { isAuthenticated, token } = useAuthStore();
   const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>(
      'disconnected',
   );
   const [lastPing, setLastPing] = useState<Date | null>(null);

   // Use the enhanced notification socket hook
   const { isConnected, onlineUsers, sendNotification } = useNotificationSocket();

   // Update connection status based on socket state
   useEffect(() => {
      if (isConnected) {
         setConnectionStatus('connected');
      } else if (isAuthenticated && token) {
         setConnectionStatus('connecting');
      } else {
         setConnectionStatus('disconnected');
      }
   }, [isConnected, isAuthenticated, token]);

   // Monitor connection health
   useEffect(() => {
      if (!isConnected) return;

      const healthCheck = setInterval(() => {
         try {
            socketService.ping();
            setLastPing(new Date());
         } catch (error) {
            console.error('Health check failed:', error);
            setConnectionStatus('error');
         }
      }, 30000); // Every 30 seconds

      return () => clearInterval(healthCheck);
   }, [isConnected]);

   // Call management methods
   const initiateCall = useCallback(
      (receiverId: string, type: 'VOICE' | 'VIDEO') => {
         if (isConnected) {
            const callId = crypto.randomUUID();
            socketService.initiateCall(receiverId, type, callId);
         } else {
            console.warn('Cannot initiate call: Socket not connected');
         }
      },
      [isConnected],
   );

   const acceptCall = useCallback(
      (callId: string) => {
         if (isConnected) {
            socketService.acceptCall(callId);
         } else {
            console.warn('Cannot accept call: Socket not connected');
         }
      },
      [isConnected],
   );

   const rejectCall = useCallback(
      (callId: string) => {
         if (isConnected) {
            socketService.rejectCall(callId);
         } else {
            console.warn('Cannot reject call: Socket not connected');
         }
      },
      [isConnected],
   );

   const endCall = useCallback(
      (callId: string) => {
         if (isConnected) {
            socketService.endCall(callId);
         } else {
            console.warn('Cannot end call: Socket not connected');
         }
      },
      [isConnected],
   );

   // Messaging methods
   const sendMessage = useCallback(
      (message: {
         conversationId: string;
         content: string;
         type?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
         replyToId?: string | null;
      }) => {
         if (isConnected) {
            socketService.sendMessage(message);
         } else {
            console.warn('Cannot send message: Socket not connected');
         }
      },
      [isConnected],
   );

   const markMessageAsRead = useCallback(
      (messageId: string) => {
         if (isConnected) {
            socketService.markMessageAsRead(messageId);
         } else {
            console.warn('Cannot mark message as read: Socket not connected');
         }
      },
      [isConnected],
   );

   const startTyping = useCallback(
      (conversationId: string) => {
         if (isConnected) {
            socketService.startTyping(conversationId);
         }
      },
      [isConnected],
   );

   const stopTyping = useCallback(
      (conversationId: string) => {
         if (isConnected) {
            socketService.stopTyping(conversationId);
         }
      },
      [isConnected],
   );

   // Room management methods
   const joinRoom = useCallback(
      (roomId: string) => {
         if (isConnected) {
            socketService.joinRoom(roomId);
         } else {
            console.warn('Cannot join room: Socket not connected');
         }
      },
      [isConnected],
   );

   const leaveRoom = useCallback(
      (roomId: string) => {
         if (isConnected) {
            socketService.leaveRoom(roomId);
         } else {
            console.warn('Cannot leave room: Socket not connected');
         }
      },
      [isConnected],
   );

   const contextValue: SocketNotificationContextType = {
      isConnected,
      onlineUsers,
      connectionStatus,
      lastPing,
      sendNotification,
      initiateCall,
      acceptCall,
      rejectCall,
      endCall,
      sendMessage,
      markMessageAsRead,
      startTyping,
      stopTyping,
      joinRoom,
      leaveRoom,
   };

   return <SocketNotificationContext.Provider value={contextValue}>{children}</SocketNotificationContext.Provider>;
};

// Hook to use the socket notification context
export const useSocketNotification = (): SocketNotificationContextType => {
   const context = useContext(SocketNotificationContext);
   if (!context) {
      throw new Error('useSocketNotification must be used within a SocketNotificationProvider');
   }
   return context;
};

// Connection status indicator component
export const ConnectionStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
   const { connectionStatus, isConnected, lastPing } = useSocketNotification();

   const getStatusColor = () => {
      switch (connectionStatus) {
         case 'connected':
            return 'text-green-500';
         case 'connecting':
            return 'text-yellow-500';
         case 'error':
            return 'text-red-500';
         default:
            return 'text-gray-500';
      }
   };

   const getStatusText = () => {
      switch (connectionStatus) {
         case 'connected':
            return 'Connected';
         case 'connecting':
            return 'Connecting...';
         case 'error':
            return 'Connection Error';
         default:
            return 'Disconnected';
      }
   };

   return (
      <div className={`flex items-center gap-2 ${className}`}>
         <div
            className={`w-2 h-2 rounded-full ${getStatusColor().replace('text-', 'bg-')} ${
               isConnected ? 'animate-pulse' : ''
            }`}
         ></div>
         <span className={`text-xs ${getStatusColor()}`}>{getStatusText()}</span>
         {lastPing && <span className='text-xs text-gray-400'>Last ping: {lastPing.toLocaleTimeString()}</span>}
      </div>
   );
};
