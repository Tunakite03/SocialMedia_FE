import { useState, useEffect } from 'react';
import { commentService } from '@/services';
import type { Comment, CommentFormData } from '@/types';

// Hook for getting post comments
export const usePostComments = (postId: string, page: number = 1, limit: number = 10) => {
   const [comments, setComments] = useState<Comment[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [hasMore, setHasMore] = useState(true);

   const fetchComments = async (pageNum: number = 1, append: boolean = false) => {
      setLoading(true);
      setError(null);
      try {
         const response = await commentService.getPostComments({ postId, page: pageNum, limit });
         if (response.success && response.data) {
            if (append) {
               setComments((prev) => [...prev, ...response.data!.comments]);
            } else {
               setComments(response.data.comments);
            }
            setHasMore(response.data.pagination.hasNext);
         } else {
            throw new Error(response.error || 'Failed to fetch comments');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to fetch comments';
         setError(errorMessage);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (postId) {
         fetchComments(page);
      }
   }, [postId, page]);

   const loadMore = () => {
      if (hasMore && !loading) {
         fetchComments(page + 1, true);
      }
   };

   // Add new comment to local state (optimistic update)
   const addCommentOptimistic = (comment: Comment) => {
      setComments((prev) => [comment, ...prev]);
   };

   // Update comment in local state (for replies)
   const updateComment = (commentId: string, updatedComment: Comment) => {
      setComments((prev) => prev.map((comment) => (comment.id === commentId ? updatedComment : comment)));
   };

   return {
      comments,
      loading,
      error,
      hasMore,
      loadMore,
      refetch: () => fetchComments(1),
      addCommentOptimistic,
      updateComment,
   };
};

// Hook for creating a comment
export const useCreateComment = () => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const createComment = async (postId: string, commentData: CommentFormData) => {
      setLoading(true);
      setError(null);
      try {
         const response = await commentService.createComment(postId, commentData);
         if (response.success && response.data) {
            return response.data.comment;
         } else {
            throw new Error(response.error || 'Failed to create comment');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to create comment';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return { createComment, loading, error };
};

// Hook for comment actions (update, delete)
export const useComment = (commentId: string) => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const updateComment = async (commentData: CommentFormData) => {
      setLoading(true);
      setError(null);
      try {
         const response = await commentService.updateComment(commentId, commentData);
         if (response.success) {
            return true;
         } else {
            throw new Error(response.error || 'Failed to update comment');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to update comment';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   const deleteComment = async () => {
      setLoading(true);
      setError(null);
      try {
         const response = await commentService.deleteComment(commentId);
         if (response.success) {
            return true;
         } else {
            throw new Error(response.error || 'Failed to delete comment');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to delete comment';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return { updateComment, deleteComment, loading, error };
};

// Hook for comment replies
export const useCommentReplies = (commentId: string) => {
   const [replies, setReplies] = useState<Comment[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const fetchReplies = async () => {
      setLoading(true);
      setError(null);
      try {
         const response = await commentService.getCommentReplies(commentId);
         console.log('Replies API response:', response);

         if (response.success && response.data) {
            // Ensure response.data is an array
            const repliesData = Array.isArray(response.data) ? response.data : [];
            console.log('Setting replies data:', repliesData);
            setReplies(repliesData);
         } else {
            console.log('API response not successful or no data:', response);
            setReplies([]);
            if (response.error) {
               throw new Error(response.error);
            }
         }
      } catch (err: any) {
         console.error('Error fetching replies:', err);
         console.error('Error details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
            url: err.config?.url,
         });
         const errorMessage = err.error || err.message || 'Failed to fetch replies';
         setError(errorMessage);
         setReplies([]);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (commentId) {
         fetchReplies();
      }
   }, [commentId]);

   return { replies, loading, error, refetch: fetchReplies };
};

// Hook for comment reactions
export const useCommentReactions = (commentId: string) => {
   const [reactions, setReactions] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const fetchReactions = async () => {
      setLoading(true);
      setError(null);
      try {
         const response = await commentService.getCommentReactions(commentId);
         if (response.success && response.data) {
            setReactions(response.data);
         } else {
            throw new Error(response.error || 'Failed to fetch reactions');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to fetch reactions';
         setError(errorMessage);
      } finally {
         setLoading(false);
      }
   };

   const addReaction = async (type: 'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW') => {
      setLoading(true);
      setError(null);
      try {
         const response = await commentService.addCommentReaction(commentId, { type });
         if (response.success) {
            await fetchReactions(); // Refresh reactions
         } else {
            throw new Error(response.error || 'Failed to add reaction');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to add reaction';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (commentId) {
         fetchReactions();
      }
   }, [commentId]);

   return { reactions, loading, error, addReaction, refetch: fetchReactions };
};
