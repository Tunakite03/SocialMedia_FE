import { useState, useEffect } from 'react';
import { postService } from '@/services';
import type { Post, PostFormData } from '@/types';

// Hook for getting feed
export const useFeed = (limit: number = 10) => {
   const [posts, setPosts] = useState<Post[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [hasMore, setHasMore] = useState(true);
   const [page, setPage] = useState(1);

   const fetchFeed = async (pageNum: number = 1, append: boolean = false) => {
      setLoading(true);
      setError(null);
      try {
         const response = await postService.getFeed({ page: pageNum, limit });

         if (response.success && response.data) {
            const posts = Array.isArray(response.data.posts) ? response.data.posts : [];
            if (append) {
               setPosts((prev) => [...prev, ...posts]);
            } else {
               setPosts(posts);
            }
            setHasMore(response.data.pagination?.hasNext || false);
         } else {
            throw new Error(response.error || 'Failed to fetch feed');
         }
      } catch (err: any) {
         console.error('Feed fetch error:', err); // Debug log
         const errorMessage = err.error || err.message || 'Failed to fetch feed';
         setError(errorMessage);
         // Ensure posts is always an array, don't reset to empty if appending
         if (!append) {
            setPosts([]);
         }
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchFeed(1);
   }, []);

   const loadMore = () => {
      if (hasMore && !loading) {
         const nextPage = page + 1;
         setPage(nextPage);
         fetchFeed(nextPage, true);
      }
   };

   const refetch = () => {
      setPage(1);
      fetchFeed(1);
   };

   return { posts, loading, error, hasMore, loadMore, refetch };
};

// Hook for getting user posts
export const useUserPosts = (userId: string, page: number = 1, limit: number = 10) => {
   const [posts, setPosts] = useState<Post[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [hasMore, setHasMore] = useState(true);

   const fetchUserPosts = async (pageNum: number = 1, append: boolean = false) => {
      setLoading(true);
      setError(null);
      try {
         const response = await postService.getUserPosts({ userId, page: pageNum, limit });
         if (response.success && response.data) {
            const posts = response.data.posts || [];
            if (append) {
               setPosts((prev) => [...prev, ...posts]);
            } else {
               setPosts(posts);
            }
            setHasMore(response.data.pagination?.hasNext || false);
         } else {
            throw new Error(response.error || 'Failed to fetch user posts');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to fetch user posts';
         setError(errorMessage);
         // Ensure posts is always an array, don't reset to empty if appending
         if (!append) {
            setPosts([]);
         }
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (userId) {
         fetchUserPosts(page);
      }
   }, [userId, page]);

   const loadMore = () => {
      if (hasMore && !loading) {
         fetchUserPosts(page + 1, true);
      }
   };

   return { posts, loading, error, hasMore, loadMore, refetch: () => fetchUserPosts(1) };
};

// Hook for creating a post
export const useCreatePost = () => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const createPost = async (postData: PostFormData) => {
      setLoading(true);
      setError(null);
      try {
         const response = await postService.createPost(postData);
         if (response.success && response.data) {
            return response.data.post;
         } else {
            throw new Error(response.error || 'Failed to create post');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to create post';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return { createPost, loading, error };
};

// Hook for getting a single post
export const usePost = (postId: string) => {
   const [post, setPost] = useState<Post | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
         const response = await postService.getPostById(postId);
         if (response.success && response.data) {
            setPost(response.data.post);
         } else {
            throw new Error(response.error || 'Failed to fetch post');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to fetch post';
         setError(errorMessage);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (postId) {
         fetchPost();
      }
   }, [postId]);

   const updatePost = async (postData: Partial<PostFormData>) => {
      setLoading(true);
      setError(null);
      try {
         const response = await postService.updatePost(postId, postData);
         if (response.success) {
            // Refetch the post to get updated data
            await fetchPost();
         } else {
            throw new Error(response.error || 'Failed to update post');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to update post';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   const deletePost = async () => {
      setLoading(true);
      setError(null);
      try {
         const response = await postService.deletePost(postId);
         if (response.success) {
            return true;
         } else {
            throw new Error(response.error || 'Failed to delete post');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to delete post';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return { post, loading, error, updatePost, deletePost, refetch: fetchPost };
};

// Hook for post reactions
export const usePostReactions = (postId: string) => {
   const [reactions, setReactions] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const fetchReactions = async () => {
      setLoading(true);
      setError(null);
      try {
         const response = await postService.getPostReactions(postId);
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
         const response = await postService.addPostReaction(postId, { type });
         if (response.success && response.data) {
            // Return response data để component có thể xử lý
            return response.data;
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

   return { reactions, loading, error, addReaction, refetch: fetchReactions };
};
