import { apiService } from './apiService';
import type { Reaction, ReactionFormData, ApiResponse } from '@/types';

class ReactionService {
   // Post reactions
   async getPostReactions(postId: string): Promise<ApiResponse<Reaction[]>> {
      return apiService.get<Reaction[]>(`/posts/${postId}/reactions`);
   }

   async addPostReaction(postId: string, reactionData: ReactionFormData): Promise<ApiResponse<null>> {
      return apiService.post<null>(`/posts/${postId}/reactions`, reactionData);
   }

   // Comment reactions
   async getCommentReactions(commentId: string): Promise<ApiResponse<Reaction[]>> {
      return apiService.get<Reaction[]>(`/comments/${commentId}/reactions`);
   }

   async addCommentReaction(commentId: string, reactionData: ReactionFormData): Promise<ApiResponse<null>> {
      return apiService.post<null>(`/comments/${commentId}/reactions`, reactionData);
   }
}

export const reactionService = new ReactionService();
