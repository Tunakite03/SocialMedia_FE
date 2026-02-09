import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { useState } from 'react';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import DropdownMenu from '@/components/ui/dropdown-menu';
import { useNotificationStore } from '@/store/notificationStore';
import NotificationBadge from '../ui/notification-badge';
import { navItems } from '@/config';

const DesktopSidebar = () => {
   const location = useLocation();
   const { user, logout } = useAuthStore();
   const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
   const { unreadCount } = useNotificationStore();
   const handleLogout = () => {
      setShowLogoutConfirm(true);
   };

   const confirmLogout = () => {
      logout();
   };

   return (
      <aside className='hidden lg:flex lg:flex-col lg:w-16 xl:w-64 lg:fixed lg:left-0 lg:top-0 lg:h-full bg-background border-r border-border lg:p-2 xl:p-3'>
         <div className='mb-8 pt-4 min-h-44'>
            <Link
               to='/feed'
               className='text-2xl flex flex-col font-bold text-foreground tracking-tight'
            >
               <img
                  src='/logov2_128.png'
                  alt='Otakomi Logo'
                  className='h-15 object-contain'
               />
            </Link>
         </div>

         {/* Navigation */}
         <nav className='flex-1 overflow-y-auto scrollbar-thin'>
            <ul className='space-y-2'>
               {navItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = location.pathname === item.activeKey;

                  return (
                     <li key={item.path}>
                        <Link
                           to={item.path}
                           className={`flex items-center xl:justify-start justify-center  relative lg:space-x-0 xl:space-x-4 lg:px-2 xl:px-3 py-3 rounded-lg transition-colors hover:bg-muted ${
                              isActive ? 'font-bold bg-muted' : ''
                           } `}
                        >
                           <IconComponent
                              size={24}
                              className={`${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
                           />
                           {
                              /* Show notification badge only for Notifications item */
                              item.label === 'Notifications' && unreadCount > 0 && (
                                 <NotificationBadge
                                    count={unreadCount}
                                    color='red'
                                    size='sm'
                                 />
                              )
                           }

                           <span
                              className={`text-base hidden xl:inline ${
                                 isActive ? 'font-bold text-foreground' : 'text-foreground'
                              }`}
                           >
                              {item.label}
                           </span>
                        </Link>
                     </li>
                  );
               })}
            </ul>
         </nav>

         {/* User Profile */}
         {user && user.username && (
            <div className='mt-auto pt-4 border-t border-border'>
               {/* More Button with Dropdown */}
               <DropdownMenu onLogout={handleLogout} />

               <Link
                  to='/profile'
                  className='flex items-center  lg:space-x-0 xl:space-x-3 lg:px-2 xl:px-3 py-2 rounded-lg hover:bg-muted transition-colors mt-2'
               >
                  <div className='w-8 h-8 rounded-full bg-muted overflow-hidden'>
                     {user.avatar ? (
                        <img
                           src={user.avatar}
                           alt={user.displayName || user.username}
                           className='w-full h-full object-cover'
                        />
                     ) : (
                        <div className='w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm'>
                           {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                     )}
                  </div>
                  <div className='flex-1 min-w-0 hidden xl:block'>
                     <p className='text-sm font-semibold text-foreground truncate'>{user.username}</p>
                     <p className='text-xs text-muted-foreground truncate'>{user.displayName || user.username}</p>
                  </div>
               </Link>
            </div>
         )}

         {/* Logout Confirmation Modal */}
         <ConfirmDialog
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
            title='Xác nhận đăng xuất'
            message='Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?'
            confirmText='Đăng xuất'
            cancelText='Hủy'
            type='warning'
         />
      </aside>
   );
};

export default DesktopSidebar;
