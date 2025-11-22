// Core type definitions for Otakomi application

export interface User {
   id: string;
   email: string;
   username: string;
   displayName: string;
   avatar?: string;
   bio?: string;
   dateOfBirth?: string;
   role: 'USER' | 'ADMIN' | 'MODERATOR';
   isOnline: boolean;
   lastSeen?: string;
   emailVerified: boolean;
   createdAt: string;
}
export interface SimpleUser {
   id: string;
   username: string;
   displayName: string;
   avatar?: string;
}
export interface ListFollower {
   followers: User[];
}
export interface ListFollowing {
   following: User[];
}

export interface UserProfile extends User {
   isFollowing?: boolean;
   _count: {
      posts: number;
      followers: number;
      following: number;
   };
}
export interface ListSearchUser {
   users: SearchUser[];
}
export interface SearchUser {
   id: string;
   username: string;
   displayName: string;
   avatar?: string;
   bio?: string;
   isFollowing?: boolean; // Only present when authenticated
   _count: {
      followers: number;
      following: number;
   };
}

export interface AuthState {
   user: User | null;
   token: string | null; // accessToken for backward compatibility
   refreshToken: string | null;
   isAuthenticated: boolean;
   isLoading: boolean;
}

export interface MessageSender {
   id: string;
   username: string;
   displayName: string;
   avatar?: string;
}

export interface Message {
   id: string;
   content: string;
   type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
   mediaUrl?: string;
   conversationId: string;
   senderId: string;
   sender: MessageSender;
   receiverId?: string;
   receiver?: User;
   parentId: string | null;
   parent?: Message | null;
   reactions: MessageReaction[];
   attachments: MessageAttachment[];
   isRead: boolean;
   readAt?: string;
   createdAt: string;
   updatedAt: string;
}

export interface MessageReaction {
   id: string;
   messageId: string;
   userId: string;
   emoji: string;
   user: User;
   createdAt: string;
}

export interface MessageAttachment {
   id: string;
   messageId: string;
   fileName: string;
   fileUrl: string;
   fileType: string;
   fileSize: number;
   createdAt: string;
}

export interface Conversation {
   id: string;
   title?: string | null;
   type: 'DIRECT' | 'GROUP';
   participants: ConversationParticipant[];
   messages?: Message[];
   lastMessage?: Message;
   _count: {
      messages: number;
      unreadMessages?: number;
   };
   lastReadMessageId?: string;
   lastReadAt?: string;
   createdAt: string;
   updatedAt: string;
   otherParticipant?: SimpleUser;
}

export interface ConversationParticipant {
   id: string;
   conversationId: string;
   userId: string;
   user: User;
   joinedAt: string;
   leftAt?: string;
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
   type: 'TEXT' | 'IMAGE' | 'VIDEO';
   isPublic: boolean;
   author: {
      id: string;
      username: string;
      displayName: string;
      avatar: string | null;
   };
   authorId: string;
   mediaUrl?: string;
   _count: {
      comments: number;
      reactions: number;
   };
   createdAt: string;
   updatedAt: string;
   userReaction?: 'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW';
}

export interface Comment {
   id: string;
   content: string;
   postId: string;
   authorId: string;
   parentId?: string | null;
   createdAt: string;
   updatedAt: string;
   author: {
      id: string;
      username: string;
      displayName: string;
      avatar: string | null;
   };
   replies?: Comment[];
   _count: {
      replies: number;
      reactions: number;
   };
   userReaction?: 'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW' | null;
}

export interface Reaction {
   id: string;
   type: 'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW';
   user: User;
   createdAt: string;
}

export interface Pagination {
   limit: number;
   offset: number;
   hasMore: boolean; // Changed from hasNext to hasMore to match API
   page?: number;
   total: number;
   nextCursor: string | null;
   performanceHint: string | null;
   // Optional backward compatibility
   hasNext?: boolean;
   hasPrev?: boolean;
}

export interface Notification {
   id: string;
   type: 'REACT' | 'COMMENT' | 'FOLLOW' | 'MESSAGE' | 'CALL' | 'MENTION';
   title: string;
   message: string;
   recipientId?: string;
   senderId: string;
   sender?: {
      id: string;
      username: string;
      displayName: string;
      avatar: string | null;
   };
   isRead: boolean;
   entityId?: string; // ID of related entity (post, comment, etc.)
   entityType?: 'post' | 'comment' | 'user';
   metadata?: {
      errorCode?: string;
      postId?: string;
      commentId?: string;
      callType?: 'VOICE' | 'VIDEO';
      conversationId?: string;
   };
   createdAt: string;
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
   data?: T;
   pagination?: Pagination;
   message?: string;
   error?: string;
   details?: Array<{
      field: string;
      message: string;
   }>;
}

export interface ErrorResponse {
   success: false;
   error: string;
   code: string;
   details?: Array<{
      field: string;
      message: string;
   }>;
}

export interface PaginatedResponse<T> {
   success: boolean;
   data: T[];
   pagination: Pagination;
}
export interface FollowStatusResponse {
   isFollowing: boolean;
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
   dateOfBirth?: string;
   bio?: string;
}

export interface PostFormData {
   content: string;
   type?: 'TEXT' | 'IMAGE' | 'VIDEO';
   isPublic?: boolean;
   mediaFile?: File; // File object for multipart/form-data upload
}

export interface CommentFormData {
   content: string;
   parentId?: string;
}

export interface ProfileFormData {
   displayName?: string;
   bio?: string;
   dateOfBirth?: string;
   avatar?: string;
}

export interface PasswordChangeFormData {
   currentPassword: string;
   newPassword: string;
}

export interface ResetPasswordFormData {
   newPassword: string;
   confirmPassword: string;
}

export interface ReactionFormData {
   type: 'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW';
}

export interface UploadResponse {
   url: string;
   publicId: string;
   size: number;
}

export interface MultipleUploadResponse {
   images: UploadResponse[];
}
