import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, CheckCheck, MoreVertical, Reply, Edit3, Trash2 } from 'lucide-react';
import type { Message } from '@/types';
import { useMobile } from '@/hooks';
import SentimentBadge from '@/components/features/comment/SentimentBadge';

interface MessageBubbleProps {
   message: Message;
   showAvatar?: boolean;
   onReply?: (message: Message) => void;
   onEdit?: (message: Message) => void;
   onDelete?: (messageId: string) => void;
   className?: string;
}

const MessageBubble = ({
   message,
   showAvatar = true,
   onReply,
   onEdit,
   onDelete,
   className = '',
}: MessageBubbleProps) => {
   const { user } = useAuthStore();
   const [showActions, setShowActions] = useState(false);
   const messageRef = useRef<HTMLDivElement>(null);
   const timeoutRef = useRef<number | null>(null);
   const isOwn = message.senderId === user?.id;
   const isMobile = useMobile();
   // Auto-hide actions after 3 seconds on mobile
   useEffect(() => {
      if (showActions && isMobile) {
         timeoutRef.current = setTimeout(() => {
            setShowActions(false);
         }, 5000);
      }

      return () => {
         if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
         }
      };
   }, [showActions]);

   // Handle click outside to hide actions
   useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
         if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
            setShowActions(false);
         }
      };

      if (showActions) {
         document.addEventListener('mousedown', handleClickOutside);
         document.addEventListener('touchstart', handleClickOutside);
      }

      return () => {
         document.removeEventListener('mousedown', handleClickOutside);
         document.removeEventListener('touchstart', handleClickOutside);
      };
   }, [showActions]);

   const handleMessageInteraction = (event?: React.TouchEvent | React.MouseEvent) => {
      // Prevent action toggle during scroll on mobile
      if (event && 'touches' in event && event.touches.length > 1) {
         return;
      }

      setShowActions((prev) => !prev);

      // Clear existing timeout when user interacts
      if (timeoutRef.current) {
         clearTimeout(timeoutRef.current);
      }
   };

   const formatTime = (timestamp: string) => {
      return new Date(timestamp).toLocaleTimeString([], {
         hour: '2-digit',
         minute: '2-digit',
      });
   };

   const renderMessageContent = () => {
      switch (message.type) {
         case 'IMAGE':
            return (
               <div className='space-y-2'>
                  {message.mediaUrl && (
                     <img
                        src={message.mediaUrl}
                        alt='Shared image'
                        className='max-w-sm rounded-lg anime-hover-scale cursor-pointer'
                        onClick={() => window.open(message.mediaUrl, '_blank')}
                     />
                  )}
                  {message.content && <p className='text-sm'>{message.content}</p>}
               </div>
            );

         case 'FILE':
            return (
               <div className='flex items-center space-x-3 p-3 bg-muted/30 rounded-lg'>
                  <div className='text-2xl'>📎</div>
                  <div className='flex-1'>
                     <p className='font-medium text-sm'>File attachment</p>
                     {message.content && <p className='text-xs text-muted-foreground'>{message.content}</p>}
                  </div>
                  {message.mediaUrl && (
                     <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => window.open(message.mediaUrl, '_blank')}
                     >
                        Download
                     </Button>
                  )}
               </div>
            );

         case 'VOICE':
            return (
               <div className='flex items-center space-x-3 p-3 bg-muted/30 rounded-lg'>
                  <div className='text-2xl'>🎵</div>
                  <div className='flex-1'>
                     <p className='font-medium text-sm'>Voice message</p>
                     <p className='text-xs text-muted-foreground'>Click to play</p>
                  </div>
                  {message.mediaUrl && (
                     <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => {
                           // TODO: Implement audio player
                           console.log('Play voice message:', message.mediaUrl);
                        }}
                     >
                        ▶️
                     </Button>
                  )}
               </div>
            );

         default:
            return <p className='text-sm whitespace-pre-wrap wrap-break-word text-foreground'>{message.content}</p>;
      }
   };

   return (
      <div
         ref={messageRef}
         className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group ${className} text-foreground`}
         onMouseLeave={() => setShowActions(false)}
      >
         <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            {showAvatar && !isOwn && (
               <div className='mr-3'>
                  <Avatar className='h-8 w-8'>
                     <AvatarImage
                        src={message.sender.avatar || ''}
                        alt={message.sender.displayName}
                     />
                     <AvatarFallback className='text-xs bg-accent text-accent-foreground'>
                        {message.sender.displayName.slice(0, 2).toUpperCase()}
                     </AvatarFallback>
                  </Avatar>
               </div>
            )}

            {/* Message Content */}
            <div className={`relative ${isOwn ? 'mr-3' : ''}`}>
               {/* Sender name for group chats */}
               {!isOwn && showAvatar && (
                  <div className='text-xs text-muted-foreground mb-1 ml-1'>{message.sender.displayName}</div>
               )}

               {/* Message bubble */}
               <div
                  className={` px-4 py-2 relative rounded-2xl shadow-lg backdrop-blur-2xl anime-slide-in-${
                     isOwn ? 'right' : 'left'
                  }
                     ${isOwn ? 'text-primary-foreground shadow-lg' : 'bg-muted/70 text-foreground'}
                     cursor-pointer select-none active:scale-95 transition-transform duration-100
                     touch-manipulation
                  `}
                  onMouseEnter={() => setShowActions(true)}
                  onTouchStart={handleMessageInteraction}
                  onClick={handleMessageInteraction}
               >
                  {/* Reply indicator */}
                  {message.parent && (
                     <div className=' p-2 bg-muted rounded-lg'>
                        <p className='text-xs text-muted-foreground'>{message.parent.sender.displayName}</p>
                        <p className='text-sm text-foreground'>{message.parent.content}</p>
                     </div>
                  )}

                  {renderMessageContent()}

                  {/* Message info */}
                  <div
                     className={`flex items-center justify-between gap-2 mt-1 text-xs ${
                        isOwn ? 'text-muted-foreground' : 'text-muted-foreground'
                     }`}
                  >
                     <SentimentBadge
                        sentiment={message.sentiment}
                        confidence={message.sentimentConfidence}
                        showConfidence={false}
                     />
                     <span>{formatTime(message.createdAt)}</span>

                     {/* Read receipts for own messages */}
                     {isOwn && (
                        <div className='flex items-center'>
                           {message.isRead ? (
                              <CheckCheck className='h-3 w-3 text-green-400' />
                           ) : (
                              <Check className='h-3 w-3' />
                           )}
                        </div>
                     )}
                  </div>
               </div>

               {/* Action buttons */}
               {showActions && (
                  <div
                     className={`
                     absolute top-2 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} 
                     flex items-center space-x-1 opacity-0 group-hover:opacity-100 
                     transition-opacity duration-200 anime-slide-in-${isOwn ? 'left' : 'right'}
                     z-10
                     md:opacity-0 md:group-hover:opacity-100
                     max-md:opacity-100
                  `}
                  >
                     {onReply && (
                        <Button
                           size='icon'
                           variant='ghost'
                           onClick={(e) => {
                              e.stopPropagation();
                              onReply(message);
                           }}
                           className='h-6 w-6 hover:bg-muted touch-manipulation'
                        >
                           <Reply className='h-3 w-3' />
                        </Button>
                     )}

                     {isOwn && onEdit && (
                        <Button
                           size='icon'
                           variant='ghost'
                           onClick={(e) => {
                              e.stopPropagation();
                              onEdit(message);
                           }}
                           className='h-6 w-6 hover:bg-muted touch-manipulation'
                        >
                           <Edit3 className='h-3 w-3' />
                        </Button>
                     )}

                     {isOwn && onDelete && (
                        <Button
                           size='icon'
                           variant='ghost'
                           onClick={(e) => {
                              e.stopPropagation();
                              onDelete(message.id);
                           }}
                           className='h-6 w-6 hover:bg-destructive  touch-manipulation'
                        >
                           <Trash2 className='h-3 w-3' />
                        </Button>
                     )}

                     <Button
                        size='icon'
                        variant='ghost'
                        className='h-6 w-6 hover:bg-muted touch-manipulation'
                        onClick={(e) => e.stopPropagation()}
                     >
                        <MoreVertical className='h-3 w-3' />
                     </Button>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default MessageBubble;
