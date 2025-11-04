import InstagramLayout from '@/components/layout/InstagramLayout';
import { Camera, Image, Video } from 'lucide-react';

const CreatePage = () => {
   return (
      <InstagramLayout>
         <div className='p-4'>
            <div className='text-center'>
               <h1 className='text-2xl font-bold mb-8'>Create new post</h1>

               <div className='space-y-4 max-w-sm mx-auto'>
                  <div className='bg-white border border-gray-200 rounded-lg p-8 text-center'>
                     <Camera
                        size={48}
                        className='mx-auto mb-4 text-gray-400'
                     />
                     <p className='text-gray-600 mb-4'>Share photos and videos</p>
                     <button className='bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors'>
                        Select from computer
                     </button>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                     <button className='bg-white border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors'>
                        <Image
                           size={24}
                           className='mx-auto mb-2 text-gray-600'
                        />
                        <span className='text-sm text-gray-600'>Photo</span>
                     </button>
                     <button className='bg-white border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors'>
                        <Video
                           size={24}
                           className='mx-auto mb-2 text-gray-600'
                        />
                        <span className='text-sm text-gray-600'>Video</span>
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </InstagramLayout>
   );
};

export default CreatePage;
