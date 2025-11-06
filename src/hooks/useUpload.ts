import { useState } from 'react';
import { uploadService } from '@/services';
import type { UploadResponse, MultipleUploadResponse } from '@/types';

// Hook for uploading a single image
export const useImageUpload = () => {
   const [loading, setLoading] = useState(false);
   const [progress, setProgress] = useState(0);
   const [error, setError] = useState<string | null>(null);

   const uploadImage = async (file: File): Promise<UploadResponse> => {
      setLoading(true);
      setProgress(0);
      setError(null);

      try {
         const response = await uploadService.uploadImage(file, (progressValue) => {
            setProgress(progressValue);
         });

         if (response.success && response.data) {
            return response.data;
         } else {
            throw new Error(response.error || 'Failed to upload image');
         }
      } catch (err: any) {
         const errorMessage = err.response?.data?.error || err.message || 'Failed to upload image';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
         setProgress(0);
      }
   };

   return { uploadImage, loading, progress, error };
};

// Hook for uploading multiple images
export const useMultipleImageUpload = () => {
   const [loading, setLoading] = useState(false);
   const [progress, setProgress] = useState(0);
   const [error, setError] = useState<string | null>(null);

   const uploadImages = async (files: File[]): Promise<MultipleUploadResponse> => {
      setLoading(true);
      setProgress(0);
      setError(null);

      try {
         const response = await uploadService.uploadImages(files, (progressValue) => {
            setProgress(progressValue);
         });

         if (response.success && response.data) {
            return response.data;
         } else {
            throw new Error(response.error || 'Failed to upload images');
         }
      } catch (err: any) {
         const errorMessage = err.response?.data?.error || err.message || 'Failed to upload images';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
         setProgress(0);
      }
   };

   return { uploadImages, loading, progress, error };
};
