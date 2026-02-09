import { Plus, AlertCircle } from 'lucide-react';
import { useStories } from '@/hooks';
import { useAuthStore } from '@/store';

interface StoriesProps {
   // Props for future customization
}

const Stories = ({}: StoriesProps) => {
   const { stories, loading, error, markAsViewed } = useStories();
   const { user } = useAuthStore();

   const handleStoryClick = (storyId: string) => {
      markAsViewed(storyId);
      // TODO: Open story viewer modal
   };

   const handleCreateStory = () => {
      // TODO: Open create story modal
   };

   if (loading) {
      return (
         <div className='bg-card border-b border-border p-4 rounded-4xl overflow-hidden liquid-glass'>
            <div className='flex space-x-4 overflow-x-auto scrollbar-hide'>
               {Array.from({ length: 5 }, (_, i) => (
                  <div
                     key={i}
                     className='flex flex-col items-center space-y-1 shrink-0'
                  >
                     <div className='w-14 h-14 rounded-full bg-gray-200 animate-pulse'></div>
                     <div className='w-12 h-3 bg-gray-200 rounded animate-pulse'></div>
                  </div>
               ))}
            </div>
         </div>
      );
   }

   if (error) {
      return (
         <div className='bg-card border-b border-border p-4 rounded-4xl overflow-hidden liquid-glass'>
            <div className='flex items-center justify-center py-8'>
               <AlertCircle className='w-5 h-5 text-red-500 mr-2' />
               <span className='text-red-600 text-sm'>Failed to load stories</span>
            </div>
         </div>
      );
   }

   return (
      <div className='bg-card border-b border-border p-4 rounded-4xl overflow-hidden liquid-glass'>
         <div className='flex space-x-4 overflow-x-auto scrollbar-hide'>
            {/* Your Story / Create Story */}
            {user && (
               <div
                  className='flex flex-col items-center space-y-1 shrink-0 cursor-pointer'
                  onClick={handleCreateStory}
               >
                  <div className='relative'>
                     <div className='bg-background p-0.5 rounded-full'>
                        <div className='w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden relative'>
                           {user.avatar ? (
                              <img
                                 src={user.avatar}
                                 alt={user.username}
                                 className='w-full h-full object-cover'
                                 onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">${user.username
                                       .charAt(0)
                                       .toUpperCase()}</div>`;
                                 }}
                              />
                           ) : (
                              <div className='w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm'>
                                 {user.username.charAt(0).toUpperCase()}
                              </div>
                           )}
                           <div className='absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white'>
                              <Plus
                                 size={12}
                                 className='text-white'
                              />
                           </div>
                        </div>
                     </div>
                  </div>
                  <span className='text-xs text-muted-foreground max-w-[60px] truncate'>Your Story</span>
               </div>
            )}

            {/* Stories from API */}
            {stories.map((story) => (
               <div
                  key={story.id}
                  className='flex flex-col items-center space-y-1 shrink-0 cursor-pointer'
                  onClick={() => handleStoryClick(story.id)}
               >
                  <div
                     className={`relative ${
                        !story.isViewed ? 'bg-linear-to-tr from-yellow-400 to-fuchsia-600 p-0.5 rounded-full' : ''
                     }`}
                  >
                     <div className='bg-background p-0.5 rounded-full'>
                        <div className='w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden'>
                           <img
                              src={
                                 story.user.avatar ||
                                 `/api/placeholder/60/60?text=${story.user.username.charAt(0).toUpperCase()}`
                              }
                              alt={story.user.username}
                              className='w-full h-full object-cover'
                              onError={(e) => {
                                 const target = e.target as HTMLImageElement;
                                 target.style.display = 'none';
                                 target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">${story.user.username
                                    .charAt(0)
                                    .toUpperCase()}</div>`;
                              }}
                           />
                        </div>
                     </div>
                  </div>
                  <span className='text-xs text-muted-foreground max-w-[60px] truncate'>{story.user.username}</span>
               </div>
            ))}

            {/* Empty state if no stories */}
            {stories.length === 0 && (
               <div className='flex items-center justify-center py-8 text-gray-500 text-sm'>
                  No stories yet. Be the first to share!
               </div>
            )}
         </div>
      </div>
   );
};

export default Stories;
