import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PhoneOff, X } from 'lucide-react';

interface CallErrorPopupProps {
   message: string;
   onClose: () => void;
   autoCloseMs?: number;
}

export const CallErrorPopup = ({ message, onClose, autoCloseMs = 4000 }: CallErrorPopupProps) => {
   useEffect(() => {
      const timer = setTimeout(onClose, autoCloseMs);
      const handleEsc = (e: KeyboardEvent) => {
         if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEsc);
      return () => {
         clearTimeout(timer);
         document.removeEventListener('keydown', handleEsc);
      };
   }, [onClose, autoCloseMs]);

   return createPortal(
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
         <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={onClose}
         />
         <div className='relative bg-background border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200'>
            <button
               onClick={onClose}
               className='absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted'
            >
               <X size={18} />
            </button>

            <div className='flex flex-col items-center text-center gap-4'>
               <div className='w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center'>
                  <PhoneOff className='w-7 h-7 text-red-500' />
               </div>

               <div className='space-y-1'>
                  <h3 className='text-lg font-semibold text-foreground'>Không thể thực hiện cuộc gọi</h3>
                  <p className='text-sm text-muted-foreground'>{message}</p>
               </div>

               <button
                  onClick={onClose}
                  className='w-full px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-medium transition-colors'
               >
                  Đóng
               </button>
            </div>
         </div>
      </div>,
      document.body,
   );
};
