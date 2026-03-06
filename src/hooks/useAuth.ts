import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services';
import { useAuthStore } from '@/store';
import { TokenManager } from '@/utils/tokenManager';
import type { UserProfile, LoginFormData, RegisterFormData, ProfileFormData, PasswordChangeFormData } from '@/types';

// Main authentication hook - integrates with authStore
export const useAuth = () => {
   const authStore = useAuthStore();

   const login = useCallback(
      async (credentials: LoginFormData) => {
         authStore.setLoading(true);
         try {
            const response = await authService.login(credentials);
            if (response.success && response.data) {
               authStore.login(response.data.user, response.data.accessToken, response.data.refreshToken);
               return response.data;
            } else {
               throw new Error(response.error || 'Login failed');
            }
         } catch (err: any) {
            authStore.setLoading(false);
            const errorMessage = err.error || err.message || 'Login failed';
            throw new Error(errorMessage);
         }
      },
      [authStore],
   );

   const register = useCallback(
      async (userData: Omit<RegisterFormData, 'confirmPassword'>) => {
         authStore.setLoading(true);
         try {
            const response = await authService.register(userData);
            if (response.success && response.data) {
               authStore.login(response.data.user, response.data.accessToken, response.data.refreshToken);
               return response.data;
            } else {
               throw new Error(response.error || 'Registration failed');
            }
         } catch (err: any) {
            authStore.setLoading(false);
            const errorMessage = err.error || err.message || 'Registration failed';
            throw new Error(errorMessage);
         }
      },
      [authStore],
   );

   const logout = useCallback(async () => {
      authStore.setLoading(true);
      try {
         await authService.logout();
      } catch (err) {
         console.error('Logout error:', err);
      } finally {
         authStore.logout();
         TokenManager.logout();
      }
   }, [authStore]);

   const updateProfile = useCallback(
      async (userData: ProfileFormData) => {
         try {
            const response = await authService.updateProfile(userData);
            if (response.success && response.data) {
               authStore.updateUser(response.data.user);
               return response.data.user;
            } else {
               throw new Error(response.error || 'Failed to update profile');
            }
         } catch (err: any) {
            const errorMessage = err.error || err.message || 'Failed to update profile';
            throw new Error(errorMessage);
         }
      },
      [authStore],
   );

   const updateAvatar = useCallback(
      async (file: File) => {
         try {
            const response = await authService.updateUserAvatar(file);
            if (response.success && response.data) {
               authStore.updateUser(response.data.user);
               return response.data.user;
            } else {
               throw new Error(response.error || 'Failed to update avatar');
            }
         } catch (err: any) {
            const errorMessage = err.error || err.message || 'Failed to update avatar';
            throw new Error(errorMessage);
         }
      },
      [authStore],
   );

   const verifyToken = useCallback(async () => {
      try {
         const response = await authService.verifyToken();
         if (response.success && response.data) {
            authStore.updateUser(response.data.user);
            return response.data.user;
         } else {
            authStore.logout();
            return null;
         }
      } catch (err) {
         authStore.logout();
         return null;
      }
   }, [authStore]);

   const refreshTokens = useCallback(async () => {
      const refreshToken = authStore.refreshToken;
      if (!refreshToken) {
         authStore.logout();
         return false;
      }

      try {
         const response = await authService.refreshToken(refreshToken);
         if (response.success && response.data) {
            authStore.updateTokens(response.data.accessToken, response.data.refreshToken);
            return true;
         } else {
            authStore.logout();
            return false;
         }
      } catch (err) {
         authStore.logout();
         return false;
      }
   }, [authStore]);

   return {
      // State from store
      user: authStore.user,
      token: authStore.token,
      refreshToken: authStore.refreshToken,
      isAuthenticated: authStore.isAuthenticated,
      isLoading: authStore.isLoading,
      error: authStore.error,
      profileLoading: authStore.profileLoading,

      // Actions
      login,
      register,
      logout,
      updateProfile,
      updateAvatar,
      verifyToken,
      refreshTokens,
      updateUser: authStore.updateUser,
      setLoading: authStore.setLoading,
      setError: authStore.setError,
      clearError: authStore.clearError,
      setProfileLoading: authStore.setProfileLoading,
      updateActivity: authStore.updateActivity,
      isSessionValid: authStore.isSessionValid,
   };
};

