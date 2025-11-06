import { apiService } from './apiService';
import type { UploadResponse, MultipleUploadResponse, ApiResponse } from '@/types';

class UploadService {
   private readonly endpoint = '/upload';

   async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<UploadResponse>> {
      const formData = new FormData();
      formData.append('image', file);

      return apiService.post<UploadResponse>(`${this.endpoint}/image`, formData, {
         headers: {
            'Content-Type': 'multipart/form-data',
         },
         onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
               const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
               onProgress(progress);
            }
         },
      });
   }

   async uploadImages(
      files: File[],
      onProgress?: (progress: number) => void
   ): Promise<ApiResponse<MultipleUploadResponse>> {
      const formData = new FormData();
      files.forEach((file) => {
         formData.append('images', file);
      });

      return apiService.post<MultipleUploadResponse>(`${this.endpoint}/images`, formData, {
         headers: {
            'Content-Type': 'multipart/form-data',
         },
         onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
               const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
               onProgress(progress);
            }
         },
      });
   }
}

export const uploadService = new UploadService();
