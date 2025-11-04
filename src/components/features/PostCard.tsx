import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Share2, Eye } from 'lucide-react';

interface Post {
   id: string;
   user: {
      username: string;
      avatar: string;
   };
   image: string;
   caption: string;
   likes: number;
   comments: number;
   shares?: number;
   views?: number;
   timestamp: string;
   isLiked?: boolean;
   isBookmarked?: boolean;
}

interface PostCardProps {
   post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
   const [isLiked, setIsLiked] = useState(post.isLiked || false);
   const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
   const [likesCount, setLikesCount] = useState(post.likes);
   const [showStats, setShowStats] = useState(false);

   const handleLike = () => {
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
   };

   const handleBookmark = () => {
      setIsBookmarked(!isBookmarked);
   };

   const formatCount = (count: number) => {
      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
      return count.toString();
   };

   useEffect(() => {
      const timer = setTimeout(() => setShowStats(true), 300);
      return () => clearTimeout(timer);
   }, []);

   return (
      <article className='card-anime anime-slide-in-left bg-white border-b border-gray-200 relative overflow-hidden'>
         {/* Header with enhanced styling */}
         <div className='flex items-center justify-between px-4 py-3'>
            <div className='flex items-center space-x-3'>
               <div className='w-10 h-10 rounded-full bg-linear-to-r from-primary to-secondary p-0.5 anime-hover-scale'>
                  <div className='w-full h-full rounded-full bg-white overflow-hidden'>
                     <img
                        src={post.user.avatar}
                        alt={post.user.username}
                        className='w-full h-full object-cover'
                        onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.style.display = 'none';
                           target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">${post.user.username
                              .charAt(0)
                              .toUpperCase()}</div>`;
                        }}
                     />
                  </div>
               </div>
               <div className='flex flex-col'>
                  <span className='font-anime font-semibold text-sm text-black'>{post.user.username}</span>
                  <span className='text-xs text-gray-500 font-anime'>{post.timestamp}</span>
               </div>
            </div>
            <button className='p-2 hover:bg-gray-100 rounded-full transition-colors anime-hover-scale'>
               <MoreHorizontal
                  size={16}
                  className='text-black'
               />
            </button>
         </div>

         {/* Image with hover effects */}
         <div className='w-full aspect-square bg-gray-100 relative group overflow-hidden'>
            <img
               src={post.image}
               alt='Post'
               className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
               onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">Image not available</div>`;
               }}
            />

            {/* Animated stats overlay - Figma inspired */}
            <div
               className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            >
               <div className='flex items-center gap-6 text-white'>
                  {showStats && (
                     <>
                        <div className='flex items-center gap-2 animate-count-up'>
                           <Heart
                              size={20}
                              className='text-red-400'
                           />
                           <span className='font-anime font-semibold'>{formatCount(likesCount)} Like's</span>
                        </div>
                        {post.comments > 0 && (
                           <div
                              className='flex items-center gap-2 animate-count-up'
                              style={{ animationDelay: '0.1s' }}
                           >
                              <MessageCircle
                                 size={20}
                                 className='text-blue-400'
                              />
                              <span className='font-anime font-semibold'>{formatCount(post.comments)} Comment's</span>
                           </div>
                        )}
                        {post.shares && post.shares > 0 && (
                           <div
                              className='flex items-center gap-2 animate-count-up'
                              style={{ animationDelay: '0.2s' }}
                           >
                              <Share2
                                 size={20}
                                 className='text-green-400'
                              />
                              <span className='font-anime font-semibold'>{formatCount(post.shares)} Share</span>
                           </div>
                        )}
                        {post.views && post.views > 0 && (
                           <div
                              className='flex items-center gap-2 animate-count-up'
                              style={{ animationDelay: '0.3s' }}
                           >
                              <Eye
                                 size={20}
                                 className='text-purple-400'
                              />
                              <span className='font-anime font-semibold'>{formatCount(post.views)} View's</span>
                           </div>
                        )}
                     </>
                  )}
               </div>
            </div>
         </div>

         {/* Actions with enhanced anime effects */}
         <div className='flex items-center justify-between px-4 py-3'>
            <div className='flex items-center space-x-4'>
               <button
                  onClick={handleLike}
                  className='anime-hover-scale anime-button-press relative group'
               >
                  <Heart
                     size={24}
                     className={`${
                        isLiked ? 'text-red-500 fill-red-500 anime-pulse' : 'text-black group-hover:text-red-400'
                     } transition-colors`}
                  />
                  {isLiked && <span className='absolute -top-2 -right-2 text-xs animate-bounce'>💖</span>}
               </button>
               <button className='anime-hover-scale anime-button-press group'>
                  <MessageCircle
                     size={24}
                     className='text-black group-hover:text-blue-400 transition-colors'
                  />
               </button>
               <button className='anime-hover-scale anime-button-press group'>
                  <Send
                     size={24}
                     className='text-black group-hover:text-green-400 transition-colors'
                  />
               </button>
               <button className='anime-hover-scale anime-button-press group'>
                  <Share2
                     size={20}
                     className='text-black group-hover:text-purple-400 transition-colors'
                  />
               </button>
            </div>
            <button
               onClick={handleBookmark}
               className='anime-hover-scale anime-button-press relative group'
            >
               <Bookmark
                  size={24}
                  className={`${
                     isBookmarked
                        ? 'text-yellow-500 fill-yellow-500 anime-pulse'
                        : 'text-black group-hover:text-yellow-400'
                  } transition-colors`}
               />
               {isBookmarked && <span className='absolute -top-2 -right-2 text-xs animate-bounce'>⭐</span>}
            </button>
         </div>

         {/* Enhanced likes count with sparkle and animation */}
         <div className='px-4 pb-2 flex items-center gap-2'>
            <span className='text-lg animate-pulse'>✨</span>
            <span className='font-anime font-semibold text-sm text-black'>
               {formatCount(likesCount)} {likesCount === 1 ? 'like' : 'likes'}
            </span>
         </div>

         {/* Caption with better typography */}
         <div className='px-4 pb-2'>
            <div className='text-sm text-black font-anime'>
               <span className='font-semibold mr-2 text-gradient-anime'>{post.user.username}</span>
               <span className='leading-relaxed'>{post.caption}</span>
            </div>
         </div>

         {/* Comments */}
         {post.comments > 0 && (
            <div className='px-4 pb-2'>
               <button className='text-gray-500 text-sm font-anime hover:text-primary transition-colors'>
                  View all {formatCount(post.comments)} comments
               </button>
            </div>
         )}
      </article>
   );
};

export default PostCard;
