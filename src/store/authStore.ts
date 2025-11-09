import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User } from '@/types';

interface AuthStore extends AuthState {
   login: (user: User, accessToken: string, refreshToken: string) => void;
   logout: () => void;
   updateUser: (user: Partial<User>) => void;
   setLoading: (loading: boolean) => void;
   updateTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthStore>()(
   persist(
      (set, get) => ({
         user: null,
         token: null, // accessToken for backward compatibility
         refreshToken: null,
         isAuthenticated: false,
         isLoading: false,

         login: (user: User, accessToken: string, refreshToken: string) => {
            // Ensure user data has all required fields with fallbacks
            const safeUser: User = {
               id: user.id || '',
               email: user.email || '',
               username: user.username || '',
               displayName: user.displayName || user.username || 'User',
               role: user.role || 'USER',
               emailVerified: user.emailVerified || false,
               avatar: user.avatar,
               isOnline: user.isOnline ?? true,
               lastSeen: user.lastSeen,
               createdAt: user.createdAt || new Date().getDate().toString(),
            };

            set({
               user: safeUser,
               token: accessToken,
               refreshToken: refreshToken,
               isAuthenticated: true,
               isLoading: false,
            });
         },

         logout: () => {
            set({
               user: null,
               token: null,
               refreshToken: null,
               isAuthenticated: false,
               isLoading: false,
            });

            // Force clear localStorage to ensure persistence is updated
            try {
               localStorage.removeItem('auth-storage');
            } catch (error) {
               console.error('Error clearing localStorage:', error);
            }
         },

         updateUser: (userData: Partial<User>) => {
            const currentUser = get().user;
            if (currentUser) {
               set({
                  user: { ...currentUser, ...userData },
               });
            }
         },

         setLoading: (loading: boolean) => {
            set({ isLoading: loading });
         },

         updateTokens: (accessToken: string, refreshToken: string) => {
            set({
               token: accessToken,
               refreshToken: refreshToken,
            });
         },
      }),
      {
         name: 'auth-storage',
         partialize: (state) => ({
            user: state.user,
            token: state.token,
            refreshToken: state.refreshToken,
            isAuthenticated: state.isAuthenticated,
         }),
      }
   )
);
