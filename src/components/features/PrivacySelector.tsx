import React, { useState, useRef, useEffect } from 'react';
import { Globe, Lock, ChevronDown } from 'lucide-react';

interface PrivacySelectorProps {
   isPublic: boolean;
   onChange: (isPublic: boolean) => void;
   variant?: 'toggle' | 'dropdown';
}

/**
 * Privacy Selector Component
 *
 * Two UI variants:
 * - toggle: Smooth toggle switch with anime effects
 * - dropdown: Dropdown menu with detailed descriptions
 */
export const PrivacySelector: React.FC<PrivacySelectorProps> = ({ isPublic, onChange, variant = 'toggle' }) => {
   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
   const dropdownRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
         }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
         document.removeEventListener('mousedown', handleClickOutside);
      };
   }, []);

   if (variant === 'dropdown') {
      return (
         <div
            className='relative'
            ref={dropdownRef}
         >
            {/* Dropdown trigger button */}
            <button
               onClick={() => setIsDropdownOpen(!isDropdownOpen)}
               className='flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-border  hover:bg-white/20 transition-all duration-300 anime-hover-lift group w-full shadow-lg hover:shadow-xl'
            >
               <div className='flex items-center gap-1.5'>
                  {isPublic ? (
                     <Globe
                        size={16}
                        className='text-blue-400 group-hover:text-blue-300 transition-colors'
                     />
                  ) : (
                     <Lock
                        size={16}
                        className='text-amber-400 group-hover:text-amber-300 transition-colors'
                     />
                  )}
                  <span className='text-xs font-medium tracking-wide'>{isPublic ? 'Public' : 'Private'}</span>
               </div>
               <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
               />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
               <div className='absolute top-full left-0 mt-2 w-full bg-white/5 backdrop-blur-2xl border border-border rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200'>
                  {/* Public option */}
                  <button
                     onClick={() => {
                        onChange(true);
                        setIsDropdownOpen(false);
                     }}
                     className={`w-full px-3 py-2.5 flex items-start gap-2.5 transition-all duration-200 ${
                        isPublic
                           ? 'bg-blue-400/20 border-l-2 border-blue-400'
                           : 'hover:bg-white/5 border-l-2 border-transparent'
                     }`}
                  >
                     <Globe
                        size={16}
                        className={`mt-0.5 shrink-0 ${isPublic ? 'text-blue-300' : 'text-white/40'}`}
                     />
                     <div className='text-left'>
                        <div className={`font-medium text-xs ${isPublic ? 'text-blue-200' : 'text-white/70'}`}>
                           Public
                        </div>
                        <div className='text-xs text-white/50 mt-0.5'>Anyone can see and interact</div>
                     </div>
                  </button>

                  {/* Divider */}
                  <div className='h-px bg-white/10' />

                  {/* Private option */}
                  <button
                     onClick={() => {
                        onChange(false);
                        setIsDropdownOpen(false);
                     }}
                     className={`w-full px-3 py-2.5 flex items-start gap-2.5 transition-all duration-200 ${
                        !isPublic
                           ? 'bg-amber-400/20 border-l-2 border-amber-400'
                           : 'hover:bg-white/5 border-l-2 border-transparent'
                     }`}
                  >
                     <Lock
                        size={16}
                        className={`mt-0.5 shrink-0 ${!isPublic ? 'text-amber-300' : 'text-white/40'}`}
                     />
                     <div className='text-left'>
                        <div className={`font-medium text-xs ${!isPublic ? 'text-amber-200' : 'text-white/70'}`}>
                           Private
                        </div>
                        <div className='text-xs text-white/50 mt-0.5'>Only you can see this</div>
                     </div>
                  </button>
               </div>
            )}
         </div>
      );
   }

   // Toggle variant (default)
   return (
      <button
         onClick={() => onChange(!isPublic)}
         className='relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-border/20 hover:border-border/40 hover:bg-white/20 transition-all duration-300 anime-hover-lift group shadow-lg hover:shadow-xl'
         title={isPublic ? 'Switch to Private' : 'Switch to Public'}
      >
         {/* Icon and label */}
         <div className='flex items-center gap-1.5'>
            {isPublic ? (
               <Globe
                  size={16}
                  className='text-blue-400 group-hover:text-blue-300 transition-colors'
               />
            ) : (
               <Lock
                  size={16}
                  className='text-amber-400 group-hover:text-amber-300 transition-colors'
               />
            )}
            <span className='text-xs font-medium tracking-wide'>{isPublic ? 'Public' : 'Private'}</span>
         </div>

         {/* Toggle indicator */}
         <div className='relative h-4 w-7 bg-white/10 rounded-full border border-border/20 ml-1.5'>
            <div
               className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-all duration-300 shadow-md ${
                  isPublic ? 'translate-x-0 bg-blue-400' : 'translate-x-3 bg-amber-400'
               }`}
            />
         </div>
      </button>
   );
};

export default PrivacySelector;
