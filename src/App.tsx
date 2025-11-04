import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import './App.css';

function App() {
   return (
      <>
         <Suspense
            fallback={
               <div className='min-h-screen flex items-center justify-center bg-background'>
                  <div className='text-center'>
                     <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
                     <p className='text-muted-foreground'>Loading...</p>
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
