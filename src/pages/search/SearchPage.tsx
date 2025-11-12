import { useState, useEffect } from 'react';
import { Search, User, Users } from 'lucide-react';
import InstagramLayout from '@/components/layout/InstagramLayout';
import { useUserSearch, useFollow } from '@/hooks';
import { useAuthStore } from '@/store';
import { UserSearchSkeleton } from '@/components/ui/loading';
import type { SearchUser } from '@/types';

const SearchPage = () => {
   const [searchQuery, setSearchQuery] = useState('');
   const [isTyping, setIsTyping] = useState(false);
   const { users, loading: searchLoading, error, searchUsers } = useUserSearch();
   const { followUser, unfollowUser, loading: followLoading } = useFollow();
   const { isAuthenticated } = useAuthStore();

   // Debounced search
   useEffect(() => {
      const timer = setTimeout(() => {
         if (searchQuery.trim()) {
            searchUsers(searchQuery);
         }
         setIsTyping(false);
      }, 400);

      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [searchQuery]); // searchUsers is stable from the hook

   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      if (e.target.value.trim()) {
         setIsTyping(true);
      } else {
         setIsTyping(false);
      }
   };

   const handleFollowToggle = async (user: SearchUser) => {
      if (!isAuthenticated) return;

      try {
         if (user.isFollowing) {
            await unfollowUser(user.id);
            // Optimistically update UI
            user.isFollowing = false;
            user._count.followers--;
         } else {
            await followUser(user.id);
            // Optimistically update UI
            user.isFollowing = true;
            user._count.followers++;
         }
      } catch (error) {
         console.error('Failed to toggle follow:', error);
      }
   };

   const UserCard = ({ user }: { user: SearchUser }) => (
      <div className='card-liquid-glass p-4 mb-4 anime-hover-scale text-foreground'>
         <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
               <div className='relative'>
                  <img
                     src={user.avatar || '/images/avatar/default-avatar.png'}
                     alt={user.displayName}
                     className='w-12 h-12 rounded-full object-cover border-2 border-gray-200'
                     onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/avatar/default-avatar.png';
                     }}
                  />
                  <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full'></div>
               </div>
               <div className='flex-1'>
                  <div className='flex gap-3 items-center'>
                     <h3 className='font-semibold  font-anime'>{user.displayName}</h3>
                     <p className='text-sm text-muted-foreground'>@{user.username}</p>
                  </div>

                  {user.bio && <p className='text-sm text-gray-500 mt-1 line-clamp-2'>{user.bio}</p>}
                  <div className='flex items-center space-x-4 mt-2 text-xs'>
                     <div className='flex items-center space-x-1'>
                        <Users size={12} />
                        <span>{user._count.followers} followers</span>
                     </div>
                     <div className='flex items-center space-x-1'>
                        <User size={12} />
                        <span>{user._count.following} following</span>
                     </div>
                  </div>
               </div>
            </div>
            {isAuthenticated && (
               <button
                  onClick={() => handleFollowToggle(user)}
                  disabled={followLoading}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                     user.isFollowing
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 anime-button-press'
                        : 'bg-linear-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 anime-button-press'
                  }`}
               >
                  {user.isFollowing ? 'Following' : 'Follow'}
               </button>
            )}
         </div>
      </div>
   );

   return (
      <InstagramLayout>
         <div className='p-4 max-w-2xl mx-auto'>
            {/* Search header */}
            <div className='mb-6'>
               <div className='relative'>
                  <Search
                     className='absolute left-3 top-1/2 transform -translate-y-1/2 '
                     size={20}
                  />
                  <input
                     type='text'
                     placeholder='Search for users...'
                     value={searchQuery}
                     onChange={handleInputChange}
                     className='w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-0 transition-all duration-200 font-anime'
                  />
                  {searchLoading && (
                     <div className='absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 '></div>
                     </div>
                  )}
               </div>
            </div>

            {/* Search Results */}
            {searchQuery.trim() && (
               <div className='mb-6 text-foreground'>
                  <h2 className='text-lg font-semibold mb-4 font-anime'>Search Results</h2>

                  {/* Results Container with Smooth Transitions */}
                  <div className='relative min-h-[200px]'>
                     {/* Loading State */}
                     <div
                        className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                           searchLoading || isTyping
                              ? 'opacity-100 transform translate-y-0'
                              : 'opacity-0 transform -translate-y-4 pointer-events-none'
                        }`}
                     >
                        <UserSearchSkeleton count={3} />
                     </div>

                     {/* Error State */}
                     <div
                        className={`absolute inset-0 transition-all duration-500 ease-in-out flex items-center justify-center ${
                           !searchLoading && error
                              ? 'opacity-100 transform translate-y-0'
                              : 'opacity-0 transform translate-y-4 pointer-events-none'
                        }`}
                     >
                        <div className='card-liquid-glass p-4 text-center w-full max-w-md'>
                           <p className='text-red-600 font-medium'>{error}</p>
                        </div>
                     </div>

                     {/* No Results State */}
                     <div
                        className={`absolute inset-0 transition-all duration-500 ease-in-out flex items-center justify-center ${
                           !searchLoading && !error && !isTyping && users.length === 0
                              ? 'opacity-100 transform translate-y-0'
                              : 'opacity-0 transform translate-y-4 pointer-events-none'
                        }`}
                     >
                        <div className='card-liquid-glass p-8 text-center w-full max-w-md'>
                           <Search className='mx-auto h-12 w-12 mb-4 anime-pulse' />
                           <h3 className='text-lg font-medium  mb-2 font-anime'>No users found</h3>
                           <p className='text-muted-foreground'>Try searching with a different keyword</p>
                        </div>
                     </div>

                     {/* Results State */}
                     <div
                        className={`transition-all duration-500 ease-in-out ${
                           !searchLoading && !error && !isTyping && users.length > 0
                              ? 'opacity-100 transform translate-y-0'
                              : 'opacity-0 transform translate-y-4 pointer-events-none'
                        }`}
                     >
                        <div className='space-y-2'>
                           {users.map((user, index) => (
                              <div
                                 key={user.id}
                                 className='anime-slide-in-left'
                                 style={{
                                    animationDelay: `${index * 100}ms`,
                                    animationFillMode: 'both',
                                 }}
                              >
                                 <UserCard user={user} />
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* Default Explore Grid when no search */}
            {!searchQuery.trim() && (
               <>
                  <div className='mb-6 text-foreground'>
                     <h2 className='text-lg font-semibold'>Explore</h2>
                     <p className='text-sm mt-1'>Discover new people and content</p>
                  </div>
               </>
            )}
         </div>
      </InstagramLayout>
   );
};

export default SearchPage;
