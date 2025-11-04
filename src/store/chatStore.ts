import { create } from 'zustand';
import type { Message, ChatRoom } from '@/types';

interface ChatStore {
   chatRooms: ChatRoom[];
   messages: Record<string, Message[]>;
   activeChat: string | null;
   typingUsers: Record<string, string[]>;
   unreadCounts: Record<string, number>;

   // Actions
   setChatRooms: (rooms: ChatRoom[]) => void;
   addChatRoom: (room: ChatRoom) => void;
   updateChatRoom: (roomId: string, updates: Partial<ChatRoom>) => void;

   setMessages: (roomId: string, messages: Message[]) => void;
   addMessage: (message: Message) => void;
   markMessageAsRead: (messageId: string, roomId: string) => void;

   setActiveChat: (roomId: string | null) => void;

   setTypingUsers: (roomId: string, users: string[]) => void;
   addTypingUser: (roomId: string, userId: string) => void;
   removeTypingUser: (roomId: string, userId: string) => void;

   incrementUnreadCount: (roomId: string) => void;
   resetUnreadCount: (roomId: string) => void;

   clearChatData: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
   chatRooms: [],
   messages: {},
   activeChat: null,
   typingUsers: {},
   unreadCounts: {},

   setChatRooms: (rooms) => set({ chatRooms: rooms }),

   addChatRoom: (room) =>
      set((state) => ({
         chatRooms: [room, ...state.chatRooms.filter((r) => r.id !== room.id)],
      })),

   updateChatRoom: (roomId, updates) =>
      set((state) => ({
         chatRooms: state.chatRooms.map((room) => (room.id === roomId ? { ...room, ...updates } : room)),
      })),

   setMessages: (roomId, messages) =>
      set((state) => ({
         messages: { ...state.messages, [roomId]: messages },
      })),

   addMessage: (message) =>
      set((state) => {
         const roomId = message.chatRoomId || `direct_${message.senderId}_${message.receiverId}`;
         const roomMessages = state.messages[roomId] || [];

         return {
            messages: {
               ...state.messages,
               [roomId]: [...roomMessages, message].sort(
                  (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
               ),
            },
         };
      }),

   markMessageAsRead: (messageId, roomId) =>
      set((state) => ({
         messages: {
            ...state.messages,
            [roomId]: (state.messages[roomId] || []).map((msg) =>
               msg.id === messageId ? { ...msg, isRead: true } : msg
            ),
         },
      })),

   setActiveChat: (roomId) => set({ activeChat: roomId }),

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

   clearChatData: () =>
      set({
         chatRooms: [],
         messages: {},
         activeChat: null,
         typingUsers: {},
         unreadCounts: {},
      }),
}));
