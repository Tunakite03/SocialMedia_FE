import { Link } from 'react-router-dom';
import { MessageCircle, Bell, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

const TopNavigation = () => {
   const [isScrolled, setIsScrolled] = useState(false);
   useEffect(() => {
      // Scroll down to resize navigation, scroll top to expand
      const handleScroll = () => {
         if (window.scrollY > 50) {
            setIsScrolled(true);
         } else {
            setIsScrolled(false);
         }
      };

      window.addEventListener('scroll', handleScroll);

      return () => {
         window.removeEventListener('scroll', handleScroll);
      };
   }, []);

   return (
      <header
         className={`fixed top-0 left-0 right-0  border-b border-border/50 z-40 transition-all duration-500 ease-in-out ${
            isScrolled ? 'nav-scrolled' : 'bg-background/80 backdrop-blur-md'
         }`}
      >
         <div className='flex items-center justify-between px-4 py-3 max-w-md mx-auto md:max-w-2xl lg:max-w-4xl nav-content'>
            {/* Logo */}
            <Link
               to='/feed'
               className='anime-hover-scale logo-container'
            >
               <img
                  src='/logov2_128.png'
                  alt='Otakomi Logo'
                  className='h-8 w-auto md:h-10 transition-all duration-300 ease-in-out logo-img'
               />
            </Link>

            {/* Center search for tablet */}
            <div className='hidden md:block lg:hidden flex-1 max-w-xs mx-4 nav-search'>
               <Link
                  to='/search'
                  className={`flex items-center bg-muted rounded-lg px-3 py-2 transition-all duration-300 hover:bg-muted/80`}
               >
                  <Search
                     size={20}
                     className='text-muted-foreground mr-2 transition-all duration-300'
                  />
                  <span className='text-muted-foreground text-sm'>Search...</span>
               </Link>
            </div>

            {/* Right icons with anime effects */}
            <div className='flex items-center space-x-2 md:space-x-4 nav-actions'>
               <Link
                  to='/chat'
                  className='p-2 anime-hover-lift hover:bg-muted rounded-lg transition-all duration-300 nav-icon'
               >
                  <MessageCircle
                     size={24}
                     className={`text-foreground transition-all duration-300`}
                  />
               </Link>
               <Link
                  to='/activity'
                  className='p-2 anime-hover-lift hover:bg-muted rounded-lg transition-all duration-300 nav-icon'
               >
                  <Bell
                     size={24}
                     className={`text-foreground transition-all duration-300`}
                  />
               </Link>
            </div>
         </div>
      </header>
   );
};

export default TopNavigation;
