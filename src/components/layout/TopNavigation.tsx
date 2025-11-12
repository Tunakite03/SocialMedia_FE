import { Link } from 'react-router-dom';
import { MessageCircle, Bell, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import NotificationBadge from '@/components/ui/notification-badge';
import { useNotifications } from '@/hooks';

const TopNavigation = () => {
   const [isScrolled, setIsScrolled] = useState(false);
   // const unreadMessageCount = useUnreadMessageCount();
   const { unreadCount } = useNotifications();
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

            {/* Right icons with anime effects */}
            <div className='flex items-center space-x-2 md:space-x-4 nav-actions'>
               <Link
                  to='/chat'
                  className='p-2 anime-hover-lift hover:bg-muted rounded-lg transition-all duration-300 nav-icon relative'
               >
                  <MessageCircle
                     size={24}
                     className={`text-foreground transition-all duration-300`}
                  />
                  {/* {unreadMessageCount > 0 && (
                     <NotificationBadge
                        count={unreadMessageCount}
                        color='purple'
                        size='sm'
                     />
                  )} */}
               </Link>
               <Link
                  to='/activity'
                  className='p-2 anime-hover-lift hover:bg-muted rounded-lg transition-all duration-300 nav-icon relative'
               >
                  <Bell
                     size={24}
                     className={`text-foreground transition-all duration-300`}
                  />
                  {unreadCount > 0 && (
                     <NotificationBadge
                        count={unreadCount}
                        color='red'
                        size='sm'
                     />
                  )}
               </Link>
            </div>
         </div>
      </header>
   );
};

export default TopNavigation;
