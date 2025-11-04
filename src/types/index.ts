// Core type definitions for Otakomi application

export interface User {
   id: string;
   email: string;
   username: string;
   displayName: string;
   avatar?: string;
   isOnline: boolean;
   lastSeen?: Date;
   createdAt: Date;
}

export interface AuthState {
   user: User | null;
   token: string | null;
   isAuthenticated: boolean;
   isLoading: boolean;
}

export interface Message {
   id: string;
   content: string;
   senderId: string;
   receiverId?: string;
   chatRoomId?: string;
   type: 'text' | 'image' | 'file' | 'call';
   timestamp: Date;
   isRead: boolean;
}

export interface ChatRoom {
   id: string;
   participants: User[];
   lastMessage?: Message;
   updatedAt: Date;
   type: 'direct' | 'group';
   name?: string;
}

export interface Post {
   id: string;
   content: string;
   authorId: string;
   author: User;
   images?: string[];
   likes: string[];
   comments: Comment[];
   createdAt: Date;
   updatedAt: Date;
}

export interface Comment {
   id: string;
   content: string;
   authorId: string;
   author: User;
   postId: string;
   parentId?: string;
   replies?: Comment[];
   createdAt: Date;
}

export interface Notification {
   id: string;
   type: 'like' | 'comment' | 'message' | 'call' | 'friend_request';
   title: string;
   message: string;
   recipientId: string;
   senderId: string;
   sender: User;
   isRead: boolean;
   data?: any;
   createdAt: Date;
}

export interface CallState {
   isInCall: boolean;
   callType: 'audio' | 'video' | null;
   caller?: User;
   receiver?: User;
   localStream?: MediaStream;
   remoteStream?: MediaStream;
   isCallAccepted: boolean;
   callStartTime?: Date;
}

export interface EmotionAnalysis {
   id: string;
   callId: string;
   timestamp: Date;
   emotions: {
      happy: number;
      sad: number;
      angry: number;
      surprised: number;
      fearful: number;
      disgusted: number;
      neutral: number;
   };
   dominantEmotion: string;
   confidence: number;
}

export interface CallRecord {
   id: string;
   participants: User[];
   startTime: Date;
   endTime?: Date;
   duration?: number;
   type: 'audio' | 'video';
   transcript?: string;
   emotionAnalysis?: EmotionAnalysis[];
   status: 'ongoing' | 'completed' | 'missed';
}

// API Response types
export interface ApiResponse<T = any> {
   success: boolean;
   data: T;
   message?: string;
   error?: string;
}

export interface PaginatedResponse<T> {
   items: T[];
   total: number;
   page: number;
   limit: number;
   totalPages: number;
}

// Socket.IO event types
export interface SocketEvents {
   // Authentication
   'user:connect': (user: User) => void;
   'user:disconnect': (userId: string) => void;
   'user:online': (userId: string) => void;
   'user:offline': (userId: string) => void;

   // Messages
   'message:new': (message: Message) => void;
   'message:delivered': (messageId: string) => void;
   'message:read': (messageId: string) => void;
   'typing:start': (data: { userId: string; chatRoomId: string }) => void;
   'typing:stop': (data: { userId: string; chatRoomId: string }) => void;

   // Calls
   'call:incoming': (data: { callId: string; caller: User; type: 'audio' | 'video' }) => void;
   'call:accepted': (data: { callId: string; acceptedBy: string }) => void;
   'call:rejected': (data: { callId: string; rejectedBy: string }) => void;
   'call:ended': (data: { callId: string; endedBy: string }) => void;
   'call:offer': (data: { callId: string; offer: RTCSessionDescriptionInit; from: string }) => void;
   'call:answer': (data: { callId: string; answer: RTCSessionDescriptionInit; from: string }) => void;
   'call:ice-candidate': (data: { callId: string; candidate: RTCIceCandidate; from: string }) => void;

   // Notifications
   'notification:new': (notification: Notification) => void;

   // Posts
   'post:new': (post: Post) => void;
   'post:updated': (post: Post) => void;
   'post:deleted': (postId: string) => void;
   'post:liked': (data: { postId: string; userId: string }) => void;
   'post:unliked': (data: { postId: string; userId: string }) => void;
   'comment:new': (comment: Comment) => void;
}

// Form validation schemas
export interface LoginFormData {
   email: string;
   password: string;
}

export interface RegisterFormData {
   email: string;
   username: string;
   displayName: string;
   password: string;
   confirmPassword: string;
}

export interface PostFormData {
   content: string;
   images?: FileList;
}

export interface CommentFormData {
   content: string;
}

export interface ProfileFormData {
   displayName: string;
   username: string;
   bio?: string;
   avatar?: File;
}
