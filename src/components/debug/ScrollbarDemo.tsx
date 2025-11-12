import React from 'react';

/**
 * ScrollbarDemo component - demonstrates different scrollbar variants
 * Usage in any component where you need scrollable content:
 */

interface ScrollbarDemoProps {
   className?: string;
}

const ScrollbarDemo: React.FC<ScrollbarDemoProps> = ({ className }) => {
   // Generate sample content for demonstration
   const sampleContent = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

   return (
      <div className={`space-y-6 p-6 ${className}`}>
         <h2 className='text-2xl font-semibold mb-4'>Scrollbar Variants Demo</h2>

         {/* Default Auto-Hide Scrollbar */}
         <div className='space-y-2'>
            <h3 className='text-lg font-medium'>1. Auto-Hide Scrollbar (default)</h3>
            <div className='h-32 border rounded-lg p-4 overflow-y-auto auto-hide-scrollbar'>
               {sampleContent.map((item, index) => (
                  <div
                     key={index}
                     className='py-1 text-sm'
                  >
                     {item} - Hover to see scrollbar appear
                  </div>
               ))}
            </div>
         </div>

         {/* Overlay Scrollbar */}
         <div className='space-y-2'>
            <h3 className='text-lg font-medium'>2. Overlay Scrollbar</h3>
            <div className='h-32 border rounded-lg p-4 scrollbar-overlay'>
               {sampleContent.map((item, index) => (
                  <div
                     key={index}
                     className='py-1 text-sm'
                  >
                     {item} - Perfect overlay that doesn't affect layout
                  </div>
               ))}
            </div>
         </div>

         {/* Custom Thin Scrollbar */}
         <div className='space-y-2'>
            <h3 className='text-lg font-medium'>3. Custom Thin Scrollbar</h3>
            <div className='h-32 border rounded-lg p-4 overflow-y-auto custom-scrollbar'>
               {sampleContent.map((item, index) => (
                  <div
                     key={index}
                     className='py-1 text-sm'
                  >
                     {item} - Themed thin scrollbar with primary color
                  </div>
               ))}
            </div>
         </div>

         {/* Feed Scrollbar */}
         <div className='space-y-2'>
            <h3 className='text-lg font-medium'>4. Feed Scrollbar (ultra-thin)</h3>
            <div className='h-32 border rounded-lg p-4 overflow-y-auto scrollbar-feed'>
               {sampleContent.map((item, index) => (
                  <div
                     key={index}
                     className='py-1 text-sm'
                  >
                     {item} - Ultra-thin scrollbar perfect for feeds
                  </div>
               ))}
            </div>
         </div>

         {/* Always Visible Scrollbar */}
         <div className='space-y-2'>
            <h3 className='text-lg font-medium'>5. Always Visible Scrollbar</h3>
            <div className='h-32 border rounded-lg p-4 overflow-y-auto scrollbar-visible'>
               {sampleContent.map((item, index) => (
                  <div
                     key={index}
                     className='py-1 text-sm'
                  >
                     {item} - Always visible themed scrollbar
                  </div>
               ))}
            </div>
         </div>

         {/* Hidden Scrollbar */}
         <div className='space-y-2'>
            <h3 className='text-lg font-medium'>6. Hidden Scrollbar</h3>
            <div className='h-32 border rounded-lg p-4 overflow-y-auto scrollbar-hide'>
               {sampleContent.map((item, index) => (
                  <div
                     key={index}
                     className='py-1 text-sm'
                  >
                     {item} - Completely hidden scrollbar (still scrollable)
                  </div>
               ))}
            </div>
         </div>

         <div className='mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
            <h3 className='font-semibold mb-2'>How to use:</h3>
            <ul className='text-sm space-y-1 list-disc list-inside'>
               <li>
                  <code className='bg-gray-100 dark:bg-gray-800 px-1 rounded'>scrollbar-overlay</code> - Best for main
                  content areas, doesn't affect layout
               </li>
               <li>
                  <code className='bg-gray-100 dark:bg-gray-800 px-1 rounded'>auto-hide-scrollbar</code> - Auto-hiding
                  scrollbar, good for sidebars
               </li>
               <li>
                  <code className='bg-gray-100 dark:bg-gray-800 px-1 rounded'>custom-scrollbar</code> - Thin themed
                  scrollbar with hover effects
               </li>
               <li>
                  <code className='bg-gray-100 dark:bg-gray-800 px-1 rounded'>scrollbar-feed</code> - Ultra-thin for
                  feed components
               </li>
               <li>
                  <code className='bg-gray-100 dark:bg-gray-800 px-1 rounded'>scrollbar-visible</code> - Always visible
                  themed scrollbar
               </li>
               <li>
                  <code className='bg-gray-100 dark:bg-gray-800 px-1 rounded'>scrollbar-hide</code> - Completely hidden
               </li>
            </ul>
         </div>
      </div>
   );
};

export default ScrollbarDemo;
