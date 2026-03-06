import { apiService } from './apiService';
import type { ApiResponse, Message, Conversation, MessageReaction, MessageAttachment } from '@/types';

interface CreateGroupConversationData {
   title: string;
   participantIds: string[];
}

interface SendMessageData {
   content: string;
   replyToId?: string | null;
   type?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE';
}

interface ConversationResponse {
   conversations: Conversation[];
   pagination?: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
   };
}

interface MessagesResponse {
   messages: Message[];
   pagination?: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
   };
}

class MessageService {
   private readonly conversationsEndpoint = '/conversations';
   private readonly messagesEndpoint = '/messages';

   // Conversation management
   async getConversations(limit = 20, offset = 0): Promise<ApiResponse<ConversationResponse>> {
      return apiService.get<ConversationResponse>(`${this.conversationsEndpoint}?limit=${limit}&offset=${offset}`);
   }

   async getConversation(conversationId: string): Promise<ApiResponse<{ conversation: Conversation }>> {
      return apiService.get<{ conversation: Conversation }>(`${this.conversationsEndpoint}/${conversationId}`);
   }

   async getOrCreateDirectConversation(userId: string): Promise<ApiResponse<{ conversation: Conversation }>> {
      return apiService.get<{ conversation: Conversation }>(`${this.conversationsEndpoint}/direct/${userId}`);
   }

   async createGroupConversation(
      data: CreateGroupConversationData,
   ): Promise<ApiResponse<{ conversation: Conversation }>> {
      return apiService.post<{ conversation: Conversation }>(`${this.conversationsEndpoint}/group`, data);
   }

   async deleteConversation(conversationId: string): Promise<ApiResponse<null>> {
      return apiService.delete<null>(`${this.conversationsEndpoint}/${conversationId}`);
   }

   async addParticipant(conversationId: string, userId: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.conversationsEndpoint}/${conversationId}/participants`, { userId });
   }

   async removeParticipant(conversationId: string, userId: string): Promise<ApiResponse<null>> {
      return apiService.delete<null>(`${this.conversationsEndpoint}/${conversationId}/participants/${userId}`);
   }

   // Message management
   async getMessages(conversationId: string, limit = 50, offset = 0): Promise<ApiResponse<MessagesResponse>> {
      return apiService.get<MessagesResponse>(
         `${this.conversationsEndpoint}/${conversationId}/messages?limit=${limit}&offset=${offset}`,
      );
   }

   async sendMessage(conversationId: string, data: SendMessageData): Promise<ApiResponse<{ message: Message }>> {
      return apiService.post<{ message: Message }>(`${this.conversationsEndpoint}/${conversationId}/messages`, data);
   }

   async reactToMessage(messageId: string, emoji: string): Promise<ApiResponse<{ reaction: MessageReaction }>> {
      return apiService.post<{ reaction: MessageReaction }>(`${this.messagesEndpoint}/${messageId}/react`, { emoji });
   }

   async uploadAttachment(messageId: string, file: File): Promise<ApiResponse<{ attachment: MessageAttachment }>> {
      const formData = new FormData();
      formData.append('file', file);
      return apiService.post<{ attachment: MessageAttachment }>(
         `${this.messagesEndpoint}/${messageId}/attachments`,
         formData,
         {
            headers: {
               'Content-Type': 'multipart/form-data',
            },
         },
      );
   }

   async markMessageAsRead(messageId: string): Promise<ApiResponse<null>> {
      return apiService.put<null>(`${this.messagesEndpoint}/${messageId}/read`);
   }

   async markConversationAsRead(
      conversationId: string,
      lastMessageId?: string,
   ): Promise<ApiResponse<{ unreadCount: number; lastReadMessageId: string }>> {
      const body = lastMessageId ? { lastMessageId } : {};
      return apiService.post<{ unreadCount: number; lastReadMessageId: string }>(
         `${this.conversationsEndpoint}/${conversationId}/read`,
         body,
      );
   }

   async deleteMessage(messageId: string): Promise<ApiResponse<null>> {
      return apiService.delete<null>(`${this.conversationsEndpoint}/messages/${messageId}`);
   }

   async editMessage(messageId: string, content: string): Promise<ApiResponse<{ message: Message }>> {
      return apiService.put<{ message: Message }>(`${this.conversationsEndpoint}/messages/${messageId}`, { content });
   }

   // Direct message helpers
   async sendDirectMessage(
      receiverId: string,
      content: string,
      type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' = 'TEXT',
      replyToId?: string | null,
   ): Promise<ApiResponse<{ message: Message }>> {
      const conversationResponse = await this.getOrCreateDirectConversation(receiverId);

      if (!conversationResponse.success || !conversationResponse.data) {
         return conversationResponse as any;
      }

      return this.sendMessage(conversationResponse.data.conversation.id, {
         content,
         type,
         replyToId,
      });
   }
}

export const messageService = new MessageService();
