// Authentication hooks
export * from './useAuth';

// Data initialization hooks (replaces localStorage persistence)
export * from './useDataInitializer';

// User hooks
export * from './useUsers';

// Post hooks with Zustand store (new approach)
export {
   useFeed as useFeedStore,
   usePost as usePostStore,
   usePostReactions as usePostReactionsStore,
   useCreatePost as useCreatePostStore,
} from './usePostStore';

// Comment hooks with Zustand store
export {
   usePostComments as usePostCommentsStore,
   useCreateComment as useCreateCommentStore,
   useCommentRealtime,
} from './useCommentsStore';

// Notification hooks
export * from './useNotifications';
export * from './useNotificationSocket';
export * from './useNewNotifications';
export * from './useSocketNotifications';

// Reaction hooks

// Upload hooks
export * from './useUpload';

// Story hooks
export * from './useStories';

// Video player hooks
export * from './useVideoPlayer';
export * from './useVideoControls';
export * from './useProgressBar';

// Mobile detection hook
export * from './useMobile';

// Collapse hook
export * from './useCollapse';

// Debounce hook
export * from './useDebounce';
