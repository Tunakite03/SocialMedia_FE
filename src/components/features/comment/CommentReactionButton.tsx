import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Heart, ThumbsUp, Star, Laugh, Angry, Meh } from 'lucide-react';
import { useCommentReactions } from '@/hooks';

type ReactionType = 'LIKE' | 'LOVE' | 'LAUGH' | 'ANGRY' | 'SAD' | 'WOW';

const REACTION_ICONS: Record<ReactionType, ReactNode> = {
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

const REACTION_LABELS: Record<ReactionType, string> = {
   LIKE: 'Like',
   LOVE: 'Love',
   LAUGH: 'Haha',
   ANGRY: 'Angry',
   SAD: 'Sad',
   WOW: 'Wow',
};

interface CommentReactionButtonProps {
   postId: string;
   commentId: string;
}

const CommentReactionButton = ({ postId, commentId }: CommentReactionButtonProps) => {
   const { userReaction, reactionCount, addReaction } = useCommentReactions(postId, commentId);
   const [showPopup, setShowPopup] = useState(false);
   const popupRef = useRef<HTMLDivElement>(null);
   const longPressTimer = useRef<number | null>(null);
   const isTouch = 'ontouchstart' in window;
   const [popupOpenedByLongPress, setPopupOpenedByLongPress] = useState(false);
   const [isLongPressing, setIsLongPressing] = useState(false);

   useEffect(() => {
      return () => {
         if (longPressTimer.current) clearTimeout(longPressTimer.current);
      };
   }, []);

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
         if (showPopup && popupRef.current && !popupRef.current.contains(event.target as Node)) {
            setTimeout(() => {
               if (!popupOpenedByLongPress) {
                  setShowPopup(false);
                  setPopupOpenedByLongPress(false);
               }
            }, 100);
         }
      };

      if (showPopup) {
         document.addEventListener('touchstart', handleClickOutside);
         document.addEventListener('click', handleClickOutside);
      }

      return () => {
         document.removeEventListener('touchstart', handleClickOutside);
         document.removeEventListener('click', handleClickOutside);
      };
   }, [showPopup, popupOpenedByLongPress]);

   const handleReaction = async (type: ReactionType) => {
      try {
         await addReaction(type);
      } catch (error) {
         console.error('Error handling comment reaction:', error);
      }
      setShowPopup(false);
      setPopupOpenedByLongPress(false);
      setIsLongPressing(false);
   };

   const reactionLabel = userReaction ? REACTION_LABELS[userReaction] : 'Like';

   return (
      <div className='relative inline-flex items-center gap-1'>
         <button
            onClick={(e) => {
               e.stopPropagation();
               if (isTouch) {
                  if (!isLongPressing) {
                     handleReaction(userReaction || 'LIKE');
                  }
               } else {
                  handleReaction(userReaction || 'LIKE');
               }
            }}
            onTouchStart={() => {
               if (isTouch) {
                  setIsLongPressing(false);
                  longPressTimer.current = window.setTimeout(() => {
                     setIsLongPressing(true);
                     setShowPopup(true);
                     setPopupOpenedByLongPress(true);
                     if (navigator.vibrate) navigator.vibrate(50);
                     setTimeout(() => setPopupOpenedByLongPress(false), 1000);
                  }, 400);
               }
            }}
            onTouchEnd={(e) => {
               if (isTouch) {
                  if (isLongPressing) e.preventDefault();
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
               if (!isTouch) setShowPopup(true);
            }}
            className={`font-medium text-xs flex items-center gap-1 transition-colors ${
               userReaction ? 'text-blue-500' : 'hover:text-foreground'
            }`}
         >
            {userReaction && <span className='inline-flex'>{REACTION_ICONS[userReaction]}</span>}
            <span>{reactionLabel}</span>
            {reactionCount > 0 && <span className='text-muted-foreground'>({reactionCount})</span>}
         </button>

         {showPopup && (
            <div
               ref={popupRef}
               className='absolute bottom-full left-0 transform mb-1 bg-white border rounded-lg liquid-glass p-1.5 flex space-x-0.5 z-10'
               onMouseEnter={() => {
                  if (!isTouch) setShowPopup(true);
               }}
               onMouseLeave={() => {
                  if (!isTouch) setShowPopup(false);
               }}
            >
               {(Object.entries(REACTION_ICONS) as [ReactionType, ReactNode][]).map(([type, icon]) => (
                  <button
                     key={type}
                     onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(type);
                     }}
                     className='hover:scale-110 active:scale-95 transition-transform p-1 rounded-md hover:bg-gray-100'
                     title={REACTION_LABELS[type]}
                  >
                     {icon}
                  </button>
               ))}
               {isTouch && (
                  <button
                     onClick={(e) => {
                        e.stopPropagation();
                        setShowPopup(false);
                        setPopupOpenedByLongPress(false);
                        setIsLongPressing(false);
                     }}
                     className='text-sm text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 ml-0.5'
                  >
                     ✕
                  </button>
               )}
            </div>
         )}
      </div>
   );
};

export default CommentReactionButton;
