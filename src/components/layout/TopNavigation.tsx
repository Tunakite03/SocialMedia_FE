import { Link } from 'react-router-dom';
import { MessageCircle, Bell } from 'lucide-react';

const TopNavigation = () => {
   return (
      <header className='fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40'>
         <div className='flex items-center justify-between px-4 py-3 max-w-md mx-auto md:max-w-2xl lg:max-w-4xl'>
            {/* Logo */}
            <Link
               to='/feed'
               className='anime-hover-scale'
            >
               <img
                  src='/logov2_128.png'
                  alt='Otakomi Logo'
                  className='h-8 w-auto'
               />
            </Link>

            {/* Right icons with anime effects */}
            <div className='flex items-center space-x-4'>
               <Link
                  to='/chat'
                  className='p-2 anime-hover-lift relative'
               >
                  <MessageCircle
                     size={24}
                     className='text-black'
                  />
                  <span className='absolute -top-1 -right-1 text-xs anime-pulse'>💬</span>
               </Link>
               <Link
                  to='/activity'
                  className='p-2 anime-hover-lift relative'
               >
                  <Bell
                     size={24}
                     className='text-black'
                  />
                  <span className='absolute -top-1 -right-1 text-xs anime-pulse'>🔔</span>
               </Link>
            </div>
         </div>
      </header>
   );
};

export default TopNavigation;
