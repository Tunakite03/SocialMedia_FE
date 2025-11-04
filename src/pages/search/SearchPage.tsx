import InstagramLayout from '@/components/layout/InstagramLayout';
import { Search } from 'lucide-react';

const SearchPage = () => {
   return (
      <InstagramLayout>
         <div className='p-4'>
            {/* Search header */}
            <div className='mb-6'>
               <div className='relative'>
                  <Search
                     className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                     size={20}
                  />
                  <input
                     type='text'
                     placeholder='Search'
                     className='w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-gray-300'
                  />
               </div>
            </div>

            {/* Explore grid */}
            <div className='grid grid-cols-3 gap-1'>
               {Array.from({ length: 21 }, (_, i) => (
                  <div
                     key={i}
                     className='aspect-square bg-gray-200 rounded'
                  >
                     <img
                        src={`/api/placeholder/150/150?random=${i}`}
                        alt={`Explore ${i + 1}`}
                        className='w-full h-full object-cover rounded'
                        onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.style.display = 'none';
                           target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs">Photo</div>`;
                        }}
                     />
                  </div>
               ))}
            </div>
         </div>
      </InstagramLayout>
   );
};

export default SearchPage;
