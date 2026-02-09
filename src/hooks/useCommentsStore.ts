import { useCommentStore } from '@/store';
import { useEffect, useRef } from 'react';

// Hook for managing comments of a specific post
export const usePostComments = (postId: string) => {
   const { getComments, isLoading, getError, hasMoreComments, fetchComments, clearPostComments } = useCommentStore();
   const hasInitiallyFetched = useRef<Set<string>>(new Set());

   const comments = getComments(postId);
   const loading = isLoading(postId);
   const error = getError(postId);
   const hasMore = hasMoreComments(postId);

   // Auto-fetch comments when component mounts
   useEffect(() => {
      if (postId && !loading && !hasInitiallyFetched.current.has(postId)) {
         hasInitiallyFetched.current.add(postId);
         fetchComments(postId);
      }

      // Cleanup function to remove tracking when component unmounts
      return () => {
         if (postId) {
            hasInitiallyFetched.current.delete(postId);
         }
      };
   }, [postId]);

   const loadMore = () => {
      if (hasMore && !loading) {
         const currentPage = Math.ceil(comments.length / 20) + 1;
         fetchComments(postId, currentPage, true);
      }
   };

   const refetch = () => {
      // Allow refetch even if already fetched
      fetchComments(postId);
   };

   return {
      comments,
      loading,
      error,
      hasMore,
      loadMore,
      refetch,
      clearComments: () => clearPostComments(postId),
   };
};

// Hook for creating comments
export const useCreateComment = () => {
   const { createComment, createLoading } = useCommentStore();

   return {
      createComment,
      loading: createLoading,
      error: null, // Error handling is done in store
   };
};

// Hook for real-time comment updates (to be used with socket)
export const useCommentRealtime = () => {
   const { handleNewComment, handleCommentUpdate } = useCommentStore();

   return {
      handleNewComment,
      handleCommentUpdate,
   };
};
