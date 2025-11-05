import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, User } from 'lucide-react';

const BottomNavigation = () => {
   const location = useLocation();

   const navItems = [
      {
         icon: Home,
         label: 'Home',
         path: '/feed',
         activeKey: '/feed',
      },
      {
         icon: Search,
         label: 'Search',
         path: '/search',
         activeKey: '/search',
      },
      {
         icon: PlusSquare,
         label: 'Create',
         path: '/create',
         activeKey: '/create',
      },
      {
         icon: User,
         label: 'Profile',
         path: '/profile',
         activeKey: '/profile',
      },
   ];

   return (
      <nav className='fixed w-full bottom-0 left-0 right-0 bg-background border-t border-border z-50 lg:hidden'>
         <div className='flex justify-around items-center py-2 md:py-3'>
            {navItems.map((item) => {
               const IconComponent = item.icon;
               const isActive = location.pathname === item.activeKey;

               return (
                  <Link
                     key={item.path}
                     to={item.path}
                     className={`flex flex-col items-center justify-center p-2 md:p-3 min-w-[60px] md:min-w-20 hover:bg-gray-100 rounded-lg transition-colors ${
                        isActive ? 'bg-gray-200' : ''
                     } transition-colors md:mb-1`}
                  >
                     <IconComponent
                        size={24}
                        className={`${
                           isActive ? 'text-foreground ' : 'text-muted-foreground'
                        } transition-colors md:mb-1`}
                     />
                     <span
                        className={`text-xs md:text-sm ${
                           isActive ? 'text-foreground font-medium ' : 'text-muted-foreground'
                        } hidden md:block transition-colors`}
                     >
                        {item.label}
                     </span>
                     <span className='sr-only md:hidden'>{item.label}</span>
                  </Link>
               );
            })}
         </div>
      </nav>
   );
};

export default BottomNavigation;
