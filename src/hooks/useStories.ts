import { useState, useEffect } from 'react';
import { storyService } from '@/services';
import type { Story } from '@/services/storyService';

export const useStories = () => {
   const [stories, setStories] = useState<Story[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const fetchStories = async () => {
      setLoading(true);
      setError(null);
      try {
         const response = await storyService.getStories();
         if (response.success && response.data) {
            setStories(response.data.stories);
         } else {
            throw new Error(response.error || 'Failed to fetch stories');
         }
      } catch (err: any) {
         const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch stories';
         setError(errorMessage);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchStories();
   }, []);

   const markAsViewed = async (storyId: string) => {
      try {
         await storyService.markStoryAsViewed(storyId);
         setStories((prev) => prev.map((story) => (story.id === storyId ? { ...story, isViewed: true } : story)));
      } catch (err: any) {
         console.error('Failed to mark story as viewed:', err);
      }
   };

   const refetch = () => {
      fetchStories();
   };

   return { stories, loading, error, refetch, markAsViewed };
};

export const useMyStories = () => {
   const [stories, setStories] = useState<Story[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const fetchMyStories = async () => {
      setLoading(true);
      setError(null);
      try {
         const response = await storyService.getMyStories();
         if (response.success && response.data) {
            setStories(response.data.stories);
         } else {
            throw new Error(response.error || 'Failed to fetch my stories');
         }
      } catch (err: any) {
         const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch my stories';
         setError(errorMessage);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchMyStories();
   }, []);

   const createStory = async (storyData: FormData) => {
      setLoading(true);
      setError(null);
      try {
         const response = await storyService.createStory(storyData);
         if (response.success && response.data) {
            setStories((prev) => [response.data!.story, ...prev]);
            return response.data.story;
         } else {
            throw new Error(response.error || 'Failed to create story');
         }
      } catch (err: any) {
         const errorMessage = err.response?.data?.error || err.message || 'Failed to create story';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   const deleteStory = async (storyId: string) => {
      setLoading(true);
      setError(null);
      try {
         const response = await storyService.deleteStory(storyId);
         if (response.success) {
            setStories((prev) => prev.filter((story) => story.id !== storyId));
            return true;
         } else {
            throw new Error(response.error || 'Failed to delete story');
         }
      } catch (err: any) {
         const errorMessage = err.response?.data?.error || err.message || 'Failed to delete story';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   const refetch = () => {
      fetchMyStories();
   };

   return { stories, loading, error, refetch, createStory, deleteStory };
};
