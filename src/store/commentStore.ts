import { create } from 'zustand';
import { commentService } from '@/services';
import type { Comment, CommentFormData } from '@/types';

type ReactionType = 'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW';

interface CommentState {
   // State for comments by post ID
   commentsByPost: Record<string, Comment[]>;
   loading: Record<string, boolean>;
   errors: Record<string, string | null>;
   hasMore: Record<string, boolean>;

   // Create comment loading
   createLoading: boolean;

   // Actions
   fetchComments: (postId: string, page?: number, append?: boolean) => Promise<void>;
   addCommentOptimistic: (postId: string, comment: Comment) => void;
   addReplyOptimistic: (postId: string, parentCommentId: string, reply: Comment) => void;
   createComment: (postId: string, commentData: CommentFormData) => Promise<Comment | null>;
   addCommentReaction: (postId: string, commentId: string, type: ReactionType) => Promise<void>;

   // Real-time updates
   handleNewComment: (comment: Comment) => void;
   handleCommentUpdate: (updatedComment: Comment) => void;

   // Cache management
   clearPostComments: (postId: string) => void;
   clearAllComments: () => void;

   // Getters
   getComments: (postId: string) => Comment[];
   isLoading: (postId: string) => boolean;
   getError: (postId: string) => string | null;
   hasMoreComments: (postId: string) => boolean;
}

