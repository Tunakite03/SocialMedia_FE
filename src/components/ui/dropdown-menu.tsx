import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Settings, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface DropdownMenuProps {
   onLogout: () => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ onLogout }) => {
   const [isOpen, setIsOpen] = useState(false);
   const dropdownRef = useRef<HTMLDivElement>(null);
   const location = useLocation();

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
         }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
         document.removeEventListener('mousedown', handleClickOutside);
      };
   }, []);

   const handleLogout = () => {
      setIsOpen(false);
      onLogout();
   };

   return (
      <div
         className='relative'
         ref={dropdownRef}
      >
         <button
            onClick={() => setIsOpen(!isOpen)}
            className='flex items-center text-center justify-center xl:justify-start lg:space-x-0 xl:space-x-4 lg:px-2 xl:px-3 py-3 rounded-lg transition-colors hover:bg-muted w-full'
         >
            <MoreHorizontal
               size={24}
               className='text-muted-foreground'
            />
            <span className='text-base text-foreground hidden xl:inline'>More</span>
         </button>

         {isOpen && (
            <div className='absolute bottom-full left-0 mb-2 w-48 bg-background border border-border rounded-lg shadow-lg py-2 z-50'>
               <Link
                  to='/settings'
                  className={`flex items-center space-x-3 px-4 py-2 hover:bg-muted transition-colors text-foreground ${
                     location.pathname === '/settings' ? 'bg-muted font-medium' : ''
                  }`}
                  onClick={() => setIsOpen(false)}
               >
                  <Settings size={16} />
                  <span>Settings</span>
               </Link>

               <button
                  onClick={handleLogout}
                  className='flex items-center space-x-3 px-4 py-2 hover:bg-muted transition-colors text-foreground w-full text-left'
               >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
               </button>
            </div>
         )}
      </div>
   );
};

export default DropdownMenu;
