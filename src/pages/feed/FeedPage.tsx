import { useEffect, useCallback, useRef } from 'react';
import { useFeedStore } from '@/hooks';
import InstagramLayout from '@/components/layout/InstagramLayout';
import OnlineUsers from '@/components/features/post/OnlineUsers';
import PostCard from '@/components/features/post/PostCard';
import { PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';
import type { Post } from '@/types';

// Transform API Post to PostCard expected format
const transformPostForCard = (post: Post) => {
   const timeAgo = (date: string) => {
      const now = new Date();
      const postDate = new Date(date);
      const diffInMs = now.getTime() - postDate.getTime();
      const diffInMinutes = Math.floor(diffInMs / 60000);

      if (diffInMinutes < 60) {
         return `${diffInMinutes} MINUTES AGO`;
      } else if (diffInMinutes < 1440) {
         return `${Math.floor(diffInMinutes / 60)} HOURS AGO`;
      } else {
         return `${Math.floor(diffInMinutes / 1440)} DAYS AGO`;
      }
   };

   return {
      ...post,
      timestamp: timeAgo(post.updatedAt),
   };
};

const FeedPage = () => {
   // Use the wrapper hook for cleaner code
   const { posts: rawPosts, loading, error, hasMore, loadMore, refetch } = useFeedStore();

   const loadMoreRef = useRef<HTMLDivElement>(null);

   // Ensure posts is always an array
   const posts = rawPosts || [];
   // Intersection Observer for infinite scroll
   const handleObserver = useCallback(
      (entries: IntersectionObserverEntry[]) => {
         const target = entries[0];
         if (target.isIntersecting && hasMore && !loading) {
            loadMore();
         }
      },
      [hasMore, loading, loadMore]
   );

   useEffect(() => {
      const option = {
         root: null,
         rootMargin: '20px',
         threshold: 0,
      };
      const observer = new IntersectionObserver(handleObserver, option);

      if (loadMoreRef.current) {
         observer.observe(loadMoreRef.current);
      }

      return () => {
         if (loadMoreRef.current) {
            observer.unobserve(loadMoreRef.current);
         }
      };
   }, [handleObserver]);

   // useEffect(() => {
   //    // Socket event handlers with store integration
   //    const handleNewPost = (newPost: Post) => {
   //       // Add new post to the store
   //       addPost(newPost);
   //    };

   //    const handlePostUpdated = (updatedPost: Post) => {
   //       console.log('Post updated:', updatedPost);
   //       // Update post in the store
   //       updatePost(updatedPost.id, updatedPost);
   //    };

   //    const handlePostDeleted = (postId: string) => {
   //       console.log('Post deleted:', postId);
   //       // Remove post from the store
   //       removePost(postId);
   //    };

   //    // Subscribe to socket events
   //    if (socketService.isConnected) {
   //       socketService.on('post:new', handleNewPost);
   //       socketService.on('post:updated', handlePostUpdated);
   //       socketService.on('post:deleted', handlePostDeleted);
   //    }

   //    // Cleanup socket listeners
   //    return () => {
   //       if (socketService.isConnected) {
   //          socketService.off('post:new', handleNewPost);
   //          socketService.off('post:updated', handlePostUpdated);
   //          socketService.off('post:deleted', handlePostDeleted);
   //       }
   //    };
   // }, [addPost, updatePost, removePost]);

   const handleLoadMore = async () => {
      if (hasMore && !loading) {
         await loadMore();
      }
   };

   const handleRefresh = async () => {
      await refetch();
   };

   // Error state
   if (error && posts.length === 0) {
      return (
         <InstagramLayout>
            <div className='flex flex-col items-center justify-center min-h-[400px] space-y-4'>
               <AlertCircle className='w-12 h-12 text-red-500' />
               <div className='text-center'>
                  <h3 className='font-semibold text-gray-900 mb-2'>Oops! Something went wrong</h3>
                  <p className='text-gray-600 mb-4'>{error}</p>
                  <button
                     onClick={handleRefresh}
                     className='flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors'
                  >
                     <RefreshCw className='w-4 h-4' />
                     Try Again
                  </button>
               </div>
            </div>
         </InstagramLayout>
      );
   }

   return (
      <InstagramLayout>
         <div className='space-y-2 w-full max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto scrollbar-feed'>
            {/* Online Users section */}
            <div className='flex flex-row gap-4 '>
               <div className='w-full space-y-2 scrollbar-feed'>
                  <OnlineUsers />

                  {/* Posts feed with animations */}
                  <div className='space-y-2 scrollbar-feed'>
                     {posts.map((post: Post, index: number) => (
                        <div
                           key={post.id}
                           className={`anime-slide-in-${index % 2 === 0 ? 'left' : 'right'}`}
                           style={{ animationDelay: `${index * 200}ms` }}
                        >
                           <PostCard post={transformPostForCard(post)} />
                        </div>
                     ))}
                  </div>

                  {/* Empty state */}
                  {!loading && posts.length === 0 && !error && (
                     <div className='text-center py-12'>
                        <div className='text-gray-500 mb-4'>
                           <PlusCircle className='w-16 h-16 mx-auto mb-4 opacity-50' />
                           <h3 className='text-lg font-medium text-gray-900 mb-2'>No posts yet</h3>
                           <p className='text-gray-600'>Be the first to share something amazing!</p>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* Loading indicator and infinite scroll trigger */}
            {loading && (
               <div className='flex justify-center py-8'>
                  <div className='anime-spinner'></div>
                  <span className='ml-3 text-muted-foreground anime-pulse font-anime'>
                     Loading more awesome content...
                  </span>
               </div>
            )}

            {/* Intersection observer target for infinite scroll */}
            <div
               ref={loadMoreRef}
               className='h-4'
            />

            {/* Manual load more button (fallback) */}
            {!loading && hasMore && posts.length > 0 && (
               <div className='flex justify-center py-3'>
                  <button
                     onClick={handleLoadMore}
                     className='bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium'
                  >
                     Load More Posts
                  </button>
               </div>
            )}

            {/* End of feed indicator */}
            {!loading && !hasMore && posts.length > 0 && (
               <div className='text-center py-8'>
                  <p className='text-gray-500 font-anime'>You've reached the end! Time for some anime break 🍃</p>
               </div>
            )}
         </div>
      </InstagramLayout>
   );
};

export default FeedPage;
