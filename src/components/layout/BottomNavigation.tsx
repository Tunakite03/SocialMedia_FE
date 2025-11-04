import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, Bell, User } from 'lucide-react';

const BottomNavigation = () => {
   const location = useLocation();

   const navItems = [
      {
         icon: Home,
         label: 'Home',
         path: '/feed',
         activeKey: '/feed',
         emoji: '🏠',
      },
      {
         icon: Search,
         label: 'Search',
         path: '/search',
         activeKey: '/search',
         emoji: '🔍',
      },
      {
         icon: PlusSquare,
         label: 'Create',
         path: '/create',
         activeKey: '/create',
         emoji: '✨',
      },
      {
         icon: Bell,
         label: 'Activity',
         path: '/activity',
         activeKey: '/activity',
         emoji: '🔔',
      },
      {
         icon: User,
         label: 'Profile',
         path: '/profile',
         activeKey: '/profile',
         emoji: '👤',
      },
   ];

   return (
      <nav className='fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 md:hidden shadow-anime-card'>
         <div className='flex justify-around items-center py-2 px-2'>
            {navItems.map((item, index) => {
               const IconComponent = item.icon;
               const isActive =
                  location.pathname === item.activeKey ||
                  (item.activeKey === '/profile' && location.pathname.startsWith('/profile'));

               return (
                  <Link
                     key={item.path}
                     to={item.path}
                     className={`
                        flex flex-col items-center justify-center p-3 min-w-16 rounded-2xl 
                        transition-all duration-300 group relative overflow-hidden
                        ${
                           isActive
                              ? 'bg-primary/10 shadow-anime-glow transform -translate-y-1'
                              : 'hover:bg-gray-50 anime-hover-scale'
                        }
                     `}
                     style={{ animationDelay: `${index * 50}ms` }}
                  >
                     {/* Animated background for active state */}
                     {isActive && (
                        <div className='absolute inset-0 bg-linear-to-br from-primary/20 to-secondary/20 rounded-2xl anime-pulse'></div>
                     )}

                     {/* Icon with emoji overlay on active */}
                     <div className='relative'>
                        <IconComponent
                           size={22}
                           className={`${
                              isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                           } transition-all duration-300 relative z-10`}
                        />

                        {/* Emoji for active state */}
                        {isActive && (
                           <span className='absolute -top-1 -right-1 text-xs animate-bounce z-20'>{item.emoji}</span>
                        )}

                        {/* Hover glow effect */}
                        <div
                           className={`
                           absolute inset-0 rounded-full transition-opacity duration-300
                           ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}
                           bg-primary/20 blur-sm scale-150
                        `}
                        ></div>
                     </div>

                     {/* Label with anime font */}
                     <span
                        className={`
                        text-xs font-anime font-medium mt-1 transition-all duration-300 relative z-10
                        ${isActive ? 'text-primary transform scale-105' : 'text-gray-400 group-hover:text-gray-600'}
                     `}
                     >
                        {item.label}
                     </span>

                     {/* Active indicator dot */}
                     {isActive && (
                        <div className='absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-pulse'></div>
                     )}
                  </Link>
               );
            })}
         </div>

         {/* Decorative elements */}
         <div className='absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-linear-to-r from-primary to-secondary rounded-b-full opacity-50'></div>
      </nav>
   );
};

export default BottomNavigation;
