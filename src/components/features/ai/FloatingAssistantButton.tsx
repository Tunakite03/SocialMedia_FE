import { useState, useRef, useEffect } from 'react';
import { Bot, MessageCircle, X, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AssistantChatPopup from './AssistantChatPopup';

const FloatingAssistantButton = () => {
   const [isOpen, setIsOpen] = useState(false);
   const [hasNewMessage, setHasNewMessage] = useState(false);
   const [position, setPosition] = useState({ x: 0, y: 0 });
   const [isDragging, setIsDragging] = useState(false);
   const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
   const [isMobile, setIsMobile] = useState(false);
   const buttonRef = useRef<HTMLDivElement>(null);

   // Detect mobile screen
   useEffect(() => {
      const checkMobile = () => {
         setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
   }, []);

   // Load saved position from localStorage
   useEffect(() => {
      const saved = localStorage.getItem('ai-assistant-position');
      if (saved) {
         setPosition(JSON.parse(saved));
      }
   }, []);

   const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      setIsDragging(true);
      setDragStart({
         x: e.clientX - position.x,
         y: e.clientY - position.y,
      });
      e.preventDefault();
   };

   const handleTouchStart = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
         x: touch.clientX - position.x,
         y: touch.clientY - position.y,
      });
      e.preventDefault();
   };

   const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Keep within viewport bounds
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - 80;

      setPosition({
         x: Math.max(-maxX, Math.min(maxX, newX)),
         y: Math.max(-maxY, Math.min(maxY, newY)),
      });
   };

   const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;

      // Keep within viewport bounds
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - 80;

      setPosition({
         x: Math.max(-maxX, Math.min(maxX, newX)),
         y: Math.max(-maxY, Math.min(maxY, newY)),
      });
   };

   const handleMouseUp = () => {
      if (isDragging) {
         setIsDragging(false);
         // Save position to localStorage
         localStorage.setItem('ai-assistant-position', JSON.stringify(position));
      }
   };

   const handleTouchEnd = () => {
      if (isDragging) {
         setIsDragging(false);
         // Save position to localStorage
         localStorage.setItem('ai-assistant-position', JSON.stringify(position));
      }
   };

   useEffect(() => {
      if (isDragging) {
         document.addEventListener('mousemove', handleMouseMove);
         document.addEventListener('mouseup', handleMouseUp);
         document.addEventListener('touchmove', handleTouchMove);
         document.addEventListener('touchend', handleTouchEnd);
         return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
         };
      }
   }, [isDragging, dragStart, position]);

   const toggleChat = () => {
      setIsOpen(!isOpen);
      if (!isOpen) {
         setHasNewMessage(false);
      }
   };

   return (
      <>
         {/* Floating Button */}
         <div
            ref={buttonRef}
            className={'fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3'}
            style={{
               transform: `translate(${position.x}px, ${position.y}px)`,
               cursor: isDragging ? 'grabbing' : 'grab',
            }}
         >
            {/* Tooltip - Hide on mobile
            {!isOpen && !isMobile && (
               <div className='animate-bounce-slow bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap opacity-0 animate-fade-in'>
                  Trợ lý cảm xúc AI
                  <div className='absolute -bottom-1 right-6 w-3 h-3 bg-primary rotate-45'></div>
               </div>
            )} */}

            {/* Main Button */}
            <Button
               onClick={() => {
                  if (!isDragging) toggleChat();
               }}
               onMouseDown={handleMouseDown}
               onTouchStart={handleTouchStart}
               size='sm'
               className={`
                  relative ${isMobile ? 'h-14 w-14' : 'h-16 w-16'} rounded-full shadow-2xl
                  transition-all duration-300 ease-in-out
                  ${!isDragging && !isMobile && 'hover:scale-110 hover:shadow-primary/50'}
                  ${
                     isOpen
                        ? 'bg-destructive hover:bg-destructive/90'
                        : 'bg-linear-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  }
               `}
               style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
               {/* Pulse animation ring */}
               {!isOpen && <span className='absolute inset-0 rounded-full bg-primary/30 '></span>}

               {/* Icon */}
               <div className='relative z-10'>
                  {isOpen ? (
                     <X className='h-6 w-6 text-white' />
                  ) : (
                     <div className='relative'>
                        <Bot className='h-6 w-6 text-white' />
                     </div>
                  )}
               </div>

               {/* Drag indicator - Hide on mobile */}
               {!isOpen && !isMobile && (
                  <div className='absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                     <Move className='h-3 w-3 text-white/60' />
                  </div>
               )}

               {/* Notification badge */}
               {hasNewMessage && !isOpen && (
                  <span className='absolute -top-1 -right-1 flex h-5 w-5'>
                     <span className=' absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75'></span>
                     <span className='relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center text-white text-xs font-bold'>
                        !
                     </span>
                  </span>
               )}
            </Button>
         </div>

         {/* Chat Popup */}
         <AssistantChatPopup
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            buttonPosition={position}
         />

         {/* Custom animations */}
         <style>{`
            @keyframes fade-in {
               from {
                  opacity: 0;
                  transform: translateY(10px);
               }
               to {
                  opacity: 1;
                  transform: translateY(0);
               }
            }

            @keyframes bounce-slow {
               0%, 100% {
                  transform: translateY(0);
               }
               50% {
                  transform: translateY(-10px);
               }
            }

            .animate-fade-in {
               animation: fade-in 0.5s ease-out forwards;
               animation-delay: 1s;
            }

            .animate-bounce-slow {
               animation: bounce-slow 2s ease-in-out infinite;
               animation-delay: 1s;
            }
         `}</style>
      </>
   );
};

export default FloatingAssistantButton;
