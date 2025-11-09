import { apiService } from './apiService';
import type { Post, PostFormData, Reaction, ReactionFormData, ApiResponse } from '@/types';

interface GetFeedParams {
   page?: number;
   limit?: number;
}

interface GetUserPostsParams {
   userId: string;
   page?: number;
   limit?: number;
}

interface PostsResponse {
   posts: Post[];
   pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
   };
}

interface ReactionResponse {
   reaction: Reaction | null;
   action: 'added' | 'removed' | 'updated';
   counts: Record<string, number>;
}

class PostService {
   private readonly endpoint = '/posts';

   async getFeed(params: GetFeedParams = {}): Promise<ApiResponse<PostsResponse>> {
      const { page = 1, limit = 10 } = params;
      return apiService.get<PostsResponse>(`${this.endpoint}/feed`, {
         params: { page, limit },
      });
   }

   async getPostById(id: string): Promise<ApiResponse<{ post: Post }>> {
      return apiService.get<{ post: Post }>(`${this.endpoint}/${id}`);
   }

   async getUserPosts(params: GetUserPostsParams): Promise<ApiResponse<PostsResponse>> {
      const { userId, page = 1, limit = 10 } = params;
      return apiService.get<PostsResponse>(`${this.endpoint}/user/${userId}`, {
         params: { page, limit },
      });
   }

   async createPost(postData: PostFormData): Promise<ApiResponse<{ post: Post }>> {
      // If there's a media file, use multipart/form-data
      if (postData.mediaFile) {
         const formData = new FormData();

         if (postData.content?.trim()) {
            formData.append('content', postData.content);
         }

         formData.append('type', postData.type || 'TEXT');
         formData.append('isPublic', String(postData.isPublic !== false));
         formData.append('media', postData.mediaFile);

         return apiService.post<{ post: Post }>(`${this.endpoint}`, formData, {
            headers: {
               'Content-Type': 'multipart/form-data',
            },
         });
      }

      // For text-only posts, use JSON
      const payload: any = {
         content: postData.content || '',
         type: postData.type || 'TEXT',
         isPublic: postData.isPublic !== false,
      };

      return apiService.post<{ post: Post }>(`${this.endpoint}`, payload);
   }

   async updatePost(id: string, postData: Partial<PostFormData>): Promise<ApiResponse<null>> {
      return apiService.put<null>(`${this.endpoint}/${id}`, postData);
   }

   async deletePost(id: string): Promise<ApiResponse<null>> {
      return apiService.delete<null>(`${this.endpoint}/${id}`);
   }

   async getPostReactions(postId: string): Promise<ApiResponse<Reaction[]>> {
      return apiService.get<Reaction[]>(`${this.endpoint}/${postId}/reactions`);
   }

   async addPostReaction(postId: string, reactionData: ReactionFormData): Promise<ApiResponse<ReactionResponse>> {
      return apiService.post<ReactionResponse>(`${this.endpoint}/${postId}/reactions`, reactionData);
   }
}

export const postService = new PostService();
