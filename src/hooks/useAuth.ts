import { useState, useEffect } from 'react';
import { authService } from '@/services';
import { TokenManager } from '@/utils/tokenManager';
import type {
   User,
   UserProfile,
   LoginFormData,
   RegisterFormData,
   ProfileFormData,
   PasswordChangeFormData,
} from '@/types';

// Hook for login
export const useLogin = () => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const login = async (credentials: LoginFormData) => {
      setLoading(true);
      setError(null);
      try {
         const response = await authService.login(credentials);
         if (response.success && response.data) {
            // Store tokens in localStorage
            const authData = {
               state: {
                  user: response.data.user,
                  token: response.data.accessToken,
                  refreshToken: response.data.refreshToken,
                  isAuthenticated: true,
                  isLoading: false,
               },
            };
            localStorage.setItem('auth-storage', JSON.stringify(authData));
            return response.data;
         } else {
            throw new Error(response.error || 'Login failed');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Login failed';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return { login, loading, error };
};

// Hook for registration
export const useRegister = () => {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const register = async (userData: Omit<RegisterFormData, 'confirmPassword'>) => {
      setLoading(true);
      setError(null);
      try {
         const response = await authService.register(userData);
         if (response.success && response.data) {
            // Store tokens in localStorage
            const authData = {
               state: {
                  user: response.data.user,
                  token: response.data.accessToken,
                  refreshToken: response.data.refreshToken,
                  isAuthenticated: true,
                  isLoading: false,
               },
            };
            localStorage.setItem('auth-storage', JSON.stringify(authData));
            return response.data;
         } else {
            throw new Error(response.error || 'Registration failed');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Registration failed';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return { register, loading, error };
};

// Hook for logout
export const useLogout = () => {
   const [loading, setLoading] = useState(false);

   const logout = async () => {
      setLoading(true);
      try {
         await authService.logout();
      } catch (err) {
         console.error('Logout error:', err);
      } finally {
         // Use TokenManager for centralized logout
         TokenManager.logout();
         setLoading(false);
         // React Router will handle redirect via ProtectedRoute
      }
   };

   return { logout, loading };
};

// Hook for getting user profile
export const useProfile = () => {
   const [profile, setProfile] = useState<UserProfile | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const fetchProfile = async () => {
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
   };

   useEffect(() => {
      fetchProfile();
   }, []);

   const updateProfile = async (userData: ProfileFormData) => {
      setLoading(true);
      setError(null);
      try {
         const response = await authService.updateProfile(userData);
         if (response.success && response.data) {
            setProfile((prevProfile) => ({
               ...prevProfile!,
               ...response.data!.user,
            }));
            return response.data.user;
         } else {
            throw new Error(response.error || 'Failed to update profile');
         }
      } catch (err: any) {
         const errorMessage = err.error || err.message || 'Failed to update profile';
         setError(errorMessage);
         throw err;
      } finally {
         setLoading(false);
      }
   };

   return { profile, loading, error, updateProfile, refetch: fetchProfile };
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

// Hook for verifying token
export const useVerifyToken = () => {
   const [isValid, setIsValid] = useState(false);
   const [loading, setLoading] = useState(true);
   const [user, setUser] = useState<User | null>(null);

   const verifyToken = async () => {
      setLoading(true);
      try {
         const response = await authService.verifyToken();
         if (response.success && response.data) {
            setIsValid(true);
            setUser(response.data.user);
         } else {
            setIsValid(false);
            setUser(null);
         }
      } catch (err) {
         setIsValid(false);
         setUser(null);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      const token = TokenManager.getAccessToken();
      if (token) {
         verifyToken();
      } else {
         setLoading(false);
         setIsValid(false);
      }
   }, []);

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
