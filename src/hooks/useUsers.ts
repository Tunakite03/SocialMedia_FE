import { useState, useEffect } from 'react';
import { userService } from '@/services';
import { postService } from '@/services';
import type { User, UserProfile, SearchUser, Post } from '@/types';

// Hook for searching users
export const useUserSearch = () => {
   const [users, setUsers] = useState<SearchUser[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const searchUsers = async (query: string) => {
      if (!query.trim()) {
         setUsers([]);
         return;
      }
      setLoading(true);
      setError(null);
      try {
         const response = await userService.searchUsers(query);
         if (response.success && response.data) {
            setUsers(response.data.users || []);
         } else {
            throw new Error(response.error || 'Failed to search users');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to search users';
         setError(errorMessage);
      } finally {
         setLoading(false);
      }
   };

   return { users, loading, error, searchUsers };
};

// Hook for getting a user by ID
export const useUser = (userId: string) => {
   const [user, setUser] = useState<UserProfile | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
         const response = await userService.getUserById(userId);
         if (response.success && response.data) {
            setUser(response.data.user);
         } else {
            throw new Error(response.error || 'Failed to fetch user');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to fetch user';
         setError(errorMessage);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (userId) {
         fetchUser();
      }
   }, [userId]);

   return { user, loading, error, refetch: fetchUser };
};

// Hook for user followers
export const useUserFollowers = (userId: string) => {
   const [followers, setFollowers] = useState<User[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const fetchFollowers = async () => {
      setLoading(true);
      setError(null);
      try {
         const response = await userService.getUserFollowers(userId);
         if (response.success && response.data) {
            setFollowers(response.data.followers);
         } else {
            throw new Error(response.error || 'Failed to fetch followers');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to fetch followers';
         setError(errorMessage);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (userId) {
         fetchFollowers();
      }
   }, [userId]);

   return { followers, loading, error, refetch: fetchFollowers };
};

// Hook for user following
export const useUserFollowing = (userId: string) => {
   const [following, setFollowing] = useState<User[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const fetchFollowing = async () => {
      setLoading(true);
      setError(null);
      try {
         const response = await userService.getUserFollowing(userId);
         if (response.success && response.data) {
            setFollowing(response.data.following);
         } else {
            throw new Error(response.error || 'Failed to fetch following');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to fetch following';
         setError(errorMessage);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (userId) {
         fetchFollowing();
      }
   }, [userId]);

   return { following, loading, error, refetch: fetchFollowing };
};

// Hook for follow/unfollow actions
export const useFollow = () => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const followUser = async (userId: string) => {
      setLoading(true);
      setError(null);
      try {
         const response = await userService.followUser(userId);
         if (response.success) {
            return true;
         } else {
            throw new Error(response.error || 'Failed to follow user');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to follow user';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   const unfollowUser = async (userId: string) => {
      setLoading(true);
      setError(null);
      try {
         const response = await userService.unfollowUser(userId);
         if (response.success) {
            return true;
         } else {
            throw new Error(response.error || 'Failed to unfollow user');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to unfollow user';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return { followUser, unfollowUser, loading, error };
};

// Hook for user posts (profile page)
export const useUserPosts = (userId: string) => {
   const [posts, setPosts] = useState<Post[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const fetchUserPosts = async () => {
      setLoading(true);
      setError(null);
      try {
         const response = await postService.getUserPosts({ userId });
         if (response.success && response.data) {
            setPosts(response.data.posts);
         } else {
            throw new Error(response.error || 'Failed to fetch user posts');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to fetch user posts';
         setError(errorMessage);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (userId) {
         fetchUserPosts();
      }
   }, [userId]);

   return { posts, loading, error, refetch: fetchUserPosts };
};
