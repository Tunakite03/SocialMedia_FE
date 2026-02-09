import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, MoreHorizontal } from 'lucide-react';
import { usePostComments, useCreateComment } from '@/hooks/useCommentsStore';
import CommentInput from '@/components/features/comment/CommentInput';
import type { Comment } from '@/types';
import PostMedia from '@/components/features/post/PostMedia';
import CommentItem from '@/components/features/comment/CommentItems';
import { usePost } from '@/hooks/usePostStore';

const PostDetailPage = () => {
   const { postId } = useParams<{ postId: string }>();
   const navigate = useNavigate();
   const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
   const commentInputRef = useRef<HTMLDivElement>(null);

   // Use the real hooks instead of mock data
   const { post, loading, error } = usePost(postId || '');
   const { comments, loading: commentsLoading } = usePostComments(postId || '');
   const { createComment, loading: createLoading } = useCreateComment();

   const handleSubmitComment = async (content: string, parentId?: string) => {
      if (!postId) return;
      try {
         const newComment = await createComment(postId, { content, parentId });
         if (newComment) {
            // The store handles optimistic updates automatically
            // Clear replyingTo state if it was a reply
            if (parentId && replyingTo) {
               setReplyingTo(null);
            }
         }
      } catch (error) {
         console.error('Failed to create comment:', error);
      }
   };

   const handleReply = (commentId: string, username: string) => {
      setReplyingTo({ id: commentId, username });

      // Focus vào input chính ở dưới cùng
      setTimeout(() => {
         if (commentInputRef.current) {
            const input = commentInputRef.current.querySelector('input');
            if (input) {
               input.focus();
               commentInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
         }
      }, 100);
   };

   const handleReplyComplete = (commentId: string) => {
      // Clear replyingTo when reply is completed
      if (replyingTo?.id === commentId) {
         setReplyingTo(null);
      }
   };

   if (loading) {
      return (
         <div className='max-w-2xl mx-auto p-4'>
            <div className='flex justify-center py-12'>
               <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
            </div>
         </div>
      );
   }

   if (error || !post) {
      return (
         <div className='max-w-2xl mx-auto p-4 text-foreground'>
            <div className='text-center py-12'>
               <h2 className='text-xl font-semibold mb-2'>Post not found</h2>
               <p className='mb-4'>{error || 'The post you are looking for does not exist.'}</p>
               <button
                  onClick={() => navigate('/feed')}
                  className='bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors'
               >
                  Back to Feed
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className='w-full flex flex-col mx-auto h-screen liquid-glass overflow-hidden text-foreground'>
         {/* Header */}
         <div className='p-2 flex items-center w-full gap-4'>
            <button
               onClick={() => navigate(-1)}
               className='p-2 hover:bg-gray-100 rounded-full transition-colors'
            >
               <ArrowLeft size={20} />
            </button>
            <h1 className='font-semibold text-lg '>Post</h1>
         </div>

         <div className='md:grid hidden min-h-0 flex-1 grid-cols-1 md:grid-cols-2 justify-center gap-2 py-2'>
            {/* Post Content */}
            <div className='flex items-center justify-center h-full px-4'>
               <PostMedia post={post} />
            </div>

            {/* Comments Section */}
            <div className='h-full flex flex-col min-h-0 gap-1'>
               {/* Author header - hidden on mobile */}
               <div className='hidden md:flex flex-row liquid-glass rounded-2xl p-2 justify-between items-center shrink-0'>
                  <Link
                     to={`/profile/${post.author.id}`}
                     className='font-semibold text-base flex items-center gap-3'
                  >
                     <div className='w-12 h-12 rounded-full overflow-hidden'>
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
                     <div className='text-semibold'>{post.author.username}</div>
                  </Link>

                  <div>
                     <MoreHorizontal size={20} />
                  </div>
               </div>
               <div className='w-full px-4 py-2'>
                  <p className='text-base text-foreground font-anime'>{post.content}</p>
               </div>
               {/* Comments List - Scrollable */}
               <div className='flex-1 overflow-y-auto scrollbar-hide p-2 min-h-0 rounded-2xl liquid-glass'>
                  <div className='space-y-1'>
                     {commentsLoading && comments.length === 0 ? (
                        <div className='flex justify-center py-8'>
                           <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900'></div>
                        </div>
                     ) : (
                        <>
                           {comments.map((comment: Comment) => (
                              <CommentItem
                                 key={comment.id}
                                 comment={comment}
                                 onReply={handleReply}
                                 onCreateReply={handleSubmitComment}
                                 createLoading={createLoading}
                                 replyingTo={replyingTo}
                                 onReplyComplete={handleReplyComplete}
                              />
                           ))}

                           {comments.length === 0 && !commentsLoading && (
                              <div className='text-center py-8'>
                                 <MessageCircle
                                    size={48}
                                    className='mx-auto mb-3 '
                                 />
                                 <p>No comments yet.</p>
                                 <p className='text-sm'>Be the first to comment!</p>
                              </div>
                           )}
                        </>
                     )}
                  </div>
               </div>

               {/* Comment Input - Fixed at bottom */}
               <div
                  className='p-4  shrink-0  liquid-glass rounded-2xl'
                  ref={commentInputRef}
               >
                  <CommentInput
                     onSubmit={handleSubmitComment}
                     loading={createLoading}
                     replyingTo={replyingTo}
                     onCancelReply={() => setReplyingTo(null)}
                     placeholder='Add a comment...'
                     autoFocus={!!replyingTo}
                  />
               </div>
            </div>
         </div>

         <div className='md:hidden flex min-h-0 flex-col flex-1 justify-between '>
            {/* Post Content */}

            <div className='flex flex-col flex-1 liquid-glass overflow-y-auto scrollbar-hide shrink-0 pt-2'>
               <div className='px-4'>
                  <PostMedia post={post} />
               </div>
               {/* Comments List - Scrollable */}
               <div className='flex-1  p-2 min-h-0 rounded-2xl '>
                  <div className='space-y-1'>
                     {commentsLoading && comments.length === 0 ? (
                        <div className='flex justify-center py-8'>
                           <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900'></div>
                        </div>
                     ) : (
                        <>
                           {comments.map((comment: Comment) => (
                              <CommentItem
                                 key={comment.id}
                                 comment={comment}
                                 onReply={handleReply}
                                 onCreateReply={handleSubmitComment}
                                 createLoading={createLoading}
                                 replyingTo={replyingTo}
                                 onReplyComplete={handleReplyComplete}
                              />
                           ))}

                           {comments.length === 0 && !commentsLoading && (
                              <div className='text-center py-8'>
                                 <MessageCircle
                                    size={48}
                                    className='mx-auto mb-3 '
                                 />
                                 <p>No comments yet.</p>
                                 <p className='text-sm'>Be the first to comment!</p>
                              </div>
                           )}
                        </>
                     )}
                  </div>
               </div>
            </div>
            {/* Comment Input - Fixed at bottom */}
            <div
               className='p-4 shrink-0 liquid-glass'
               ref={commentInputRef}
            >
               <CommentInput
                  onSubmit={handleSubmitComment}
                  loading={createLoading}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                  placeholder='Add a comment...'
                  autoFocus={!!replyingTo}
               />
            </div>
         </div>
      </div>
   );
};

export default PostDetailPage;
