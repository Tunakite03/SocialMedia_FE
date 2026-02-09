import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Smile, X } from 'lucide-react';
import type { Message } from '@/types';

interface MessageInputProps {
   onSendMessage: (content: string, type?: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE') => void;
   onStartTyping?: () => void;
   onStopTyping?: () => void;
   disabled?: boolean;
   placeholder?: string;
   replyingTo?: Message;
   onCancelReply?: () => void;
   editingMessage?: Message;
   onCancelEdit?: () => void;
   className?: string;
}

const MessageInput = ({
   onSendMessage,
   onStartTyping,
   onStopTyping,
   disabled = false,
   placeholder = 'Type a message...',
   replyingTo,
   onCancelReply,
   editingMessage,
   onCancelEdit,
   className = '',
}: MessageInputProps) => {
   const [message, setMessage] = useState('');
   const [isTyping, setIsTyping] = useState(false);
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const textareaRef = useRef<HTMLTextAreaElement>(null);
   const typingTimeoutRef = useRef<number | null>(null);

   // Initialize with editing message content
   useEffect(() => {
      if (editingMessage) {
         setMessage(editingMessage.content);
         textareaRef.current?.focus();
      }
   }, [editingMessage]);

   // Auto-resize textarea
   useEffect(() => {
      if (textareaRef.current) {
         textareaRef.current.style.height = 'auto';
         textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
      }
   }, [message]);

   const handleTyping = (value: string) => {
      setMessage(value);

      // Typing indicators
      if (!isTyping && value.trim() && onStartTyping) {
         setIsTyping(true);
         onStartTyping();
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
         clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing
      typingTimeoutRef.current = window.setTimeout(() => {
         if (isTyping && onStopTyping) {
            setIsTyping(false);
            onStopTyping();
         }
      }, 1000);

      if (!value.trim() && isTyping && onStopTyping) {
         setIsTyping(false);
         onStopTyping();
      }
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (!message.trim() && !selectedFile) return;
      if (disabled) return;

      // Send message
      if (selectedFile) {
         // TODO: Handle file upload
         // For now, just send as text with filename
         onSendMessage(`📎 ${selectedFile.name}`, 'FILE');
         setSelectedFile(null);
      } else {
         onSendMessage(message.trim(), 'TEXT');
      }

      // Reset form
      setMessage('');

      // Stop typing indicator
      if (isTyping && onStopTyping) {
         setIsTyping(false);
         onStopTyping();
      }

      // Clear timeout
      if (typingTimeoutRef.current) {
         clearTimeout(typingTimeoutRef.current);
      }
   };

   const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
         e.preventDefault();
         handleSubmit(e);
      }
   };

   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         setSelectedFile(file);
      }
   };

   const handleRemoveFile = () => {
      setSelectedFile(null);
      if (fileInputRef.current) {
         fileInputRef.current.value = '';
      }
   };

   const canSend = (message.trim() || selectedFile) && !disabled;

   return (
      <div className={`bg-card border-t border-border ${className}`}>
         {/* Reply/Edit indicator */}
         {(replyingTo || editingMessage) && (
            <div className='px-4 py-2 bg-muted/30 border-b border-border'>
               <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                     <div className='w-1 h-6 bg-primary rounded-full' />
                     <div className='text-sm'>
                        {editingMessage && (
                           <>
                              <span className='text-muted-foreground'>Editing message</span>
                              <p className='font-medium truncate max-w-md'>{editingMessage.content}</p>
                           </>
                        )}
                        {replyingTo && (
                           <>
                              <span className='text-muted-foreground'>Replying to {replyingTo.sender.displayName}</span>
                              <p className='font-medium truncate max-w-md'>{replyingTo.content}</p>
                           </>
                        )}
                     </div>
                  </div>
                  <Button
                     variant='ghost'
                     size='icon'
                     onClick={editingMessage ? onCancelEdit : onCancelReply}
                     className='h-6 w-6'
                  >
                     <X className='h-4 w-4' />
                  </Button>
               </div>
            </div>
         )}

         {/* File preview */}
         {selectedFile && (
            <div className='px-4 py-2 bg-muted/20 border-b border-border'>
               <div className='flex items-center space-x-3'>
                  <div className='text-2xl'>{selectedFile.type.startsWith('image/') ? '📷' : '📎'}</div>
                  <div className='flex-1'>
                     <p className='font-medium text-sm'>{selectedFile.name}</p>
                     <p className='text-xs text-muted-foreground'>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button
                     variant='ghost'
                     size='icon'
                     onClick={handleRemoveFile}
                     className='h-6 w-6 hover:bg-destructive hover:text-destructive-foreground'
                  >
                     <X className='h-4 w-4' />
                  </Button>
               </div>
            </div>
         )}

         {/* Message input */}
         <form
            onSubmit={handleSubmit}
            className='p-4'
         >
            <div className='flex items-center space-x-3'>
               {/* Attachment button */}
               <div className='flex space-x-1'>
                  <input
                     ref={fileInputRef}
                     type='file'
                     onChange={handleFileSelect}
                     className='hidden'
                     accept='image/*,audio/*,video/*,.pdf,.doc,.docx,.txt'
                  />
                  <Button
                     type='button'
                     variant='ghost'
                     size='icon'
                     onClick={() => fileInputRef.current?.click()}
                     disabled={disabled}
                     className='anime-hover-scale'
                  >
                     <Paperclip className='h-4 w-4' />
                  </Button>
               </div>

               {/* Message input area */}
               <div className='flex-1 relative flex items-center'>
                  <textarea
                     ref={textareaRef}
                     value={message}
                     onChange={(e) => handleTyping(e.target.value)}
                     onKeyPress={handleKeyPress}
                     placeholder={placeholder}
                     disabled={disabled}
                     rows={1}
                     className='
                        w-full px-3 py-2 pr-10 bg-muted/50 border border-border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-ring resize-none
                        transition-all duration-200 placeholder:text-muted-foreground scrollbar-hide
                        max-h-32
                     '
                  />

                  {/* Emoji button */}
                  <Button
                     type='button'
                     variant='ghost'
                     size='icon'
                     disabled={disabled}
                     className='absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6'
                     onClick={() => {
                        // TODO: Open emoji picker
                        console.log('Open emoji picker');
                     }}
                  >
                     <Smile className='h-4 w-4' />
                  </Button>
               </div>

               {/* Send button */}
               <Button
                  type='submit'
                  disabled={!canSend}
                  className='anime-button-press anime-hover-lift'
               >
                  <Send className='h-4 w-4' />
                  <span className='ml-1 hidden sm:inline'>{editingMessage ? 'Update' : 'Send'}</span>
               </Button>
            </div>
         </form>
      </div>
   );
};

export default MessageInput;
