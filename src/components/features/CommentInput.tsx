import { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { useAuthStore } from '@/store';
import { Input } from '@/components/ui/input';

interface CommentInputProps {
   onSubmit: (content: string, parentId?: string) => Promise<void>;
   loading?: boolean;
   placeholder?: string;
   replyingTo?: { id: string; username: string } | null;
   onCancelReply?: () => void;
   autoFocus?: boolean;
}

const CommentInput = ({
   onSubmit,
   loading = false,
   placeholder = 'Add a comment...',
   replyingTo,
   onCancelReply,
   autoFocus = false,
}: CommentInputProps) => {
   const [content, setContent] = useState('');
   const { user } = useAuthStore();
   const inputRef = useRef<HTMLInputElement>(null);

   // Auto-focus and scroll to view when replyingTo changes
   useEffect(() => {
      if (replyingTo && inputRef.current) {
         inputRef.current.focus();
      }
   }, [replyingTo]);

   // Auto-focus when component mounts with autoFocus
   useEffect(() => {
      if (autoFocus && inputRef.current) {
         inputRef.current.focus();
      }
   }, [autoFocus]);

   // Set initial content when replying
   useEffect(() => {
      if (replyingTo) {
         setContent(`@${replyingTo.username} `);
      } else {
         setContent('');
      }
   }, [replyingTo]);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim() || loading) return;

      // Loại bỏ @username khỏi content khi submit reply
      let submitContent = content.trim();
      if (replyingTo && submitContent.startsWith(`@${replyingTo.username} `)) {
         submitContent = submitContent.substring(`@${replyingTo.username} `.length);
      }

      // Không submit nếu chỉ có @username mà không có nội dung
      if (!submitContent.trim()) return;

      try {
         await onSubmit(submitContent, replyingTo?.id);
         setContent('');
         if (onCancelReply) {
            onCancelReply();
         }
      } catch (error) {
         console.error('Error submitting comment:', error);
      }
   };

   return (
      <form
         onSubmit={handleSubmit}
         className='space-y-2 w-full'
      >
         {replyingTo && (
            <div className='text-xs text-gray-500 flex items-center gap-2'>
               <span>Replying to @{replyingTo.username}</span>
               <button
                  type='button'
                  onClick={() => {
                     setContent('');
                     if (onCancelReply) onCancelReply();
                  }}
                  className='text-gray-400 hover:text-gray-600'
               >
                  <X size={14} />
               </button>
            </div>
         )}

         <div className='flex flex-row items-center gap-3'>
            <div className='w-8 h-8 rounded-full overflow-hidden shrink-0'>
               <img
                  src={user?.avatar || '/default-avatar.png'}
                  alt={user?.username || 'You'}
                  className='w-full h-full object-cover'
                  onError={(e) => {
                     const target = e.target as HTMLImageElement;
                     target.style.display = 'none';
                     target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-xs">${(
                        user?.username || 'U'
                     )
                        .charAt(0)
                        .toUpperCase()}</div>`;
                  }}
               />
            </div>

            <Input
               ref={inputRef}
               value={content}
               onChange={(e) => setContent(e.target.value)}
               placeholder={placeholder}
               className='border-none bg-transparent focus:ring-0 focus:outline-none text-sm flex-1'
               disabled={loading}
               autoFocus={autoFocus}
            />
            <button
               type='submit'
               disabled={
                  loading || 
                  !content.trim() || 
                  (replyingTo ? content.trim() === `@${replyingTo.username} ` : false)
               }
               className='bg-transparent hover:bg-transparent text-blue-500 hover:text-blue-600 disabled:text-gray-400'
            >
               {loading ? (
                  <div className='animate-spin rounded-fullborder-b-2 border-blue-500'></div>
               ) : (
                  <Send size={22} />
               )}
            </button>
         </div>
      </form>
   );
};

export default CommentInput;