export const useCommentStore = create<CommentState>()((set, get) => ({
   // Initial state
   commentsByPost: {},
   loading: {},
   errors: {},
   hasMore: {},
   createLoading: false,

   // Fetch comments for a post
   fetchComments: async (postId: string, page = 1, append = false) => {
      set((state) => ({
         loading: { ...state.loading, [postId]: true },
         errors: { ...state.errors, [postId]: null },
      }));

      try {
         const response = await commentService.getPostComments({
            postId,
            page,
            limit: 20,
         });

         if (response.success && response.data) {
            // Handle different possible response formats
            let comments: Comment[] = [];
            let hasNext = false;

            // Case 1: Standard format with comments array and pagination
            if (response.data.comments && Array.isArray(response.data.comments)) {
               comments = response.data.comments;
               hasNext = response.data.pagination?.hasNext || false;
            }
            // Case 2: Direct array (fallback)
            else if (Array.isArray(response.data)) {
               comments = response.data;
               hasNext = false; // No pagination info available
            }
            // Case 3: Invalid format
            else {
               console.error('Invalid response structure:', response.data);
               throw new Error('Invalid response structure');
            }
            set((state) => {
               const existingComments = state.commentsByPost[postId] || [];
               const updatedComments = append ? [...existingComments, ...comments] : comments;

               return {
                  commentsByPost: {
                     ...state.commentsByPost,
                     [postId]: updatedComments,
                  },
                  hasMore: {
                     ...state.hasMore,
                     [postId]: hasNext,
                  },
                  loading: { ...state.loading, [postId]: false },
               };
            });
         } else {
            set((state) => ({
               loading: { ...state.loading, [postId]: false },
               hasMore: { ...state.hasMore, [postId]: false },
            }));
            throw new Error(response.error || 'Failed to fetch comments');
         }
      } catch (error: any) {
         const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch comments';
         set((state) => ({
            errors: { ...state.errors, [postId]: errorMessage },
            loading: { ...state.loading, [postId]: false },
         }));
         console.error('Error fetching comments:', error);
      }
   },

   // Add comment optimistically (for immediate UI update)
   addCommentOptimistic: (postId: string, comment: Comment) => {
      set((state) => {
         const existingComments = state.commentsByPost[postId] || [];
         return {
            commentsByPost: {
               ...state.commentsByPost,
               [postId]: [comment, ...existingComments],
            },
         };
      });
   },

   // Add reply optimistically (nested in parent comment)
   addReplyOptimistic: (postId: string, parentCommentId: string, reply: Comment) => {
      set((state) => {
         const existingComments = state.commentsByPost[postId] || [];
         const updatedComments = existingComments.map((comment) => {
            if (comment.id === parentCommentId) {
               return {
                  ...comment,
                  replies: [...(comment.replies || []), reply],
                  _count: {
                     ...comment._count,
                     replies: comment._count.replies + 1,
                  },
               };
            }
            return comment;
         });

         return {
            commentsByPost: {
               ...state.commentsByPost,
               [postId]: updatedComments,
            },
         };
      });
   },

   // Create comment (API call + optimistic update)
   createComment: async (postId: string, commentData: CommentFormData) => {
      set({ createLoading: true });

      try {
         const response = await commentService.createComment(postId, commentData);

         if (response.success && response.data) {
            const newComment = response.data.comment;

            // If it's a reply, update the parent comment
            if (commentData.parentId) {
               get().addReplyOptimistic(postId, commentData.parentId, newComment);
            } else {
               // If it's a top-level comment, add to the beginning
               get().addCommentOptimistic(postId, newComment);
            }

            set({ createLoading: false });
            return newComment;
         } else {
            throw new Error(response.error || 'Failed to create comment');
         }
      } catch (error: any) {
         console.error('Error creating comment:', error);
         set({ createLoading: false });

         // Re-fetch comments to ensure consistency if optimistic update failed
         await get().fetchComments(postId);
         return null;
      }
   },

   // Add reaction to a comment
   addCommentReaction: async (postId: string, commentId: string, type: ReactionType) => {
      const state = get();
      const comments = state.commentsByPost[postId] || [];

      // Find the comment (could be top-level or a reply)
      const findComment = (list: Comment[]): Comment | undefined => {
         for (const c of list) {
            if (c.id === commentId) return c;
            if (c.replies) {
               const found = findComment(c.replies);
               if (found) return found;
            }
         }
         return undefined;
      };

      const comment = findComment(comments);
      if (!comment) return;

      // Save previous state for rollback
      const prevReaction = comment.userReaction;
      const prevCount = comment._count.reactions;

      // Optimistic update
      const isSameReaction = prevReaction === type;
      const optimisticReaction = isSameReaction ? null : type;
      const optimisticCount = isSameReaction ? prevCount - 1 : prevReaction ? prevCount : prevCount + 1;

      const updateComment = (c: Comment): Comment => {
         if (c.id === commentId) {
            return {
               ...c,
               userReaction: optimisticReaction,
               _count: { ...c._count, reactions: optimisticCount },
            };
         }
         if (c.replies) {
            return { ...c, replies: c.replies.map(updateComment) };
         }
         return c;
      };

      set((s) => ({
         commentsByPost: {
            ...s.commentsByPost,
            [postId]: (s.commentsByPost[postId] || []).map(updateComment),
         },
      }));

      try {
         const response = await commentService.addCommentReaction(commentId, { type });

         if (response.success && response.data) {
            const { action, counts } = response.data;
            const totalCount = Object.values(counts).reduce((sum, n) => sum + n, 0);
            const serverReaction = action === 'removed' ? null : type;

            const applyServer = (c: Comment): Comment => {
               if (c.id === commentId) {
                  return {
                     ...c,
                     userReaction: serverReaction,
                     _count: { ...c._count, reactions: totalCount },
                  };
               }
               if (c.replies) {
                  return { ...c, replies: c.replies.map(applyServer) };
               }
               return c;
            };

            set((s) => ({
               commentsByPost: {
                  ...s.commentsByPost,
                  [postId]: (s.commentsByPost[postId] || []).map(applyServer),
               },
            }));
         }
      } catch (error) {
         // Rollback on failure
         const rollback = (c: Comment): Comment => {
            if (c.id === commentId) {
               return {
                  ...c,
                  userReaction: prevReaction,
                  _count: { ...c._count, reactions: prevCount },
               };
            }
            if (c.replies) {
               return { ...c, replies: c.replies.map(rollback) };
            }
            return c;
         };

         set((s) => ({
            commentsByPost: {
               ...s.commentsByPost,
               [postId]: (s.commentsByPost[postId] || []).map(rollback),
            },
         }));

         console.error('Error adding comment reaction:', error);
      }
   },

   // Handle real-time comment updates (from socket)
   handleNewComment: (comment: Comment) => {
      const { postId } = comment;
      if (comment.parentId) {
         // It's a reply
         get().addReplyOptimistic(postId, comment.parentId, comment);
      } else {
         // It's a top-level comment
         get().addCommentOptimistic(postId, comment);
      }
   },

   // Handle comment updates (like reactions)
   handleCommentUpdate: (updatedComment: Comment) => {
      const { postId } = updatedComment;

      set((state) => {
         const existingComments = state.commentsByPost[postId] || [];
         const updatedComments = existingComments.map((comment) => {
            if (comment.id === updatedComment.id) {
               return updatedComment;
            }

            // Check if it's a reply within a comment
            if (comment.replies) {
               const updatedReplies = comment.replies.map((reply) =>
                  reply.id === updatedComment.id ? updatedComment : reply,
               );
               return { ...comment, replies: updatedReplies };
            }

            return comment;
         });

         return {
            commentsByPost: {
               ...state.commentsByPost,
               [postId]: updatedComments,
            },
         };
      });
   },

   // Clear comments for a specific post
   clearPostComments: (postId: string) => {
      set((state) => {
         const newCommentsByPost = { ...state.commentsByPost };
         const newLoading = { ...state.loading };
         const newErrors = { ...state.errors };
         const newHasMore = { ...state.hasMore };

         delete newCommentsByPost[postId];
         delete newLoading[postId];
         delete newErrors[postId];
         delete newHasMore[postId];

         return {
            commentsByPost: newCommentsByPost,
            loading: newLoading,
            errors: newErrors,
            hasMore: newHasMore,
         };
      });
   },

   // Clear all comments (useful for logout)
   clearAllComments: () => {
      set({
         commentsByPost: {},
         loading: {},
         errors: {},
         hasMore: {},
      });
   },

   // Getters
   getComments: (postId: string) => {
      return get().commentsByPost[postId] || [];
   },

   isLoading: (postId: string) => {
      return get().loading[postId] || false;
   },

   getError: (postId: string) => {
      return get().errors[postId] || null;
   },

   hasMoreComments: (postId: string) => {
      return get().hasMore[postId] || false;
   },
}));
