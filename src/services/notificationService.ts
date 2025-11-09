import { apiService } from './apiService';
import type { ApiResponse, Notification } from '@/types';

interface GetNotificationsParams {
   limit?: number;
   offset?: number;
   cursor?: string;
}

interface NotificationsResponse {
   notifications: Notification[];
   unreadCount: number;
}

class NotificationService {
   private readonly endpoint = '/notifications';

   async getNotifications(params?: GetNotificationsParams): Promise<ApiResponse<NotificationsResponse>> {
      const queryParams = new URLSearchParams();

      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.cursor) queryParams.append('cursor', params.cursor);

      const queryString = queryParams.toString();
      const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

      return apiService.get<NotificationsResponse>(url);
   }

   async markAsRead(notificationId: string): Promise<ApiResponse<{ message: string }>> {
      return apiService.put<{ message: string }>(`${this.endpoint}/${notificationId}/read`);
   }

   async markAllAsRead(): Promise<ApiResponse<{ message: string; markedCount: number }>> {
      return apiService.put<{ message: string; markedCount: number }>(`${this.endpoint}/read-all`);
   }
}

export const notificationService = new NotificationService();
