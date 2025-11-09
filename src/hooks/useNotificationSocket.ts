import { useEffect, useCallback, useRef } from 'react';
import { socketService, notificationSoundService } from '@/services';
import { useNotificationStore, useAuthStore } from '@/store';
import type { Notification } from '@/types';

interface OnlineUser {
   id: string;
   username: string;
   displayName: string;
   avatar: string | null;
   lastSeen: string;
}

interface SocketNotificationHookReturn {
   isConnected: boolean;
   onlineUsers: OnlineUser[];
   sendNotification: (
      receiverId: string,
      type: string,
      message: string,
      entityId?: string,
      entityType?: string
   ) => void;
}

export const useNotificationSocket = (): SocketNotificationHookReturn => {
   const { addNotification } = useNotificationStore();
   const { isAuthenticated, token, user } = useAuthStore();
   const onlineUsersRef = useRef<OnlineUser[]>([]);

   // Browser notification permission request
   const requestNotificationPermission = useCallback(async () => {
      if ('Notification' in window && Notification.permission === 'default') {
         const permission = await Notification.requestPermission();
         console.log('🔔 Notification permission:', permission);
         return permission;
      }
      return Notification.permission;
   }, []);

   // Show browser notification
   const showBrowserNotification = useCallback((notification: Notification) => {
      if ('Notification' in window && Notification.permission === 'granted') {
         const browserNotification = new Notification(notification.title, {
            body: notification.message,
            icon: notification.sender?.avatar || '/images/default-avatar.png',
            tag: notification.id,
            requireInteraction: false,
            silent: false,
            badge: '/images/badge-icon.png',
         });

         // Auto-close after 5 seconds
         setTimeout(() => {
            browserNotification.close();
         }, 5000);

         // Handle notification click
         browserNotification.onclick = () => {
            window.focus();
            browserNotification.close();
         };
      }
   }, []);

   // Send notification via socket
   const sendNotification = useCallback(
      (receiverId: string, type: string, message: string, entityId?: string, entityType?: string) => {
         if (socketService.isConnected) {
            socketService.sendNotification(receiverId, type, message, entityId, entityType);
         } else {
            console.warn('🔌 Socket not connected, cannot send notification');
         }
      },
      []
   );

   useEffect(() => {
      if (!isAuthenticated || !token) {
         console.log('🔐 Not authenticated, skipping socket connection');
         return;
      }

      // Connect socket if not already connected
      if (!socketService.isConnected) {
         console.log('🔌 Connecting to socket...');
         socketService.connect(token);
      }

      // Request notification permission on mount
      requestNotificationPermission();

      // Preload notification sounds after user interaction
      const preloadSounds = () => {
         notificationSoundService.preloadSounds();
         // Remove listener after first interaction
         document.removeEventListener('click', preloadSounds);
         document.removeEventListener('keydown', preloadSounds);
      };

      document.addEventListener('click', preloadSounds, { once: true });
      document.addEventListener('keydown', preloadSounds, { once: true });

      // Handler for new notifications
      const handleNewNotification = (notification: Notification) => {
         console.log('🔔 New notification received:', notification);

         // Validate notification data
         if (!notification || !notification.id || !notification.type || !notification.title || !notification.message) {
            console.warn('⚠️ Received malformed notification:', notification);
            return;
         }

         // Don't show notifications from the current user to themselves
         if (notification.senderId === user?.id) {
            console.log('🚫 Ignoring self-notification');
            return;
         }

         // Add notification to store
         addNotification(notification);

         // Show browser notification
         showBrowserNotification(notification);

         // Play notification sound
         notificationSoundService
            .playNotificationSound(notification.type)
            .catch((error) => console.log('🔇 Could not play notification sound:', error));
      };

      // Connection status handlers
      const handleUserOnline = (data: { user: OnlineUser }) => {
         console.log('👤 User came online:', data.user.username);
         onlineUsersRef.current = [...onlineUsersRef.current.filter((u) => u.id !== data.user.id), data.user];
      };

      const handleUserOffline = (data: { userId: string; user?: OnlineUser }) => {
         console.log('👤 User went offline:', data.userId);
         onlineUsersRef.current = onlineUsersRef.current.filter((u) => u.id !== data.userId);
      };

      const handleUsersOnline = (users: OnlineUser[]) => {
         console.log('👥 Online users list received:', users.length, 'users');
         onlineUsersRef.current = users;
      };

      // Post-related notification triggers
      const handlePostNew = (post: any) => {
         console.log('📝 New post created:', post.id);
         // Could trigger notifications for followers
      };

      const handlePostUpdated = (post: any) => {
         console.log('📝 Post updated:', post.id);
      };

      const handlePostDeleted = (data: { postId: string; authorId: string }) => {
         console.log('🗑️ Post deleted:', data.postId);
      };

      // Comment-related notification triggers
      const handleCommentNew = (comment: any) => {
         console.log('💬 New comment:', comment.id);
         // Could trigger notifications for post author and parent comment author
      };

      const handleCommentUpdated = (comment: any) => {
         console.log('💬 Comment updated:', comment.id);
      };

      const handleCommentDeleted = (data: { commentId: string; postId: string; authorId: string }) => {
         console.log('🗑️ Comment deleted:', data.commentId);
      };

      // Call-related handlers
      const handleCallIncoming = (data: {
         callId: string;
         caller: {
            id: string;
            username: string;
            displayName: string;
            avatar: string | null;
         };
         type: 'VOICE' | 'VIDEO';
         createdAt: string;
      }) => {
         console.log('📞 Incoming call:', data.type, 'from', data.caller.username);

         // Create a call notification
         const callNotification: Notification = {
            id: `call-${data.callId}`,
            type: 'CALL',
            title: `Incoming ${data.type.toLowerCase()} call`,
            message: `${data.caller.displayName} is calling you`,
            recipientId: user?.id || '',
            senderId: data.caller.id,
            sender: data.caller,
            isRead: false,
            metadata: {
               callType: data.type,
            },
            createdAt: data.createdAt,
         };

         addNotification(callNotification);
         showBrowserNotification(callNotification);
      };

      const handleCallResponse = (data: { callId: string; accepted: boolean; user: OnlineUser }) => {
         console.log('📞 Call response:', data.accepted ? 'accepted' : 'declined', 'by', data.user.username);
      };

      const handleCallEnded = (data: { callId: string; endedBy: string; duration?: number }) => {
         console.log('📞 Call ended by:', data.endedBy, 'Duration:', data.duration);
      };

      const handleCallError = (error: { message: string; code?: string; callId?: string }) => {
         console.error('📞 Call error:', error.message);
      };

      // Message-related handlers
      const handleMessageNew = (message: any) => {
         console.log('💌 New message received:', message.id);
      };

      const handleMessageReceived = (message: any) => {
         console.log('💌 Message received confirmation:', message.id);
      };

      const handleMessageRead = (data: { messageId: string; readBy: string; readAt: string }) => {
         console.log('👁️ Message read:', data.messageId, 'by', data.readBy);
      };

      const handleMessageError = (error: { message: string; messageId?: string }) => {
         console.error('💌 Message error:', error.message);
      };

      // Typing indicators
      const handleTypingStart = (data: { conversationId: string; user: OnlineUser; timestamp: string }) => {
         console.log('⌨️ User started typing:', data.user.username);
      };

      const handleTypingStop = (data: { conversationId: string; userId: string; timestamp: string }) => {
         console.log('⌨️ User stopped typing:', data.userId);
      };

      // WebRTC signaling handlers
      const handleWebRTCOffer = (data: {
         senderId: string;
         offer: RTCSessionDescriptionInit;
         callId: string;
         sender: OnlineUser;
      }) => {
         console.log('🌐 WebRTC offer received from:', data.sender.username);
      };

      const handleWebRTCAnswer = (data: {
         senderId: string;
         answer: RTCSessionDescriptionInit;
         callId: string;
         sender: OnlineUser;
      }) => {
         console.log('🌐 WebRTC answer received from:', data.sender.username);
      };

      const handleWebRTCIceCandidate = (data: {
         senderId: string;
         candidate: RTCIceCandidate;
         callId: string;
         sender: OnlineUser;
      }) => {
         console.log('🧊 ICE candidate received from:', data.sender.username);
      };

      // Connection health
      const handlePong = () => {
         console.log('🏓 Pong received - connection healthy');
      };

      // Register all event listeners
      socketService.on('notification:new', handleNewNotification);

      // User presence events
      socketService.on('user:online', handleUserOnline);
      socketService.on('user:offline', handleUserOffline);
      socketService.on('users:online', handleUsersOnline);

      // Post events
      socketService.on('post:new', handlePostNew);
      socketService.on('post:updated', handlePostUpdated);
      socketService.on('post:deleted', handlePostDeleted);

      // Comment events
      socketService.on('comment:new', handleCommentNew);
      socketService.on('comment:updated', handleCommentUpdated);
      socketService.on('comment:deleted', handleCommentDeleted);

      // Call events
      socketService.on('call:incoming', handleCallIncoming);
      socketService.on('call:response', handleCallResponse);
      socketService.on('call:ended', handleCallEnded);
      socketService.on('call:error', handleCallError);

      // Message events
      socketService.on('message:new', handleMessageNew);
      socketService.on('message:received', handleMessageReceived);
      socketService.on('message:read', handleMessageRead);
      socketService.on('message:error', handleMessageError);

      // Typing events
      socketService.on('typing:start', handleTypingStart);
      socketService.on('typing:stop', handleTypingStop);

      // WebRTC events
      socketService.on('webrtc:offer', handleWebRTCOffer);
      socketService.on('webrtc:answer', handleWebRTCAnswer);
      socketService.on('webrtc:ice-candidate', handleWebRTCIceCandidate);

      // Connection health
      socketService.on('pong', handlePong);

      // Ping server every 30 seconds for connection health
      const pingInterval = setInterval(() => {
         if (socketService.isConnected) {
            socketService.ping();
         }
      }, 30000);

      // Cleanup function
      return () => {
         console.log('🧹 Cleaning up socket event listeners');

         clearInterval(pingInterval);

         // Remove all event listeners
         socketService.off('notification:new', handleNewNotification);
         socketService.off('user:online', handleUserOnline);
         socketService.off('user:offline', handleUserOffline);
         socketService.off('users:online', handleUsersOnline);
         socketService.off('post:new', handlePostNew);
         socketService.off('post:updated', handlePostUpdated);
         socketService.off('post:deleted', handlePostDeleted);
         socketService.off('comment:new', handleCommentNew);
         socketService.off('comment:updated', handleCommentUpdated);
         socketService.off('comment:deleted', handleCommentDeleted);
         socketService.off('call:incoming', handleCallIncoming);
         socketService.off('call:response', handleCallResponse);
         socketService.off('call:ended', handleCallEnded);
         socketService.off('call:error', handleCallError);
         socketService.off('message:new', handleMessageNew);
         socketService.off('message:received', handleMessageReceived);
         socketService.off('message:read', handleMessageRead);
         socketService.off('message:error', handleMessageError);
         socketService.off('typing:start', handleTypingStart);
         socketService.off('typing:stop', handleTypingStop);
         socketService.off('webrtc:offer', handleWebRTCOffer);
         socketService.off('webrtc:answer', handleWebRTCAnswer);
         socketService.off('webrtc:ice-candidate', handleWebRTCIceCandidate);
         socketService.off('pong', handlePong);
      };
   }, [isAuthenticated, token, user?.id, addNotification, showBrowserNotification, requestNotificationPermission]);

   return {
      isConnected: socketService.isConnected,
      onlineUsers: onlineUsersRef.current,
      sendNotification,
   };
};
