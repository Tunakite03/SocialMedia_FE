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
      <div className='min-h-screen bg-background w-full scrollbar-overlay'>
         {/* Desktop Sidebar */}
         <DesktopSidebar />

         {/* Mobile/Tablet Header */}
         {showTopNav && (
            <div className='lg:hidden'>
               <TopNavigation />
            </div>
         )}

         <main
            className={`lg:ml-16 xl:ml-64 ${showTopNav ? 'pt-[70px] lg:pt-0' : ''} ${
               showBottomNav ? 'pb-16 lg:pb-0' : ''
            } scrollbar-overlay`}
         >
            <div className='w-full max-w-6xl mx-auto px-4 lg:gap-8 lg:py-8'>
               {/* Main content */}
               {children}
            </div>
         </main>

         {/* Mobile Bottom Navigation */}
         {showBottomNav && <BottomNavigation />}
      </div>
   );
};

export default InstagramLayout;
