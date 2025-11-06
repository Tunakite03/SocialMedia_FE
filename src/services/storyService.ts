import { apiService } from './apiService';
import type { User, ApiResponse } from '@/types';

export interface Story {
   id: string;
   user: User;
   mediaUrl: string;
   mediaType: 'image' | 'video';
   content?: string;
   expiresAt: string;
   createdAt: string;
   views: number;
   isViewed: boolean;
}

interface StoriesResponse {
   stories: Story[];
}

class StoryService {
   private readonly endpoint = '/stories';

   // TODO: Implement when API is ready
   async getStories(): Promise<ApiResponse<StoriesResponse>> {
      try {
         // Mock stories data until API is ready
         const mockUsers: User[] = [
            {
               id: '1',
               email: 'user1@example.com',
               username: 'anime_lover',
               displayName: 'Anime Lover',
               avatar: '/api/placeholder/60/60?text=AL',
               role: 'USER' as const,
               isOnline: true,
               emailVerified: true,
               createdAt: new Date().toISOString(),
            },
            {
               id: '2',
               email: 'user2@example.com',
               username: 'manga_reader',
               displayName: 'Manga Reader',
               avatar: '/api/placeholder/60/60?text=MR',
               role: 'USER' as const,
               isOnline: false,
               emailVerified: true,
               createdAt: new Date().toISOString(),
            },
            {
               id: '3',
               email: 'user3@example.com',
               username: 'cosplay_fan',
               displayName: 'Cosplay Fan',
               avatar: '/api/placeholder/60/60?text=CF',
               role: 'USER' as const,
               isOnline: true,
               emailVerified: true,
               createdAt: new Date().toISOString(),
            },
            {
               id: '4',
               email: 'user4@example.com',
               username: 'otaku_life',
               displayName: 'Otaku Life',
               avatar: '/api/placeholder/60/60?text=OL',
               role: 'USER' as const,
               isOnline: true,
               emailVerified: true,
               createdAt: new Date().toISOString(),
            },
         ];

         const mockStories: Story[] = mockUsers.map((user) => ({
            id: `story_${user.id}`,
            user,
            mediaUrl: user.avatar || `/api/placeholder/400/600?text=${user.username}`,
            mediaType: 'image' as const,
            content: `Check out ${user.displayName}'s latest update!`,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
            createdAt: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString(), // Random time in last 12 hours
            views: Math.floor(Math.random() * 100),
            isViewed: Math.random() > 0.5,
         }));

         return {
            success: true,
            data: { stories: mockStories },
         };
      } catch (error: any) {
         return {
            success: false,
            error: error.message || 'Failed to fetch stories',
         };
      }
   }

   async getMyStories(): Promise<ApiResponse<StoriesResponse>> {
      // TODO: Implement when API is ready
      return apiService.get<StoriesResponse>(`${this.endpoint}/me`);
   }

   async createStory(storyData: FormData): Promise<ApiResponse<{ story: Story }>> {
      // TODO: Implement when API is ready
      return apiService.post<{ story: Story }>(`${this.endpoint}`, storyData, {
         headers: {
            'Content-Type': 'multipart/form-data',
         },
      });
   }

   async deleteStory(storyId: string): Promise<ApiResponse<null>> {
      // TODO: Implement when API is ready
      return apiService.delete<null>(`${this.endpoint}/${storyId}`);
   }

   async markStoryAsViewed(storyId: string): Promise<ApiResponse<null>> {
      // TODO: Implement when API is ready
      return apiService.post<null>(`${this.endpoint}/${storyId}/view`);
   }

   async getStoryViews(storyId: string): Promise<ApiResponse<{ views: User[] }>> {
      // TODO: Implement when API is ready
      return apiService.get<{ views: User[] }>(`${this.endpoint}/${storyId}/views`);
   }
}

export const storyService = new StoryService();
