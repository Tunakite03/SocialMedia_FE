import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import { socketService } from '@/services/socketService';
import InstagramLayout from '@/components/layout/InstagramLayout';
import Stories from '@/components/features/Stories';
import PostCard from '@/components/features/PostCard';

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
         <div className='space-y-0'>
            {/* Hero Section inspired by Figma */}
            <div className='bg-linear-to-br from-primary/5 to-secondary/5 py-8 px-4 mb-6 relative overflow-hidden'>
               {/* Background decorative elements */}
               <div className='absolute top-4 right-4 opacity-20'>
                  <div className='w-16 h-16 rounded-full bg-primary/20 anime-float'></div>
               </div>
               <div className='absolute bottom-4 left-4 opacity-20'>
                  <div className='w-12 h-12 rounded-full bg-secondary/20 anime-bounce'></div>
               </div>

               <div className='max-w-lg mx-auto text-center'>
                  <h1 className='font-heading text-4xl md:text-5xl lg:text-6xl text-gradient-anime mb-4 anime-slide-in-left'>
                     Bring Your Anime
                     <br />
                     Worlds to Life
                  </h1>

                  <p
                     className='font-anime text-lg text-muted-foreground mb-6 leading-relaxed anime-slide-in-right'
                     style={{ animationDelay: '0.3s' }}
                  >
                     Create, showcase, and sell your digital art and cartoon creations with ease.
                  </p>

                  {/* CTA Buttons from Figma */}
                  <div
                     className='flex flex-col sm:flex-row gap-4 justify-center items-center anime-slide-in-left'
                     style={{ animationDelay: '0.6s' }}
                  >
                     <button className='btn-anime-primary anime-hover-lift'>Start now</button>
                     <button className='btn-anime-secondary anime-hover-lift'>Enroll Now</button>
                  </div>

                  {/* Promotional badge */}
                  <div
                     className='mt-6 anime-bounce'
                     style={{ animationDelay: '0.9s' }}
                  >
                     <div className='inline-block'>
                        <span className='badge-anime-promo'>50% Off</span>
                        <p className='font-anime text-sm text-muted-foreground mt-2'>Join our anime class</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Stories section with anime float */}
            <div className='anime-float'>
               <Stories />
            </div>

            {/* Posts feed with animations */}
            <div className='space-y-0'>
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
