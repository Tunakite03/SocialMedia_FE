import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, ThumbsUp, Star, Laugh, Angry, Meh } from 'lucide-react';
import { usePostReactions } from '@/hooks/usePosts';
import type { Post } from '@/types';
import PostMedia from './PostMedia';

interface PostCardProps {
   post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
   const navigate = useNavigate();
   // Use Lucide SVG icons for nicer reaction visuals
   const reactionIcons: Record<string, ReactNode> = {
      LIKE: (
         <ThumbsUp
            size={28}
            className='text-blue-400'
            fill='currentColor'
         />
      ),
      LOVE: (
         <Heart
            size={28}
            className='text-red-500'
            fill='currentColor'
         />
      ),
      LAUGH: (
         <Laugh
            size={28}
            className='text-yellow-500'
         />
      ),
      ANGRY: (
         <Angry
            size={28}
            className='text-orange-500'
         />
      ),
      SAD: (
         <Meh
            size={28}
            className='text-blue-500'
         />
      ),
      WOW: (
         <Star
            size={28}
            className='text-amber-400'
            fill='currentColor'
         />
      ),
   };

   const [currentReaction, setCurrentReaction] = useState<'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW' | null>(
      post.userReaction ? post.userReaction : null
   );
   const [isBookmarked, setIsBookmarked] = useState(false);
   const [likesCount, setLikesCount] = useState(post._count.reactions);
   const [showReactionPopup, setShowReactionPopup] = useState(false);
   const { addReaction } = usePostReactions(post.id);
   const reactionPopupRef = useRef<HTMLDivElement>(null);

