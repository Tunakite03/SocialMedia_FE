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
      <div className='min-h-screen bg-background overflow-hidden w-full'>
         {/* Desktop Sidebar */}
         <DesktopSidebar />

         {/* Mobile/Tablet Header */}
         {showTopNav && (
            <div className='lg:hidden'>
               <TopNavigation />
            </div>
         )}

         <main className={`lg:ml-64 ${showTopNav ? 'pt-16 lg:pt-0' : ''} ${showBottomNav ? 'pb-16 lg:pb-0' : ''}`}>
            <div className='w-full max-w-lg mx-auto lg:max-w-3xl xl:max-w-4xl flex-1 justify-center px-4 lg:gap-8 lg:py-8'>
               {/* Main content */}
               <div className=''>{children}</div>
            </div>
         </main>

         {/* Mobile Bottom Navigation */}
         {showBottomNav && <BottomNavigation />}
      </div>
   );
};

export default InstagramLayout;
