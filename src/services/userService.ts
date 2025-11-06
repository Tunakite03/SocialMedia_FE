import { apiService } from './apiService';
import type { User, UserProfile, ApiResponse } from '@/types';

class UserService {
   private readonly endpoint = '/users';

   async searchUsers(query: string): Promise<ApiResponse<User[]>> {
      return apiService.get<User[]>(`${this.endpoint}/search`, {
         params: { q: query },
      });
   }

   async getUserById(id: string): Promise<ApiResponse<{ user: UserProfile }>> {
      return apiService.get<{ user: UserProfile }>(`${this.endpoint}/${id}`);
   }

   async getUserFollowers(id: string): Promise<ApiResponse<User[]>> {
      return apiService.get<User[]>(`${this.endpoint}/${id}/followers`);
   }

   async getUserFollowing(id: string): Promise<ApiResponse<User[]>> {
      return apiService.get<User[]>(`${this.endpoint}/${id}/following`);
   }

   async followUser(id: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/${id}/follow`);
   }

   async unfollowUser(id: string): Promise<ApiResponse<null>> {
      return apiService.delete<null>(`${this.endpoint}/${id}/follow`);
   }
}

export const userService = new UserService();
