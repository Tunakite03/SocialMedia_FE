import { create } from 'zustand';
import type { Message, ChatRoom, Conversation } from '@/types';

interface ChatStore {
   // Legacy chat rooms (for backward compatibility)
   chatRooms: ChatRoom[];

   // New conversation management
   conversations: Conversation[];

   // Messages organized by conversation/room ID
   messages: Record<string, Message[]>;

   // UI state
   activeChat: string | null;
   isLoading: boolean;

   // Typing indicators by conversation/room ID
   typingUsers: Record<string, string[]>;

   // Unread counts by conversation/room ID
   unreadCounts: Record<string, number>;

   // Helper functions for unread counts
   getUnreadCount: (conversation: Conversation) => number;
   updateConversationUnreadCount: (conversationId: string, count: number) => void;
   incrementConversationUnreadCount: (conversationId: string) => void;
   resetConversationUnreadCount: (conversationId: string) => void;

   // Legacy chat room actions
   setChatRooms: (rooms: ChatRoom[]) => void;
   addChatRoom: (room: ChatRoom) => void;
   updateChatRoom: (roomId: string, updates: Partial<ChatRoom>) => void;

   // New conversation actions
   setConversations: (conversations: Conversation[]) => void;
   addConversation: (conversation: Conversation) => void;
   updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
   removeConversation: (conversationId: string) => void;

   // Message actions
   setMessages: (roomId: string, messages: Message[]) => void;
   addMessage: (message: Message) => void;
   updateMessage: (messageId: string, roomId: string, updates: Partial<Message>) => void;
   removeMessage: (messageId: string, roomId: string) => void;
   markMessageAsRead: (messageId: string, roomId: string) => void;
   markMessagesAsRead: (senderId: string, roomId: string, readAt?: string) => void;

   // UI state actions
   setActiveChat: (roomId: string | null) => void;
   setIsLoading: (loading: boolean) => void;

   // Typing indicators
   setTypingUsers: (roomId: string, users: string[]) => void;
   addTypingUser: (roomId: string, userId: string) => void;
   removeTypingUser: (roomId: string, userId: string) => void;

   // Unread counts
   incrementUnreadCount: (roomId: string) => void;
   resetUnreadCount: (roomId: string) => void;

   // Cleanup
   clearChatData: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
   // State
   chatRooms: [],
   conversations: [],
   messages: {},
   activeChat: null,
   isLoading: false,
   typingUsers: {},
   unreadCounts: {},

   // Legacy chat room actions
   setChatRooms: (rooms) => set({ chatRooms: rooms }),

   addChatRoom: (room) =>
      set((state) => ({
         chatRooms: [room, ...state.chatRooms.filter((r) => r.id !== room.id)],
      })),

   updateChatRoom: (roomId, updates) =>
      set((state) => ({
         chatRooms: state.chatRooms.map((room) => (room.id === roomId ? { ...room, ...updates } : room)),
      })),

   // New conversation actions
   setConversations: (conversations) => set({ conversations }),

   addConversation: (conversation) =>
      set((state) => ({
         conversations: [conversation, ...state.conversations.filter((c) => c.id !== conversation.id)],
      })),

