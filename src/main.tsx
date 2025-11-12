import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { SocketNotificationProvider } from '@/contexts/SocketNotificationProvider.tsx';

createRoot(document.getElementById('root')!).render(
   <StrictMode>
      <SocketNotificationProvider>
         <App />
      </SocketNotificationProvider>
   </StrictMode>
);
