import { apiService } from './apiService';
import type { UserProfile, ApiResponse, ListSearchUser, ListFollower, ListFollowing } from '@/types';

class UserService {
   private readonly endpoint = '/users';

   async searchUsers(query: string): Promise<ApiResponse<ListSearchUser>> {
      return apiService.get<ListSearchUser>(`${this.endpoint}/search`, {
         params: { q: query },
      });
   }

   async getUserById(id: string): Promise<ApiResponse<{ user: UserProfile }>> {
      return apiService.get<{ user: UserProfile }>(`${this.endpoint}/${id}`);
   }

   async getUserFollowers(id: string): Promise<ApiResponse<ListFollower>> {
      return apiService.get<ListFollower>(`${this.endpoint}/${id}/followers`);
   }

   async getUserFollowing(id: string): Promise<ApiResponse<ListFollowing>> {
      return apiService.get<ListFollowing>(`${this.endpoint}/${id}/following`);
   }

   async followUser(id: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/${id}/follow`);
   }

   async unfollowUser(id: string): Promise<ApiResponse<null>> {
      return apiService.delete<null>(`${this.endpoint}/${id}/follow`);
   }

   async checkFollowStatus(id: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
      return apiService.get<{ isFollowing: boolean }>(`${this.endpoint}/${id}/follow-status`);
   }

   async getUserByUsername(username: string): Promise<ApiResponse<{ user: UserProfile }>> {
      return apiService.get<{ user: UserProfile }>(`${this.endpoint}/by-username/${username}`);
   }
}

export const userService = new UserService();
