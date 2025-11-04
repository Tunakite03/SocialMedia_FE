import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
   return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
         <div className='text-center space-y-6'>
            <div className='space-y-2'>
               <h1 className='text-6xl font-bold text-foreground'>404</h1>
               <h2 className='text-2xl font-semibold text-foreground'>Page Not Found</h2>
               <p className='text-muted-foreground max-w-md mx-auto'>
                  The page you're looking for doesn't exist or has been moved.
               </p>
            </div>

            <Link to='/'>
               <Button className='inline-flex items-center space-x-2'>
                  <Home className='h-4 w-4' />
                  <span>Go Home</span>
               </Button>
            </Link>
         </div>
      </div>
   );
};

export default NotFoundPage;