// Hook for login (backward compatibility)
export const useLogin = () => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const { login: authLogin } = useAuth();

   const login = async (credentials: LoginFormData) => {
      setLoading(true);
      setError(null);
      try {
         const result = await authLogin(credentials);
         return result;
      } catch (err: any) {
         const errorMessage = err.message || 'Login failed';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return { login, loading, error };
};

// Hook for Google OAuth login
export const useGoogleLogin = () => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const authStore = useAuthStore();

   const googleLogin = async (accessToken: string) => {
      setLoading(true);
      setError(null);
      try {
         const response = await authService.googleLogin(accessToken);
         if (response.success && response.data) {
            authStore.login(response.data.user, response.data.accessToken, response.data.refreshToken);
            return response.data;
         }
         throw new Error(response.error || 'Google login failed');
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Google login failed';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return { googleLogin, loading, error };
};

// Hook for registration (backward compatibility)
export const useRegister = () => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const { register: authRegister } = useAuth();

   const register = async (userData: Omit<RegisterFormData, 'confirmPassword'>) => {
      setLoading(true);
      setError(null);
      try {
         const result = await authRegister(userData);
         return result;
      } catch (err: any) {
         const errorMessage = err.message || 'Registration failed';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return { register, loading, error };
};

// Hook for logout (backward compatibility)
export const useLogout = () => {
   const [loading, setLoading] = useState(false);
   const { logout: authLogout } = useAuth();

   const logout = async () => {
      setLoading(true);
      try {
         await authLogout();
      } catch (err) {
         console.error('Logout error:', err);
      } finally {
         setLoading(false);
      }
   };

   return { logout, loading };
};

// Hook for getting and updating user profile
export const useProfile = () => {
   const [profile, setProfile] = useState<UserProfile | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const { updateProfile: authUpdateProfile, updateAvatar: authUpdateAvatar, user } = useAuth();

   const fetchProfile = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
         const response = await authService.getProfile();
         if (response.success && response.data) {
            setProfile(response.data.user);
         } else {
            throw new Error(response.error || 'Failed to fetch profile');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to fetch profile';
         setError(errorMessage);
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchProfile();
   }, [fetchProfile]);

   // Keep profile in sync with store user
   useEffect(() => {
      if (user) {
         setProfile(user as UserProfile);
      }
   }, [user]);

   const updateProfile = async (userData: ProfileFormData) => {
      setLoading(true);
      setError(null);
      try {
         const updatedUser = await authUpdateProfile(userData);
         setProfile(updatedUser as UserProfile);
         return updatedUser;
      } catch (err: any) {
         const errorMessage = err.message || 'Failed to update profile';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   const updateAvatar = async (file: File) => {
      setLoading(true);
      setError(null);
      try {
         const updatedUser = await authUpdateAvatar(file);
         setProfile(updatedUser as UserProfile);
         return updatedUser;
      } catch (err: any) {
         const errorMessage = err.message || 'Failed to update avatar';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return {
      profile,
      loading,
      error,
      updateProfile,
      updateAvatar,
      refetch: fetchProfile,
   };
};

// Hook for changing password
export const useChangePassword = () => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const changePassword = async (passwordData: PasswordChangeFormData) => {
      setLoading(true);
      setError(null);
      try {
         const response = await authService.changePassword(passwordData);
         if (response.success) {
            return true;
         } else {
            throw new Error(response.error || 'Failed to change password');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to change password';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return { changePassword, loading, error };
};

// Hook for token verification
export const useVerifyToken = () => {
   const [isValid, setIsValid] = useState(false);
   const [loading, setLoading] = useState(true);
   const { verifyToken: authVerifyToken, user, isAuthenticated } = useAuth();

   const verifyToken = useCallback(async () => {
      setLoading(true);
      try {
         const verifiedUser = await authVerifyToken();
         if (verifiedUser) {
            setIsValid(true);
         } else {
            setIsValid(false);
         }
      } catch (err) {
         setIsValid(false);
      } finally {
         setLoading(false);
      }
   }, [authVerifyToken]);

   useEffect(() => {
      const token = TokenManager.getAccessToken();
      if (token && isAuthenticated) {
         verifyToken();
      } else {
         setLoading(false);
         setIsValid(false);
      }
   }, [verifyToken, isAuthenticated]);

   // Keep isValid in sync with auth state
   useEffect(() => {
      setIsValid(isAuthenticated && !!user);
   }, [isAuthenticated, user]);

   return { isValid, loading, user, verifyToken };
};

// Hook for forgot password
export const useForgotPassword = () => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [isSuccess, setIsSuccess] = useState(false);

   const forgotPassword = async (email: string) => {
      setLoading(true);
      setError(null);
      setIsSuccess(false);
      try {
         const response = await authService.forgotPassword(email);
         if (response.success) {
            setIsSuccess(true);
         } else {
            throw new Error(response.error || 'Failed to send reset email');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to send reset email';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return { forgotPassword, loading, error, isSuccess };
};

// Hook for automatic session management
export const useAuthSession = () => {
   const {
      isAuthenticated,
      token,
      refreshToken,
      isSessionValid,
      updateActivity,
      refreshTokens,
      logout: authLogout,
   } = useAuth();

   // Auto refresh token when needed
   useEffect(() => {
      if (!isAuthenticated || !token || !refreshToken) return;

      const checkAndRefreshToken = async () => {
         try {
            // Check if token needs refresh (e.g., expires in < 5 minutes)
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const expiresIn = tokenPayload.exp * 1000 - Date.now();
            const shouldRefresh = expiresIn < 5 * 60 * 1000; // 5 minutes

            if (shouldRefresh) {
               const success = await refreshTokens();
               if (!success) {
                  console.warn('Failed to refresh token, logging out');
                  authLogout();
               }
            }
         } catch (error) {
            console.error('Token refresh check failed:', error);
         }
      };

      // Check immediately and then every 5 minutes
      checkAndRefreshToken();
      const interval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);

      return () => clearInterval(interval);
   }, [isAuthenticated, token, refreshToken, refreshTokens, authLogout]);

   // Track user activity
   useEffect(() => {
      if (!isAuthenticated) return;

      const handleActivity = () => {
         updateActivity();
      };

      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach((event) => {
         document.addEventListener(event, handleActivity, true);
      });

      return () => {
         events.forEach((event) => {
            document.removeEventListener(event, handleActivity, true);
         });
      };
   }, [isAuthenticated, updateActivity]);

   // Session timeout check
   useEffect(() => {
      if (!isAuthenticated) return;

      const checkSession = () => {
         if (!isSessionValid()) {
            console.warn('Session expired, logging out');
            authLogout();
         }
      };

      // Check every minute
      const interval = setInterval(checkSession, 60 * 1000);
      return () => clearInterval(interval);
   }, [isAuthenticated, isSessionValid, authLogout]);

   return {
      isAuthenticated,
      sessionValid: isSessionValid(),
   };
};

// Hook for reset password
export const useResetPassword = () => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const resetPassword = async (token: string, newPassword: string) => {
      setLoading(true);
      setError(null);
      try {
         const response = await authService.resetPassword(token, newPassword);
         if (response.success) {
            return true;
         } else {
            throw new Error(response.error || 'Failed to reset password');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to reset password';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return { resetPassword, loading, error };
};
