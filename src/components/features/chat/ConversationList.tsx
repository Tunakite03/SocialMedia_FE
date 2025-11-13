import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useChatStore, useAuthStore } from '@/store';
import { messageService } from '@/services/messageService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Plus, Search } from 'lucide-react';
import NewChatModal from './NewChatModal';
import type { Conversation } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ConversationItemProps {
   conversation: Conversation;
   isActive: boolean;
   onClick: () => void;
   currentUserId: string;
}

const ConversationItem = ({ conversation, isActive, onClick, currentUserId }: ConversationItemProps) => {
   const getConversationDisplay = () => {
      if (conversation.type === 'GROUP') {
         return {
            name: conversation.title || 'Group Chat',
            avatar: null, // Could show group avatar
            subtitle: `${conversation.participants.length} members`,
         };
      }

      // Direct conversation - show other participant
      const otherParticipant = conversation.participants.find((p) => p.user.id !== currentUserId);
      if (otherParticipant) {
         return {
            name: otherParticipant.user.displayName,
            avatar: otherParticipant.user.avatar,
            subtitle: otherParticipant.user.isOnline ? 'Online' : 'Offline',
         };
      }

      return {
         name: 'Unknown',
         avatar: null,
         subtitle: '',
      };
   };

   const formatLastMessageTime = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
         return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      if (diffInHours < 168) {
         // 7 days
         return date.toLocaleDateString([], { weekday: 'short' });
      }

      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
   };

   const { name, avatar, subtitle } = getConversationDisplay();
   const hasUnread = (conversation.unreadCount ?? 0) > 0;

   return (
      <div
         onClick={onClick}
         className={`
            flex items-center p-3 cursor-pointer transition-all duration-200
            anime-hover-lift hover:bg-muted/50 border-l-2
            ${isActive ? 'bg-primary/10 border-primary shadow-lg' : 'border-transparent hover:border-accent/30'}
         `}
      >
         <div className='relative'>
            <Avatar className='h-12 w-12 anime-hover-scale'>
               <AvatarImage
                  src={avatar || ''}
                  alt={name}
               />
               <AvatarFallback className='bg-linear-to-br from-accent to-secondary text-accent-foreground'>
                  {name.slice(0, 2).toUpperCase()}
               </AvatarFallback>
            </Avatar>
            {conversation.type === 'DIRECT' && subtitle === 'Online' && (
               <div className='absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background anime-pulse' />
            )}
         </div>

         <div className='ml-3 flex-1 min-w-0'>
            <div className='flex items-center justify-between'>
               <h3 className={`font-medium truncate ${hasUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                  {name}
               </h3>
               {conversation.lastMessage && (
                  <span className='text-xs text-muted-foreground'>
                     {formatLastMessageTime(conversation.lastMessage.createdAt)}
                  </span>
               )}
            </div>

            <div className='flex items-center justify-between mt-1'>
               {conversation.lastMessage ? (
                  <p
                     className={`text-sm truncate ${
                        hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground'
                     }`}
                  >
                     {conversation.lastMessage.type === 'IMAGE' && '📷 Photo'}
                     {conversation.lastMessage.type === 'FILE' && '📎 File'}
                     {conversation.lastMessage.type === 'VOICE' && '🎵 Voice message'}
                     {conversation.lastMessage.type === 'TEXT' && conversation.lastMessage.content}
                  </p>
               ) : (
                  <p className='text-sm text-muted-foreground italic'>No messages yet</p>
               )}

               {hasUnread && (
                  <span className='min-w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center anime-bounce'>
                     {conversation.unreadCount! > 99 ? '99+' : conversation.unreadCount}
                  </span>
               )}
            </div>
         </div>
      </div>
   );
};

interface ConversationListProps {
   // No props needed
}

const ConversationList = ({}: ConversationListProps) => {
   const navigate = useNavigate();
   const { conversationId } = useParams<{ conversationId: string }>();
   const { user } = useAuthStore();
   const { conversations, setConversations, isLoading, setIsLoading } = useChatStore();

   const [searchTerm, setSearchTerm] = useState('');
   const [showNewChatModal, setShowNewChatModal] = useState(false);

   useEffect(() => {
      loadConversations();
   }, []);

   const loadConversations = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
         const response = await messageService.getConversations();

         if (response.success && response.data) {
            setConversations(response.data.conversations);
         } else {
            setConversations([]);
         }
      } catch (error) {
         console.error('Failed to load conversations:', error);
         setConversations([]);
      } finally {
         setIsLoading(false);
      }
   };

   const handleConversationClick = (conversation: Conversation) => {
      navigate(`/chat/${conversation.id}`);
   };

   const handleNewChat = () => {
      setShowNewChatModal(true);
   };

   const filteredConversations = conversations.filter((conversation: Conversation) => {
      if (!searchTerm.trim()) return true;

      const searchLower = searchTerm.toLowerCase();

      if (conversation.type === 'GROUP') {
         return conversation.title?.toLowerCase().includes(searchLower);
      }

      // Direct conversation - search by participant name
      const otherParticipant = conversation.participants.find((p: any) => p.user.id !== user?.id);
      return (
         otherParticipant?.user.displayName.toLowerCase().includes(searchLower) ||
         otherParticipant?.user.username.toLowerCase().includes(searchLower)
      );
   });

   return (
      <div className='h-full flex flex-col bg-card border-r border-border lg:border-r-0'>
         {/* Header */}
         <div className='p-4 border-b border-border'>
            <div className='flex items-center justify-between mb-3'>
               <div className='lg:hidden flex'>
                  <Link to='/feed'>
                     <Button
                        variant='ghost'
                        size='icon'
                        className='anime-hover-scale shrink-0'
                     >
                        <ArrowLeft className='h-10 w-10' />
                     </Button>
                  </Link>
               </div>
               <h1 className='text-xl font-bold flex items-center gap-2'>
                  <MessageCircle className='h-5 w-5 text-primary' />
                  <span className='text-transparent bg-linear-to-r from-primary to-accent bg-clip-text'>Messages</span>
               </h1>
               <Button
                  onClick={handleNewChat}
                  size='icon'
                  variant='ghost'
                  className='anime-hover-scale'
               >
                  <Plus className='h-4 w-4' />
               </Button>
            </div>

            {/* Search */}
            <div className='relative'>
               <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
               <input
                  type='text'
                  placeholder='Search conversations...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring anime-hover-scale'
               />
            </div>
         </div>

         {/* Conversations List */}
         <div className='flex-1 overflow-y-auto'>
            {isLoading ? (
               <div className='p-4 space-y-3'>
                  {Array.from({ length: 5 }).map((_, i) => (
                     <div
                        key={i}
                        className='flex items-center p-3 animate-pulse'
                     >
                        <div className='w-12 h-12 bg-muted rounded-full' />
                        <div className='ml-3 flex-1'>
                           <div className='h-4 bg-muted rounded w-3/4 mb-2' />
                           <div className='h-3 bg-muted rounded w-1/2' />
                        </div>
                     </div>
                  ))}
               </div>
            ) : filteredConversations.length === 0 ? (
               <div className='p-8 text-center'>
                  <div className='text-6xl mb-4 anime-float'>💬</div>
                  <h3 className='text-lg font-medium mb-2'>
                     {searchTerm.trim() ? 'No conversations found' : 'No conversations yet'}
                  </h3>
                  <p className='text-muted-foreground mb-4'>
                     {searchTerm.trim()
                        ? 'Try adjusting your search terms'
                        : 'Start a conversation to connect with others ✨'}
                  </p>
                  {!searchTerm.trim() && (
                     <Button
                        onClick={handleNewChat}
                        className='anime-button-press'
                     >
                        <Plus className='h-4 w-4 mr-2' />
                        New Chat
                     </Button>
                  )}
               </div>
            ) : (
               <div className='divide-y divide-border/50'>
                  {filteredConversations.map((conversation: Conversation, index: number) => (
                     <div
                        key={conversation.id}
                        className='anime-slide-in-left'
                        style={{ animationDelay: `${index * 50}ms` }}
                     >
                        <ConversationItem
                           conversation={conversation}
                           isActive={conversationId === conversation.id}
                           onClick={() => handleConversationClick(conversation)}
                           currentUserId={user?.id || ''}
                        />
                     </div>
                  ))}
               </div>
            )}
         </div>

         {/* New Chat Modal */}
         <NewChatModal
            isOpen={showNewChatModal}
            onClose={() => setShowNewChatModal(false)}
         />
      </div>
   );
};

export default ConversationList;
