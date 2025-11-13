import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Settings, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface DropdownMenuProps {
   onLogout: () => void;
   isCollapsed?: boolean;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ onLogout, isCollapsed = false }) => {
   const [isOpen, setIsOpen] = useState(false);
   const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
   const dropdownRef = useRef<HTMLDivElement>(null);
   const buttonRef = useRef<HTMLButtonElement>(null);
   const location = useLocation();

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target as Node) &&
            buttonRef.current &&
            !buttonRef.current.contains(event.target as Node)
         ) {
            setIsOpen(false);
         }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
         document.removeEventListener('mousedown', handleClickOutside);
      };
   }, []);

   const handleToggle = () => {
      if (!isOpen && buttonRef.current) {
         const rect = buttonRef.current.getBoundingClientRect();
         setDropdownPosition({
            top: rect.top - 120, // Position above the button
            left: rect.left,
         });
      }
      setIsOpen(!isOpen);
   };

   const handleLogout = () => {
      setIsOpen(false);
      onLogout();
   };

   const dropdownContent =
      isOpen && dropdownPosition ? (
         <div
            ref={dropdownRef}
            className='fixed w-48 bg-background border border-border rounded-lg shadow-lg py-2 z-50'
            style={{
               top: `${dropdownPosition.top}px`,
               left: `${dropdownPosition.left}px`,
            }}
         >
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
      ) : null;

   return (
      <>
         <div className='relative'>
            {!isCollapsed ? (
               <button
                  ref={buttonRef}
                  onClick={handleToggle}
                  className='flex items-center text-center justify-center xl:justify-start lg:space-x-0 xl:space-x-4 lg:px-2 xl:px-3 py-3 rounded-lg transition-colors hover:bg-muted w-full'
               >
                  <MoreHorizontal
                     size={24}
                     className='text-muted-foreground'
                  />
                  <span className='text-base text-foreground hidden xl:inline'>More</span>
               </button>
            ) : (
               <button
                  ref={buttonRef}
                  onClick={handleToggle}
                  className='flex items-center text-center justify-center space-x-0 px-2  py-3 rounded-lg transition-colors hover:bg-muted w-full'
               >
                  <MoreHorizontal
                     size={24}
                     className='text-muted-foreground'
                  />
               </button>
            )}
         </div>

         {dropdownContent && createPortal(dropdownContent, document.body)}
      </>
   );
};

export default DropdownMenu;