   updateConversation: (conversationId, updates) =>
      set((state) => ({
         conversations: state.conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, ...updates } : conv
         ),
      })),

   removeConversation: (conversationId) =>
      set((state) => ({
         conversations: state.conversations.filter((conv) => conv.id !== conversationId),
         messages: Object.fromEntries(Object.entries(state.messages).filter(([key]) => key !== conversationId)),
         typingUsers: Object.fromEntries(Object.entries(state.typingUsers).filter(([key]) => key !== conversationId)),
         unreadCounts: Object.fromEntries(Object.entries(state.unreadCounts).filter(([key]) => key !== conversationId)),
         activeChat: state.activeChat === conversationId ? null : state.activeChat,
      })),

   // Message actions
   setMessages: (roomId, messages) =>
      set((state) => ({
         messages: {
            ...state.messages,
            [roomId]: messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
         },
      })),

   addMessage: (message) =>
      set((state) => {
         const roomId = message.conversationId || `direct_${message.senderId}_${message.receiverId || ''}`;
         const roomMessages = state.messages[roomId] || [];

         // Check if message already exists to prevent duplicates
         const existingMessage = roomMessages.find((msg) => msg.id === message.id);
         if (existingMessage) {
            console.log('🚨 [ChatStore] Message already exists, skipping duplicate:', message.id);
            return state; // Return unchanged state if message already exists
         }

         console.log('✅ [ChatStore] Adding new message:', message.id);
         return {
            messages: {
               ...state.messages,
               [roomId]: [...roomMessages, message].sort(
                  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
               ),
            },
         };
      }),

   updateMessage: (messageId, roomId, updates) =>
      set((state) => ({
         messages: {
            ...state.messages,
            [roomId]: (state.messages[roomId] || []).map((msg) =>
               msg.id === messageId ? { ...msg, ...updates } : msg
            ),
         },
      })),

   removeMessage: (messageId, roomId) =>
      set((state) => ({
         messages: {
            ...state.messages,
            [roomId]: (state.messages[roomId] || []).filter((msg) => msg.id !== messageId),
         },
      })),

   markMessageAsRead: (messageId, roomId) =>
      set((state) => ({
         messages: {
            ...state.messages,
            [roomId]: (state.messages[roomId] || []).map((msg) =>
               msg.id === messageId ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
            ),
         },
      })),

   markMessagesAsRead: (senderId, roomId, readAt) =>
      set((state) => ({
         messages: {
            ...state.messages,
            [roomId]: (state.messages[roomId] || []).map((msg) =>
               msg.senderId === senderId && !msg.isRead
                  ? { ...msg, isRead: true, readAt: readAt || new Date().toISOString() }
                  : msg
            ),
         },
      })),

   // UI state actions
   setActiveChat: (roomId) => set({ activeChat: roomId }),
   setIsLoading: (loading) => set({ isLoading: loading }),

   // Typing indicators
   setTypingUsers: (roomId, users) =>
      set((state) => ({
         typingUsers: { ...state.typingUsers, [roomId]: users },
      })),

   addTypingUser: (roomId, userId) =>
      set((state) => {
         const currentUsers = state.typingUsers[roomId] || [];
         if (!currentUsers.includes(userId)) {
            return {
               typingUsers: {
                  ...state.typingUsers,
                  [roomId]: [...currentUsers, userId],
               },
            };
         }
         return state;
      }),

   removeTypingUser: (roomId, userId) =>
      set((state) => ({
         typingUsers: {
            ...state.typingUsers,
            [roomId]: (state.typingUsers[roomId] || []).filter((id) => id !== userId),
         },
      })),

   // Unread counts
   incrementUnreadCount: (roomId) =>
      set((state) => ({
         unreadCounts: {
            ...state.unreadCounts,
            [roomId]: (state.unreadCounts[roomId] || 0) + 1,
         },
      })),

   resetUnreadCount: (roomId) =>
      set((state) => ({
         unreadCounts: { ...state.unreadCounts, [roomId]: 0 },
      })),

   // Helper functions for unread counts
   getUnreadCount: (conversation) => {
      // Prioritize _count.unreadMessages, fallback to legacy unreadCount
      return conversation._count?.unreadMessages ?? conversation.unreadCount ?? 0;
   },

   updateConversationUnreadCount: (conversationId, count) =>
      set((state) => {
         const updatedConversations = state.conversations.map((conv) =>
            conv.id === conversationId
               ? {
                    ...conv,
                    _count: {
                       ...conv._count,
                       unreadMessages: count,
                    },
                    unreadCount: count, // Keep legacy property in sync
                 }
               : conv
         );
         return {
            conversations: updatedConversations,
            unreadCounts: { ...state.unreadCounts, [conversationId]: count },
         };
      }),

   incrementConversationUnreadCount: (conversationId) =>
      set((state) => {
         const conversation = state.conversations.find((c) => c.id === conversationId);
         const currentCount = conversation
            ? state.conversations.find((c) => c.id === conversationId)?._count?.unreadMessages ??
              conversation.unreadCount ??
              0
            : 0;
         const newCount = currentCount + 1;

         const updatedConversations = state.conversations.map((conv) =>
            conv.id === conversationId
               ? {
                    ...conv,
                    _count: {
                       ...conv._count,
                       unreadMessages: newCount,
                    },
                    unreadCount: newCount, // Keep legacy property in sync
                 }
               : conv
         );

         return {
            conversations: updatedConversations,
            unreadCounts: { ...state.unreadCounts, [conversationId]: newCount },
         };
      }),

   resetConversationUnreadCount: (conversationId) =>
      set((state) => {
         const updatedConversations = state.conversations.map((conv) =>
            conv.id === conversationId
               ? {
                    ...conv,
                    _count: {
                       ...conv._count,
                       unreadMessages: 0,
                    },
                    unreadCount: 0, // Keep legacy property in sync
                 }
               : conv
         );
         return {
            conversations: updatedConversations,
            unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
         };
      }),

   // Cleanup
   clearChatData: () =>
      set({
         chatRooms: [],
         conversations: [],
         messages: {},
         activeChat: null,
         isLoading: false,
         typingUsers: {},
         unreadCounts: {},
      }),
}));
