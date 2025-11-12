import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User } from '@/types';

interface AuthStore extends AuthState {
   // Auth actions
   login: (user: User, accessToken: string, refreshToken: string) => void;
   logout: () => void;
   updateUser: (user: Partial<User>) => void;
   setLoading: (loading: boolean) => void;
   updateTokens: (accessToken: string, refreshToken: string) => void;

   // Error handling
   error: string | null;
   setError: (error: string | null) => void;
   clearError: () => void;

   // Profile management
   profileLoading: boolean;
   setProfileLoading: (loading: boolean) => void;

   // Session management
   lastActivity: number;
   updateActivity: () => void;
   isSessionValid: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
   persist(
      (set, get) => ({
         // Base auth state
         user: null,
         token: null, // accessToken for backward compatibility
         refreshToken: null,
         isAuthenticated: false,
         isLoading: false,

         // Extended state
         error: null,
         profileLoading: false,
         lastActivity: Date.now(),

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
               error: null,
               lastActivity: Date.now(),
            });
         },

         logout: () => {
            set({
               user: null,
               token: null,
               refreshToken: null,
               isAuthenticated: false,
               isLoading: false,
               error: null,
               profileLoading: false,
               lastActivity: 0,
            });

            // Clear other stores when logging out
            try {
               // Import stores dynamically to avoid circular dependency
               import('./notificationStore').then(({ useNotificationStore }) => {
                  useNotificationStore.getState().clearNotifications();
               });

               import('./commentStore').then(({ useCommentStore }) => {
                  useCommentStore.getState().clearAllComments();
               });

               // Force clear localStorage to ensure persistence is updated
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
                  lastActivity: Date.now(),
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
               lastActivity: Date.now(),
            });
         },

         setError: (error: string | null) => {
            set({ error });
         },

         clearError: () => {
            set({ error: null });
         },

         setProfileLoading: (loading: boolean) => {
            set({ profileLoading: loading });
         },

         updateActivity: () => {
            set({ lastActivity: Date.now() });
         },

         isSessionValid: () => {
            const state = get();
            const now = Date.now();
            const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

            return Boolean(state.isAuthenticated && state.token && now - state.lastActivity < sessionTimeout);
         },
      }),
      {
         name: 'auth-storage',
         partialize: (state) => ({
            user: state.user,
            token: state.token,
            refreshToken: state.refreshToken,
            isAuthenticated: state.isAuthenticated,
            lastActivity: state.lastActivity,
         }),
      }
   )
);
