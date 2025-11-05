import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Bell, Search } from 'lucide-react';

const TopNavigation = () => {
   const location = useLocation();

   return (
      <header className='fixed top-0 left-0 right-0 bg-background border-b border-border z-40'>
         <div className='flex items-center justify-between px-4 py-3 max-w-md mx-auto md:max-w-2xl lg:max-w-4xl'>
            {/* Logo */}
            <Link
               to='/feed'
               className='anime-hover-scale'
            >
               <img
                  src='/logov2_128.png'
                  alt='Otakomi Logo'
                  className='h-8 w-auto md:h-10'
               />
            </Link>

            {/* Center search for tablet */}
            <div className='hidden md:block lg:hidden flex-1 max-w-xs mx-4'>
               <Link
                  to='/search'
                  className={`flex items-center bg-muted rounded-lg px-3 py-2 transition-colors hover:bg-muted/80 ${
                     location.pathname === '/search' ? 'bg-muted/80' : ''
                  }`}
               >
                  <Search
                     size={20}
                     className='text-muted-foreground mr-2'
                  />
                  <span className='text-muted-foreground text-sm'>Search...</span>
               </Link>
            </div>

            {/* Right icons with anime effects */}
            <div className='flex items-center space-x-2 md:space-x-4'>
               <Link
                  to='/chat'
                  className='p-2 anime-hover-lift  hover:bg-muted rounded-lg transition-colors'
               >
                  <MessageCircle
                     size={24}
                     className={`text-foreground ${location.pathname.startsWith('/chat') ? 'text-primary' : ''}`}
                  />
               </Link>
               <Link
                  to='/activity'
                  className='p-2 anime-hover-lift  hover:bg-muted rounded-lg transition-colors'
               >
                  <Bell
                     size={24}
                     className={`text-foreground ${location.pathname === '/activity' ? 'text-primary' : ''}`}
                  />
               </Link>
            </div>
         </div>
      </header>
   );
};

export default TopNavigation;
