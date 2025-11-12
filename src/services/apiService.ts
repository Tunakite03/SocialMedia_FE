import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

// Forward declaration to avoid circular dependency
let authService: any;
let TokenManager: any;

// Lazy imports to avoid circular dependencies
const getAuthService = async () => {
   if (!authService) {
      const module = await import('./authService');
      authService = module.authService;
   }
   return authService;
};

const getTokenManager = async () => {
   if (!TokenManager) {
      const module = await import('@/utils/tokenManager');
      TokenManager = module.TokenManager;
   }
   return TokenManager;
};

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
      async (config) => {
         try {
            const tokenManager = await getTokenManager();
            const token = tokenManager.getAccessToken();
            if (token) {
               config.headers.Authorization = `Bearer ${token}`;
            }
         } catch (error) {
            console.error('Error getting auth token:', error);
         }
         return config;
      },
      (error) => {
         return Promise.reject(error);
      }
   );

   // Response interceptor for error handling and token refresh
   api.interceptors.response.use(
      (response) => response,
      async (error) => {
         const originalRequest = error.config;

         if (error.response?.status === 401 && !originalRequest._retry && !originalRequest._skipRetry) {
            originalRequest._retry = true;

            try {
               // Try to refresh the token
               const tokenManager = await getTokenManager();
               const refreshToken = tokenManager.getRefreshToken();

               if (refreshToken) {
                  const authServiceInstance = await getAuthService();
                  const response = await authServiceInstance.refreshToken(refreshToken);

                  if (response.success && response.data) {
                     // Update tokens using TokenManager
                     const { useAuthStore } = await import('@/store');
                     useAuthStore.getState().updateTokens(response.data.accessToken, response.data.refreshToken);

                     // Retry the original request with new token
                     originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
                     return api(originalRequest);
                  }
               }
            } catch (refreshError) {
               console.error('Token refresh failed:', refreshError);
            }

            // If refresh fails or no refresh token, logout using TokenManager
            const tokenManager = await getTokenManager();
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
               tokenManager.logout();
               window.location.href = '/login';
            }
         }

         return Promise.reject(error.response?.data || 'An unexpected error occurred');
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
      formData.append('image', file);

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

   // Multiple files upload method
   async uploadMultipleFiles<T>(
      url: string,
      files: File[],
      onProgress?: (progress: number) => void
   ): Promise<ApiResponse<T>> {
      const formData = new FormData();
      files.forEach((file) => {
         formData.append('images', file);
      });

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
