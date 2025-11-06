import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Share, ThumbsUp, Star, Laugh, Angry, Meh } from 'lucide-react';
import { usePostReactions } from '@/hooks/usePosts';
import type { Post } from '@/types';
import PostMedia from './PostMedia';

interface PostDetailCardProps {
   post: Post;
   onShare?: () => void;
}

const PostDetailCard = ({ post, onShare }: PostDetailCardProps) => {
   const [isBookmarked, setIsBookmarked] = useState(false);
   const [likesCount, setLikesCount] = useState(post._count.reactions);
   const [currentReaction, setCurrentReaction] = useState<string | null>(post.userReaction || null);
   const { addReaction } = usePostReactions(post.id);

   const reactionIcons = {
      LIKE: (
         <ThumbsUp
            size={20}
            className='text-blue-400'
            fill='currentColor'
         />
      ),
      LOVE: (
         <Heart
            size={20}
            className='text-red-500'
            fill='currentColor'
         />
      ),
      LAUGH: (
         <Laugh
            size={20}
            className='text-yellow-500'
         />
      ),
      ANGRY: (
         <Angry
            size={20}
            className='text-orange-500'
         />
      ),
      SAD: (
         <Meh
            size={20}
            className='text-blue-500'
         />
      ),
      WOW: (
         <Star
            size={20}
            className='text-amber-400'
            fill='currentColor'
         />
      ),
   };

   const handleReaction = async (type: string) => {
      try {
         const response = await addReaction(type as any);
         if (response && response.action === 'removed') {
            setCurrentReaction(null);
            setLikesCount((prev) => prev - 1);
         } else if (response) {
            const wasReacted = currentReaction !== null;
            setCurrentReaction(type);
            setLikesCount((prev) => (wasReacted ? prev : prev + 1));
         }
      } catch (error) {
         console.error('Error handling reaction:', error);
      }
   };

   const formatCount = (count: number) => {
      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
      return count.toString();
   };

   const formatTimeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return `${Math.floor(diffInSeconds / 604800)}w ago`;
   };

   return (
      <div className='w-full max-w-2xl overflow-hidden'>
         {/* Post Header */}
         <div className='flex items-center justify-between p-4 border-b border-gray-100'>
            <div className='flex items-center gap-3'>
               <div className='w-12 h-12 rounded-full overflow-hidden'>
                  <img
                     src={post.author.avatar || '/default-avatar.png'}
                     alt={post.author.username}
                     className='w-full h-full object-cover '
                     onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">${post.author.username
                           .charAt(0)
                           .toUpperCase()}</div>`;
                     }}
                  />
               </div>
               <div>
                  <Link
                     to={`/profile/${post.author.id}`}
                     className='font-semibold text-base hover:underline'
                  >
                     {post.author.username}
                  </Link>
                  <div className='text-sm text-gray-500'>{formatTimeAgo(post.updatedAt)}</div>
               </div>
            </div>
            <button className='p-2 hover:bg-gray-100 rounded-full transition-colors'>
               <MoreHorizontal size={20} />
            </button>
         </div>

         {/* Post Image */}
         {post.mediaUrl && <PostMedia post={post} />}

         {/* Post Actions */}
         <div className='p-4'>
            <div className='flex items-center justify-between mb-4'>
               <div className='flex items-center gap-4'>
                  <button
                     onClick={() => handleReaction(currentReaction || 'LIKE')}
                     className='anime-hover-scale flex items-center gap-2'
                  >
                     {currentReaction ? (
                        reactionIcons[currentReaction as keyof typeof reactionIcons]
                     ) : (
                        <Heart
                           size={24}
                           className='text-gray-700 hover:text-red-500 transition-colors'
                        />
                     )}
                     <span className='font-semibold text-sm'>{formatCount(likesCount)}</span>
                  </button>
                  <div className='flex items-center gap-2'>
                     <MessageCircle
                        size={24}
                        className='text-gray-700'
                     />
                     <span className='font-semibold text-sm'>{formatCount(post._count.comments)}</span>
                  </div>
               </div>
               <div className='flex items-center gap-4'>
                  <button
                     onClick={onShare}
                     className='anime-hover-scale hover:bg-gray-100 p-2 rounded-full transition-colors'
                  >
                     <Share
                        size={20}
                        className='text-gray-700'
                     />
                  </button>
                  <button
                     onClick={() => setIsBookmarked(!isBookmarked)}
                     className='anime-hover-scale hover:bg-gray-100 p-2 rounded-full transition-colors'
                  >
                     <Bookmark
                        size={20}
                        className={isBookmarked ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'}
                     />
                  </button>
               </div>
            </div>

            {/* Likes count */}
            <div className='text-sm font-semibold mb-2'>{formatCount(likesCount)} likes</div>

            {/* Post Caption */}
            <div className='mb-2'>
               <Link
                  to={`/profile/${post.author.id}`}
                  className='font-semibold mr-2 hover:underline'
               >
                  {post.author.username}
               </Link>
               <span className='text-gray-900'>{post.content}</span>
            </div>

            {/* Time */}
            <div className='text-xs text-gray-500 uppercase tracking-wide'>{formatTimeAgo(post.updatedAt)}</div>
         </div>
      </div>
   );
};

export default PostDetailCard;
