import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User } from '@/types';

interface AuthStore extends AuthState {
   login: (user: User, token: string) => void;
   logout: () => void;
   updateUser: (user: Partial<User>) => void;
   setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
   persist(
      (set, get) => ({
         user: null,
         token: null,
         isAuthenticated: false,
         isLoading: false,

         login: (user: User, token: string) => {
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
               token,
               isAuthenticated: true,
               isLoading: false,
            });
         },

         logout: () => {
            set({
               user: null,
               token: null,
               isAuthenticated: false,
               isLoading: false,
            });
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
      }),
      {
         name: 'auth-storage',
         partialize: (state) => ({
            user: state.user,
            token: state.token,
            isAuthenticated: state.isAuthenticated,
         }),
      }
   )
);
