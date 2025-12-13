import type { Comment } from '@/types';
import { MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import CommentReplies from './CommentReplies';
import SentimentBadge from './SentimentBadge';

interface CommentItemProps {
   comment: Comment;
   onReply: (commentId: string, username: string) => void;
   onCreateReply: (content: string, parentId: string) => Promise<void>;
   createLoading: boolean;
   replyingTo: { id: string; username: string } | null;
   onReplyComplete: (commentId: string) => void;
}

const CommentItem = ({
   comment,
   onReply,
   onCreateReply,
   createLoading,
   replyingTo,
   onReplyComplete,
}: CommentItemProps) => {
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

   return (
      <div className='flex gap-3 py-3 border-b border-border last:border-b-0 text-foreground'>
         <Link
            to={`/profile/${comment.author.id}`}
            className='font-semibold text-sm'
         >
            <div className='w-10 h-10 rounded-full overflow-hidden shrink-0'>
               <img
                  src={comment.author.avatar || '/default-avatar.png'}
                  alt={comment.author.username}
                  className='w-full h-full object-cover'
                  onError={(e) => {
                     const target = e.target as HTMLImageElement;
                     target.style.display = 'none';
                     target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-xs">${comment.author.username
                        .charAt(0)
                        .toUpperCase()}</div>`;
                  }}
               />
            </div>
         </Link>

         <div className='flex-1 min-w-0 text-foreground '>
            <div className='rounded-2xl '>
               <div className='flex items-center gap-2'>
                  <div className='font-semibold text-base'>{comment.author.username}</div>
                  <SentimentBadge
                     sentiment={comment.sentiment}
                     confidence={comment.sentimentConfidence}
                     showConfidence={false}
                  />
               </div>
               <div className='text-sm t mt-1 leading-relaxed'>{comment.content}</div>
            </div>

            <div className='flex items-center gap-6 mt-3 text-xs'>
               <span>{formatTimeAgo(comment.createdAt)}</span>
               <button className=' font-medium'>Like</button>
               <button
                  onClick={() => onReply(comment.id, comment.author.username)}
                  className=' font-medium'
               >
                  Reply
               </button>
               <button className=''>
                  <MoreHorizontal size={14} />
               </button>
            </div>

            {comment._count.replies > 0 && (
               <CommentReplies
                  comment={comment}
                  onCreateReply={onCreateReply}
                  loading={createLoading}
                  autoExpand={replyingTo?.id === comment.id}
                  onReplyComplete={() => onReplyComplete(comment.id)}
               />
            )}
         </div>
      </div>
   );
};
export default CommentItem;
