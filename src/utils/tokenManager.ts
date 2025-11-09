// Token management utilities for refresh token functionality

import { useAuthStore } from '@/store';
import { authService } from '@/services';

export class TokenManager {
   /**
    * Get the current access token from the store
    */
   static getAccessToken(): string | null {
      return useAuthStore.getState().token;
   }

   /**
    * Get the current refresh token from the store
    */
   static getRefreshToken(): string | null {
      return useAuthStore.getState().refreshToken;
   }

   /**
    * Check if the user is authenticated (has valid tokens)
    */
   static isAuthenticated(): boolean {
      const { isAuthenticated, token, refreshToken } = useAuthStore.getState();
      return isAuthenticated && !!(token || refreshToken);
   }

   /**
    * Manually refresh tokens (useful for testing or explicit refresh)
    */
   static async refreshTokens(): Promise<boolean> {
      try {
         const refreshToken = this.getRefreshToken();
         if (!refreshToken) {
            console.error('No refresh token available');
            return false;
         }

         const response = await authService.refreshToken(refreshToken);
         if (response.success && response.data) {
            useAuthStore.getState().updateTokens(response.data.accessToken, response.data.refreshToken);
            return true;
         }
      } catch (error) {
         console.error('Failed to refresh tokens:', error);
         // If refresh fails, logout the user
         useAuthStore.getState().logout();
      }

      return false;
   }

   /**
    * Clear all tokens and logout
    */
   static logout(): void {
      useAuthStore.getState().logout();
      // Let React Router handle the redirect via ProtectedRoute
      // No manual redirect needed as ProtectedRoute will detect auth change
   }
}
