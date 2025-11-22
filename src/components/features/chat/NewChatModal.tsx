import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { useConversations } from '@/hooks/useConversations';
import { useUserSearch, useDebounce } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Search, MessageCircle, Users } from 'lucide-react';
import { LoadingSpinner, UserSearchSkeleton } from '@/components/ui/loading';
import type { SearchUser } from '@/types';

interface NewChatModalProps {
   isOpen: boolean;
   onClose: () => void;
}

const NewChatModal = ({ isOpen, onClose }: NewChatModalProps) => {
   const navigate = useNavigate();
   const { user } = useAuthStore();
   const { createDirectConversation, createGroupConversation, conversations } = useConversations();

   // Use existing search hook
   const { users: searchResults, loading: isSearching, error: searchError, searchUsers } = useUserSearch();

   const [searchTerm, setSearchTerm] = useState('');
   const [isTyping, setIsTyping] = useState(false);
   const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
   const [isCreatingGroup, setIsCreatingGroup] = useState(false);
   const [groupName, setGroupName] = useState('');
   const [isCreating, setIsCreating] = useState(false);
   const [selectedIndex, setSelectedIndex] = useState(-1);
   const [error, setError] = useState<string | null>(null);

   // Debounce search term
   const debouncedSearchTerm = useDebounce(searchTerm, 300);

   const searchInputRef = useRef<HTMLInputElement>(null);

   // Filter out current user from search results
   const filteredSearchResults = searchResults.filter((u) => u.id !== user?.id);

   // Effect to trigger search when debounced term changes
   useEffect(() => {
      if (debouncedSearchTerm.trim()) {
         setIsTyping(false);
         searchUsers(debouncedSearchTerm);
      }
   }, [debouncedSearchTerm]);

   const handleSearchChange = (value: string) => {
      setIsTyping(true);
      setSearchTerm(value);
   };

   const handleStartDirectChat = async (targetUser: SearchUser) => {
      try {
         setError(null);
         const conversation = await createDirectConversation(targetUser.id);
         if (conversation) {
            navigate(`/chat/${conversation.id}`);
            onClose();
         } else {
            setError('Failed to start conversation. Please try again.');
         }
      } catch (error) {
         console.error('Failed to start chat:', error);
         setError('Failed to start conversation. Please try again.');
      }
   };

   const handleUserSelect = (selectedUser: SearchUser) => {
      if (isCreatingGroup) {
         const isAlreadySelected = selectedUsers.find((u) => u.id === selectedUser.id);
         if (isAlreadySelected) {
            // Remove user if already selected
            setSelectedUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
         } else if (selectedUsers.length < 50) {
            // Add user if not at limit
            setSelectedUsers((prev) => [...prev, selectedUser]);
         } else {
            setError('Cannot add more than 50 members to a group');
         }
      } else {
         handleStartDirectChat(selectedUser);
      }
   };

   const generateGroupName = (users: SearchUser[]): string => {
      if (users.length === 0) return '';

      const names = users.map((u) => u.displayName.split(' ')[0]); // Get first names

      if (names.length === 2) {
         return `${names[0]} & ${names[1]}`;
      } else if (names.length === 3) {
         return `${names[0]}, ${names[1]} & ${names[2]}`;
      } else {
         return `${names[0]}, ${names[1]} & ${names.length - 2} others`;
      }
   };

   const handleCreateGroup = async () => {
      let finalGroupName = groupName.trim();

      // Auto-generate name if empty
      if (!finalGroupName && selectedUsers.length >= 2) {
         finalGroupName = generateGroupName(selectedUsers);
      }

      // Validation
      if (!finalGroupName) {
         setError('Group name is required');
         return;
      }

      if (finalGroupName.length < 3) {
         setError('Group name must be at least 3 characters long');
         return;
      }

      if (selectedUsers.length < 2) {
         setError('Group chat must have at least 2 members');
         return;
      }

      if (selectedUsers.length > 50) {
         setError('Group chat cannot have more than 50 members');
         return;
      }

      setIsCreating(true);
      setError(null);
      try {
         const conversation = await createGroupConversation(
            finalGroupName,
            selectedUsers.map((u) => u.id)
         );
         if (conversation) {
            navigate(`/chat/${conversation.id}`);
            onClose();
         } else {
            setError('Failed to create group. Please try again.');
         }
      } catch (error) {
         console.error('Failed to create group:', error);
         setError('Failed to create group. Please try again.');
      } finally {
         setIsCreating(false);
      }
   };

   const resetModal = () => {
      setSearchTerm('');
      setSelectedUsers([]);
      setIsCreatingGroup(false);
      setGroupName('');
      setSelectedIndex(-1);
      setError(null);
   };

   // Keyboard navigation
   useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
         const currentItems = searchTerm.trim() ? filteredSearchResults : conversations.slice(0, 5);

         switch (e.key) {
            case 'Escape':
               handleClose();
               break;
            case 'Enter':
               e.preventDefault();
               if (selectedIndex >= 0 && selectedIndex < currentItems.length) {
                  if (searchTerm.trim()) {
                     // Search results
                     handleUserSelect(filteredSearchResults[selectedIndex]);
                  } else {
                     // Recent conversations
                     const conversation = conversations[selectedIndex];
                     navigate(`/chat/${conversation.id}`);
                     onClose();
                  }
               }
               break;
            case 'ArrowDown':
               e.preventDefault();
               setSelectedIndex((prev) => (prev < currentItems.length - 1 ? prev + 1 : 0));
               break;
            case 'ArrowUp':
               e.preventDefault();
               setSelectedIndex((prev) => (prev > 0 ? prev - 1 : currentItems.length - 1));
               break;
         }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, selectedIndex, filteredSearchResults, conversations, searchTerm, isCreatingGroup]);

   // Reset selected index when search changes
   useEffect(() => {
      setSelectedIndex(-1);
   }, [searchTerm, isCreatingGroup]);

   const handleClose = () => {
      resetModal();
      onClose();
   };

   if (!isOpen) return null;

   return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 anime-fade-in p-2 sm:p-4'>
         <div className='w-full max-w-md mx-auto bg-card rounded-lg shadow-lg card-liquid-glass-animate transform transition-all duration-300 ease-out anime-bounce-in max-h-[90vh] sm:max-h-[80vh] overflow-hidden'>
            {/* Header */}
            <div className='flex items-center justify-between p-3 sm:p-4 border-b border-border'>
               <h2 className='text-lg font-semibold flex items-center gap-2'>
                  {isCreatingGroup ? (
                     <>
                        <Users className='h-5 w-5 text-primary' />
                        Create Group Chat
                     </>
                  ) : (
                     <>
                        <MessageCircle className='h-5 w-5 text-primary' />
                        New Chat
                     </>
                  )}
               </h2>
               <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleClose}
                  className='anime-hover-scale h-8 w-8 sm:h-10 sm:w-10'
               >
                  <X className='h-4 w-4' />
               </Button>
            </div>

            {/* Content */}
            <div className='p-3 sm:p-4 max-h-[calc(90vh-8rem)] sm:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent'>
               {/* Chat type selector */}
               <div className='flex space-x-2 mb-4'>
                  <Button
                     variant={!isCreatingGroup ? 'default' : 'outline'}
                     size='sm'
                     onClick={() => setIsCreatingGroup(false)}
                     className='anime-button-press'
                  >
                     <MessageCircle className='h-4 w-4 mr-2' />
                     Direct Chat
                  </Button>
                  <Button
                     variant={isCreatingGroup ? 'default' : 'outline'}
                     size='sm'
                     onClick={() => setIsCreatingGroup(true)}
                     className='anime-button-press'
                  >
                     <Users className='h-4 w-4 mr-2' />
                     Group Chat
                  </Button>
               </div>

               {/* Group name input */}
               {isCreatingGroup && (
                  <div className='mb-4'>
                     <input
                        type='text'
                        placeholder={
                           selectedUsers.length >= 2
                              ? `Group name (or leave empty to auto-generate)...`
                              : 'Group name (required)...'
                        }
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className={`w-full px-3 py-2 bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 anime-hover-scale ${
                           groupName.trim()
                              ? 'border-border focus:ring-ring'
                              : 'border-destructive/50 focus:ring-destructive/50'
                        }`}
                        maxLength={50}
                     />
                     <p className='text-xs text-muted-foreground mt-1'>{groupName.length}/50 characters</p>
                  </div>
               )}

               {/* Selected users for group */}
               {isCreatingGroup && selectedUsers.length > 0 && (
                  <div className='mb-4'>
                     <p className='text-sm text-muted-foreground mb-2'>Selected members:</p>
                     <div className='flex flex-wrap gap-2'>
                        {selectedUsers.map((user, index) => (
                           <div
                              key={user.id}
                              className='flex items-center space-x-2 bg-primary/10 text-primary px-2 py-1 rounded-full text-sm anime-hover-scale transition-all duration-200 ease-out'
                              style={{ animationDelay: `${index * 50}ms` }}
                           >
                              <Avatar className='h-4 w-4'>
                                 <AvatarImage
                                    src={user.avatar || ''}
                                    alt={user.displayName}
                                 />
                                 <AvatarFallback className='text-xs'>
                                    {user.displayName.slice(0, 1).toUpperCase()}
                                 </AvatarFallback>
                              </Avatar>
                              <span>{user.displayName}</span>
                              <Button
                                 variant='ghost'
                                 size='icon'
                                 onClick={() => setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id))}
                                 className='h-4 w-4 hover:bg-destructive hover:text-destructive-foreground'
                              >
                                 <X className='h-3 w-3' />
                              </Button>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* Search */}
               <div className='relative mb-4'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <input
                     ref={searchInputRef}
                     type='text'
                     placeholder='Search users...'
                     value={searchTerm}
                     onChange={(e) => handleSearchChange(e.target.value)}
                     className='w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring anime-hover-scale'
                  />
               </div>

               {/* Error message */}
               {(error || searchError) && (
                  <div className='mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg'>
                     <p className='text-sm text-destructive'>{error || searchError}</p>
                  </div>
               )}

               {/* Recent Conversations or Search Results */}
               <div className='space-y-2'>
                  {!searchTerm.trim() ? (
                     // Recent Conversations
                     <>
                        <h3 className='text-sm font-medium text-muted-foreground mb-3'>Recent Chats</h3>
                        {conversations.slice(0, 5).map((conversation, index) => (
                           <div
                              key={conversation.id}
                              onClick={() => {
                                 navigate(`/chat/${conversation.id}`);
                                 onClose();
                              }}
                              className={`flex items-center space-x-3 p-4 sm:p-3 rounded-lg cursor-pointer transition-all duration-300 ease-out anime-hover-lift anime-slide-in-left group min-h-14 sm:min-h-0 ${
                                 selectedIndex === index && !searchTerm.trim()
                                    ? 'bg-primary/10 border border-primary shadow-lg anime-pulse'
                                    : 'hover:bg-muted/50 hover:shadow-md active:bg-muted/70'
                              }`}
                              style={{
                                 animationDelay: `${index * 100}ms`,
                                 transform: selectedIndex === index && !searchTerm.trim() ? 'scale(1.02)' : 'scale(1)',
                              }}
                           >
                              <Avatar className='h-10 w-10'>
                                 {conversation.type === 'DIRECT' ? (
                                    // For direct chats, show the other participant's avatar
                                    (() => {
                                       const otherParticipant = conversation.participants.find(
                                          (p) => p.userId !== user?.id
                                       );
                                       return (
                                          <AvatarImage
                                             src={otherParticipant?.user.avatar || ''}
                                             alt={otherParticipant?.user.displayName}
                                          />
                                       );
                                    })()
                                 ) : (
                                    // For group chats, show a group icon or first participant's avatar
                                    <div className='bg-primary/10 flex items-center justify-center'>
                                       <Users className='h-5 w-5 text-primary' />
                                    </div>
                                 )}
                                 <AvatarFallback className='bg-accent text-accent-foreground'>
                                    {conversation.type === 'DIRECT'
                                       ? conversation.participants
                                            .find((p) => p.userId !== user?.id)
                                            ?.user.displayName.slice(0, 2)
                                            .toUpperCase()
                                       : conversation.title?.slice(0, 2).toUpperCase() || 'GR'}
                                 </AvatarFallback>
                              </Avatar>
                              <div className='flex-1 min-w-0'>
                                 <h3 className='font-medium truncate'>
                                    {conversation.type === 'DIRECT'
                                       ? conversation.participants.find((p) => p.userId !== user?.id)?.user.displayName
                                       : conversation.title || 'Group Chat'}
                                 </h3>
                                 <p className='text-sm text-muted-foreground truncate'>
                                    {conversation.lastMessage?.content || 'No messages yet'}
                                 </p>
                              </div>
                              {conversation._count.unreadMessages && conversation._count.unreadMessages > 0 && (
                                 <div className='bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center'>
                                    {conversation._count.unreadMessages > 99
                                       ? '99+'
                                       : conversation._count.unreadMessages}
                                 </div>
                              )}
                           </div>
                        ))}
                        {conversations.length === 0 && (
                           <div className='text-center py-8 text-muted-foreground'>
                              <MessageCircle className='h-12 w-12 mx-auto mb-3 opacity-50' />
                              <p>No recent conversations</p>
                              <p className='text-sm'>Start a new chat to get started!</p>
                           </div>
                        )}
                     </>
                  ) : (
                     // Search Results
                     <>
                        <h3 className='text-sm font-medium text-muted-foreground mb-3'>Search Results</h3>
                        {isTyping || isSearching ? (
                           <UserSearchSkeleton count={1} />
                        ) : filteredSearchResults.length === 0 ? (
                           <div className='text-center py-4 text-muted-foreground'>No users found</div>
                        ) : (
                           filteredSearchResults.map((searchUser, index) => (
                              <div
                                 key={searchUser.id}
                                 onClick={() => handleUserSelect(searchUser)}
                                 className={`
                                    flex items-center space-x-3 p-4 sm:p-3 rounded-lg cursor-pointer
                                    transition-all duration-300 ease-out anime-hover-lift anime-slide-in-left group min-h-14 sm:min-h-0
                                    ${
                                       selectedIndex === index && searchTerm.trim()
                                          ? 'bg-primary/10 border border-primary shadow-lg anime-pulse'
                                          : isCreatingGroup && selectedUsers.find((u) => u.id === searchUser.id)
                                          ? 'bg-primary/10 border border-primary shadow-md'
                                          : 'hover:bg-muted/50 hover:shadow-md active:bg-muted/70'
                                    }
                                 `}
                                 style={{
                                    animationDelay: `${index * 100}ms`,
                                    transform:
                                       (selectedIndex === index && searchTerm.trim()) ||
                                       (isCreatingGroup && selectedUsers.find((u) => u.id === searchUser.id))
                                          ? 'scale(1.02)'
                                          : 'scale(1)',
                                 }}
                              >
                                 <Avatar className='h-10 w-10'>
                                    <AvatarImage
                                       src={searchUser.avatar || ''}
                                       alt={searchUser.displayName}
                                    />
                                    <AvatarFallback className='bg-accent text-accent-foreground'>
                                       {searchUser.displayName.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                 </Avatar>
                                 <div className='flex-1 min-w-0'>
                                    <h3 className='font-medium truncate'>{searchUser.displayName}</h3>
                                    <p className='text-sm text-muted-foreground truncate'>@{searchUser.username}</p>
                                    {searchUser._count && (
                                       <p className='text-xs text-muted-foreground'>
                                          {searchUser._count.followers} followers
                                       </p>
                                    )}
                                 </div>
                                 {isCreatingGroup && selectedUsers.find((u) => u.id === searchUser.id) && (
                                    <div className='text-primary'>✓</div>
                                 )}
                              </div>
                           ))
                        )}
                     </>
                  )}
               </div>
            </div>

            {/* Footer */}
            {isCreatingGroup && selectedUsers.length > 0 && (
               <div className='p-3 sm:p-4 border-t border-border'>
                  <Button
                     onClick={handleCreateGroup}
                     disabled={
                        (!groupName.trim() && selectedUsers.length < 2) ||
                        (groupName.trim() && groupName.trim().length < 3) ||
                        selectedUsers.length < 2 ||
                        selectedUsers.length > 50 ||
                        isCreating
                     }
                     className='w-full anime-button-press h-11 sm:h-10'
                  >
                     {isCreating ? (
                        <>
                           <LoadingSpinner
                              size='sm'
                              className='mr-2'
                           />
                           Creating Group...
                        </>
                     ) : (
                        `Create Group (${selectedUsers.length} members)`
                     )}
                  </Button>
               </div>
            )}
         </div>
      </div>
   );
};

export default NewChatModal;
