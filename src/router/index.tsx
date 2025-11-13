import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from '@/components/layout/RouteGuards';
import ErrorBoundary from '@/components/error/ErrorBoundary';

// Lazy load pages for better performance
import { lazy } from 'react';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const FeedPage = lazy(() => import('@/pages/feed/FeedPage'));
const SearchPage = lazy(() => import('@/pages/search/SearchPage'));
const CreatePage = lazy(() => import('@/pages/create/CreatePage'));
const ActivityPage = lazy(() => import('@/pages/activity/ActivityPage'));
const ChatPage = lazy(() => import('@/pages/chat/ChatPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const PostDetailPage = lazy(() => import('@/pages/post/PostDetailPage'));
const NotFoundPage = lazy(() => import('@/pages/error/NotFoundPage'));

export const router = createBrowserRouter([
   {
      path: '/',
      element: (
         <Navigate
            to='/feed'
            replace
         />
      ),
   },
   {
      path: '/login',
      element: (
         <PublicRoute>
            <LoginPage />
         </PublicRoute>
      ),
   },
   {
      path: '/register',
      element: (
         <PublicRoute>
            <RegisterPage />
         </PublicRoute>
      ),
   },
   {
      path: '/forgot-password',
      element: (
         <PublicRoute>
            <ForgotPasswordPage />
         </PublicRoute>
      ),
   },
   {
      path: '/reset-password',
      element: (
         <PublicRoute>
            <ResetPasswordPage />
         </PublicRoute>
      ),
   },
   {
      path: '/feed',
      element: (
         <ProtectedRoute>
            <FeedPage />
         </ProtectedRoute>
      ),
   },
   {
      path: '/search',
      element: (
         <ProtectedRoute>
            <SearchPage />
         </ProtectedRoute>
      ),
   },
   {
      path: '/create',
      element: (
         <ProtectedRoute>
            <CreatePage />
         </ProtectedRoute>
      ),
   },
   {
      path: '/activity',
      element: (
         <ProtectedRoute>
            <ErrorBoundary>
               <ActivityPage />
            </ErrorBoundary>
         </ProtectedRoute>
      ),
   },
   {
      path: '/chat',
      element: (
         <ProtectedRoute>
            <ChatPage />
         </ProtectedRoute>
      ),
   },
   {
      path: '/chat/:conversationId',
      element: (
         <ProtectedRoute>
            <ChatPage />
         </ProtectedRoute>
      ),
   },
   {
      path: '/profile',
      element: (
         <ProtectedRoute>
            <ErrorBoundary>
               <ProfilePage />
            </ErrorBoundary>
         </ProtectedRoute>
      ),
   },
   {
      path: '/profile/:id',
      element: (
         <ProtectedRoute>
            <ErrorBoundary>
               <ProfilePage />
            </ErrorBoundary>
         </ProtectedRoute>
      ),
   },
   {
      path: '/post/:postId',
      element: (
         <ProtectedRoute>
            <ErrorBoundary>
               <PostDetailPage />
            </ErrorBoundary>
         </ProtectedRoute>
      ),
   },
   {
      path: '/settings',
      element: (
         <ProtectedRoute>
            <SettingsPage />
         </ProtectedRoute>
      ),
   },
   {
      path: '*',
      element: <NotFoundPage />,
   },
]);
