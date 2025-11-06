import { apiService } from './apiService';
import type { ApiResponse } from '@/types';

class NotificationService {
   private readonly endpoint = '/notifications';

   async getNotifications(): Promise<ApiResponse<{ notifications: any[] }>> {
      return apiService.get<{ notifications: any[] }>(`${this.endpoint}`);
   }
}

export const notificationService = new NotificationService();
