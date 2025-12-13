import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { useDataInitializer } from '@/hooks/useDataInitializer';
import ThemeInitializer from '@/components/theme/ThemeInitializer';
import NotificationPopupManager from '@/components/features/NotificationPopupManager';
import FloatingAssistantButton from '@/components/features/ai/FloatingAssistantButton';
import './App.css';

function App() {
   // Initialize fresh data on app start (replaces localStorage persistence)
   useDataInitializer();
   return (
      <>
         <ThemeInitializer />
         <NotificationPopupManager />
         <FloatingAssistantButton />

         <Suspense
            fallback={
               <div className='min-h-screen flex items-center justify-center bg-background'>
                  <div className='text-center'>
                     <img
                        src='/logov2_128.png'
                        alt='Logo'
                        className='w-20 h-20 object-contain mb-4 mx-auto'
                     />
                     <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
                  </div>
               </div>
            }
         >
            <RouterProvider router={router} />
         </Suspense>
      </>
   );
}

export default App;
