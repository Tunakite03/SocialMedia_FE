import type { Post } from '@/types';

const PostMedia = ({ post }: { post: Post }) => {
   if (post.type === 'IMAGE' && post.mediaUrl) {
      return (
         <>
            {post.mediaUrl && (
               <div className='w-full bg-gray-100 rounded-2xl overflow-hidden'>
                  <img
                     src={post.mediaUrl}
                     alt='Post'
                     className='w-full object-cover max-h-[600px]'
                     onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<div class="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-500">Image not available</div>`;
                     }}
                  />
               </div>
            )}
         </>
      );
   }
   if (post.type === 'VIDEO' && post.mediaUrl) {
      return (
         <>
            {post.mediaUrl && (
               <div className='w-full bg-gray-100 rounded-2xl overflow-hidden'>
                  <video
                     src={post.mediaUrl}
                     controls
                     className='w-full object-cover max-h-[600px]'
                  />
               </div>
            )}
         </>
      );
   }

   return (
      <div className='w-full aspect-square bg-gray-100 relative group overflow-hidden rounded-2xl flex items-center font-semibold text-center'>
         {post.content}
      </div>
   );
};

export default PostMedia;
