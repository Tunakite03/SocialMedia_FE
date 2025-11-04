import { apiService } from './apiService';
import type { User, LoginFormData, RegisterFormData, ApiResponse } from '@/types';

interface LoginResponse {
   user: User;
   token: string;
}

interface RegisterResponse {
   user: User;
   token: string;
}

class AuthService {
   private readonly endpoint = '/auth';

   async login(credentials: LoginFormData): Promise<ApiResponse<LoginResponse>> {
      return apiService.post<LoginResponse>(`${this.endpoint}/login`, credentials);
   }

   async register(userData: RegisterFormData): Promise<ApiResponse<RegisterResponse>> {
      return apiService.post<RegisterResponse>(`${this.endpoint}/register`, userData);
   }

   async logout(): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/logout`);
   }

   async refreshToken(): Promise<ApiResponse<{ token: string }>> {
      return apiService.post<{ token: string }>(`${this.endpoint}/refresh`);
   }

   async forgotPassword(email: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/forgot-password`, { email });
   }

   async resetPassword(token: string, newPassword: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/reset-password`, {
         token,
         password: newPassword,
      });
   }

   async verifyEmail(token: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/verify-email`, { token });
   }

   async resendVerificationEmail(): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/resend-verification`);
   }

   async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/change-password`, {
         oldPassword,
         newPassword,
      });
   }

   async getProfile(): Promise<ApiResponse<User>> {
      return apiService.get<User>(`${this.endpoint}/profile`);
   }

   async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
      return apiService.patch<User>(`${this.endpoint}/profile`, userData);
   }

   async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
      return apiService.uploadFile<{ avatarUrl: string }>(`${this.endpoint}/avatar`, file);
   }

   async deleteAccount(): Promise<ApiResponse<null>> {
      return apiService.delete<null>(`${this.endpoint}/account`);
   }
}

export const authService = new AuthService();
