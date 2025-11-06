import { usePostStore } from '@/store/postStore';
import { useEffect } from 'react';

// Hook for easy feed management
export const useFeed = () => {
   const store = usePostStore();

   // Auto-fetch feed on mount if not already loaded
   useEffect(() => {
      if (store.posts.length === 0 && !store.loading && !store.error) {
         store.fetchFeed(1, false);
      }
   }, []);

   return {
      posts: store.posts,
      loading: store.loading,
      error: store.error,
      hasMore: store.hasMore,
      loadMore: store.loadMore,
      refetch: store.refetch,
      addPost: store.addPost,
      updatePost: store.updatePost,
      removePost: store.removePost,
   };
};

// Hook for single post management
export const usePost = (postId?: string) => {
   const store = usePostStore();

   // Auto-fetch post on mount if postId is provided
   useEffect(() => {
      if (postId && (!store.currentPost || store.currentPost.id !== postId)) {
         store.fetchPost(postId);
      }
   }, [postId]);

   // Get post from feed cache if not in currentPost
   const post = store.currentPost || (postId ? store.posts.find((p) => p.id === postId) : null);

   return {
      post,
      loading: store.currentPostLoading,
      error: store.currentPostError,
      createPost: store.createPost,
      editPost: store.editPost,
      deletePost: store.deletePost,
      addReaction: store.addReaction,
      refetch: postId ? () => store.fetchPost(postId) : undefined,
   };
};

// Hook for post reactions
export const usePostReactions = (postId: string) => {
   const store = usePostStore();

   const post = store.posts.find((p) => p.id === postId) || store.currentPost;

   return {
      userReaction: post?.userReaction,
      reactionCount: post?._count.reactions || 0,
      addReaction: (type: 'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW') => store.addReaction(postId, type),
   };
};

// Hook for creating posts
export const useCreatePost = () => {
   const store = usePostStore();

   return {
      createPost: store.createPost,
      loading: store.loading, // We can add separate loading state for creation if needed
      error: store.error,
   };
};