   // Close reaction popup when clicking outside on mobile
   useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
         if (
            showReactionPopup &&
            reactionPopupRef.current &&
            !reactionPopupRef.current.contains(event.target as Node) &&
            'ontouchstart' in window
         ) {
            setShowReactionPopup(false);
         }
      };

      if (showReactionPopup) {
         document.addEventListener('touchstart', handleClickOutside);
         document.addEventListener('click', handleClickOutside);
      }

      return () => {
         document.removeEventListener('touchstart', handleClickOutside);
         document.removeEventListener('click', handleClickOutside);
      };
   }, [showReactionPopup]);

   const handleReaction = async (type: 'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW') => {
      try {
         const response = await addReaction(type);

         // Xử lý response từ API
         if (response && response.action === 'removed') {
            // Reaction đã được remove
            setCurrentReaction(null);
            setLikesCount((prev) => prev - 1);
         } else if (response) {
            // Reaction đã được add hoặc thay đổi
            const wasReacted = currentReaction !== null;
            setCurrentReaction(type);
            setLikesCount((prev) => (wasReacted ? prev : prev + 1));
         }
      } catch (error) {
         console.error('Error handling reaction:', error);
         // Rollback UI state nếu có lỗi
         // UI đã được update optimistically, cần rollback
      }

      setShowReactionPopup(false);
   };

   const handleBookmark = () => {
      setIsBookmarked(!isBookmarked);
   };

   const formatCount = (count: number) => {
      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
      return count.toString();
   };

   return (
      <article className='card-liquid-glass card-liquid-glass-animate anime-slide-in-left border-0 relative overflow-hidden w-full'>
         {/* Header with enhanced styling */}
         <div className='flex items-center justify-between px-4 py-3'>
            <div className='flex items-center space-x-3'>
               <div className='w-10 h-10 rounded-full  p-0.5 anime-hover-scale'>
                  <div className='w-full h-full rounded-full bg-white overflow-hidden'>
                     <img
                        src={post.author.avatar || '/default-avatar.png'}
                        alt={post.author.username}
                        className='w-full h-full object-cover'
                        onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.style.display = 'none';
                           target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">${post.author.username
                              .charAt(0)
                              .toUpperCase()}</div>`;
                        }}
                     />
                  </div>
               </div>
               <div className='flex flex-col'>
                  <span className='font-anime font-semibold text-sm text-foreground'>{post.author.username}</span>
                  <span className='text-xs text-muted-foreground font-anime'>{post.updatedAt}</span>
               </div>
            </div>
            <button className='p-2 hover:bg-gray-100 rounded-full transition-colors anime-hover-scale'>
               <MoreHorizontal
                  size={20}
                  className='text-muted-foreground'
               />
            </button>
         </div>

         <PostMedia post={post} />

         {/* Actions with enhanced anime effects */}
         <div
            className='flex items-center justify-between px-4 py-3'
            onMouseLeave={() => {
               // Only hide on mouse leave for desktop devices
               if (!('ontouchstart' in window)) {
                  setShowReactionPopup(false);
               }
            }}
         >
            <div className='flex items-center space-x-4'>
               <div className='relative flex items-center'>
                  <button
                     onClick={(e) => {
                        // On mobile/tablet, show reaction popup on single tap if not already shown
                        if ('ontouchstart' in window && !showReactionPopup) {
                           e.preventDefault();
                           setShowReactionPopup(true);
                        } else {
                           // On desktop or second tap on mobile, execute reaction
                           handleReaction(currentReaction || 'LIKE');
                        }
                     }}
                     onMouseEnter={() => {
                        // Only show on hover for desktop devices
                        if (!('ontouchstart' in window)) {
                           setShowReactionPopup(true);
                        }
                     }}
                     className='anime-hover-scale flex gap-1 items-center anime-button-press relative group'
                  >
                     {currentReaction ? (
                        <span className='text-2xl'>{reactionIcons[currentReaction]}</span>
                     ) : (
                        <Heart
                           size={26}
                           className='text-muted-foreground group-hover:text-red-400 transition-colors'
                        />
                     )}
                     <span className='font-anime font-semibold text-sm text-foreground'>{formatCount(likesCount)}</span>
                     {currentReaction && <span className='absolute -top-2 -right-2 text-xs animate-bounce'>💖</span>}
                  </button>
                  {showReactionPopup && (
                     <div
                        ref={reactionPopupRef}
                        className='absolute bottom-full -left-2.5 transform mb-2 bg-white border rounded-lg liquid-glass p-2 flex space-x-1 z-10 '
                        onMouseEnter={() => {
                           // Keep popup open on desktop hover
                           if (!('ontouchstart' in window)) {
                              setShowReactionPopup(true);
                           }
                        }}
                        onMouseLeave={() => {
                           // Hide popup on desktop mouse leave
                           if (!('ontouchstart' in window)) {
                              setShowReactionPopup(false);
                           }
                        }}
                     >
                        {Object.entries(reactionIcons)
                           .filter(([type]) => type !== 'NULL')
                           .map(([type, icon]) => (
                              <button
                                 key={type}
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    handleReaction(type as 'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW');
                                 }}
                                 className='hover:scale-110 active:scale-95 transition-transform anime-hover-scale p-1 rounded-md hover:bg-gray-100'
                              >
                                 {icon}
                              </button>
                           ))}
                        {/* Close button for mobile */}
                        {'ontouchstart' in window && (
                           <button
                              onClick={(e) => {
                                 e.stopPropagation();
                                 setShowReactionPopup(false);
                              }}
                              className='text-lg text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 ml-1'
                           >
                              ✕
                           </button>
                        )}
                     </div>
                  )}
               </div>
               <button
                  onClick={() => navigate(`/post/${post.id}`)}
                  className='anime-hover-scale flex items-center gap-2 anime-button-press group'
               >
                  <MessageCircle
                     size={24}
                     className='text-muted-foreground group-hover:text-blue-400 transition-colors'
                  />
                  <span className='font-anime font-semibold text-sm text-foreground'>
                     {formatCount(post._count.comments)}
                  </span>
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
                        : 'text-muted-foreground group-hover:text-yellow-400'
                  } transition-colors`}
               />
               {isBookmarked && <span className='absolute -top-2 -right-2 text-xs animate-bounce'>⭐</span>}
            </button>
         </div>

         {/* Caption with better typography */}
         <div className='px-4 pb-2'>
            <div className='text-sm text-foreground font-anime'>
               <span className='font-semibold mr-2 text-gradient-anime'>{post.author.username}</span>
               <span className='leading-relaxed'>{post.content}</span>
            </div>
         </div>

         {/* Comments */}
         {post._count.comments > 0 && (
            <div className='px-4 pb-2'>
               <button
                  onClick={() => navigate(`/post/${post.id}`)}
                  className='text-muted-foreground text-sm font-anime hover:text-primary transition-colors'
               >
                  View all {formatCount(post._count.comments)} comments
               </button>
            </div>
         )}
      </article>
   );
};

export default PostCard;
