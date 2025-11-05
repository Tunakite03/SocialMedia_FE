import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import { socketService } from '@/services/socketService';
import InstagramLayout from '@/components/layout/InstagramLayout';
import Stories from '@/components/features/Stories';
import PostCard from '@/components/features/PostCard';
import { PlusCircle } from 'lucide-react';

const FeedPage = () => {
   useEffect(() => {
      // Initialize socket connection if not already connected
      const token = useAuthStore.getState().token;
      if (token && !socketService.isConnected) {
         socketService.connect(token);
      }
   }, []);

   // Mock data for posts with anime touches
   const mockPosts = [
      {
         id: '1',
         user: {
            username: '桜_traveler',
            avatar: '/api/placeholder/40/40',
         },
         image: '/api/placeholder/400/400',
         caption: '桜の季節がやってきた！ Amazing sakura season in Japan! 🌸✨ #sakura #japan #travel #spring',
         likes: 2847,
         comments: 156,
         shares: 89,
         views: 15600,
         timestamp: '2 HOURS AGO',
         isLiked: false,
         isBookmarked: false,
      },
      {
         id: '2',
         user: {
            username: 'ramen_lover',
            avatar: '/api/placeholder/40/40',
         },
         image: '/api/placeholder/400/500',
         caption: 'おいしいラーメン！ Homemade tonkotsu ramen! 🍜 Recipe inspired by anime! #ramen #anime #food',
         likes: 1892,
         comments: 89,
         shares: 45,
         views: 8900,
         timestamp: '4 HOURS AGO',
         isLiked: true,
         isBookmarked: true,
      },
      {
         id: '3',
         user: {
            username: 'manga_collection',
            avatar: '/api/placeholder/40/40',
         },
         image: '/api/placeholder/400/300',
         caption: '新しいマンガコレクション！ New manga collection setup! 📚✨ #manga #otaku #collection',
         likes: 3256,
         comments: 234,
         shares: 167,
         views: 21000,
         timestamp: '6 HOURS AGO',
         isLiked: false,
         isBookmarked: false,
      },
      {
         id: '4',
         user: {
            username: 'cosplay_life',
            avatar: '/api/placeholder/40/40',
         },
         image: '/api/placeholder/400/600',
         caption:
            "今日のコスプレ！ Today's cosplay practice! 🎌💫 Working on my Nezuko costume! #cosplay #anime #demonslayer",
         likes: 1756,
         comments: 67,
         shares: 23,
         views: 7800,
         timestamp: '8 HOURS AGO',
         isLiked: true,
         isBookmarked: false,
      },
   ];

   return (
      <InstagramLayout>
         <div className='space-y-2 w-full pt-5'>
            {/* Stories section with anime float */}
            <div className='flex flex-row gap-4 '>
               <div className='w-full space-y-2'>
                  <Stories />
                  {/* Posts feed with animations */}
                  <div className='space-y-2'>
                     {mockPosts.map((post, index) => (
                        <div
                           key={post.id}
                           className={`anime-slide-in-${index % 2 === 0 ? 'left' : 'right'}`}
                           style={{ animationDelay: `${index * 200}ms` }}
                        >
                           <PostCard post={post} />
                        </div>
                     ))}
                  </div>
               </div>

               {/* Right sidebar for desktop */}
               <div className='hidden lg:block'>
                  <div className='space-y-4'>
                     <div className='bg-white rounded-4xl p-4 border border-gray-200'>
                        <h3 className='font-semibold text-gray-900 mb-3 text-sm'>Suggestions for you</h3>
                        <div className='space-y-3'>
                           {Array.from({ length: 3 }, (_, i) => (
                              <div
                                 key={i}
                                 className='flex items-start justify-between gap-x-3'
                              >
                                 <div className='flex items-center space-x-3'>
                                    <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
                                    <div>
                                       <p className='text-sm font-semibold'>suggested_{i + 1}</p>
                                       <p className='text-xs text-gray-500'>Follows you</p>
                                    </div>
                                 </div>
                                 <button className='text-blue-500 text-xs font-semibold hover:text-blue-700'>
                                    <PlusCircle className='w-5 h-5 inline-block mr-1 text-black' />
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Loading indicator with anime style */}
            <div className='flex justify-center py-8'>
               <div className='anime-spinner'></div>
               <span className='ml-3 text-muted-foreground anime-pulse font-anime'>
                  Loading more awesome content...
               </span>
            </div>
         </div>
      </InstagramLayout>
   );
};

export default FeedPage;
