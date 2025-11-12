import { create } from 'zustand';
import { postService } from '@/services';
import type { Post, PostFormData } from '@/types';

interface PostStore {
   // Feed state
   posts: Post[];
   loading: boolean;
   error: string | null;
   hasMore: boolean;
   page: number;
   totalPosts: number;
   cursor?: string;

   // Single post state (for post detail page)
   currentPost: Post | null;
   currentPostLoading: boolean;
   currentPostError: string | null;

   // Actions for feed
   fetchFeed: (pageNum?: number, append?: boolean) => Promise<void>;
   loadMore: () => Promise<void>;
   refetch: () => Promise<void>;

   // Actions for posts manipulation
   addPost: (post: Post) => void;
   updatePost: (postId: string, updates: Partial<Post>) => void;
   removePost: (postId: string) => void;

   // Actions for single post
   fetchPost: (postId: string) => Promise<void>;
   createPost: (postData: PostFormData) => Promise<Post | null>;
   editPost: (postId: string, postData: Partial<PostFormData>) => Promise<void>;
   deletePost: (postId: string) => Promise<boolean>;

   // Actions for post reactions
   addReaction: (postId: string, type: 'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW') => Promise<void>;

   // Reset actions
   resetFeed: () => void;
   resetCurrentPost: () => void;
}

export const usePostStore = create<PostStore>()((set, get) => ({
   // Initial state
   posts: [],
   loading: false,
   error: null,
   hasMore: false,
   page: 1,
   totalPosts: 0,
   cursor: '',

   currentPost: null,
   currentPostLoading: false,
   currentPostError: null,

   // Feed actions
   fetchFeed: async (pageNum = 1, append = false) => {
      const state = get();

      // Prevent multiple concurrent requests
      if (state.loading) return;

      set({ loading: true, error: null });

      try {
         const response = await postService.getFeed({
            offset: (pageNum - 1) * 10,
            limit: 10,
            cursor: state.cursor || '',
         });

         if (response.success && response.data) {
            const newPosts = Array.isArray(response.data.posts) ? response.data.posts : [];

            if (append) {
               const filteredPosts = newPosts.filter((p) => !state.posts.find((sp) => sp.id === p.id));
               set({ posts: [...state.posts, ...filteredPosts] });
            } else {
               set({ posts: newPosts });
            }

            set({
               hasMore: response.pagination?.hasMore || false,
               page: pageNum,
               loading: false,
               totalPosts: response.pagination?.total || 0,
               error: null,
               cursor: response.pagination?.nextCursor || '',
            });
         } else {
            throw new Error(response.error || 'Failed to fetch feed');
         }
      } catch (err: any) {
         console.error('Feed fetch error:', err);
         const errorMessage = err.error || err.message || 'Failed to fetch feed';

         set({
            error: errorMessage,
            loading: false,
            // Don't reset posts if appending
            posts: append ? state.posts : [],
         });
      }
   },

   loadMore: async () => {
      const state = get();
      if (state.hasMore && !state.loading) {
         const nextPage = state.page + 1;
         await state.fetchFeed(nextPage, true);
      }
   },

   refetch: async () => {
      const state = get();
      await state.fetchFeed(1, false);
   },

   // Post manipulation actions
   addPost: (post: Post) => {
      set((state) => ({
         posts: [post, ...state.posts],
      }));
   },

   updatePost: (postId: string, updates: Partial<Post>) => {
      set((state) => ({
         posts: state.posts.map((post) => (post.id === postId ? { ...post, ...updates } : post)),
         currentPost: state.currentPost?.id === postId ? { ...state.currentPost, ...updates } : state.currentPost,
      }));
   },

   removePost: (postId: string) => {
      set((state) => ({
         posts: state.posts.filter((post) => post.id !== postId),
         currentPost: state.currentPost?.id === postId ? null : state.currentPost,
      }));
   },

   // Single post actions
   fetchPost: async (postId: string) => {
      set({ currentPostLoading: true, currentPostError: null });

      try {
         const response = await postService.getPostById(postId);
         if (response.success && response.data) {
            set({
               currentPost: response.data.post,
               currentPostLoading: false,
               currentPostError: null,
            });
         } else {
            throw new Error(response.error || 'Failed to fetch post');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to fetch post';
         set({
            currentPostError: errorMessage,
            currentPostLoading: false,
         });
      }
   },

   createPost: async (postData: PostFormData) => {
      try {
         set({ loading: true, error: null });
         const response = await postService.createPost(postData);
         if (response.success && response.data) {
            const newPost = response.data.post;
            // Add to the beginning of the feed
            set((state) => ({
               posts: [newPost, ...state.posts],
            }));
            set({ loading: false, error: null });
            return newPost;
         } else {
            set({ loading: false, error: response.error || 'Failed to create post' });
            throw new Error(response.error || 'Failed to create post');
         }
      } catch (err: any) {
         set({ loading: false, error: err.error || 'Failed to create post' });
         throw new Error(err.error || 'Failed to create post');
      }
   },

   editPost: async (postId: string, postData: Partial<PostFormData>) => {
      try {
         set({ loading: true, error: null });
         const response = await postService.updatePost(postId, postData);
         if (response.success) {
            // Refetch the specific post to get updated data
            const state = get();
            if (state.currentPost?.id === postId) {
               await state.fetchPost(postId);
            }
            // Also update in the feed if it exists
            await state.refetch();

            set({ loading: false, error: null });
         } else {
            set({ loading: false, error: response.error || 'Failed to update post' });
            throw new Error(response.error || 'Failed to update post');
         }
      } catch (err: any) {
         set({ loading: false, error: err.error || 'Failed to update post' });
         throw new Error(err.error || 'Failed to update post');
      }
   },

   deletePost: async (postId: string) => {
      try {
         set({ loading: true, error: null });
         const response = await postService.deletePost(postId);
         if (response.success) {
            // Remove from store
            get().removePost(postId);
            set({ loading: false, error: null });
            return true;
         } else {
            set({ loading: false, error: response.error || 'Failed to delete post' });
            throw new Error(response.error || 'Failed to delete post');
         }
      } catch (err: any) {
         set({ loading: false, error: err.error || 'Failed to delete post' });
         throw new Error(err.error || 'Failed to delete post');
      }
   },

   addReaction: async (postId: string, type: 'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW') => {
      try {
         set({ loading: true, error: null });
         const response = await postService.addPostReaction(postId, { type });
         if (response.success && response.data) {
            // Optimistically update the post's reaction count and user reaction
            const state = get();
            const post = state.posts.find((p) => p.id === postId);

            if (post) {
               const updates: Partial<Post> = {
                  userReaction: response.data.action === 'removed' ? undefined : type,
                  _count: {
                     ...post._count,
                     reactions: Object.values(response.data.counts).reduce((sum, count) => sum + count, 0),
                  },
               };

               state.updatePost(postId, updates);
            }
            set({ loading: false, error: null });
         } else {
            set({ loading: false, error: response.error || 'Failed to add reaction' });
            throw new Error(response.error || 'Failed to add reaction');
         }
      } catch (err: any) {
         set({ loading: false, error: err.error || 'Failed to add reaction' });
         throw new Error(err.error || 'Failed to add reaction');
      }
   },

   // Reset actions
   resetFeed: () => {
      set({
         posts: [],
         loading: false,
         error: null,
         hasMore: true,
         page: 1,
      });
   },

   resetCurrentPost: () => {
      set({
         currentPost: null,
         currentPostLoading: false,
         currentPostError: null,
      });
   },
}));
