import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
   Heart,
   MessageCircle,
   Bookmark,
   MoreHorizontal,
   ThumbsUp,
   Star,
   Laugh,
   Angry,
   Meh,
   UserPlus,
} from 'lucide-react';
import { usePostReactionsStore, useFollow } from '@/hooks';
import { useAuthStore } from '@/store/authStore';
import type { Post } from '@/types';
import PostMedia from './PostMedia';
import SentimentBadge from './SentimentBadge';
import { formatRelativeTime } from '@/lib/utils';

interface PostCardProps {
   post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
   const navigate = useNavigate();
   const { user: currentUser } = useAuthStore();
   const { followUser, unfollowUser, loading: followLoading } = useFollow();

   // Check if current user is the author
   const isOwnPost = currentUser?.id === post.author.id;

   // Use isFollowing from API response, fallback to false
   const [isFollowing, setIsFollowing] = useState(post.author.isFollowing || false);

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

   // Use store data instead of local state
   const { userReaction, reactionCount, addReaction } = usePostReactionsStore(post.id);
   const [isBookmarked, setIsBookmarked] = useState(false);
   const [showReactionPopup, setShowReactionPopup] = useState(false);
   const reactionPopupRef = useRef<HTMLDivElement>(null);
   const longPressTimer = useRef<number | null>(null);
   const isTouch = 'ontouchstart' in window;
   const [popupOpenedByLongPress, setPopupOpenedByLongPress] = useState(false);
   const [isLongPressing, setIsLongPressing] = useState(false);

   // Use store data or fallback to post data
   const currentReaction = userReaction || post.userReaction;
   const likesCount = reactionCount || post._count.reactions;

   // Cleanup timer on unmount
   useEffect(() => {
      return () => {
         if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
         }
      };
   }, []);

   // Close reaction popup when clicking outside
   useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
         if (
            showReactionPopup &&
            reactionPopupRef.current &&
            !reactionPopupRef.current.contains(event.target as Node)
         ) {
            // Small delay to prevent immediate closing after long press
            setTimeout(() => {
               if (!popupOpenedByLongPress) {
                  setShowReactionPopup(false);
                  setPopupOpenedByLongPress(false);
               }
            }, 100);
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
   }, [showReactionPopup, popupOpenedByLongPress]);

   const handleReaction = async (type: 'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW') => {
      try {
         // Store handles the reaction logic internally, including optimistic updates
         await addReaction(type);
      } catch (error) {
         console.error('Error handling reaction:', error);
         // Store handles error states, but you can add additional UI feedback here if needed
      }

      // Close popup after reaction selection
      setShowReactionPopup(false);
      setPopupOpenedByLongPress(false);
      setIsLongPressing(false);
   };

   const handleBookmark = () => {
      setIsBookmarked(!isBookmarked);
   };

   const handleFollowClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (followLoading) return;

      try {
         if (isFollowing) {
            await unfollowUser(post.author.id);
            setIsFollowing(false);
         } else {
            await followUser(post.author.id);
            setIsFollowing(true);
         }
      } catch (error) {
         console.error('Error handling follow:', error);
      }
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
               <Link to={`/profile/${post.author.id}`}>
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
               </Link>

               <div className='flex flex-col'>
                  <span className='font-anime font-semibold text-sm text-foreground'>{post.author.username}</span>
                  <span className='text-xs text-muted-foreground font-anime'>{formatRelativeTime(post.updatedAt)}</span>
               </div>

               {/* Follow button - only show if not own post and not following */}
               {!isOwnPost && !isFollowing && (
                  <button
                     onClick={handleFollowClick}
                     disabled={followLoading}
                     className='ml-2 p-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all anime-hover-scale disabled:opacity-50 disabled:cursor-not-allowed'
                     title='Follow'
                  >
                     <UserPlus size={12} />
                  </button>
               )}
            </div>
            <div className='flex items-center gap-2'>
               {post.sentiment && (
                  <SentimentBadge
                     sentiment={post.sentiment}
                     confidence={post.sentimentConfidence}
                  />
               )}
               <button className='p-2 hover:bg-gray-100 rounded-full transition-colors anime-hover-scale'>
                  <MoreHorizontal
                     size={20}
                     className='text-muted-foreground'
                  />
               </button>
            </div>
         </div>

         <PostMedia post={post} />

         {/* Actions with enhanced anime effects */}
         <div
            className='flex items-center justify-between px-4 py-3'
            onMouseLeave={() => {
               // Hide popup on mouse leave for desktop only, and not when opened by long press
               if (!isTouch && !popupOpenedByLongPress) {
                  setShowReactionPopup(false);
                  setPopupOpenedByLongPress(false);
               }
            }}
         >
            <div className='flex items-center space-x-4'>
               <div className='relative flex items-center'>
                  <button
                     onClick={() => {
                        if (isTouch) {
                           // On mobile, only react if it's not a long press
                           if (!isLongPressing) {
                              // Simple tap on mobile - toggle like/unlike
                              if (currentReaction) {
                                 handleReaction(currentReaction); // Remove current reaction
                              } else {
                                 handleReaction('LIKE'); // Add like
                              }
                           }
                        } else {
                           // Desktop - execute reaction directly
                           handleReaction(currentReaction || 'LIKE');
                        }
                     }}
                     onTouchStart={() => {
                        if (isTouch) {
                           setIsLongPressing(false);
                           // Start long press timer for mobile
                           longPressTimer.current = window.setTimeout(() => {
                              setIsLongPressing(true);
                              setShowReactionPopup(true);
                              setPopupOpenedByLongPress(true);
                              if (navigator.vibrate) {
                                 navigator.vibrate(50);
                              }
                              // Allow closing after a delay
                              setTimeout(() => {
                                 setPopupOpenedByLongPress(false);
                              }, 1000);
                           }, 400);
                        }
                     }}
                     onTouchEnd={(e) => {
                        if (isTouch) {
                           // Only prevent default if it was a long press
                           if (isLongPressing) {
                              e.preventDefault();
                           }
                           if (longPressTimer.current) {
                              clearTimeout(longPressTimer.current);
                              longPressTimer.current = null;
                           }
                        }
                     }}
                     onTouchMove={() => {
                        if (isTouch && longPressTimer.current) {
                           clearTimeout(longPressTimer.current);
                           longPressTimer.current = null;
                        }
                     }}
                     onMouseEnter={() => {
                        // Show popup on hover for desktop
                        if (!isTouch) {
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
                           className='text-muted-foreground group-hover:scale(1.05) duration-300 ease transition-colors'
                        />
                     )}
                     <span className='font-anime font-semibold text-sm text-foreground'>{formatCount(likesCount)}</span>
                     {currentReaction && <span className='absolute -top-2 -right-2 text-xs animate-bounce'>💖</span>}
                  </button>
                  {showReactionPopup && (
                     <div
                        ref={reactionPopupRef}
                        className='absolute bottom-full -left-2.5 transform mb-2 bg-white border rounded-lg liquid-glass p-2 flex space-x-1 z-10'
                        onMouseEnter={() => {
                           // Keep popup open on desktop hover
                           if (!isTouch) {
                              setShowReactionPopup(true);
                           }
                        }}
                        onMouseLeave={() => {
                           // Hide popup on desktop mouse leave
                           if (!isTouch) {
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
                        {isTouch && (
                           <button
                              onClick={(e) => {
                                 e.stopPropagation();
                                 setShowReactionPopup(false);
                                 setPopupOpenedByLongPress(false);
                                 setIsLongPressing(false);
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
