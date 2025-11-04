import type { ReactNode } from 'react';
import TopNavigation from './TopNavigation';
import BottomNavigation from './BottomNavigation';
import DesktopSidebar from './DesktopSidebar';

interface InstagramLayoutProps {
   children: ReactNode;
   showTopNav?: boolean;
   showBottomNav?: boolean;
}

const InstagramLayout = ({ children, showTopNav = true, showBottomNav = true }: InstagramLayoutProps) => {
   return (
      <div className='min-h-screen bg-gray-50'>
         {/* Desktop Sidebar */}
         <DesktopSidebar />

         {/* Mobile/Tablet Header */}
         {showTopNav && (
            <div className='lg:hidden'>
               <TopNavigation />
            </div>
         )}

         <main className={`lg:ml-64 ${showTopNav ? 'pt-16 lg:pt-0' : ''} ${showBottomNav ? 'pb-16 lg:pb-0' : ''}`}>
            <div className='max-w-md mx-auto lg:max-w-2xl xl:max-w-4xl lg:grid lg:grid-cols-3 lg:gap-8 lg:px-4 lg:py-8'>
               {/* Main content */}
               <div className='lg:col-span-2'>{children}</div>

               {/* Right sidebar for desktop */}
               <div className='hidden lg:block'>
                  <div className='sticky top-8 space-y-4'>
                     <div className='bg-white rounded-lg p-4 border border-gray-200'>
                        <h3 className='font-semibold text-gray-900 mb-3 text-sm'>Suggestions for you</h3>
                        <div className='space-y-3'>
                           {Array.from({ length: 3 }, (_, i) => (
                              <div
                                 key={i}
                                 className='flex items-center justify-between'
                              >
                                 <div className='flex items-center space-x-3'>
                                    <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
                                    <div>
                                       <p className='text-sm font-semibold'>suggested_user_{i + 1}</p>
                                       <p className='text-xs text-gray-500'>Follows you</p>
                                    </div>
                                 </div>
                                 <button className='text-blue-500 text-xs font-semibold hover:text-blue-700'>
                                    Follow
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className='bg-white rounded-lg p-4 border border-gray-200'>
                        <p className='text-xs text-gray-500 leading-relaxed'>
                           © 2024 OnWay from Meta Technologies Inc.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </main>

         {/* Mobile Bottom Navigation */}
         {showBottomNav && <BottomNavigation />}
      </div>
   );
};

export default InstagramLayout;
