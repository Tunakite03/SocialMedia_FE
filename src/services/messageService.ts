import { apiService } from './apiService';
import type { ApiResponse } from '@/types';

interface MessageData {
   content: string;
   receiverId: string;
}

class MessageService {
   private readonly endpoint = '/messages';

   async getMessages(): Promise<ApiResponse<{ messages: any[] }>> {
      return apiService.get<{ messages: any[] }>(`${this.endpoint}`);
   }

   async sendMessage(messageData: MessageData): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}`, messageData);
   }
}

export const messageService = new MessageService();
