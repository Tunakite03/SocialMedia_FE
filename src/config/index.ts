import { Bell, Home, MessageCircle, PlusSquare, Search, User } from 'lucide-react';

// Navigation items configuration
export const navItems = [
   {
      icon: Home,
      label: 'Home',
      path: '/feed',
      activeKey: '/feed',
   },
   {
      icon: Search,
      label: 'Search',
      path: '/search',
      activeKey: '/search',
   },
   {
      icon: PlusSquare,
      label: 'Posts',
      path: '/create',
      activeKey: '/create',
   },
   {
      icon: Bell,
      label: 'Notifications',
      path: '/activity',
      activeKey: '/activity',
   },
   {
      icon: MessageCircle,
      label: 'Messages',
      path: '/chat',
      activeKey: '/chat',
   },
   {
      icon: User,
      label: 'Profile',
      path: '/profile',
      activeKey: '/profile',
   },
];

// Application constants
export const APP_NAME = 'Otakomi';
export const ITEMS_PER_PAGE = 12;
export const MAX_POST_LENGTH = 2000;
export const MAX_USERNAME_LENGTH = 30;
export const MAX_BIO_LENGTH = 160;
export const MAX_COMMENT_LENGTH = 500;
export const SOCKET_IO_PATH = '/socket.io';
export const SOCKET_IO_TIMEOUT = 20000; // 20 seconds
export const TYPING_INDICATOR_TIMEOUT = 3000; // 3 seconds
export const CALL_TIMEOUT = 60000; // 60 seconds
export const MEDIA_UPLOAD_LIMIT_MB = 50; // 50 MB
export const MEDIA_PREVIEW_MAX_WIDTH = 800; // 800 pixels
export const MEDIA_PREVIEW_MAX_HEIGHT = 800; // 800 pixels
export const SUPPORTED_MEDIA_TYPES = [
   'image/jpeg',
   'image/png',
   'image/gif',
   'image/webp',
   'video/mp4',
   'video/webm',
   'audio/mpeg',
   'audio/wav',
   'application/pdf',
   'application/msword',
   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
   'text/plain',
];
export const MEDIA_THUMBNAIL_WIDTH = 400; // 400 pixels
export const MEDIA_THUMBNAIL_HEIGHT = 400; // 400 pixels
export const NOTIFICATION_POLLING_INTERVAL = 60000; // 60 seconds
export const FEED_REFRESH_INTERVAL = 120000; // 2 minutes
export const CHAT_MESSAGE_FETCH_LIMIT = 50;
export const MAX_CONCURRENT_FILE_UPLOADS = 3;
export const CALL_RETRY_INTERVAL = 5000; // 5 seconds
export const MAX_CALL_RETRIES = 5;
export const PRESENCE_UPDATE_INTERVAL = 30000; // 30 seconds
export const TYPING_THROTTLE_INTERVAL = 2000; // 2 seconds
export const DEBOUNCE_DELAY = 300; // 300 milliseconds
export const AUTO_SAVE_DRAFT_INTERVAL = 15000; // 15 seconds
export const MAX_DRAFTS = 5;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const SESSION_TIMEOUT = 3600000; // 1 hour
export const EMOTION_ANALYSIS_INTERVAL = 10000; // 10 seconds
export const EMOTION_CONFIDENCE_THRESHOLD = 0.6; // 60%
export const CALL_RECORDING_CHUNK_DURATION = 60000; // 1 minute
export const CALL_RECORDINGS_RETENTION_DAYS = 30; // 30 days
export const ANALYTICS_EVENT_BATCH_SIZE = 20;
export const ANALYTICS_EVENT_FLUSH_INTERVAL = 30000; // 30 seconds
