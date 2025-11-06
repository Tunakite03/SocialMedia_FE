import { apiService } from './apiService';
import type { Comment, CommentFormData, Reaction, ReactionFormData, ApiResponse } from '@/types';

interface GetCommentsParams {
   postId: string;
   page?: number;
   limit?: number;
}

interface CommentsResponse {
   comments: Comment[];
   pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
   };
}

class CommentService {
   private readonly endpoint = '/comments';

   async getPostComments(params: GetCommentsParams): Promise<ApiResponse<CommentsResponse>> {
      const { postId, page = 1, limit = 10 } = params;
      return apiService.get<CommentsResponse>(`${this.endpoint}/post/${postId}`, {
         params: { page, limit },
      });
   }

   async createComment(postId: string, commentData: CommentFormData): Promise<ApiResponse<{ comment: Comment }>> {
      return apiService.post<{ comment: Comment }>(`${this.endpoint}/post/${postId}`, commentData);
   }

   async updateComment(id: string, commentData: CommentFormData): Promise<ApiResponse<null>> {
      return apiService.put<null>(`${this.endpoint}/${id}`, commentData);
   }

   async deleteComment(id: string): Promise<ApiResponse<null>> {
      return apiService.delete<null>(`${this.endpoint}/${id}`);
   }

   async getCommentReplies(commentId: string): Promise<ApiResponse<Comment[]>> {
      return apiService.get<Comment[]>(`${this.endpoint}/${commentId}/replies`);
   }

   async getCommentReactions(commentId: string): Promise<ApiResponse<Reaction[]>> {
      return apiService.get<Reaction[]>(`${this.endpoint}/${commentId}/reactions`);
   }

   async addCommentReaction(commentId: string, reactionData: ReactionFormData): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/${commentId}/reactions`, reactionData);
   }
}

export const commentService = new CommentService();
