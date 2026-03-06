import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CommentInput from './CommentInput';
import CommentReactionButton from './CommentReactionButton';
import SentimentBadge from './SentimentBadge';
import type { Comment } from '@/types';

interface CommentRepliesProps {
   comment: Comment;
   onCreateReply: (content: string, parentId: string) => Promise<void>;
   loading?: boolean;
   autoExpand?: boolean; // New prop to auto-expand replies
   onReplyComplete?: () => void; // Callback when reply is completed
}

const CommentReplies = ({
   comment,
   onCreateReply,
   loading = false,
   autoExpand = false,
   onReplyComplete,
}: CommentRepliesProps) => {
   const [showReplies, setShowReplies] = useState(autoExpand);
   const [showReplyInput, setShowReplyInput] = useState(false);

   // Auto-expand when autoExpand prop changes
   useEffect(() => {
      if (autoExpand) {
         setShowReplies(true);
      }
   }, [autoExpand]);

   // Use replies from comment object if available, otherwise use empty array
   const replies = comment.replies || [];
   const repliesLoading = false;

   const handleCreateReply = async (content: string) => {
      await onCreateReply(content, comment.id);
      setShowReplyInput(false);
      setShowReplies(true); // Auto-expand to show new reply
      onReplyComplete?.(); // Notify parent that reply is complete
   };

   const formatTimeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return `${diffInSeconds}s`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
      return `${Math.floor(diffInSeconds / 604800)}w`;
   };

   if (comment._count.replies === 0) return null;

   return (
      <div
         className='mt-2 ml-11'
         data-comment-id={comment.id}
      >
         {/* Toggle Replies Button */}
         <button
            onClick={() => setShowReplies(!showReplies)}
            className='flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 mb-2'
            disabled={repliesLoading}
         >
            {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>
               {showReplies ? 'Hide' : 'View'} {comment._count.replies}{' '}
               {comment._count.replies === 1 ? 'reply' : 'replies'}
            </span>
            {repliesLoading && <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500'></div>}
         </button>

         {/* Replies List */}
         {showReplies && (
            <div className='space-y-3'>
               {repliesLoading && (
                  <div className='flex items-center justify-center py-4'>
                     <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500'></div>
                     <span className='ml-2 text-sm text-gray-500'>Loading replies...</span>
                  </div>
               )}

               {!repliesLoading && (!replies || replies.length === 0) && (
                  <div className='text-sm text-gray-500 py-4 text-center'>No replies found</div>
               )}

               {Array.isArray(replies) &&
                  replies.length > 0 &&
                  replies.map((reply) => (
                     <div
                        key={reply.id}
                        className='flex gap-2'
                     >
                        <div className='w-6 h-6 rounded-full overflow-hidden shrink-0'>
                           <img
                              src={reply.author.avatar || '/default-avatar.png'}
                              alt={reply.author.username}
                              className='w-full h-full object-cover'
                              onError={(e) => {
                                 const target = e.target as HTMLImageElement;
                                 target.style.display = 'none';
                                 target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-xs">${reply.author.username
                                    .charAt(0)
                                    .toUpperCase()}</div>`;
                              }}
                           />
                        </div>

                        <div className='flex-1 min-w-0'>
                           <div className='bg-gray-50 rounded-xl px-3 py-2'>
                              <div className='flex items-center gap-2 mb-0.5'>
                                 <div className='font-semibold text-xs text-gray-900'>{reply.author.username}</div>
                                 <SentimentBadge sentiment={reply.sentiment} />
                              </div>
                              <div className='text-xs text-gray-700 mt-0.5'>{reply.content}</div>
                           </div>

                           <div className='flex items-center gap-3 mt-1 text-xs text-gray-500'>
                              <span>{formatTimeAgo(reply.createdAt)}</span>
                              <CommentReactionButton
                                 postId={comment.postId}
                                 commentId={reply.id}
                              />
                              <button
                                 onClick={() => {
                                    setShowReplyInput(!showReplyInput);
                                    // Auto-expand replies when starting to reply
                                    if (!showReplyInput) {
                                       setShowReplies(true);
                                    }
                                 }}
                                 className='hover:text-gray-700'
                              >
                                 Reply
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}

               {/* Reply Input */}
               {showReplyInput && (
                  <div className='mt-3'>
                     <CommentInput
                        onSubmit={handleCreateReply}
                        loading={loading}
                        placeholder={`Reply to ${comment.author.username}...`}
                        onCancelReply={() => setShowReplyInput(false)}
                        autoFocus={true}
                     />
                  </div>
               )}
            </div>
         )}
      </div>
   );
};

export default CommentReplies;
