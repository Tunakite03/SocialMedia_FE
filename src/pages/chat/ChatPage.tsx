import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useChatStore, useAuthStore } from '@/store';
import { socketService } from '@/services/socketService';
import { Button } from '@/components/ui/button';
import { Send, Phone, Video, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ChatPage = () => {
   const { roomId } = useParams<{ roomId: string }>();
   const [message, setMessage] = useState('');
   const [isTyping, setIsTyping] = useState(false);
   const messagesEndRef = useRef<HTMLDivElement>(null);

   const { user } = useAuthStore();
   const { messages, setActiveChat, addMessage, typingUsers, addTypingUser, removeTypingUser } = useChatStore();

   const currentMessages = roomId ? messages[roomId] || [] : [];
   const currentTypingUsers = roomId ? typingUsers[roomId] || [] : [];

   useEffect(() => {
      if (roomId) {
         setActiveChat(roomId);

         // Join room
         socketService.joinRoom(roomId);
      }

      return () => {
         if (roomId) {
            socketService.leaveRoom(roomId);
         }
      };
   }, [roomId, setActiveChat]);

   useEffect(() => {
      // Setup socket listeners
      socketService.on('message:new', (newMessage) => {
         addMessage(newMessage);
      });

      socketService.on('typing:start', (data) => {
         if (data.chatRoomId === roomId && data.userId !== user?.id) {
            addTypingUser(data.chatRoomId, data.userId);
         }
      });

      socketService.on('typing:stop', (data) => {
         if (data.chatRoomId === roomId) {
            removeTypingUser(data.chatRoomId, data.userId);
         }
      });

      return () => {
         socketService.off('message:new');
         socketService.off('typing:start');
         socketService.off('typing:stop');
      };
   }, [roomId, user?.id, addMessage, addTypingUser, removeTypingUser]);

   useEffect(() => {
      scrollToBottom();
   }, [currentMessages]);

   const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   };

   const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();

      if (!message.trim() || !roomId || !user) return;

      const messageData = {
         content: message.trim(),
         chatRoomId: roomId,
         type: 'text' as const,
      };

      socketService.sendMessage(messageData);
      setMessage('');

      // Stop typing indicator
      if (isTyping) {
         socketService.stopTyping(roomId, user.id);
         setIsTyping(false);
      }
   };

   const handleTyping = (value: string) => {
      setMessage(value);

      if (!roomId || !user) return;

      if (value.trim() && !isTyping) {
         socketService.startTyping(roomId, user.id);
         setIsTyping(true);
      } else if (!value.trim() && isTyping) {
         socketService.stopTyping(roomId, user.id);
         setIsTyping(false);
      }
   };

   const formatTime = (timestamp: Date) => {
      return new Date(timestamp).toLocaleTimeString([], {
         hour: '2-digit',
         minute: '2-digit',
      });
   };

   if (!roomId) {
      return (
         <div className='min-h-screen bg-background flex items-center justify-center'>
            <div className='text-center anime-float'>
               <div className='text-6xl mb-4 anime-bounce'>🌸</div>
               <h1 className='text-2xl font-bold mb-4'>Select a Chat</h1>
               <p className='text-muted-foreground'>Choose a conversation to start chatting ✨</p>
            </div>
         </div>
      );
   }

   return (
      <div className='min-h-screen bg-background flex flex-col'>
         {/* Header */}
         <header className='border-b border-border bg-card px-4 py-3'>
            <div className='flex items-center justify-between'>
               <div className='flex items-center space-x-3'>
                  <Link to='/'>
                     <Button
                        variant='ghost'
                        size='icon'
                     >
                        <ArrowLeft className='h-5 w-5' />
                     </Button>
                  </Link>
                  <div>
                     <h1 className='font-semibold'>🌸 Chat Room {roomId} 🌸</h1>
                     {currentTypingUsers.length > 0 && (
                        <p className='text-sm text-muted-foreground anime-pulse'>
                           {currentTypingUsers.length === 1
                              ? '✨ Someone is typing...'
                              : `✨ ${currentTypingUsers.length} people are typing...`}
                        </p>
                     )}
                  </div>
               </div>

               <div className='flex items-center space-x-2'>
                  <Button
                     variant='ghost'
                     size='icon'
                  >
                     <Phone className='h-5 w-5' />
                  </Button>
                  <Button
                     variant='ghost'
                     size='icon'
                  >
                     <Video className='h-5 w-5' />
                  </Button>
               </div>
            </div>
         </header>

         {/* Messages */}
         <div className='flex-1 overflow-y-auto p-4 space-y-4'>
            {currentMessages.length === 0 ? (
               <div className='text-center text-muted-foreground anime-float'>
                  <div className='text-4xl mb-4'>💬</div>
                  <p>No messages yet. Start the conversation! ✨</p>
               </div>
            ) : (
               currentMessages.map((msg) => (
                  <div
                     key={msg.id}
                     className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'} anime-slide-in-${
                        msg.senderId === user?.id ? 'right' : 'left'
                     }`}
                  >
                     <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg anime-hover-lift relative ${
                           msg.senderId === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                     >
                        <p className='text-sm'>{msg.content}</p>
                        <p
                           className={`text-xs mt-1 ${
                              msg.senderId === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                           }`}
                        >
                           🕐 {formatTime(msg.timestamp)}
                        </p>
                        {msg.senderId === user?.id && <span className='anime-sparkle'></span>}
                     </div>
                  </div>
               ))
            )}
            <div ref={messagesEndRef} />
         </div>

         {/* Message Input */}
         <div className='border-t border-border bg-card p-4'>
            <form
               onSubmit={handleSendMessage}
               className='flex space-x-2'
            >
               <input
                  type='text'
                  value={message}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder='Type a message... ✨'
                  className='flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring anime-hover-scale'
               />
               <Button
                  type='submit'
                  disabled={!message.trim()}
                  className='anime-button-press anime-hover-lift'
               >
                  <Send className='h-4 w-4' />
                  <span className='ml-1 hidden sm:inline'>Send</span>
               </Button>
            </form>
         </div>
      </div>
   );
};

export default ChatPage;
