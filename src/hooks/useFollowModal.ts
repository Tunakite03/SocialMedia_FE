import { useState, useEffect } from 'react';
import { userService } from '@/services';
import type { User } from '@/types';

// Hook for followers modal - only fetch when modal is open
export const useFollowersModal = (userId: string) => {
   const [followers, setFollowers] = useState<User[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [isOpen, setIsOpen] = useState(false);

   const fetchFollowers = async () => {
      if (!userId) return;

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

   const openModal = () => {
      setIsOpen(true);
   };

   const closeModal = () => {
      setIsOpen(false);
   };

   // Fetch followers when modal opens
   useEffect(() => {
      if (isOpen && userId) {
         fetchFollowers();
      }
   }, [isOpen, userId]);

   return {
      followers,
      loading,
      error,
      isOpen,
      openModal,
      closeModal,
   };
};

// Hook for following modal - only fetch when modal is open
export const useFollowingModal = (userId: string) => {
   const [following, setFollowing] = useState<User[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [isOpen, setIsOpen] = useState(false);

   const fetchFollowing = async () => {
      if (!userId) return;

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

   const openModal = () => {
      setIsOpen(true);
   };

   const closeModal = () => {
      setIsOpen(false);
   };

   // Fetch following when modal opens
   useEffect(() => {
      if (isOpen && userId) {
         fetchFollowing();
      }
   }, [isOpen, userId]);

   return {
      following,
      loading,
      error,
      isOpen,
      openModal,
      closeModal,
   };
};
