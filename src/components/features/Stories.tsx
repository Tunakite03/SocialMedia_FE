import { Plus } from 'lucide-react';

interface Story {
   id: string;
   username: string;
   avatar: string;
   hasStory: boolean;
   isOwn?: boolean;
}

interface StoriesProps {
   stories?: Story[];
}

const Stories = ({ stories = [] }: StoriesProps) => {
   // Mock data for demonstration
   const mockStories: Story[] = [
      {
         id: 'own',
         username: 'Your Story',
         avatar: '/api/placeholder/60/60',
         hasStory: false,
         isOwn: true,
      },
      {
         id: '1',
         username: 'john_doe',
         avatar: '/api/placeholder/60/60',
         hasStory: true,
      },
      {
         id: '2',
         username: 'jane_smith',
         avatar: '/api/placeholder/60/60',
         hasStory: true,
      },
      {
         id: '3',
         username: 'travel_guy',
         avatar: '/api/placeholder/60/60',
         hasStory: true,
      },
      {
         id: '4',
         username: 'foodie_life',
         avatar: '/api/placeholder/60/60',
         hasStory: true,
      },
   ];

   const displayStories = stories.length > 0 ? stories : mockStories;

   return (
      <div className='bg-card border-b border-border p-4 rounded-4xl overflow-hidden liquid-glass '>
         <div className='flex space-x-4 overflow-x-auto scrollbar-hide'>
            {displayStories.map((story) => (
               <div
                  key={story.id}
                  className='flex flex-col items-center space-y-1 shrink-0 cursor-pointer'
               >
                  <div
                     className={`relative ${
                        story.hasStory ? 'bg-linear-to-tr from-yellow-400 to-fuchsia-600 p-0.5 rounded-full' : ''
                     }`}
                  >
                     <div className='bg-background p-0.5 rounded-full'>
                        <div className='w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden'>
                           {story.isOwn ? (
                              <div className='w-full h-full bg-gray-100 flex items-center justify-center'>
                                 <Plus
                                    size={20}
                                    className='text-muted-foreground'
                                 />
                              </div>
                           ) : (
                              <img
                                 src={story.avatar}
                                 alt={story.username}
                                 className='w-full h-full object-cover'
                                 onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">${story.username
                                       .charAt(0)
                                       .toUpperCase()}</div>`;
                                 }}
                              />
                           )}
                        </div>
                     </div>
                  </div>
                  <span className='text-xs text-muted-foreground max-w-[60px] truncate'>
                     {story.isOwn ? 'Your Story' : story.username}
                  </span>
               </div>
            ))}
         </div>
      </div>
   );
};

export default Stories;
