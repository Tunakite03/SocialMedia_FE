import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

// Create axios instance with default configuration
const createApiClient = (): AxiosInstance => {
   const api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
      headers: {
         'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
   });

   // Request interceptor to add auth token
   api.interceptors.request.use(
      (config) => {
         const token = localStorage.getItem('auth-storage');
         if (token) {
            try {
               const authData = JSON.parse(token);
               if (authData.state?.token) {
                  config.headers.Authorization = `Bearer ${authData.state.token}`;
               }
            } catch (error) {
               console.error('Error parsing auth token:', error);
            }
         }
         return config;
      },
      (error) => {
         return Promise.reject(error);
      }
   );

   // Response interceptor for error handling
   api.interceptors.response.use(
      (response) => response,
      (error) => {
         if (
            error.response?.status === 401 &&
            window.location.pathname !== '/login' &&
            window.location.pathname !== '/register'
         ) {
            // Token expired or invalid, redirect to login
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
         }
         return Promise.reject(error);
      }
   );

   return api;
};

class ApiService {
   private api: AxiosInstance;

   constructor() {
      this.api = createApiClient();
   }

   // Generic methods
   async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
      const response = await this.api.get(url, config);
      return response.data;
   }

   async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
      const response = await this.api.post(url, data, config);
      return response.data;
   }

   async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
      const response = await this.api.put(url, data, config);
      return response.data;
   }

   async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
      const response = await this.api.patch(url, data, config);
      return response.data;
   }

   async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
      const response = await this.api.delete(url, config);
      return response.data;
   }

   // File upload method
   async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.api.post(url, formData, {
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

      return response.data;
   }

   // Update base URL (useful for switching environments)
   updateBaseURL(baseURL: string) {
      this.api.defaults.baseURL = baseURL;
   }

   // Get the underlying axios instance for advanced usage
   getInstance(): AxiosInstance {
      return this.api;
   }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export the class for testing purposes
export { ApiService };
