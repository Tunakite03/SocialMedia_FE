import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { SocketNotificationProvider } from '@/components/providers/SocketNotificationProvider';
import { GlobalNotificationProvider } from '@/components/providers/GlobalNotificationProvider';

createRoot(document.getElementById('root')!).render(
   <StrictMode>
      <SocketNotificationProvider>
         <GlobalNotificationProvider>
            <App />
         </GlobalNotificationProvider>
      </SocketNotificationProvider>
   </StrictMode>
);
