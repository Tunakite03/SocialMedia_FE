import { apiService } from './apiService';
import type {
   User,
   UserProfile,
   LoginFormData,
   RegisterFormData,
   ProfileFormData,
   PasswordChangeFormData,
   ApiResponse,
} from '@/types';

interface LoginResponse {
   user: User;
   token: string;
}

interface RegisterResponse {
   user: User;
   token: string;
}

// API payload type without confirmPassword
type RegisterApiData = Omit<RegisterFormData, 'confirmPassword'>;

class AuthService {
   private readonly endpoint = '/auth';

   async login(credentials: LoginFormData): Promise<ApiResponse<LoginResponse>> {
      return apiService.post<LoginResponse>(`${this.endpoint}/login`, credentials);
   }

   async register(userData: RegisterApiData): Promise<ApiResponse<RegisterResponse>> {
      return apiService.post<RegisterResponse>(`${this.endpoint}/register`, userData);
   }

   async logout(): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/logout`);
   }

   async getProfile(): Promise<ApiResponse<{ user: UserProfile }>> {
      return apiService.get<{ user: UserProfile }>(`${this.endpoint}/profile`);
   }

   async updateProfile(userData: ProfileFormData): Promise<ApiResponse<{ user: User }>> {
      return apiService.put<{ user: User }>(`${this.endpoint}/profile`, userData);
   }

   async changePassword(passwordData: PasswordChangeFormData): Promise<ApiResponse<null>> {
      return apiService.put<null>(`${this.endpoint}/password`, passwordData);
   }

   async verifyToken(): Promise<ApiResponse<{ user: User }>> {
      return apiService.get<{ user: User }>(`${this.endpoint}/verify`);
   }

   async forgotPassword(email: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/forgot-password`, { email });
   }

   async resetPassword(token: string, newPassword: string): Promise<ApiResponse<null>> {
      return apiService.post<null>(`${this.endpoint}/reset-password`, { token, newPassword });
   }
}

export const authService = new AuthService();
