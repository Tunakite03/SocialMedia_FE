import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore, useAuthStore } from '@/store';
import { socketService } from '@/services/socketService';
import { messageService } from '@/services/messageService';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConversationList, MessageBubble, MessageInput } from '@/components/features/chat';
import { ArrowLeft, Phone, Video, MoreVertical, Users } from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { useLiveKitCall } from '@/contexts/LiveKitCallProvider';
import type { Conversation, Message } from '@/types';
import ChatLayout from '@/components/layout/ChatLayout';
const ChatPage = () => {
   const navigate = useNavigate();
   const { conversationId } = useParams<{ conversationId: string }>();
   const isMobile = useMobile();

   const [isTyping, setIsTyping] = useState(false);
   const [replyingTo, setReplyingTo] = useState<Message | undefined>(undefined);
   const [editingMessage, setEditingMessage] = useState<Message | undefined>(undefined);
   const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
   // On mobile, sidebar visibility is controlled by route; on desktop by state
   const [showSidebar, setShowSidebar] = useState(!isMobile);

   // Track if user is focused on this conversation
   const isWindowFocused = useRef(true);
   const isConversationActive = useRef(true);

   const messagesEndRef = useRef<HTMLDivElement>(null);

   const { user } = useAuthStore();
   const {
      conversations,
      messages,
      setActiveChat,
      addMessage,
      setMessages,
      updateMessage,
      removeMessage,
      markMessagesAsRead,
      updateConversation,
      addConversation,
      typingUsers,
      addTypingUser,
      removeTypingUser,
      resetUnreadCount,
      isLoading,
      updateConversationUnreadCount: updateConvUnreadCount,
      incrementConversationUnreadCount,
      resetConversationUnreadCount,
   } = useChatStore();

   const { initiateCall } = useLiveKitCall();

   const currentMessages = conversationId ? messages[conversationId] || [] : [];
   const currentTypingUsers = conversationId ? typingUsers[conversationId] || [] : [];

   // Update sidebar visibility on mobile/desktop changes
   useEffect(() => {
      setShowSidebar(!isMobile);
   }, [isMobile]);

   // Load conversation and messages when conversation ID changes
   useEffect(() => {
      if (conversationId && user) {
         isConversationActive.current = true;

         setActiveChat(conversationId);
         loadConversationData();

         // Join conversation room for socket events
         socketService.joinRoom(conversationId);

         // Reset local unread count immediately for instant UI feedback
         resetUnreadCount(conversationId);
         resetConversationUnreadCount(conversationId);
      }

      return () => {
         if (conversationId) {
            isConversationActive.current = false;
            socketService.leaveRoom(conversationId);
         }
      };
   }, [conversationId, user]);

   // Find current conversation from store
   useEffect(() => {
      if (conversationId && conversations.length > 0) {
         const conversation = conversations.find((c) => c.id === conversationId);
         setCurrentConversation(conversation || null);
      }
   }, [conversationId]);

   // Setup socket event listeners
   useEffect(() => {
      // Message events
      socketService.on('message:new', handleNewMessage);
      socketService.on('message:updated', handleMessageUpdate);
      socketService.on('message:deleted', handleMessageDelete);

      // Read events - updated to match new API
      // Read events - updated to match new API
      socketService.on('messages:read', handleMessagesRead);
      socketService.on('conversation:read:success', handleMessagesReadSuccess);
      socketService.on('conversation:read:error', handleMessagesReadError);
      socketService.on('conversation:read:success', handleMessagesReadSuccess);
      socketService.on('conversation:read:error', handleMessagesReadError);

      // Typing events
      socketService.on('typing:start', handleTypingStart);
      socketService.on('typing:stop', handleTypingStop);

      return () => {
         socketService.off('message:new', handleNewMessage);
         socketService.off('message:updated', handleMessageUpdate);
         socketService.off('message:deleted', handleMessageDelete);
         socketService.off('messages:read', handleMessagesRead);
         socketService.off('conversation:read:success', handleMessagesReadSuccess);
         socketService.off('conversation:read:error', handleMessagesReadError);
         socketService.off('conversation:read:success', handleMessagesReadSuccess);
         socketService.off('conversation:read:error', handleMessagesReadError);
         socketService.off('typing:start', handleTypingStart);
         socketService.off('typing:stop', handleTypingStop);
      };
   }, [conversationId, user?.id]); // Auto-scroll to bottom when new messages arrive
   useEffect(() => {
      scrollToBottom();
   }, [currentMessages]);

   const loadConversationData = useCallback(async () => {
      if (!conversationId) return;

      try {
         // Load messages for this conversation
         const messagesResponse = await messageService.getMessages(conversationId);
         if (messagesResponse.success && messagesResponse.data) {
            setMessages(conversationId, messagesResponse.data.messages);
         }

         // Load conversation details if not in store
         if (!currentConversation) {
            const conversationResponse = await messageService.getConversation(conversationId);
            if (conversationResponse.success && conversationResponse.data) {
               setCurrentConversation(conversationResponse.data.conversation);
               // Add to conversations list if not already there
               const existingConversation = conversations.find((c) => c.id === conversationId);
               if (!existingConversation) {
                  addConversation(conversationResponse.data.conversation);
               }
            }
         }
      } catch (error) {
         console.error('Failed to load conversation data:', error);
      }
   }, [conversationId, setMessages, currentConversation, conversations, addConversation]);

   const markConversationAsRead = useCallback(
      async (lastMessageId?: string) => {
         if (!conversationId) {
            return;
         }

         try {
            // Get current messages fresh from store
            const freshMessages = useChatStore.getState().messages[conversationId] || [];
            const messageId =
               lastMessageId || (freshMessages.length > 0 ? freshMessages[freshMessages.length - 1].id : undefined);

            // Check socket connection before emitting
            if (!socketService.isConnected) {
               return;
            }

            socketService.markConversationAsRead(conversationId, messageId);

            // Update local state immediately for instant UI feedback
            resetUnreadCount(conversationId);
            resetConversationUnreadCount(conversationId);
         } catch (error) {}
      },
      [conversationId, resetUnreadCount, resetConversationUnreadCount],
   );

   // Track window focus for read receipts
   useEffect(() => {
      const handleFocus = () => {
         isWindowFocused.current = true;
      };
      // Mark conversation as read when user focuses back to window
      if (conversationId && isConversationActive.current) {
         markConversationAsRead();
      }
      const handleBlur = () => {
         isWindowFocused.current = false;
      };

      // Set initial focus state
      isWindowFocused.current = !document.hidden;

      const handleVisibilityChange = () => {
         if (!document.hidden && conversationId && isConversationActive.current) {
            isWindowFocused.current = true;
            markConversationAsRead();
         } else if (document.hidden) {
            isWindowFocused.current = false;
         }
      };

      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
         window.removeEventListener('focus', handleFocus);
         window.removeEventListener('blur', handleBlur);
         document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
   }, [conversationId, markConversationAsRead]);

   const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   };

   // Socket event handlers
   // Simple and effective message handler
   const handleNewMessage = useCallback(
      (message: Message) => {
         if (message.conversationId === conversationId) {
            addMessage(message);

            if (message.senderId !== user?.id && isWindowFocused.current && isConversationActive.current) {
               markConversationAsRead(message.id);
            }
         } else {
            // Handle other conversation updates
            const currentConversations = useChatStore.getState().conversations;
            const existingConversation = currentConversations.find((c) => c.id === message.conversationId);

            if (!existingConversation) {
               messageService
                  .getConversation(message.conversationId)
                  .then((response) => {
                     if (response.success && response.data) {
                        addConversation(response.data.conversation);
                     }
                  })
                  .catch((error) => {
                     console.error('Failed to fetch conversation:', error);
                  });
            }

            incrementConversationUnreadCount(message.conversationId);
            updateConversation(message.conversationId, {
               lastMessage: message,
               updatedAt: message.createdAt,
            });
         }
      },
      [
         conversationId,
         markConversationAsRead,
         updateConversation,
         user?.id,
         addMessage,
         addConversation,
         incrementConversationUnreadCount,
      ],
   );

   const handleMessageUpdate = useCallback(
      (updatedMessage: Message) => {
         if (updatedMessage.conversationId === conversationId) {
            updateMessage(updatedMessage.id, conversationId, updatedMessage);
         }
      },
      [conversationId, updateMessage],
   );

   const handleMessageDelete = useCallback(
      (data: { id: string; conversationId: string }) => {
         if (data.conversationId === conversationId) {
            removeMessage(data.id, conversationId);
         }
      },
      [conversationId, removeMessage],
   );

   const handleTypingStart = useCallback(
      (data: { userId: string; conversationId: string }) => {
         if (data.conversationId === conversationId && data.userId !== user?.id) {
            addTypingUser(conversationId, data.userId);
         }
      },
      [conversationId, user?.id, addTypingUser],
   );

   const handleTypingStop = useCallback(
      (data: { userId: string; conversationId: string }) => {
         if (data.conversationId === conversationId) {
            removeTypingUser(conversationId, data.userId);
         }
      },
      [conversationId, removeTypingUser],
   );

   // Enhanced read event handlers with performance optimization
   const handleMessagesRead = useCallback(
      (data: { userId: string; conversationId: string; lastReadMessageId: string; readAt: string }) => {
         // Update messages in current conversation
         if (data.conversationId === conversationId) {
            // Mark messages as read for the user who read them
            updateMessagesReadStatus(data.userId, data.readAt);
         }

         // Update conversation read status efficiently
         updateConversation(data.conversationId, {
            lastReadMessageId: data.lastReadMessageId,
         });
      },
      [conversationId, updateConversation],
   );

   const handleMessagesReadSuccess = useCallback(
      (data: { conversationId: string; unreadCount: number; lastReadMessageId: string }) => {
         // Update unread count based on server response
         updateConvUnreadCount(data.conversationId, data.unreadCount);
      },
      [updateConvUnreadCount],
   );

   const handleMessagesReadError = useCallback((data: { error: string }) => {
      console.error('❌ [ChatPage] Read ERROR event received:', data);
   }, []);

   // Helper functions for read status updates
   const updateMessagesReadStatus = useCallback(
      (readBy: string, readAt: string) => {
         if (!conversationId) return;

         // Mark messages as read for the user who read them
         markMessagesAsRead(readBy, conversationId, readAt);
      },
      [conversationId, markMessagesAsRead],
   );

   // Message actions
   const handleSendMessage = async (content: string, type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' = 'TEXT') => {
      if (!conversationId || !user || (!content.trim() && type === 'TEXT')) return;

      try {
         if (editingMessage) {
            // Edit existing message
            const response = await messageService.editMessage(editingMessage.id, content);
            if (response.success && response.data) {
               updateMessage(editingMessage.id, conversationId, response.data.message);
               setEditingMessage(undefined);
            }
         } else {
            // Send new message
            const response = await messageService.sendMessage(conversationId, {
               content: content.trim(),
               type,
               replyToId: replyingTo ? replyingTo.id : null,
            });
            if (response.success && response.data) {
               // Add message to store immediately for instant UI update
               addMessage(response.data.message);
            }
         }

         // Clear reply state
         setReplyingTo(undefined);

         // Stop typing
         if (isTyping) {
            handleStopTyping();
         }
      } catch (error) {
         console.error('Failed to send message:', error);
      }
   };

   const handleStartTyping = () => {
      if (!conversationId || !user) return;

      setIsTyping(true);
      socketService.startTyping(conversationId);
   };

   const handleStopTyping = () => {
      if (!conversationId || !user) return;

      setIsTyping(false);
      socketService.stopTyping(conversationId);
   };

   const handleDeleteMessage = async (messageId: string) => {
      if (!conversationId) return;

      try {
         await messageService.deleteMessage(messageId);
         removeMessage(messageId, conversationId);
      } catch (error) {
         console.error('Failed to delete message:', error);
      }
   };

   const handleReplyToMessage = (message: Message) => {
      setReplyingTo(message);
      setEditingMessage(undefined);
   };

   const handleEditMessage = (message: Message) => {
      setEditingMessage(message);
      setReplyingTo(undefined);
   };

   // Handle back navigation for mobile
   const handleBackNavigation = () => {
      if (isMobile) {
         // On mobile, go back to conversations list
         navigate('/chat');
      } else {
         // On desktop, toggle sidebar or go to feed
         if (showSidebar) {
            setShowSidebar(false);
         } else {
            navigate('/');
         }
      }
   };
   const getConversationInfo = () => {
      if (!currentConversation) return { name: 'Loading...', avatar: null, subtitle: '' };

      if (currentConversation.type === 'GROUP') {
         return {
            name: currentConversation.title || 'Group Chat',
            avatar: null,
            subtitle: `${currentConversation.participants.length} members`,
         };
      }

      // Direct conversation - find the other participant
      // Direct conversation - find the other participant
      const otherParticipant = currentConversation.participants.find((p) => p.user.id !== user?.id);
      if (otherParticipant) {
         return {
            name: otherParticipant.user.displayName || otherParticipant.user.username,
            avatar: otherParticipant.user.avatar,
            subtitle: otherParticipant.user.isOnline
               ? 'Online'
               : otherParticipant.user.lastSeen
                 ? `Last seen ${new Date(otherParticipant.user.lastSeen).toLocaleString()}`
                 : 'Offline',
         };
      }

      return { name: 'Unknown', avatar: null, subtitle: '' };
   };

   const conversationInfo = getConversationInfo();

   // Handle call initiation
   const handleVoiceCall = async () => {
      if (!currentConversation || currentConversation.type === 'GROUP') return;

      const otherParticipant = currentConversation.participants.find((p) => p.user.id !== user?.id);
      if (otherParticipant) {
         try {
            const callId = await initiateCall(currentConversation.id, 'audio');
            if (callId) {
               const params = new URLSearchParams({
                  callId,
                  type: 'audio',
                  receiver: otherParticipant.user.displayName || otherParticipant.user.username,
                  receiverAvatar: otherParticipant.user.avatar || '',
                  receiverId: otherParticipant.user.id,
               });
               navigate(`/call/livekit?${params.toString()}`);
            }
         } catch (error) {
            console.error('Failed to initiate voice call:', error);
         }
      }
   };

   const handleVideoCall = async () => {
      if (!currentConversation || currentConversation.type === 'GROUP') return;

      const otherParticipant = currentConversation.participants.find((p) => p.user.id !== user?.id);
      if (otherParticipant) {
         try {
            const callId = await initiateCall(currentConversation.id, 'video');
            if (callId) {
               const params = new URLSearchParams({
                  callId,
                  type: 'video',
                  receiver: otherParticipant.user.displayName || otherParticipant.user.username,
                  receiverAvatar: otherParticipant.user.avatar || '',
                  receiverId: otherParticipant.user.id,
               });
               navigate(`/call/livekit?${params.toString()}`);
            }
         } catch (error) {
            console.error('Failed to initiate video call:', error);
         }
      }
   };

   // Empty state when no conversation selected
   if (!conversationId) {
      return (
         <ChatLayout>
            <div className='h-dvh lg:h-screen bg-background flex'>
               {/* Conversation List - Full width on mobile, sidebar on desktop */}
               <div className={`${isMobile ? 'w-full' : 'w-80 border-r border-border'}`}>
                  <ConversationList />
               </div>

               {/* Empty State - Only show on desktop when no conversation selected */}
               {!isMobile && (
                  <div className='flex-1 flex items-center justify-center'>
                     <div className='text-center anime-float'>
                        <div className='text-6xl mb-4 anime-bounce'>🌸</div>
                        <h1 className='text-2xl font-bold mb-4'>Select a Chat</h1>
                        <p className='text-muted-foreground'>Choose a conversation to start chatting</p>
                     </div>
                  </div>
               )}
            </div>
         </ChatLayout>
      );
   }

   return (
      <ChatLayout>
         <div className='h-dvh lg:h-screen bg-background flex overflow-hidden'>
            {/* Conversation List Sidebar - Hidden on mobile when chat is open */}
            {showSidebar && (
               <div className={`${isMobile ? 'hidden' : 'w-80 border-r border-border shrink-0'}`}>
                  <ConversationList />
               </div>
            )}

            {/* Main Chat Area */}
            <div className='flex-1 flex flex-col'>
               {/* Chat Header */}
               <header className='border-b border-border bg-card px-3 sm:px-4 py-3 shrink-0'>
                  <div className='flex items-center justify-between'>
                     <div className='flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1'>
                        {/* Back/Sidebar toggle button */}
                        <Button
                           variant='ghost'
                           size='icon'
                           onClick={handleBackNavigation}
                           className='anime-hover-scale shrink-0 lg:hidden inline'
                        >
                           <ArrowLeft className='h-5 w-5' />
                        </Button>

                        <Avatar className='h-8 w-8 sm:h-10 sm:w-10 shrink-0'>
                           <AvatarImage
                              src={conversationInfo.avatar || ''}
                              alt={conversationInfo.name}
                           />
                           <AvatarFallback className='bg-accent text-accent-foreground'>
                              {conversationInfo.name.slice(0, 2).toUpperCase()}
                           </AvatarFallback>
                        </Avatar>

                        <div className='min-w-0 flex-1'>
                           <h1 className='font-semibold text-sm sm:text-base truncate'>{conversationInfo.name}</h1>

                           <p className='text-xs sm:text-sm text-muted-foreground truncate'>
                              {conversationInfo.subtitle}
                           </p>
                        </div>
                     </div>

                     {/* Action buttons */}
                     <div className='flex items-center space-x-1 sm:space-x-2 shrink-0'>
                        <Button
                           variant='ghost'
                           size='icon'
                           onClick={handleVoiceCall}
                           className='anime-hover-scale h-8 w-8 sm:h-10 sm:w-10'
                        >
                           <Phone className='h-4 w-4 sm:h-5 sm:w-5' />
                        </Button>
                        <Button
                           variant='ghost'
                           size='icon'
                           onClick={handleVideoCall}
                           className='anime-hover-scale h-8 w-8 sm:h-10 sm:w-10'
                        >
                           <Video className='h-4 w-4 sm:h-5 sm:w-5' />
                        </Button>
                        {currentConversation?.type === 'GROUP' && (
                           <Button
                              variant='ghost'
                              size='icon'
                              className='anime-hover-scale h-8 w-8 sm:h-10 sm:w-10'
                           >
                              <Users className='h-4 w-4 sm:h-5 sm:w-5' />
                           </Button>
                        )}
                        <Button
                           variant='ghost'
                           size='icon'
                           className='anime-hover-scale h-8 w-8 sm:h-10 sm:w-10'
                        >
                           <MoreVertical className='h-4 w-4 sm:h-5 sm:w-5' />
                        </Button>
                     </div>
                  </div>
               </header>

               {/* Messages Area */}
               <div className='flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0'>
                  {isLoading ? (
                     <div className='text-center text-muted-foreground anime-pulse'>
                        <div className='text-4xl mb-4'>💭</div>
                        <p className='text-sm sm:text-base'>Loading messages...</p>
                     </div>
                  ) : currentMessages.length === 0 ? (
                     <div className='text-center text-muted-foreground anime-float'>
                        <div className='text-4xl mb-4'>💬</div>
                        <p className='text-sm sm:text-base'>No messages yet. Start the conversation! ✨</p>
                     </div>
                  ) : (
                     currentMessages.map((message, index) => (
                        <MessageBubble
                           key={message.id}
                           message={message}
                           showAvatar={
                              message.senderId !== user?.id &&
                              (index === 0 || currentMessages[index - 1].senderId !== message.senderId)
                           }
                           onReply={handleReplyToMessage}
                           onEdit={handleEditMessage}
                           onDelete={handleDeleteMessage}
                           className='anime-slide-in-up'
                        />
                     ))
                  )}
                  <div ref={messagesEndRef} />
               </div>
               {/* Enhanced Typing Indicator */}
               <div className='flex'>
                  {currentTypingUsers.length > 0 && (
                     <div className='flex items-center space-x-2 anime-fade-in p-2'>
                        <div className='flex space-x-1'>
                           <div
                              className='w-1 h-1 bg-primary rounded-full anime-bounce'
                              style={{ animationDelay: '0ms' }}
                           ></div>
                           <div
                              className='w-1 h-1 bg-primary rounded-full anime-bounce'
                              style={{ animationDelay: '150ms' }}
                           ></div>
                           <div
                              className='w-1 h-1 bg-primary rounded-full anime-bounce'
                              style={{ animationDelay: '300ms' }}
                           ></div>
                        </div>
                        <p className='text-xs sm:text-sm text-primary font-medium anime-pulse'>typing...</p>
                     </div>
                  )}
               </div>
               {/* Message Input */}
               <MessageInput
                  onSendMessage={handleSendMessage}
                  onStartTyping={handleStartTyping}
                  onStopTyping={handleStopTyping}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(undefined)}
                  editingMessage={editingMessage}
                  onCancelEdit={() => setEditingMessage(undefined)}
               />
            </div>
         </div>
      </ChatLayout>
   );
};

export default ChatPage;
