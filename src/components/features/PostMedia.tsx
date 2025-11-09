import type { Post } from '@/types';
import { EnhancedVideoPlayer } from './video/EnhancedVideoPlayer';

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
      return <EnhancedVideoPlayer src={post.mediaUrl} />;
   }

   return (
      <div className='flex justify-center rounded-2xl  items-center font-semibold text-center w-full aspect-video bg-gray-100 overflow-hidden'>
         {post.content}
      </div>
   );
};

export default PostMedia;
