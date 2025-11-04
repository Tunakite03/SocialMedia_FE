import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, Bell, User, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/store';

const DesktopSidebar = () => {
   const location = useLocation();
   const { user } = useAuthStore();

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
         icon: Bell,
         label: 'Notifications',
         path: '/activity',
         activeKey: '/activity',
      },
      {
         icon: MessageCircle,
         label: 'Messages',
         path: '/chat',
         activeKey: '/chat',
      },
      {
         icon: User,
         label: 'Profile',
         path: '/profile',
         activeKey: '/profile',
      },
   ];

   return (
      <aside className='hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:left-0 lg:top-0 lg:h-full lg:bg-white lg:border-r lg:border-gray-200 lg:p-4'>
         {/* Logo */}
         <div className='mb-8 pt-4'>
            <Link
               to='/feed'
               className='text-2xl font-bold text-black tracking-tight'
            >
               <img
                  src='/logov2_128.png'
                  alt='Otakomi Logo'
                  className='h-20 w-auto object-fit'
               />
            </Link>
         </div>

         {/* Navigation */}
         <nav className='flex-1'>
            <ul className='space-y-2'>
               {navItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive =
                     location.pathname === item.activeKey ||
                     (item.activeKey === '/profile' && location.pathname.startsWith('/profile')) ||
                     (item.activeKey === '/chat' && location.pathname.startsWith('/chat'));

                  return (
                     <li key={item.path}>
                        <Link
                           to={item.path}
                           className={`flex items-center space-x-4 px-3 py-3 rounded-lg transition-colors hover:bg-gray-100 ${
                              isActive ? 'font-bold bg-gray-100' : ''
                           }`}
                        >
                           <IconComponent
                              size={24}
                              className={`${isActive ? 'text-black' : 'text-black'}`}
                           />
                           <span className={`text-base ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                        </Link>
                     </li>
                  );
               })}
            </ul>
         </nav>

         {/* User Profile */}
         {user && user.username && (
            <div className='mt-auto pt-4 border-t border-gray-200'>
               <Link
                  to='/profile'
                  className='flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors'
               >
                  <div className='w-8 h-8 rounded-full bg-gray-200 overflow-hidden'>
                     {user.avatar ? (
                        <img
                           src={user.avatar}
                           alt={user.displayName || user.username}
                           className='w-full h-full object-cover'
                        />
                     ) : (
                        <div className='w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm'>
                           {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                     )}
                  </div>
                  <div className='flex-1 min-w-0'>
                     <p className='text-sm font-semibold text-black truncate'>{user.username}</p>
                     <p className='text-xs text-gray-500 truncate'>{user.displayName || user.username}</p>
                  </div>
               </Link>
            </div>
         )}
      </aside>
   );
};

export default DesktopSidebar;
