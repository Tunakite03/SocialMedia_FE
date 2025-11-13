import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
   isOpen: boolean;
   onClose: () => void;
   onConfirm: () => void;
   title: string;
   message: string;
   confirmText?: string;
   cancelText?: string;
   type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
   isOpen,
   onClose,
   onConfirm,
   title,
   message,
   confirmText = 'Xác nhận',
   cancelText = 'Hủy',
   type = 'warning',
}) => {
   if (!isOpen) return null;

   // Handle ESC key and body scroll
   useEffect(() => {
      const handleEsc = (event: KeyboardEvent) => {
         if (event.key === 'Escape') {
            onClose();
         }
      };

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEsc);

      return () => {
         document.body.style.overflow = 'unset';
         document.removeEventListener('keydown', handleEsc);
      };
   }, [onClose]);

   const handleConfirm = () => {
      onConfirm();
      onClose();
   };

   const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
         onClose();
      }
   };

   const getButtonStyles = () => {
      switch (type) {
         case 'danger':
            return 'bg-red-600 hover:bg-red-700 text-white';
         case 'warning':
            return 'bg-red-400 hover:bg-red-600 text-white';
         default:
            return 'bg-blue-600 hover:bg-blue-700 text-white';
      }
   };

   const modalContent = (
      <div className='modal-overlay fixed inset-0 flex items-center justify-center p-4 z-50'>
         <div
            className='absolute inset-0 bg-black opacity-50'
            onClick={handleBackdropClick}
         ></div>
         <div className='bg-background rounded-lg p-6 w-full max-w-md shadow-xl border border-border relative'>
            {/* Header */}
            <div className='flex items-center justify-between mb-4'>
               <h3 className='text-lg font-semibold text-foreground'>{title}</h3>
               <button
                  onClick={onClose}
                  className='text-muted-foreground hover:text-foreground transition-colors p-1'
               >
                  <X size={20} />
               </button>
            </div>

            {/* Content */}
            <div className='mb-6'>
               <p className='text-muted-foreground'>{message}</p>
            </div>

            {/* Actions */}
            <div className='flex gap-3 justify-end'>
               <button
                  onClick={onClose}
                  className='px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors font-medium'
               >
                  {cancelText}
               </button>
               <button
                  onClick={handleConfirm}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium ${getButtonStyles()}`}
               >
                  {confirmText}
               </button>
            </div>
         </div>
      </div>
   );

   return createPortal(modalContent, document.body);
};

export default ConfirmDialog;
