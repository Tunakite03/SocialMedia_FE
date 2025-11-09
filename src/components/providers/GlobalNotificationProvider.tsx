import { useNotificationSocket } from '@/hooks';

interface GlobalNotificationProviderProps {
   children: React.ReactNode;
}

/**
 * Global notification provider that initializes Socket.IO connection
 * and handles real-time notifications across the entire app.
 *
 * Add this to your App.tsx or main layout component.
 */
export const GlobalNotificationProvider: React.FC<GlobalNotificationProviderProps> = ({ children }) => {
   // Initialize notification socket connection
   useNotificationSocket();

   return <>{children}</>;
};
